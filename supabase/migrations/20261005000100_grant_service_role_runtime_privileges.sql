-- Production server role needs explicit SQL privileges in addition to its RLS bypass.
-- Browser roles remain read-only per migration 004; these grants apply only to the
-- server-side service role used by trusted FactoryMesh API routes and readiness checks.

grant select, insert, update, delete on
  public.organizations,
  public.profiles,
  public.factories,
  public.capacity_slots,
  public.orders,
  public.order_matches,
  public.production_events,
  public.audit_logs
to service_role;

grant usage, select on sequence public.audit_logs_id_seq to service_role;
