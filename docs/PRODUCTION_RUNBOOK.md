# FactoryMesh Production Runbook

This document defines the minimum launch procedure for the FactoryMesh production MVP.

## 1. Infrastructure isolation

Create a dedicated Supabase project for FactoryMesh. Do not reuse unrelated applications or databases.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (preferred) or legacy `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `APP_ENV=production`

Never commit credentials to Git.

## 2. Database

Apply migrations in order:

1. `20261003000100_initial_schema.sql`
2. `20261003000200_harden_reservations_and_storage.sql`
3. `20261003000300_data_api_grants_and_capacity_privacy.sql`
4. `20261003000400_lock_trust_sensitive_mutations.sql`

After migrations:

- confirm RLS is enabled on every exposed public table;
- verify buyer A cannot read buyer B orders;
- verify factories can only read orders assigned to them;
- verify factories cannot read competitor capacity;
- verify buyers can read executable network capacity;
- verify authenticated browser clients cannot directly mutate profiles, factory trust metadata, orders, capacity, production events or audit logs;
- verify two concurrent reservation attempts cannot overbook one slot;
- verify `tech-packs` is private.

## 3. Authentication

Use Supabase email/password initially.

Configure Auth:

- production Site URL = production FactoryMesh domain;
- add preview redirect domains intentionally, not with broad wildcards;
- confirmation email should route to `/auth/confirm?token_hash={{ .TokenHash }}&type=email`;
- require verified email before real production access;
- use strong password policy and rate limits supported by the provider.

## 4. Storage

`tech-packs` must remain private.

Uploads use server-authorized signed upload URLs. Downloads use short-lived signed URLs after order authorization.

Before launch test:

- disallowed MIME type rejected;
- file above 25 MB rejected;
- user cannot attach an object path belonging to another buyer/order;
- signed download expires.

For larger CAD/tech-pack payloads, move to resumable/TUS upload flow rather than increasing request-body limits.

## 5. Application deployment

Recommended initial platform: Vercel.

Deployment gate:

```bash
npm run check
```

This must pass:

- TypeScript;
- unit tests;
- production build.

Set production environment variables in the hosting platform, never in source.

## 6. Domain and HTTPS

Use a production domain with HTTPS only. Security headers are configured in `next.config.ts`, including HSTS, frame denial, MIME sniffing prevention, referrer policy and restricted browser permissions.

Do not enable ISR or shared CDN caching for authenticated workspace pages. `/dashboard` is explicitly force-dynamic.

## 7. Operational launch scope

The first production release intentionally supports **single-factory full-order reservation** only.

A routing result is eligible only when one capacity slot can satisfy the entire requested quantity before the deadline. This prevents partial capacity from being represented as a complete reservation.

Multi-factory allocation must be introduced as a separate allocation model with explicit remaining quantity and multiple reservation records.

## 8. First production workflow

1. Factory signs up and onboards.
2. Operator verifies factory offline and marks capability/quality/compliance fields through controlled operations tooling.
3. Factory publishes a capacity window.
4. Buyer signs up and onboards.
5. Buyer creates production brief.
6. Buyer optionally attaches private tech pack.
7. Routing engine applies hard constraints and deterministic scoring.
8. Buyer selects a persisted match.
9. Atomic DB transaction reserves capacity.
10. Factory records production/QC/shipment milestones.
11. Actual outcome data is retained for future model training.

## 9. Human verification is deliberate

Do not automatically mark factories `verified=true` based only on self-submitted data.

Initial verification should combine human review of legal identity, production capability, certificates, sample/reference evidence and factory visit/third-party evidence where appropriate. Every verification decision should later be auditable.

## 10. Observability

Before external production traffic:

- enable hosting runtime/build logs;
- configure error alerting;
- monitor `/api/health` for liveness;
- monitor `/api/readiness` for production dependency readiness;
- alert on 5xx rate and auth failures;
- monitor database/storage usage;
- add product analytics without collecting tech-pack content or unnecessary personal data.

## 11. Backups and incident response

Before paid production:

- confirm managed database backup/PITR settings suitable for the plan;
- document restore test procedure;
- define owner for security incidents;
- rotate secrets immediately on suspected exposure;
- maintain an incident log separate from customer-visible production events.

## 12. Commercial safety

FactoryMesh MVP is orchestration software, not a manufacturer, customs broker, insurer, lender or carrier.

Contracts and UI must clearly distinguish:

- estimated routing score from a guarantee;
- published factory capacity from FactoryMesh-owned capacity;
- target pricing from a binding quote;
- milestone data from independent inspection unless explicitly verified.

Local legal counsel should review buyer/factory terms, privacy terms and liability allocation before paid transactions.

## 13. Launch gates

Do not call the system production-live until all are true:

- latest main-branch CI green;
- `/api/readiness` returns HTTP 200 in production;
- dedicated production Supabase project provisioned;
- all migrations applied successfully;
- production env secrets configured;
- auth confirmation tested;
- buyer isolation test passed;
- factory isolation test passed;
- concurrent reservation test passed;
- private tech-pack upload/download test passed;
- deployment smoke test passed;
- first verified factory and first verified buyer onboarded;
- legal/commercial terms reviewed for the launch market.

Code-complete and production-live are not the same state. This runbook is the boundary.
