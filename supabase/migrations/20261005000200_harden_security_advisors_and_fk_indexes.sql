-- Final production hardening from Supabase security/performance advisor findings.

-- Trigger helper should not inherit a caller-controlled search_path.
alter function public.set_updated_at() set search_path = pg_catalog;

-- This SECURITY DEFINER event-trigger helper is invoked by PostgreSQL's event trigger,
-- not by application users. Remove Data API execution privileges.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Cover foreign-key columns used for referential checks and common joins.
create index if not exists audit_logs_actor_user_id_idx
  on public.audit_logs(actor_user_id);

create index if not exists audit_logs_organization_id_idx
  on public.audit_logs(organization_id);

create index if not exists order_matches_capacity_slot_id_idx
  on public.order_matches(capacity_slot_id);

create index if not exists order_matches_factory_id_idx
  on public.order_matches(factory_id);

create index if not exists orders_created_by_idx
  on public.orders(created_by);

create index if not exists production_events_created_by_idx
  on public.production_events(created_by);

create index if not exists production_events_factory_id_idx
  on public.production_events(factory_id);

create index if not exists profiles_organization_id_idx
  on public.profiles(organization_id);
