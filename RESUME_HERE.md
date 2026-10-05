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
- Supabase migration history verified with local/remote versions matching;
- public schema verified to contain the expected eight FactoryMesh tables;
- private `tech-packs` bucket verified with 25 MB and MIME restrictions;
- Vercel production deployment live at `https://factorymesh.vercel.app`;
- production smoke verification passes for `/`, `/api/health`, and `/api/readiness` (HTTP 200);
- real production launch verification passes using temporary, clearly labelled `[E2E TEST]` accounts and cleans fixtures afterward;
- latest main CI, production smoke, and production launch verification are green.

This satisfies the **dedicated production Supabase**, **migrations**, **Vercel deployment**, **readiness**, and **real Buyer/Factory E2E/security verification** launch prerequisites. Do not call FactoryMesh 100% production-live yet: final production Auth URL configuration plus advisor/runtime-log review remain launch gates.

### Final sign-off attempt — 2026-10-05

A dedicated `.github/workflows/production-signoff.yml` workflow was added to automate the remaining Supabase Auth URL check/update, Supabase security/performance advisor review, and final production HTTP verification.

The repository's existing `SUPABASE_ACCESS_TOKEN` is valid for the production migration/API-key workflows but the Supabase Management API returns **HTTP 403** for both:

- `/v1/projects/<project-ref>/config/auth`
- `/v1/projects/<project-ref>/advisors/security`

Therefore these final two Supabase checks are currently **account/token-permission blocked**, not application-code blocked. Do not mark them verified until a Supabase account/token with project Auth/advisor permissions is connected or the checks are completed from the Supabase dashboard.

The production smoke workflow remains green while this permission blocker is unresolved.

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

Verification evidence:

- dedicated `.github/workflows/supabase-production.yml` linked the production project;
- dry-run listed exactly the four pending migrations;
- `supabase db push` applied all four successfully;
- `supabase migration list` showed identical Local/Remote versions;
- Supabase Table Editor shows the expected public tables.

RLS/privilege behavior, private storage, Buyer/Factory isolation, and reservation concurrency are now verified by the real production launch workflow. Still required before launch: Supabase security/performance advisor review. The automated advisor call currently receives HTTP 403 from the existing Supabase access token, so this is an external permission blocker.

### 3. Configure real Supabase/Auth/Storage — PARTIAL

Verified:

- production project URL/publishable/secret server credentials are configured in Vercel Production;
- privileged Supabase key is server-only;
- private `tech-packs` bucket exists with file-size and MIME restrictions;
- signed tech-pack authorization, real upload, confirmation, signed download, cross-buyer denial, invalid MIME rejection, and oversize rejection pass in production.

Still required (currently blocked by Supabase Management API permission on the connected token):

- verify/replace the temporary localhost Supabase Auth Site URL with `https://factorymesh.vercel.app`;
- verify/add production redirect URLs:
  - `https://factorymesh.vercel.app/auth/callback`
  - `https://factorymesh.vercel.app/auth/confirm`.

The automated sign-off workflow attempts this safely and reports the permission block instead of pretending the configuration is verified.

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

Production Launch Verification run is green. Vercel/Supabase runtime log and advisor review remains separate.

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
