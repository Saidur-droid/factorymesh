import assert from "node:assert/strict";
import test from "node:test";
import { routeOrder } from "../lib/routing/engine";

test("routing filters capability and deadline, then ranks executable capacity", () => {
  const matches = routeOrder({
    productCategory: "Hoodies",
    quantity: 100_000,
    targetUnitPrice: 8,
    requiredDeliveryDate: "2026-12-01",
    complianceRequirements: ["GOTS"],
  }, [
    {
      factoryId: "a",
      factoryName: "Factory A",
      capacitySlotId: "slot-a",
      productCategories: ["Hoodies"],
      certifications: ["GOTS"],
      availableUnits: 120_000,
      slotEndsOn: "2026-11-15",
      indicativeCostMin: 7.5,
      onTimeRate: 96,
      defectRate: 1,
      capacityConfidence: 95,
    },
    {
      factoryId: "b",
      factoryName: "Factory B",
      productCategories: ["Denim"],
      certifications: ["GOTS"],
      availableUnits: 500_000,
      slotEndsOn: "2026-11-01",
    },
    {
      factoryId: "c",
      factoryName: "Factory C",
      productCategories: ["Hoodies"],
      certifications: ["GOTS"],
      availableUnits: 200_000,
      slotEndsOn: "2026-12-20",
    },
  ]);

  assert.equal(matches.length, 1);
  assert.equal(matches[0].factoryId, "a");
  assert.ok(matches[0].score > 80);
  assert.equal(matches[0].capacitySlotId, "slot-a");
});

test("routing penalizes missing compliance and price mismatch", () => {
  const [result] = routeOrder({
    productCategory: "T-Shirts",
    quantity: 50_000,
    targetUnitPrice: 3,
    requiredDeliveryDate: "2026-12-01",
    complianceRequirements: ["GOTS", "OEKO-TEX"],
  }, [{
    factoryId: "x",
    factoryName: "Factory X",
    productCategories: ["T-Shirts"],
    certifications: ["GOTS"],
    availableUnits: 50_000,
    slotEndsOn: "2026-11-20",
    indicativeCostMin: 4,
    onTimeRate: 80,
    defectRate: 2,
    capacityConfidence: 80,
  }]);

  assert.equal(result.scores.compliance, 50);
  assert.ok(result.scores.price < 100);
});
