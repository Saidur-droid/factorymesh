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
- Supabase migration history verified with local/remote versions matching exactly;
- public schema verified to contain the expected eight FactoryMesh tables;
- latest main CI after the production-workflow merge is green.

This satisfies the **dedicated production Supabase project provisioned** and **migrations applied** launch prerequisites. It does **not** mean FactoryMesh is production-live. Continue with Auth/Storage verification, Vercel deployment and real production verification below.

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

Verification evidence:

- dedicated `.github/workflows/supabase-production.yml` linked the production project;
- dry-run listed exactly the four pending migrations;
- `supabase db push` applied all four successfully;
- `supabase migration list` showed identical Local/Remote versions;
- Supabase Table Editor shows the expected public tables.

Still required before launch: RLS/privilege behavior tests, private storage tests, and Supabase security/performance advisor review.

### 3. Configure real Supabase/Auth/Storage

Obtain the production project's:

- project URL
- publishable key

Configure the application environment variables from `.env.example`.

Never expose a Supabase secret/service-role key through `NEXT_PUBLIC_*` variables.

Configure production Auth redirect URLs for the final deployment domain.

Confirm private tech-pack bucket/policies work with signed upload/download flows.

### 4. Create/import the Vercel project

Known Vercel team from the previous session:

`saidur-droids-projects`

Import/connect:

`Saidur-droid/factorymesh`

Suggested Vercel project name:

`factorymesh`

Set all required production environment variables.

Deploy `main` to production.

### 5. Live smoke/E2E test on the real deployment

After deployment, verify as a real user, not just via build output:

1. Landing page loads.
2. `/demo` loads without console/runtime errors.
3. Demo flow completes end-to-end.
4. Create a real Buyer test account.
5. Complete buyer onboarding.
6. Create a real Factory test account.
7. Complete factory onboarding.
8. Publish a real test capacity slot.
9. Buyer creates a test production order.
10. Routing returns only allowed executable capacity.
11. Reserve the slot.
12. Verify another concurrent reservation cannot double-book the same capacity.
13. Record production/QC/shipment events.
14. Verify cross-tenant isolation from both accounts.
15. Check `/api/health` and Vercel runtime logs for errors.

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
