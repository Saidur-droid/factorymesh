alter table public.orders
  add column if not exists assigned_factory_id uuid references public.factories(id) on delete set null;

create index if not exists orders_assigned_factory_idx on public.orders(assigned_factory_id, status, created_at desc);

drop policy if exists "orders_read_participants" on public.orders;
create policy "orders_read_participants" on public.orders
for select to authenticated
using (
  buyer_organization_id = (select organization_id from public.profiles where id = (select auth.uid()))
  or assigned_factory_id in (
    select f.id from public.factories f
    where f.organization_id = (select organization_id from public.profiles where id = (select auth.uid()))
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('operator','admin')
  )
);

create policy "audit_insert_self" on public.audit_logs
for insert to authenticated
with check (
  actor_user_id = (select auth.uid())
  and organization_id = (select organization_id from public.profiles where id = (select auth.uid()))
);

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

  update public.capacity_slots
  set reserved_units = reserved_units + p_units,
      status = case when reserved_units + p_units >= available_units then 'booked'::public.capacity_status else 'held'::public.capacity_status end,
      version = version + 1,
      updated_at = now()
  where id = v_slot.id;

  update public.order_matches
  set status = 'reserved'
  where id = p_match_id;

  update public.order_matches
  set status = 'rejected'
  where order_id = p_order_id and id <> p_match_id and status = 'suggested';

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tech-packs',
  'tech-packs',
  false,
  26214400,
  array['application/pdf','application/zip','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Uploads are performed through short-lived signed upload URLs created by the server.
-- Direct object access remains private; application routes must authorize downloads.
