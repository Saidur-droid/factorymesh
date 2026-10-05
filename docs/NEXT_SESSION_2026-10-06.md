# FactoryMesh — Next Session Handoff (2026-10-06)

This file is the single-source handoff for the next FactoryMesh session. Read this before doing anything. Do not rebuild or re-test completed work unless a fresh production deployment requires verification.

## Repository / production identifiers

- GitHub: `Saidur-droid/factorymesh`
- Main branch current handoff SHA: `890482ad1dfc4743321166cfba52d23d9b995edd`
- Vercel project: `factorymesh`
- Vercel team: `saidur-droids-projects`
- Public production domain: `https://factorymesh.vercel.app`
- Supabase project: `factorymesh-prod`
- Supabase project ref: `qltxvpglunmvltqoyhnl`
- Supabase region: `ap-southeast-1`

Never expose or request production secrets in chat.

## Product build status

**Current pilot-MVP product code is code-complete for the locked single-factory reservation scope.**

Implemented and merged:

- Buyer / Factory / Operator / Admin roles
- Buyer production brief creation
- Factory capacity publishing
- deterministic capacity routing
- atomic capacity reservation / double-book protection
- private tech-pack signed upload/download
- production / QC / shipment event flow
- operator factory verification / revocation
- operator capacity verification / challenge
- verification actor + timestamp + audit logs
- capacity freshness lifecycle: fresh / aging / stale / unverified
- stale or unverified capacity excluded from executable routing
- factory commercial accept/reject response
- quote price + currency + promised ship date + feasibility note
- buyer reservation only after factory commercial confirmation
- outcome memory: actual shipment date, realized unit price, defect/rework rate, notes
- factory on-time and defect metrics recalculated from outcomes
- trust/commercial/outcome mutations audited
- RLS / tenant isolation
- security headers
- health / readiness endpoints
- CI + browser E2E + production smoke automation

## Production database status

Applied production migrations:

1. `20261003000100_initial_schema.sql`
2. `20261003000200_harden_reservations_and_storage.sql`
3. `20261003000300_data_api_grants_and_capacity_privacy.sql`
4. `20261003000400_lock_trust_sensitive_mutations.sql`
5. `20261005000100_grant_service_role_runtime_privileges.sql`
6. `20261005000200_harden_security_advisors_and_fk_indexes.sql`
7. `20261005000300_close_pilot_readiness_loop.sql`
8. `20261005000400_index_pilot_readiness_foreign_keys.sql`

Verified:

- Supabase Security Advisor: zero findings
- Supabase Performance Advisor: no WARN/ERROR launch findings
- private `tech-packs` bucket with MIME + 25 MB restrictions
- production RLS / isolation / reservation concurrency previously passed real production E2E
- recent post-hardening Supabase ERROR/FATAL/PANIC check was clean

## Verified production behavior already completed

A real production launch verification has previously passed using temporary `[E2E TEST]` users and cleanup:

- Buyer A / Buyer B isolation
- Factory A / Factory B isolation
- real onboarding
- real capacity publishing
- routing
- concurrent reservation race: one success + one conflict, no double-book
- private tech-pack upload / confirmation / signed download
- invalid MIME rejection
- oversized file rejection
- production started / QC passed / shipment dispatched events
- direct browser mutation of trust-sensitive state blocked
- test fixtures cleaned up

Do not claim the **latest new product UI** is production-verified until the latest main commit actually deploys.

## Current remaining launch blockers

### Blocker 1 — latest main has not reached Vercel production

Fresh verification on 2026-10-05:

- GitHub Vercel status for current main is failure
- failure target explicitly points to `upgradeToPro=build-rate-limit`
- newest READY production deployment is older commit `a9cbcc7c5bb64ae28ab43fce50e174e63a9085e5`
- latest main product code is therefore **not yet deployed to production**

This is a Vercel Hobby build-rate quota blocker, not a build/test code failure.

There is already a `FactoryMesh Deploy Watch` automation checking this hourly. When the quota clears:

1. trigger one fresh deployment of latest main;
2. verify the deployment SHA matches current main;
3. run production smoke;
4. run production launch/E2E verification against the latest deployment;
5. inspect runtime errors if connector permission allows;
6. update this file and `RESUME_HERE.md` with evidence.

### Blocker 2 — Supabase hosted Auth redirect is still wrong

Confirmed by a real Supabase Admin `generateLink` probe:

Requested:

`https://factorymesh.vercel.app/auth/callback?next=/onboarding`

Supabase resolved it to:

`http://localhost:3000`

Required hosted Auth configuration:

- Site URL: `https://factorymesh.vercel.app`
- allowed redirect: `https://factorymesh.vercel.app/auth/callback`
- allowed redirect: `https://factorymesh.vercel.app/auth/confirm`

The currently connected Supabase tool surface supports DB, SQL, migrations, logs, advisors, Edge Functions, etc., but **does not expose hosted Auth URL configuration write actions**. Do not fake this as fixed.

There is already a `FactoryMesh Auth Watch` automation. When the connector/tool surface exposes a supported Auth config write action:

1. set the values above;
2. run the production Auth redirect probe;
3. require exact production redirect resolution;
4. rerun production launch verification.

## Secondary final sign-off items

After the two blockers above are cleared:

- verify latest `/`, `/api/health`, `/api/readiness`
- confirm latest Vercel production deployment SHA = current main SHA
- inspect Vercel runtime error/fatal logs if connector authorization permits
- rerun Supabase Security + Performance Advisor
- ensure no unresolved launch-blocking logs
- only then mark current launch definition **100% production-live**

## Submission work for 2026-10-06

After production gates are closed, move directly to submission work.

Do not invent competition requirements. First locate the official Ideathon Bangladesh 2026 submission rules/form/deadline from authoritative sources or existing project docs.

Prepare a submission-ready package from the repo:

- product name: FactoryMesh
- one-line value proposition
- problem statement
- solution
- target users
- Bangladesh-first wedge
- why now
- product workflow
- technical architecture
- trust/safety/security story
- business model
- go-to-market
- differentiation / moat
- traction wording must remain factual; do not fabricate pilots, factories, customers, revenue, LOIs, or partnerships
- live production URL
- GitHub/demo links allowed by the rules
- screenshots/video only if required
- concise pitch answers tailored to official word/character limits

If the final submission action is irreversible, requires a logged-in external form not exposed to available tools, or requires applicant attestations, prepare everything and request only the single unavoidable approval/action. Do not ask for repetitive screenshots.

## Tomorrow's execution order

1. Read this file and `RESUME_HERE.md`.
2. Check Vercel build-rate blocker.
3. Check Supabase Auth config action availability.
4. Close any newly unblocked production gate.
5. Deploy latest main and rerun full production verification.
6. Update repo evidence.
7. Research official Ideathon Bangladesh 2026 submission requirements.
8. Prepare/fill submission using only verified facts.
9. Submit if the available connected tools permit it and no applicant-only attestation is required.
10. Report exact final state and any truly unavoidable external blocker.

## Rule for completion

Never say FactoryMesh is 100% production-live unless:

- latest main is the code running in Vercel production,
- production Auth redirects resolve to the production domain,
- smoke/readiness passes,
- real production E2E passes on that latest deployment,
- no unresolved launch-blocking advisor/log issue remains.

The repo is the source of truth. The user should not need to restate old chat context.
