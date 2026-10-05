import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateCapacityFreshness,
  isCapacityRoutable,
} from "../lib/capacity/freshness";
import {
  canFactoryRespondToMatch,
  normalizeCommercialResponse,
} from "../lib/commercial/response";
import {
  calculateFactoryOutcomeMetrics,
  classifyDeliveryOutcome,
} from "../lib/outcomes/memory";

const now = new Date("2026-10-05T12:00:00.000Z");

test("capacity freshness keeps recently verified capacity executable", () => {
  const result = evaluateCapacityFreshness({
    confidence: 90,
    lastVerifiedAt: "2026-10-02T12:00:00.000Z",
    updatedAt: "2026-10-02T12:00:00.000Z",
    now,
  });
  assert.equal(result.state, "fresh");
  assert.equal(result.effectiveConfidence, 90);
  assert.equal(isCapacityRoutable(result), true);
});

test("capacity freshness decays aging capacity and blocks stale capacity", () => {
  const aging = evaluateCapacityFreshness({
    confidence: 90,
    lastVerifiedAt: "2026-09-23T12:00:00.000Z",
    updatedAt: "2026-09-23T12:00:00.000Z",
    now,
  });
  assert.equal(aging.state, "aging");
  assert.equal(aging.effectiveConfidence, 80);
  assert.equal(isCapacityRoutable(aging), true);

  const stale = evaluateCapacityFreshness({
    confidence: 90,
    lastVerifiedAt: "2026-08-20T12:00:00.000Z",
    updatedAt: "2026-08-20T12:00:00.000Z",
    now,
  });
  assert.equal(stale.state, "stale");
  assert.equal(stale.effectiveConfidence, 0);
  assert.equal(isCapacityRoutable(stale), false);
});

test("unverified self-reported capacity cannot be routed as executable", () => {
  const result = evaluateCapacityFreshness({
    confidence: 50,
    lastVerifiedAt: null,
    updatedAt: "2026-10-05T11:00:00.000Z",
    now,
  });
  assert.equal(result.state, "unverified");
  assert.equal(result.effectiveConfidence, 25);
  assert.equal(isCapacityRoutable(result), false);
});

test("factory commercial responses normalize quote details", () => {
  assert.deepEqual(
    normalizeCommercialResponse({
      decision: "accept",
      quotedUnitPrice: 7.55,
      quotedCurrency: "usd",
      promisedShipDate: "2026-11-28",
      note: "Line 4 reserved pending buyer confirmation.",
    }),
    {
      decision: "accept",
      matchStatus: "shortlisted",
      quotedUnitPrice: 7.55,
      quotedCurrency: "USD",
      promisedShipDate: "2026-11-28",
      note: "Line 4 reserved pending buyer confirmation.",
    },
  );
});

test("factory can only respond to an unassigned live match it owns", () => {
  assert.equal(canFactoryRespondToMatch({
    factoryOwnsMatch: true,
    orderAssignedFactoryId: null,
    matchStatus: "suggested",
  }), true);
  assert.equal(canFactoryRespondToMatch({
    factoryOwnsMatch: false,
    orderAssignedFactoryId: null,
    matchStatus: "suggested",
  }), false);
  assert.equal(canFactoryRespondToMatch({
    factoryOwnsMatch: true,
    orderAssignedFactoryId: "factory-a",
    matchStatus: "shortlisted",
  }), false);
});

test("outcome memory classifies delivery and computes aggregate factory metrics", () => {
  assert.equal(classifyDeliveryOutcome("2026-11-20", "2026-11-21"), false);
  assert.equal(classifyDeliveryOutcome("2026-11-20", "2026-11-20"), true);

  const metrics = calculateFactoryOutcomeMetrics([
    { onTime: true, defectRate: 1.0 },
    { onTime: false, defectRate: 3.0 },
    { onTime: true, defectRate: 2.0 },
  ]);

  assert.equal(metrics.onTimeRate, 66.67);
  assert.equal(metrics.defectRate, 2);
  assert.equal(metrics.sampleSize, 3);
});
