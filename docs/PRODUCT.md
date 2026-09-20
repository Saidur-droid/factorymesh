# FactoryMesh Product Plan

## Locked buyer outcome

The core product promise is:

> **For your exact order, show which factory is truly available now, how much capacity is available, how fast it can produce, the expected cost and execution risk — then let you reserve that capacity immediately.**

The buyer should not experience FactoryMesh as a directory. The buyer should experience it as a production decision and reservation system.

The product must create four kinds of value:

1. **Speed** — reduce time spent finding credible capacity.
2. **Certainty** — verify whether capacity is fresh, real and suitable.
3. **Lower sourcing workload** — replace broad outreach with a small number of executable options.
4. **Lower execution risk** — rank, reserve, monitor and learn from production outcomes.

## Five product primitives

### 1. Live 12-week Capacity Map
FactoryMesh maintains time-bound production availability, not only static factory profiles.

Every capacity record must carry a freshness state and last-verified timestamp. Stale capacity must automatically lose confidence.

### 2. Capacity Confidence Score
A factory's declared availability is not accepted as equally trustworthy forever.

Confidence should evolve from:
- freshness,
- operator/factory confirmation,
- historical declaration accuracy,
- reservation success,
- production start accuracy,
- and later shipment/outcome evidence.

### 3. Order Routing Engine
Given an order brief, FactoryMesh evaluates whether one factory or a split route is safer.

The route must consider:
- capability,
- quantity,
- available capacity,
- target cost,
- deadline,
- quality/reliability,
- compliance,
- and explicit warnings/unknowns.

### 4. Capacity Reservation
A recommended option must be able to progress into a real reservation workflow.

The reservation layer should preserve:
- selected capacity slot,
- reserved quantity,
- reservation state,
- expiry/confirmation rules,
- commercial references,
- and an auditable timeline.

### 5. Real Outcome History
Completed orders must update the network's memory.

Track at minimum:
- promised vs actual lead time,
- quote vs realized cost,
- on-time delivery,
- defects/rework,
- cancellations/exceptions,
- declared capacity vs actual usable capacity.

The long-term product gets better because actual execution history changes future routing.

## Primary user flows

### Buyer flow
1. Create order request.
2. Upload tech pack / BOM / reference images / target quantity / target price / delivery deadline.
3. FactoryMesh normalizes requirements.
4. System returns a **recommended executable production plan**, not a list.
5. Buyer reviews 1–3 capacity-backed options, indicative quote, risk and routing rationale.
6. Buyer requests / confirms capacity reservation.
7. Production plan is created.
8. Buyer tracks milestones, QC and shipment.
9. Actual outcomes update factory/capacity reliability history.

### Factory flow
1. Factory creates verified profile.
2. Declares capabilities and certifications.
3. Adds production lines / machine groups.
4. Shares 12-week capacity windows.
5. Refreshes capacity on schedule.
6. Receives matched requests.
7. Confirms feasibility, price and slot.
8. Confirms/reserves capacity.
9. Updates key production milestones.
10. Receives performance/confidence updates based on actual outcomes.

### Operator flow
1. Verify factory identity/capabilities.
2. Verify or challenge capacity declarations.
3. Review routing when confidence is insufficient.
4. Resolve reservation/production exceptions.
5. Record every manual verification so the operation can become more automated over time.

## MVP scope

### Buyer dashboard
- buyer organization + users
- create order request
- upload tech pack and documents
- quantity / target cost / ship-by date
- product category and key construction details
- recommended production plan
- 1–3 executable capacity-backed alternatives
- quote comparison
- routing rationale + warnings
- capacity reservation
- production status timeline
- backup-route visibility when appropriate

### Factory dashboard
- factory profile
- categories and product capabilities
- compliance / certification metadata
- production lines and capacity units
- 12-week capacity calendar
- freshness / verification state
- matched opportunities
- quote / accept / reject
- reservation confirmation
- milestone updates

### Internal operator console
- approve factory profiles
- verify capacity updates
- override routing when necessary
- handle exceptions
- inspect order activity and audit log
- record declaration accuracy and outcome corrections

## MVP constraints

Do not build initially:
- payments,
- lending,
- full logistics management,
- full ERP,
- factory payroll,
- blockchain,
- complex sustainability reporting,
- autonomous AI routing without human review.

## Capacity object
Each available capacity slot must have:
- factory,
- production unit / line group,
- product/category capability,
- start date,
- end date,
- estimated units/day,
- available quantity,
- minimum bookable quantity,
- confidence score,
- last verified timestamp,
- reservation status.

## Order request object
- buyer
- product category
- tech pack/document references
- quantity
- target unit cost
- currency
- requested delivery date
- destination
- quality level / requirements
- compliance constraints
- preferred / excluded countries if applicable

## Match output
For each candidate factory:
- feasibility status,
- capacity fit,
- capability fit,
- cost fit,
- delivery fit,
- quality/reliability fit,
- compliance fit,
- capacity confidence,
- overall routing score,
- reasons / warnings,
- reservable quantity/window.

The default output should also include a **recommended route** and, where justified, a split-order route.

## Buyer experience example

FactoryMesh should be able to produce an answer like:

> Factory A is booked for the next 4–6 weeks. Factory B has 65k units available but weaker delivery reliability. Factory C has 100k units available in the required window and meets the compliance constraints. Recommended route: 70k to C + 30k to D. Reserve now.

This is the standard to build toward.

## MVP UX principle

Buyer should never feel they are browsing a directory. The default experience is a **recommended production plan backed by live capacity**, with alternatives available only when needed.

## Product acceptance test

The product is not differentiated merely because it has factory profiles or an AI score.

A successful buyer flow must prove:

**brief → verified capacity → credible route → reservation → production monitoring → shipment/outcome evidence.**
