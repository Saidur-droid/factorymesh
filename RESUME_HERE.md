# FactoryMesh — RESUME HERE

This is the durable handoff file for continuing FactoryMesh after the original chat is gone.

## Current product state

The repository already contains a complete production-grade MVP codebase and a realistic interactive demo.

Verified in GitHub Actions:

- TypeScript check: PASS
- Unit tests: PASS
- Production Next.js build: PASS
- Browser E2E: PASS

The browser E2E covers:

**Buyer → production brief → routing → reserve factory capacity → factory execution → production milestone → QC → shipment → operator view**

The interactive demo is available at `/demo` when the app is running.


## Production infrastructure progress — 2026-10-05

Verified from the Supabase dashboard:

- dedicated project created: `factorymesh-prod`;
- region: Southeast Asia (Singapore / `ap-southeast-1`);
- project status: Healthy;
- production migrations `20261003000100` → `20261003000400` applied successfully via the dedicated GitHub Actions Supabase production workflow;
- follow-up migration `20261005000100_grant_service_role_runtime_privileges.sql` applied successfully to make trusted server runtime access explicit;
- hardening migration `20261005000200_harden_security_advisors_and_fk_indexes.sql` applied successfully;
- Supabase Security Advisor is now clean (zero lints);
- Supabase Performance Advisor has no WARN/ERROR launch findings; only INFO-level unused-index observations on this fresh project;
- Supabase migration history verified with local/remote versions matching;
- public schema verified to contain the expected eight FactoryMesh tables;
- private `tech-packs` bucket verified with 25 MB and MIME restrictions;
- Vercel production deployment live at `https://factorymesh.vercel.app`;
- production smoke verification passes for `/`, `/api/health`, and `/api/readiness` (HTTP 200);
- real production launch verification passes using temporary, clearly labelled `[E2E TEST]` accounts and cleans fixtures afterward;
- Vercel `APP_ENV` is now scoped to Production only;
- latest security-hardening commit deployed to Vercel Production in READY state;
- operator verification console is merged and CI verified;
- capacity freshness/trust lifecycle, factory commercial response, and outcome-memory loop are merged;
- production migration `20261005000300_close_pilot_readiness_loop.sql` is applied;
- production migration `20261005000400_index_pilot_readiness_foreign_keys.sql` is applied;
- latest production smoke is green; latest main CI is running for the final index-only commit after the feature commit passed CI.

This satisfies the **dedicated production Supabase**, **migrations**, **Vercel deployment**, **readiness**, **Supabase advisor hardening**, and **real Buyer/Factory E2E/security verification** launch prerequisites. Do not call FactoryMesh 100% production-live yet: the hosted Supabase Auth production redirect configuration remains a confirmed launch blocker, and the Vercel connector's runtime-log endpoint is currently permission-blocked.

### Final sign-off attempt — 2026-10-05

A dedicated `.github/workflows/production-signoff.yml` workflow was added to automate the remaining Supabase Auth URL check/update, Supabase security/performance advisor review, and final production HTTP verification.

The repository's existing `SUPABASE_ACCESS_TOKEN` is valid for the production migration/API-key workflows but the Supabase Management API returns **HTTP 403** for both:

- `/v1/projects/<project-ref>/config/auth`
- `/v1/projects/<project-ref>/advisors/security`

The connected Supabase app now provides direct Advisor access, so the advisor blocker was removed and all Security Advisor findings were fixed through migration `20261005000200`.

The hosted Auth config itself is still not exposed as a write action by the connected Supabase tool surface. A new real production probe was added to `.github/workflows/production-e2e.yml`: it uses Supabase Admin `generateLink` without sending mail and checks the resolved redirect. Fresh evidence confirmed that requesting `https://factorymesh.vercel.app/auth/callback?next=/onboarding` currently resolves to `http://localhost:3000`. Therefore the production Auth redirect is **confirmed misconfigured**, not merely unverified.

The production smoke workflow remains green while this control-plane blocker is unresolved.

## What is already implemented

- Next.js + TypeScript application
- Buyer / Factory / Operator workflows
- Production brief creation
- Live-capacity data model
- Deterministic routing engine
- Capacity reservation logic with double-booking protection design
- Production milestone tracking
- QC / shipment event flow
- Audit timeline
- Supabase schema/migrations in source control
- Supabase Auth integration code
- RLS/security policies
- Private tech-pack storage flow
- Validation and API routes
- Security headers
- Liveness and production-readiness endpoints
- CI quality gate
- Playwright browser E2E
- Full product/business/architecture/GTM/red-team documentation

## Pilot-ready product build status

The application code now closes the previously identified final product gaps:

- Operator/Admin can verify or revoke factory trust.
- Operator/Admin can verify or challenge capacity declarations.
- Verification timestamps and actors are retained.
- Capacity freshness decays from fresh → aging → stale/unverified.
- Only verified factories with fresh/aging verified capacity can enter executable routing.
- Reservation rejects stale capacity.
- Factories can accept/reject matched opportunities and return quote, currency, promised ship date and feasibility note.
- Buyers can reserve only factory-confirmed shortlisted capacity.
- Operators can record actual shipment date, realized unit price, defect/rework rate and outcome notes.
- Outcome history recalculates factory on-time and defect metrics for future routing.
- All trust/commercial/outcome mutations are audited.
- New production schema and indexes are applied.

**Core MVP / pilot software is now code-complete for the current single-factory reservation scope.**

Do not confuse this with **100% production-live**. The remaining blockers are control-plane/operational launch gates below, not missing core product workflow.

## Remaining work before saying “100% production-live”

These are infrastructure/account tasks, not missing core product code.

### 1. Dedicated Supabase production project — DONE

The dedicated project `factorymesh-prod` now exists and is Healthy in Southeast Asia (Singapore / `ap-southeast-1`). Do not replace or reuse it for unrelated applications.

### 2. Apply database migrations — DONE

Applied successfully to `factorymesh-prod`:

1. `20261003000100_initial_schema.sql`
2. `20261003000200_harden_reservations_and_storage.sql`
3. `20261003000300_data_api_grants_and_capacity_privacy.sql`
4. `20261003000400_lock_trust_sensitive_mutations.sql`
5. `20261005000100_grant_service_role_runtime_privileges.sql`
6. `20261005000200_harden_security_advisors_and_fk_indexes.sql`
7. `20261005000300_close_pilot_readiness_loop.sql`
8. `20261005000400_index_pilot_readiness_foreign_keys.sql`

Verification evidence:

- dedicated `.github/workflows/supabase-production.yml` linked the production project;
- dry-run listed exactly the four pending migrations;
- `supabase db push` applied all four successfully;
- `supabase migration list` showed identical Local/Remote versions;
- Supabase Table Editor shows the expected public tables.

RLS/privilege behavior, private storage, Buyer/Factory isolation, and reservation concurrency are verified by the real production launch workflow. Supabase Security Advisor is clean after migration `20261005000200`. Performance Advisor has no WARN/ERROR findings; only INFO-level unused-index observations remain, which are expected on a newly created project.

### 3. Configure real Supabase/Auth/Storage — PARTIAL

Verified:

- production project URL/publishable/secret server credentials are configured in Vercel Production;
- privileged Supabase key is server-only;
- private `tech-packs` bucket exists with file-size and MIME restrictions;
- signed tech-pack authorization, real upload, confirmation, signed download, cross-buyer denial, invalid MIME rejection, and oversize rejection pass in production.

Still required:

- set the hosted Supabase Auth Site URL to `https://factorymesh.vercel.app`;
- allow production redirect URLs:
  - `https://factorymesh.vercel.app/auth/callback`
  - `https://factorymesh.vercel.app/auth/confirm`.

This is now a **confirmed configuration defect**. The production Auth redirect probe requested `https://factorymesh.vercel.app/auth/callback?next=/onboarding` and Supabase resolved it to `http://localhost:3000`.

The connected Supabase app can operate the database, migrations, logs, and advisors, but its current tool surface does not expose hosted Auth URL configuration writes.

### 4. Create/import the Vercel project — DONE

- Vercel team: `saidur-droids-projects`
- repo: `Saidur-droid/factorymesh`
- project: `factorymesh`
- production domain: `https://factorymesh.vercel.app`
- required Production-only environment variables configured
- `main` deploys successfully
- automated production smoke verification is green

### 5. Live smoke/E2E test on the real deployment — VERIFIED

Automated against `https://factorymesh.vercel.app` with real temporary production Auth accounts and cleanup:

1. Landing page returns HTTP 200.
2. `/api/health` returns HTTP 200.
3. `/api/readiness` returns HTTP 200 and `ready: true`.
4. Real Buyer A and Buyer B accounts authenticate and onboard.
5. Real Factory A and Factory B accounts authenticate and onboard.
6. Factory A publishes production capacity.
7. Factory isolation is enforced.
8. Buyer A and Buyer B create independent real test production orders.
9. Buyer A cannot read/route/upload/download Buyer B data and vice versa.
10. Routing produces executable matches.
11. Two concurrent 80-unit reservations race against one 100-unit slot: exactly one succeeds and the other receives conflict; reserved capacity remains 80, proving no double-book.
12. Private tech-pack valid upload + confirmation + signed download works.
13. Invalid MIME and >25 MB tech-pack requests are rejected.
14. Factory B cannot see/operate Factory A's assigned order.
15. Factory A records production, QC, and shipment events; the winning Buyer sees them.
16. Authenticated browser clients cannot directly mutate trust-sensitive order/capacity state.
17. All `[E2E TEST]` fixtures are removed after the run.

A prior complete Production Launch Verification run is green. The workflow now also contains an explicit production Auth redirect gate so future verification cannot be marked green while Supabase resolves production email actions back to localhost.

Supabase post-hardening logs for the checked recent window contain no ERROR/FATAL/PANIC entries. Vercel's connected runtime-log endpoints currently return a connector authorization 403 even though project/deployment/env operations work; production smoke and deployment readiness remain independently green.

### 6. Final production hardening checks

Before real customers:

- verify backup/recovery settings
- configure production monitoring/error visibility
- review rate-limiting/abuse controls for public endpoints
- confirm domain + HTTPS
- confirm Auth email deliverability
- review legal Terms / Privacy / manufacturing liability language
- verify no demo/seed data can be mistaken for real network capacity
- onboard factories only after operational verification

## Definition of 100%

Do NOT say “100% production-live” merely because CI is green.

FactoryMesh reaches the current launch definition of 100% only when:

1. Dedicated Supabase production project exists.
2. All migrations including `20261003000400_lock_trust_sensitive_mutations.sql` are applied and advisors checked.
3. Real Auth/DB/Storage work.
4. Vercel production deployment is live.
5. Real buyer + factory account E2E passes.
6. Cross-tenant and concurrent reservation checks pass.
7. `/api/readiness` reports ready and runtime logs show no unresolved launch-blocking errors.

## What to tell ChatGPT next time

If the original chat has been deleted, send only:

`https://github.com/Saidur-droid/factorymesh`

and say:

> Read RESUME_HERE.md and the docs in this repo. Continue the remaining FactoryMesh production launch work. Do not rebuild completed features and do not call it 100% until the production-live definition in RESUME_HERE.md passes.

The repo is the source of truth; do not depend on the old chat for context.
