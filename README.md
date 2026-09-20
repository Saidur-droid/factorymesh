# FactoryMesh

> **Programmable manufacturing capacity for global brands.**

FactoryMesh is an AI-native manufacturing orchestration network. It turns fragmented factory capacity into a trusted, bookable and routable production network — starting with Bangladesh RMG and expanding globally.

## Locked buyer promise

FactoryMesh must earn the right to charge by delivering a concrete production outcome:

> **For your exact order, show which factory is truly available now, how much capacity is available, how fast it can produce, the expected cost and execution risk — then let you reserve that capacity immediately.**

The buyer is not paying FactoryMesh for a directory or a software seat. The buyer is paying for:

**speed + certainty + lower sourcing workload + lower execution risk.**

## The simple idea

A brand should be able to say:

> “I need 300,000 hoodies, under $8 per piece, delivered in 55 days.”

FactoryMesh should answer:

- which factories are technically capable,
- which factories have **real current capacity** in the required window,
- how much capacity is actually available,
- the realistic price range,
- expected lead time,
- quality/compliance/execution risk,
- whether one factory or a split route is safer,
- which capacity can be reserved now,
- and then monitor execution through production, QC and shipment.

The target experience is:

**Order Brief / Tech Pack → Verified Capacity → Intelligent Routing → Capacity Reservation → Production → QC → Shipment → Outcome History**

## What FactoryMesh is NOT

FactoryMesh is not another supplier directory, RFQ marketplace, ERP, sourcing agency dashboard, or bank software.

A generic discovery product says:

> **“These factories can probably make your product.”**

FactoryMesh must be able to say:

> **“Factory A is booked for the next 4–6 weeks. Factory B has 65k units available but weaker delivery reliability. Factory C has 100k units available in your required window and meets the required compliance constraints. Recommended route: 70k to C + 30k to D. Reserve now.”**

That difference is the company.

## Five product primitives

### 1. Live 12-week Capacity Map
Static factory profiles are not enough. FactoryMesh treats time-bound, refreshable production capacity as a first-class asset.

### 2. Capacity Confidence Score
The system must learn whether a factory's declared availability was actually accurate. Freshness, historical declaration accuracy, confirmations and outcomes increase or decrease confidence.

### 3. Order Routing Engine
Given quantity, target cost, deadline, product capability, quality and compliance constraints, FactoryMesh recommends one factory or a multi-factory route and explains the trade-offs.

### 4. Capacity Reservation
FactoryMesh is not only an introduction layer. The workflow must support turning an available slot into a confirmed reservation with an auditable production plan.

### 5. Real Outcome History
Every completed order should strengthen future decisions through actual:
- promised vs actual lead time,
- defect / rework performance,
- on-time delivery,
- quote vs realized cost,
- cancellation / exception history,
- and declared-capacity accuracy.

## Core wedge

### Live Capacity + Routing + Reservation

The first defensible asset is a continuously updated view of factory capacity by:

- product capability,
- line/machine type,
- available production windows,
- MOQ,
- lead time,
- historical on-time delivery,
- quality performance,
- compliance constraints,
- indicative cost band,
- capacity confidence,
- and reservation state.

The goal is to make manufacturing capacity behave more like **bookable inventory**.

## Initial market

**Start:** Bangladesh RMG.

Why Bangladesh:

- dense manufacturing ecosystem,
- large export base,
- many factories with under-utilized or unevenly utilized capacity,
- operational data is fragmented,
- global buyers still face search, capacity, reliability and coordination friction.

The launch wedge stays intentionally narrow until the first categories have real network density and trustworthy outcome data.

## Business model

### Launch revenue engine

**2.5% of fulfilled/shipped manufacturing FOB GMV** for standard early orders where FactoryMesh materially contributes to sourcing, routing, reservation and execution.

Initial commercial rules:

- no signup fee,
- no mandatory buyer subscription,
- factory listing/onboarding free initially,
- standard success/orchestration fee: **2.5%**,
- minimum fee: **$1,000 per successful order**,
- orders at or above **$250k** may move toward **2.0%** when service depth and economics support it,
- very large programs may use negotiated volume pricing,
- **no successful order = no standard orchestration fee**.

The first five paid shipped orders are the pricing-validation cohort. Do not change the standard rate casually before measuring willingness to pay, cost-to-serve, gross margin and repeat behavior.

Potential later layers:

- buyer planning subscription,
- factory SaaS / premium operating tools,
- QC services,
- logistics referrals,
- insurance integrations,
- financing referrals,
- material procurement,
- API / enterprise planning access.

FactoryMesh does **not** need to become a lender or own factories to create value.

## Why a buyer should pay

A buyer should happily pay only when FactoryMesh creates measurable value such as:

- reducing a multi-day sourcing process to a credible capacity plan in 24–48 hours,
- replacing outreach to many factories with 1–3 executable options,
- verifying whether declared capacity is actually usable,
- ranking factories by cost, deadline, quality, compliance and execution risk,
- reserving the slot instead of merely making an introduction,
- giving one production/QC/shipment workflow,
- and surfacing backup capacity when a primary route becomes risky.

FactoryMesh should never justify its fee by saying “we introduced you to a factory.” The fee is justified by **production certainty and execution leverage**.

## Competitive position

FactoryMesh assumes competition from:

- traditional buying houses and sourcing agents,
- supplier discovery and RFQ marketplaces,
- sourcing / production-management platforms,
- factory ERP / MES systems,
- and brands' internal supplier-planning tools.

The company should not claim to be “the best” before real data proves it. The strategic objective is to become materially better at one question:

> **Where can this exact order be produced, during this exact time window, at acceptable cost and execution risk — and can that capacity be reserved now?**

## Moat thesis

Software features are copyable. The moat must become the **network + data + execution history**:

> **Factory → Capability → Capacity Window → Buyer → Quote → Reservation → Production → QC → Shipment → Actual Outcome**

That graph should accumulate:

- verified live capacity,
- buyer demand patterns,
- factory capability evidence,
- order history,
- actual production outcomes,
- defect / rework history,
- delivery reliability,
- costing behavior,
- booking conversion,
- and routing feedback.

More orders → more outcome data → better routing → better buyer experience → more demand → more factories → denser capacity network.

A competitor can copy the interface. It cannot instantly copy years of verified capacity accuracy and execution outcomes.

## Non-negotiable principles

- **Do not become a generic marketplace.**
- **Do not charge for introductions as if introductions were the product.**
- **Do not ask factories for heavy manual data entry.**
- **Do not promise “AI” before enough real outcome data exists.**
- **Do not claim category leadership before outcome data proves it.**
- **Do not depend on Bangladesh Bank integration to make the core product work.**
- **Do not take inventory or credit risk early.**
- **Do not replace factory ERP systems; integrate with whatever factories already use.**
- **Human operations are acceptable in the pilot if every manual step is instrumented for later automation.**

## Global path

1. Bangladesh RMG
2. Bangladesh textile / footwear-adjacent capacity
3. Vietnam, India, Pakistan, Turkey, Cambodia
4. Multi-country order routing
5. Global manufacturing control plane
6. Expansion into other categories only after apparel network density and routing quality are proven

Example future routing:

> 5M-piece order → 40% Bangladesh + 30% Vietnam + 20% India + 10% Turkey based on cost, capacity, lead time, tariff and risk.

## Repository map

- [`RESUME_HERE.md`](RESUME_HERE.md) — current production-readiness handoff and remaining live gates
- [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) — complete strategy and product plan
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product flows and MVP scope
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture and data boundaries
- [`docs/ROUTING_ENGINE.md`](docs/ROUTING_ENGINE.md) — matching/routing logic and AI evolution
- [`docs/BANGLADESH_LAUNCH.md`](docs/BANGLADESH_LAUNCH.md) — first-market operating plan
- [`docs/GTM_AND_REVENUE.md`](docs/GTM_AND_REVENUE.md) — customer acquisition and monetization
- [`docs/GLOBAL_SCALE.md`](docs/GLOBAL_SCALE.md) — country and category expansion
- [`docs/COMPETITION_AND_MOAT.md`](docs/COMPETITION_AND_MOAT.md) — positioning and defensibility
- [`docs/RED_TEAM.md`](docs/RED_TEAM.md) — failure modes and kill conditions
- [`docs/EXECUTION_ROADMAP.md`](docs/EXECUTION_ROADMAP.md) — build and launch sequence
- [`docs/METRICS.md`](docs/METRICS.md) — north-star metrics and unit economics
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — durable product/founder decisions

## Current status

**Core MVP codebase and interactive demo are built and CI/E2E verified. Production-live validation is still incomplete.**

The remaining launch gates are maintained in [`RESUME_HERE.md`](RESUME_HERE.md), including dedicated production infrastructure, live auth/database/storage, real buyer/factory end-to-end validation, concurrency/isolation checks and production smoke testing.

The immediate commercial objective is to prove one real loop repeatedly:

> **Brand order brief → verified live capacity → recommended route → reserved slot → monitored production → successful shipment → measurable outcome data.**

If that loop works repeatedly and buyers pay the orchestration fee, everything else can compound on top of it.

---

**Codename:** FactoryMesh  
**Long-term category:** Manufacturing orchestration infrastructure / global manufacturing control plane  
**Repository created:** 2026-09-11
