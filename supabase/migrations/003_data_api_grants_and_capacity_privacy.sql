-- Explicit Data API privileges. RLS remains the authorization boundary.
grant select on public.organizations to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.factories to authenticated;
grant select, insert, update on public.capacity_slots to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select on public.order_matches to authenticated;
grant select, insert on public.production_events to authenticated;
grant select, insert on public.audit_logs to authenticated;

drop policy if exists "capacity_read_authenticated" on public.capacity_slots;
create policy "capacity_read_authorized_network" on public.capacity_slots
for select to authenticated
using (
  factory_id in (
    select f.id from public.factories f
    where f.organization_id = (select organization_id from public.profiles where id = (select auth.uid()))
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('buyer','operator','admin')
  )
);

-- Only operators/admins can see audit trails; authenticated application code may
-- append self-attributed entries through the existing audit_insert_self policy.
revoke update, delete on public.audit_logs from authenticated;
