import assert from "node:assert/strict";
import test from "node:test";
import { capacitySlotSchema } from "../lib/validation/capacity";
import { productionBriefSchema } from "../lib/validation/order";

test("production brief normalizes currency and country", () => {
  const parsed = productionBriefSchema.parse({
    title: "100k knit hoodies",
    productCategory: "Hoodies",
    quantity: "100000",
    targetUnitPrice: "7.5",
    currency: "usd",
    requiredDeliveryDate: "2026-12-01",
    shipToCountryCode: "us",
    complianceRequirements: [],
  });
  assert.equal(parsed.quantity, 100000);
  assert.equal(parsed.currency, "USD");
  assert.equal(parsed.shipToCountryCode, "US");
});

test("capacity rejects inverted dates", () => {
  const parsed = capacitySlotSchema.safeParse({
    startsOn: "2026-12-10",
    endsOn: "2026-12-01",
    productCategory: "Hoodies",
    availableUnits: 50000,
  });
  assert.equal(parsed.success, false);
});


test("capacity does not accept self-reported confidence or source", () => {
  const parsed = capacitySlotSchema.parse({
    startsOn: "2026-12-01",
    endsOn: "2026-12-10",
    productCategory: "Hoodies",
    availableUnits: 50000,
    confidence: 99,
    source: "api",
  });
  assert.equal("confidence" in parsed, false);
  assert.equal("source" in parsed, false);
});

test("capacity requires a positive unit count", () => {
  const parsed = capacitySlotSchema.safeParse({
    startsOn: "2026-12-01",
    endsOn: "2026-12-10",
    productCategory: "Hoodies",
    availableUnits: 0,
  });
  assert.equal(parsed.success, false);
});
