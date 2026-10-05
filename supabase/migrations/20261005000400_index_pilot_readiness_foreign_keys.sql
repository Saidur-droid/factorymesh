-- Cover new pilot-readiness foreign keys flagged by the Supabase performance advisor.

create index if not exists capacity_slots_last_verified_by_idx
  on public.capacity_slots(last_verified_by);

create index if not exists factories_verified_by_idx
  on public.factories(verified_by);

create index if not exists order_matches_responded_by_idx
  on public.order_matches(responded_by);

create index if not exists order_outcomes_recorded_by_idx
  on public.order_outcomes(recorded_by);
