create extension if not exists pgcrypto;

create type public.member_role as enum ('buyer','factory','operator','admin');
create type public.order_status as enum ('draft','submitted','matching','reserved','in_production','qc','shipped','completed','cancelled');
create type public.capacity_status as enum ('available','held','booked','blocked');
create type public.match_status as enum ('suggested','shortlisted','reserved','rejected');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null check (kind in ('buyer','factory','operator')),
  country_code text not null default 'BD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.member_role not null default 'buyer',
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.factories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  legal_name text not null,
  city text,
  country_code text not null default 'BD',
  verified boolean not null default false,
  product_categories text[] not null default '{}',
  certifications text[] not null default '{}',
  min_order_quantity integer,
  indicative_cost_min numeric(12,4),
  indicative_cost_max numeric(12,4),
  on_time_rate numeric(5,2),
  defect_rate numeric(5,2),
  capacity_confidence numeric(5,2) not null default 50,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capacity_slots (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  line_type text,
  product_category text,
  available_units integer not null check (available_units >= 0),
  reserved_units integer not null default 0 check (reserved_units >= 0),
  status public.capacity_status not null default 'available',
  confidence numeric(5,2) not null default 50,
  source text not null default 'manual',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (reserved_units <= available_units)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  product_category text not null,
  quantity integer not null check (quantity > 0),
  target_unit_price numeric(12,4),
  currency text not null default 'USD',
  required_delivery_date date not null,
  ship_to_country_code text,
  material_requirements text,
  compliance_requirements text[] not null default '{}',
  tech_pack_path text,
  status public.order_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_matches (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  factory_id uuid not null references public.factories(id) on delete cascade,
  capacity_slot_id uuid references public.capacity_slots(id) on delete set null,
  score numeric(6,2) not null,
  price_score numeric(6,2) not null default 0,
  capacity_score numeric(6,2) not null default 0,
  capability_score numeric(6,2) not null default 0,
  delivery_score numeric(6,2) not null default 0,
  quality_score numeric(6,2) not null default 0,
  compliance_score numeric(6,2) not null default 0,
  rationale jsonb not null default '{}'::jsonb,
  status public.match_status not null default 'suggested',
  created_at timestamptz not null default now(),
  unique(order_id, factory_id, capacity_slot_id)
);

create table public.production_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  factory_id uuid not null references public.factories(id) on delete restrict,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  progress_percent numeric(5,2),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index capacity_slots_factory_dates_idx on public.capacity_slots(factory_id, starts_on, ends_on);
create index orders_buyer_status_idx on public.orders(buyer_organization_id, status, created_at desc);
create index order_matches_order_score_idx on public.order_matches(order_id, score desc);
create index production_events_order_idx on public.production_events(order_id, occurred_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.factories enable row level security;
alter table public.capacity_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_matches enable row level security;
alter table public.production_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_read_self" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_self" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "organizations_read_own" on public.organizations for select to authenticated using (id = (select organization_id from public.profiles where id = (select auth.uid())));

create policy "factories_read_authenticated" on public.factories for select to authenticated using (true);
create policy "factory_org_updates_own" on public.factories for update to authenticated using (organization_id = (select organization_id from public.profiles where id = (select auth.uid()))) with check (organization_id = (select organization_id from public.profiles where id = (select auth.uid())));

create policy "capacity_read_authenticated" on public.capacity_slots for select to authenticated using (true);
create policy "capacity_factory_manage_own" on public.capacity_slots for all to authenticated using (factory_id in (select f.id from public.factories f join public.profiles p on p.organization_id = f.organization_id where p.id = (select auth.uid()))) with check (factory_id in (select f.id from public.factories f join public.profiles p on p.organization_id = f.organization_id where p.id = (select auth.uid())));

create policy "orders_read_participants" on public.orders for select to authenticated using (
  buyer_organization_id = (select organization_id from public.profiles where id = (select auth.uid()))
  or exists (
    select 1 from public.order_matches om
    join public.factories f on f.id = om.factory_id
    join public.profiles p on p.organization_id = f.organization_id
    where om.order_id = orders.id and p.id = (select auth.uid())
  )
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('operator','admin'))
);
create policy "orders_buyer_insert" on public.orders for insert to authenticated with check (buyer_organization_id = (select organization_id from public.profiles where id = (select auth.uid())) and created_by = (select auth.uid()));
create policy "orders_buyer_update" on public.orders for update to authenticated using (buyer_organization_id = (select organization_id from public.profiles where id = (select auth.uid()))) with check (buyer_organization_id = (select organization_id from public.profiles where id = (select auth.uid())));

create policy "matches_read_participants" on public.order_matches for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.buyer_organization_id = (select organization_id from public.profiles where id = (select auth.uid())))
  or exists (select 1 from public.factories f where f.id = factory_id and f.organization_id = (select organization_id from public.profiles where id = (select auth.uid())))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('operator','admin'))
);

create policy "events_read_participants" on public.production_events for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.buyer_organization_id = (select organization_id from public.profiles where id = (select auth.uid())))
  or exists (select 1 from public.factories f where f.id = factory_id and f.organization_id = (select organization_id from public.profiles where id = (select auth.uid())))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('operator','admin'))
);
create policy "events_factory_insert" on public.production_events for insert to authenticated with check (
  factory_id in (select f.id from public.factories f where f.organization_id = (select organization_id from public.profiles where id = (select auth.uid())))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('operator','admin'))
);

create policy "audit_operator_read" on public.audit_logs for select to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('operator','admin')));

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger factories_updated_at before update on public.factories for each row execute function public.set_updated_at();
create trigger capacity_slots_updated_at before update on public.capacity_slots for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
