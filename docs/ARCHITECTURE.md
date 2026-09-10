# FactoryMesh Architecture

## Recommended stack

- Web: Next.js App Router + TypeScript
- API: Next.js route handlers initially; extract services when scale requires
- Database: PostgreSQL
- ORM: Prisma or Drizzle (choose one before implementation; default recommendation: Prisma for MVP speed)
- Auth: organization-aware auth provider or managed auth
- File storage: S3-compatible object storage
- Queue/jobs: managed queue for parsing, scoring and notifications
- Search/filtering: PostgreSQL first; dedicated search later only if required
- Analytics: event analytics + warehouse later
- Deployment: Vercel for web/API initially, managed Postgres and object storage

## Core services

### 1. Identity & Organizations
Buyers, factories, operators, permissions, audit trail.

### 2. Factory Registry
Factory profile, location, capabilities, production units, certifications and verification status.

### 3. Capacity Service
Time-bound production capacity, reservations, holds, confidence and refresh cadence.

### 4. Order Intake
Order brief, tech pack metadata, requirements, documents, normalized product specification.

### 5. Matching / Routing
Candidate generation, hard constraints, scoring, ranking, split recommendations.

### 6. Quote & Reservation
Factory responses, quote versions, holds, expiry, confirmed booking.

### 7. Production Tracking
Milestones, exceptions, QC checkpoints, shipment state.

### 8. Outcome Ledger
Actual production, quality, delay and commercial outcomes used for future scoring.

### 9. Operator Console
Human review, verification, routing override, dispute notes and data correction.

## Core data model

### Organization
- id
- type: BUYER | FACTORY | OPERATOR | PARTNER
- name
- country
- status

### User
- id
- organizationId
- role
- identity metadata

### Factory
- id
- organizationId
- location
- verificationStatus
- complianceMetadata
- capabilitySummary

### ProductionUnit
- id
- factoryId
- name
- type
- machines / line metadata
- baseline throughput

### Capability
- id
- factoryId / productionUnitId
- category
- product attributes
- materials
- process capabilities
- evidence level

### CapacitySlot
- id
- productionUnitId
- startAt
- endAt
- availableUnits
- minBookableUnits
- confidence
- lastVerifiedAt
- status

### OrderRequest
- id
- buyerOrganizationId
- category
- quantity
- targetUnitCost
- currency
- deliveryDate
- destination
- requirementJson
- status

### Match
- id
- orderRequestId
- factoryId
- capacitySlotId
- score
- scoreBreakdown
- warnings
- status

### Quote
- id
- matchId
- unitPrice
- currency
- leadTime
- validUntil
- notes

### Reservation
- id
- capacitySlotId
- orderRequestId
- quantity
- status
- holdExpiresAt

### ProductionOrder
- id
- orderRequestId
- factoryId
- confirmedQuantity
- plannedStart
- plannedFinish
- status

### Milestone
- id
- productionOrderId
- type
- plannedAt
- actualAt
- status
- evidence

### Outcome
- productionOrderId
- onTime
- defectRate
- reworkRate
- finalUnitCost
- delayDays
- cancellationReason
- disputeFlags

## Security boundaries

- strict tenant isolation by organization,
- role-based access control,
- encrypted data at rest and in transit,
- signed file URLs,
- immutable audit log for sensitive changes,
- minimal document retention,
- no sharing factory confidential pricing/capacity with another factory,
- no training on customer-private documents without contractual permission.

## Data ingestion strategy

Never require ERP integration for the first pilot.

Support progressively:
1. CSV/XLSX template upload,
2. simple weekly capacity form,
3. email/document ingestion,
4. API/webhooks,
5. ERP integrations for high-value factories.

The objective is to reduce factory onboarding friction while preserving data quality.

## AI boundary

LLMs may assist with:
- extracting tech-pack/document fields,
- normalizing free-text requirements,
- suggesting product taxonomy,
- summarizing exceptions.

LLMs must not autonomously commit factory capacity, prices or contractual terms.

Routing starts deterministic and auditable; ML enters only after sufficient outcome data exists.
