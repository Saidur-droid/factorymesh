export type CapacityFreshnessState = "fresh" | "aging" | "stale" | "unverified";

export type CapacityFreshness = {
  state: CapacityFreshnessState;
  effectiveConfidence: number;
  ageDays: number | null;
};

export function evaluateCapacityFreshness(input: {
  confidence: number;
  lastVerifiedAt: string | null;
  updatedAt: string;
  now?: Date;
}): CapacityFreshness {
  const now = input.now ?? new Date();
  const confidence = Number.isFinite(input.confidence)
    ? Math.max(0, Math.min(100, input.confidence))
    : 0;

  if (!input.lastVerifiedAt) {
    return {
      state: "unverified",
      effectiveConfidence: Math.min(confidence, 25),
      ageDays: null,
    };
  }

  const verifiedAt = new Date(input.lastVerifiedAt);
  if (Number.isNaN(verifiedAt.getTime())) {
    return { state: "unverified", effectiveConfidence: 0, ageDays: null };
  }

  const ageDays = Math.max(
    0,
    Math.floor((now.getTime() - verifiedAt.getTime()) / 86_400_000),
  );

  if (ageDays <= 7) {
    return { state: "fresh", effectiveConfidence: confidence, ageDays };
  }

  if (ageDays <= 30) {
    return {
      state: "aging",
      effectiveConfidence: Math.max(0, confidence - 10),
      ageDays,
    };
  }

  return { state: "stale", effectiveConfidence: 0, ageDays };
}

export function isCapacityRoutable(freshness: CapacityFreshness) {
  return freshness.state === "fresh" || freshness.state === "aging";
}
