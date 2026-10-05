export type CommercialDecision = "accept" | "reject";

export function normalizeCommercialResponse(input: {
  decision: CommercialDecision;
  quotedUnitPrice?: number | null;
  quotedCurrency?: string | null;
  promisedShipDate?: string | null;
  note?: string | null;
}) {
  if (input.decision === "accept") {
    if (
      input.quotedUnitPrice != null &&
      (!Number.isFinite(input.quotedUnitPrice) || input.quotedUnitPrice <= 0)
    ) {
      throw new Error("Quoted unit price must be positive");
    }
  }

  const note = input.note?.trim() || null;
  return {
    decision: input.decision,
    matchStatus: input.decision === "accept" ? "shortlisted" : "rejected",
    quotedUnitPrice: input.quotedUnitPrice ?? null,
    quotedCurrency: (input.quotedCurrency || "USD").trim().toUpperCase(),
    promisedShipDate: input.promisedShipDate ?? null,
    note,
  };
}

export function canFactoryRespondToMatch(input: {
  factoryOwnsMatch: boolean;
  orderAssignedFactoryId: string | null;
  matchStatus: string;
}) {
  if (!input.factoryOwnsMatch || input.orderAssignedFactoryId) return false;
  return input.matchStatus === "suggested" || input.matchStatus === "shortlisted";
}
