# Durable Decisions Log

This file records important founder/product decisions so future contributors understand not only what FactoryMesh is, but why.

## 2026-09-20 — Lock the buyer outcome
Decision: FactoryMesh's core promise is to identify which factory is truly available for an exact order, how much capacity is available, expected timing/cost/risk, and enable the buyer to reserve that capacity.

Reason: Buyers should pay for production certainty and execution leverage, not for access to a supplier directory.

Canonical wording:

> **For your exact order, show which factory is truly available now, how much capacity is available, how fast it can produce, the expected cost and execution risk — then let you reserve that capacity immediately.**

## 2026-09-20 — Lock five differentiation primitives
Decision: The product strategy is organized around:
1. Live 12-week Capacity Map
2. Capacity Confidence Score
3. Order Routing Engine
4. Capacity Reservation
5. Real Outcome History

Reason: These five layers turn FactoryMesh from supplier discovery into manufacturing orchestration.

## 2026-09-20 — Lock launch pricing for the first five paid shipped orders
Decision: Standard early pricing is **2.5% of fulfilled/shipped FOB manufacturing GMV**, with a **$1,000 minimum per successful order**. Orders at or above $250k may use 2.0% when scope and economics support it. Large programs may use negotiated volume pricing.

No signup fee, no mandatory buyer subscription and no heavy factory fee at launch.

Reason: Pricing should align FactoryMesh revenue with delivered manufacturing value. The first five paid shipped orders are the pricing-validation cohort; only real willingness-to-pay and unit economics can make the rate truly market validated.

## 2026-09-20 — No successful order, no standard orchestration fee
Decision: The launch model is success-oriented. Standard orchestration revenue is earned when a FactoryMesh-supported order successfully reaches the agreed commercial execution point.

Reason: Reduce buyer adoption friction and align incentives with outcomes.

## 2026-09-20 — Lock the canonical data moat
Decision: The long-term proprietary graph is:

> **Factory → Capability → Capacity Window → Buyer → Quote → Reservation → Production → QC → Shipment → Actual Outcome**

Reason: Interface features can be copied; accumulated capacity accuracy and execution history cannot be copied instantly.

## 2026-09-20 — Do not claim category leadership before proof
Decision: FactoryMesh must not call itself “the best,” “leading,” or equivalent until real market evidence supports it.

Reason: Competitive differentiation should come from verified capacity, routing performance, reservations, fulfilled GMV, repeat buyers and improving economics rather than marketing claims.

## 2026-09-11 — FactoryMesh is an orchestration network, not a supplier marketplace
Decision: Default UX returns a recommended executable production plan, not a directory of factories.

Reason: Supplier discovery alone is crowded and weakly defensible. The value is routing + capacity + execution.

## 2026-09-11 — Live capacity is the initial wedge
Decision: Build verified 12-week capacity as a first-class data object.

Reason: Static factory profiles are easy to copy; time-bound trusted capacity is more operationally valuable and can compound into a proprietary dataset.

## 2026-09-11 — Bangladesh RMG is the launch market
Decision: Start in a narrow Bangladesh apparel category before expanding.

Reason: Dense manufacturing supply, founder proximity, and a strong opportunity to learn the real operational constraints of capacity orchestration.

## 2026-09-11 — Asset-light first
Decision: FactoryMesh will not own factories, fund production, or hold inventory in the early model.

Reason: Preserve software/network economics and avoid balance-sheet risk before product-market fit.

## 2026-09-11 — No Bangladesh Bank dependency in the core loop
Decision: The core product must work without central-bank integration.

Reason: Manufacturing orchestration should not be blocked by financial regulation. Finance can be added later through licensed partners.

## 2026-09-11 — Deterministic routing before predictive AI
Decision: Use hard constraints + weighted scoring + human review first.

Reason: Real manufacturing outcome data is required before predictive models can be trusted.

## 2026-09-11 — Integrate with ERPs; do not replace them
Decision: Begin with forms/CSV/document ingestion and add ERP/API integrations where justified.

Reason: Replacing factory systems creates unnecessary adoption friction and distracts from the network value.

## 2026-09-11 — FactoryMesh codename is not guaranteed final brand
Decision: Treat FactoryMesh as current project/product codename until full global naming/trademark/domain diligence is complete.


## 2026-10-03 — Lock execution sequence around Ideathon

Decision: Complete the Ideathon Bangladesh Stage 1 submission first, then return to FactoryMesh production-live hardening and premium product polish.

Reason: Stage 1 is judged on the strength and clarity of the idea and does not require a prototype or production-live startup. The core MVP is already implemented and verified in CI/E2E, so the deadline-sensitive priority is a clear, evidence-grounded submission rather than rushing infrastructure changes before applying.

Post-submission FactoryMesh priority:
1. dedicated production backend/infrastructure;
2. live Auth / DB / Storage;
3. production deployment;
4. real-user end-to-end verification;
5. tenant isolation and concurrent reservation validation;
6. monitoring, recovery and security hardening;
7. premium, non-generic product UX polish across the real buyer/factory/operator workflow.

Design rule: do not replace the product with a generic competition landing page. Product polish must strengthen the actual manufacturing workflow, trust, clarity and execution quality.
