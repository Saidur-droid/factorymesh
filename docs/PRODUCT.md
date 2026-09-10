# FactoryMesh Product Plan

## Primary user flows

### Buyer flow
1. Create order request.
2. Upload tech pack / BOM / reference images / target quantity / target price / delivery deadline.
3. FactoryMesh normalizes requirements.
4. System returns feasible factories and recommended routing.
5. Buyer reviews indicative quote and capacity windows.
6. Buyer requests / confirms reservation.
7. Production plan is created.
8. Buyer tracks milestones, QC and shipment.

### Factory flow
1. Factory creates verified profile.
2. Declares capabilities and certifications.
3. Adds production lines / machine groups.
4. Shares capacity windows.
5. Receives matched requests.
6. Confirms feasibility, price and slot.
7. Updates key production milestones.
8. Receives performance score based on actual outcomes.

## MVP scope

### Buyer dashboard
- buyer organization + users
- create order request
- upload tech pack and documents
- quantity / target cost / ship-by date
- product category and key construction details
- recommended factory matches
- quote comparison
- production status timeline

### Factory dashboard
- factory profile
- categories and product capabilities
- compliance / certification metadata
- production lines and capacity units
- 12-week capacity calendar
- matched opportunities
- quote / accept / reject
- milestone updates

### Internal operator console
- approve factory profiles
- verify capacity updates
- override routing when necessary
- handle exceptions
- inspect order activity and audit log

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
- overall routing score,
- reasons / warnings.

## MVP UX principle
Buyer should never feel they are browsing a directory. The default experience is a **recommended production plan**, with alternatives available only when needed.
