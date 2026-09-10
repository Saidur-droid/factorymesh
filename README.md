# FactoryMesh

> **Programmable manufacturing capacity for global brands.**

FactoryMesh is an AI-native manufacturing orchestration network. It turns fragmented factory capacity into a trusted, bookable and routable production network — starting with Bangladesh RMG and expanding globally.

## The simple idea

A brand should be able to say:

> “I need 300,000 hoodies, under $8 per piece, delivered in 55 days.”

FactoryMesh should answer:

- which factories are technically capable,
- which factories have real available capacity,
- what the realistic price range is,
- which routing minimizes delivery/quality/compliance risk,
- how the order should be split,
- and then monitor execution through QC and shipment.

The long-term experience is:

**Tech Pack / Order Brief → Quote → Capacity Reservation → Factory Routing → Production → QC → Shipment**

## What FactoryMesh is NOT

FactoryMesh is not another supplier directory, RFQ marketplace, ERP, sourcing agency dashboard, or bank software.

A marketplace says: **“Here are 20 factories. Talk to them.”**

FactoryMesh aims to say: **“Your order has been routed to the best-fit capacity, here is the committed production plan, and we are monitoring execution.”**

## Core wedge

### Live Capacity Map

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
- and capacity confidence.

The goal is to make manufacturing capacity behave more like **bookable inventory**.

## Initial market

**Start:** Bangladesh RMG.

Why Bangladesh:

- dense manufacturing ecosystem,
- large export base,
- many factories with under-utilized or unevenly utilized capacity,
- operational data is fragmented,
- global buyers still face search, capacity, reliability and coordination friction.

## Business model

Initial revenue engine:

**Manufacturing GMV × orchestration take rate**

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

## Global path

1. Bangladesh RMG
2. Bangladesh textile / footwear-adjacent capacity
3. Vietnam, India, Pakistan, Turkey, Cambodia
4. Multi-country order routing
5. Global manufacturing control plane
6. Expansion into other categories only after apparel network density and routing quality are proven

Example future routing:

> 5M-piece order → 40% Bangladesh + 30% Vietnam + 20% India + 10% Turkey based on cost, capacity, lead time, tariff and risk.

## Moat thesis

Software features are copyable. The moat must become the **network + data + execution history**:

- verified live capacity,
- buyer demand patterns,
- factory capability graph,
- order history,
- actual production outcomes,
- defect / rework history,
- delivery reliability,
- costing behavior,
- booking conversion,
- and the routing feedback loop.

More orders → more outcome data → better routing → better buyer experience → more demand → more factories → denser capacity network.

## Non-negotiable principles

- **Do not become a generic marketplace.**
- **Do not ask factories for heavy manual data entry.**
- **Do not promise “AI” before enough real outcome data exists.**
- **Do not depend on Bangladesh Bank integration to make the core product work.**
- **Do not take inventory or credit risk early.**
- **Do not replace factory ERP systems; integrate with whatever factories already use.**
- **Human operations are acceptable in the pilot if every manual step is instrumented for later automation.**

## Repository map

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

**Stage:** pre-MVP / thesis-to-pilot.

The immediate objective is not “build a huge platform.” It is to prove one loop:

> **Brand order brief → verified capacity → credible factory match → reserved slot → monitored production → successful shipment.**

If that loop works repeatedly, everything else can compound on top of it.

---

**Codename:** FactoryMesh  
**Long-term category:** Manufacturing orchestration infrastructure / global manufacturing control plane  
**Repository created:** 2026-09-11
