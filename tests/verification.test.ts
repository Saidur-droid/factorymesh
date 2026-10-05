import assert from "node:assert/strict";
import test from "node:test";
import {
  canOperateTrustState,
  resolveCapacityTrust,
} from "../lib/operations/verification";

test("only operator and admin roles can manage trust state", () => {
  assert.equal(canOperateTrustState("operator"), true);
  assert.equal(canOperateTrustState("admin"), true);
  assert.equal(canOperateTrustState("buyer"), false);
  assert.equal(canOperateTrustState("factory"), false);
  assert.equal(canOperateTrustState(undefined), false);
});

test("operator verification raises weak confidence without downgrading stronger evidence", () => {
  assert.deepEqual(resolveCapacityTrust(50, "verified"), {
    confidence: 85,
    source: "operator_verified",
  });
  assert.deepEqual(resolveCapacityTrust(94, "verified"), {
    confidence: 94,
    source: "operator_verified",
  });
});

test("operator challenge lowers weakly trusted capacity without increasing an already lower score", () => {
  assert.deepEqual(resolveCapacityTrust(80, "challenged"), {
    confidence: 25,
    source: "operator_challenged",
  });
  assert.deepEqual(resolveCapacityTrust(10, "challenged"), {
    confidence: 10,
    source: "operator_challenged",
  });
});
