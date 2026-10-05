export type TrustOperatorRole = "buyer" | "factory" | "operator" | "admin";
export type CapacityVerificationDecision = "verified" | "challenged";

export function canOperateTrustState(role: TrustOperatorRole | undefined | null) {
  return role === "operator" || role === "admin";
}

export function resolveCapacityTrust(
  currentConfidence: number,
  decision: CapacityVerificationDecision,
) {
  const safeCurrent = Number.isFinite(currentConfidence)
    ? Math.max(0, Math.min(100, currentConfidence))
    : 0;

  if (decision === "verified") {
    return {
      confidence: Math.max(safeCurrent, 85),
      source: "operator_verified",
    };
  }

  return {
    confidence: Math.min(safeCurrent, 25),
    source: "operator_challenged",
  };
}
