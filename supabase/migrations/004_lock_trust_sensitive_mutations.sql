-- Production hardening: force business-state mutations through validated server APIs.
-- The service role remains privileged; authenticated browser clients are read-only
-- for trust-sensitive entities except where explicit server paths are used.

revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.factories from authenticated;
revoke insert, update, delete on public.capacity_slots from authenticated;
revoke insert, update, delete on public.orders from authenticated;
revoke insert, update, delete on public.order_matches from authenticated;
revoke insert, update, delete on public.production_events from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;

drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "factory_org_updates_own" on public.factories;
drop policy if exists "capacity_factory_manage_own" on public.capacity_slots;
drop policy if exists "orders_buyer_insert" on public.orders;
drop policy if exists "orders_buyer_update" on public.orders;
drop policy if exists "events_factory_insert" on public.production_events;
drop policy if exists "audit_insert_self" on public.audit_logs;

alter table public.capacity_slots
  drop constraint if exists capacity_slots_confidence_range,
  add constraint capacity_slots_confidence_range check (confidence >= 0 and confidence <= 100);

alter table public.factories
  drop constraint if exists factories_capacity_confidence_range,
  add constraint factories_capacity_confidence_range check (capacity_confidence >= 0 and capacity_confidence <= 100),
  drop constraint if exists factories_on_time_rate_range,
  add constraint factories_on_time_rate_range check (on_time_rate is null or (on_time_rate >= 0 and on_time_rate <= 100)),
  drop constraint if exists factories_defect_rate_range,
  add constraint factories_defect_rate_range check (defect_rate is null or (defect_rate >= 0 and defect_rate <= 100));

-- Read privileges remain explicit.
grant select on public.organizations to authenticated;
grant select on public.profiles to authenticated;
grant select on public.factories to authenticated;
grant select on public.capacity_slots to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_matches to authenticated;
grant select on public.production_events to authenticated;
grant select on public.audit_logs to authenticated;

comment on table public.capacity_slots is
  'Trust-sensitive capacity state. Mutations must go through validated FactoryMesh server APIs using the service role.';

comment on table public.orders is
  'Buyer order state. Mutations must go through validated FactoryMesh server APIs using the service role.';

comment on table public.production_events is
  'Execution evidence. Mutations must go through validated FactoryMesh server APIs using the service role.';
