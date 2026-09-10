# FactoryMesh Routing Engine

## Goal
Turn a buyer's production request into an auditable recommendation for where, when and how the order should be produced.

## Routing is NOT magic AI
The first version should be deterministic, explainable and human-reviewable.

## Step 1: Hard constraint filtering
A factory/slot is eliminated if it fails any mandatory constraint, such as:
- wrong product capability,
- insufficient capacity,
- cannot meet delivery window,
- missing required compliance/certification,
- MOQ mismatch,
- destination/country restriction,
- process/machine mismatch.

## Step 2: Candidate scoring
Remaining candidates receive a weighted score.

Illustrative score:

`Routing Score = 25% Capacity Fit + 20% Capability Fit + 20% Delivery Reliability + 15% Cost Fit + 10% Quality History + 10% Compliance/Confidence`

Weights are configurable and must be calibrated from real order outcomes.

## Step 3: Capacity confidence
Every declared slot receives a confidence score based on:
- how recently it was updated,
- who verified it,
- historical accuracy of that factory's declarations,
- whether related orders already consume the slot,
- change frequency,
- source quality (manual vs system integration).

Stale capacity should automatically decay in confidence.

## Step 4: Split routing
When one factory cannot satisfy the full order, FactoryMesh may propose a split.

Constraints for split orders:
- product consistency,
- material availability,
- color/lot risks,
- QC coordination,
- logistics cost,
- minimum economic lot size,
- buyer approval.

The system should prefer simplicity over unnecessary splitting.

## Step 5: Explainability
Every recommendation must say why it ranked highly and what risks remain.

Example:

**Factory A — Score 87/100**
- Capacity: 95 — verified 2 days ago
- Capability: 92 — 18 similar hoodie orders
- Delivery: 88 — 94% on-time
- Cost: 72 — 4% above target
- Quality: 91 — low defect history
- Warning: peak-season slot, reservation expires in 48h

## Step 6: Human approval in early stage
An internal operator reviews routing before the buyer sees a committed recommendation.

Operator actions become training / rule-improvement data:
- accepted recommendation,
- overridden candidate,
- reason for override,
- final outcome.

## Evolution to ML
Only after enough completed orders exist should predictive models estimate:
- late delivery probability,
- likely realized lead time,
- defect/rework probability,
- quote-to-final-cost variance,
- cancellation risk,
- capacity declaration reliability.

## Long-term optimization
With multi-country network density, objective functions can include:
- total landed cost,
- delivery probability,
- tariff,
- logistics time,
- geopolitical/country risk,
- carbon preference if buyer requires,
- concentration limits,
- resilience / dual sourcing.

The end-state is not 'find a factory'. It is **optimize a manufacturing portfolio**.
