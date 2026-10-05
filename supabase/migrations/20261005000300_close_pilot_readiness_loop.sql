-- Pilot-readiness loop: capacity freshness, factory commercial confirmation,
-- and outcome memory that feeds future routing.

alter table public.factories
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

alter table public.capacity_slots
  add column if not exists last_verified_at timestamptz,
  add column if not exists last_verified_by uuid references auth.users(id) on delete set null;

alter table public.order_matches
  add column if not exists factory_response text not null default 'pending',
  add column if not exists quoted_unit_price numeric(12,4),
  add column if not exists quoted_currency text,
  add column if not exists promised_ship_date date,
  add column if not exists factory_note text,
  add column if not exists responded_at timestamptz,
  add column if not exists responded_by uuid references auth.users(id) on delete set null;

alter table public.order_matches
  drop constraint if exists order_matches_factory_response_check,
  add constraint order_matches_factory_response_check
    check (factory_response in ('pending','accepted','rejected')),
  drop constraint if exists order_matches_quoted_unit_price_positive,
  add constraint order_matches_quoted_unit_price_positive
    check (quoted_unit_price is null or quoted_unit_price > 0);

create table if not exists public.order_outcomes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  factory_id uuid not null references public.factories(id) on delete restrict,
  required_delivery_date date not null,
  actual_ship_date date not null,
  on_time boolean not null,
  defect_rate numeric(5,2) not null check (defect_rate >= 0 and defect_rate <= 100),
  realized_unit_price numeric(12,4) check (realized_unit_price is null or realized_unit_price > 0),
  currency text,
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger order_outcomes_updated_at
before update on public.order_outcomes
for each row execute function public.set_updated_at();

create index if not exists order_outcomes_factory_created_idx
  on public.order_outcomes(factory_id, created_at desc);

alter table public.order_outcomes enable row level security;

create policy "outcomes_read_participants" on public.order_outcomes
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.buyer_organization_id = (
        select organization_id from public.profiles where id = (select auth.uid())
      )
  )
  or factory_id in (
    select f.id from public.factories f
    where f.organization_id = (
      select organization_id from public.profiles where id = (select auth.uid())
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('operator','admin')
  )
);

grant select on public.order_outcomes to authenticated;
grant select, insert, update, delete on public.order_outcomes to service_role;

-- A matched factory must be able to inspect an opportunity before the buyer
-- reserves it, while unrelated factories remain isolated.
drop policy if exists "orders_read_participants" on public.orders;
create policy "orders_read_participants" on public.orders
for select to authenticated
using (
  buyer_organization_id = (
    select organization_id from public.profiles where id = (select auth.uid())
  )
  or assigned_factory_id in (
    select f.id from public.factories f
    where f.organization_id = (
      select organization_id from public.profiles where id = (select auth.uid())
    )
  )
  or exists (
    select 1
    from public.order_matches om
    join public.factories f on f.id = om.factory_id
    where om.order_id = orders.id
      and om.status in ('suggested','shortlisted','reserved')
      and f.organization_id = (
        select organization_id from public.profiles where id = (select auth.uid())
      )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('operator','admin')
  )
);

-- Commercial confirmation is now required before a buyer can atomically reserve.
create or replace function public.reserve_capacity(
  p_order_id uuid,
  p_match_id uuid,
  p_units integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.order_matches%rowtype;
  v_slot public.capacity_slots%rowtype;
  v_order public.orders%rowtype;
begin
  if p_units <= 0 then
    raise exception 'Reservation units must be positive';
  end if;

  select * into v_match
  from public.order_matches
  where id = p_match_id and order_id = p_order_id
  for update;

  if not found or v_match.capacity_slot_id is null then
    raise exception 'Match or capacity slot not found';
  end if;

  if v_match.status <> 'shortlisted' or v_match.factory_response <> 'accepted' then
    raise exception 'Factory commercial confirmation required';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  select * into v_slot
  from public.capacity_slots
  where id = v_match.capacity_slot_id
  for update;

  if not found then
    raise exception 'Capacity slot not found';
  end if;

  if (v_slot.available_units - v_slot.reserved_units) < p_units then
    raise exception 'Insufficient capacity';
  end if;

  if v_slot.status not in ('available','held') then
    raise exception 'Capacity slot is not reservable';
  end if;

  if v_slot.last_verified_at is null or v_slot.last_verified_at < now() - interval '30 days' then
    raise exception 'Capacity verification is stale';
  end if;

  update public.capacity_slots
  set reserved_units = reserved_units + p_units,
      status = case
        when reserved_units + p_units >= available_units
          then 'booked'::public.capacity_status
        else 'held'::public.capacity_status
      end,
      version = version + 1,
      updated_at = now()
  where id = v_slot.id;

  update public.order_matches
  set status = 'reserved'
  where id = p_match_id;

  update public.order_matches
  set status = 'rejected'
  where order_id = p_order_id
    and id <> p_match_id
    and status in ('suggested','shortlisted');

  update public.orders
  set assigned_factory_id = v_match.factory_id,
      status = 'reserved',
      updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'match_id', p_match_id,
    'factory_id', v_match.factory_id,
    'capacity_slot_id', v_slot.id,
    'reserved_units', p_units
  );
end;
$$;

revoke all on function public.reserve_capacity(uuid, uuid, integer) from public;
revoke all on function public.reserve_capacity(uuid, uuid, integer) from anon;
revoke all on function public.reserve_capacity(uuid, uuid, integer) from authenticated;
grant execute on function public.reserve_capacity(uuid, uuid, integer) to service_role;
