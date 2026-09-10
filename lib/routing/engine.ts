export type RoutingOrder = {
  productCategory: string;
  quantity: number;
  targetUnitPrice?: number;
  requiredDeliveryDate: string;
  complianceRequirements?: string[];
};

export type RoutingCandidate = {
  factoryId: string;
  factoryName: string;
  capacitySlotId?: string;
  productCategories: string[];
  certifications: string[];
  availableUnits: number;
  slotEndsOn: string;
  indicativeCostMin?: number;
  indicativeCostMax?: number;
  onTimeRate?: number;
  defectRate?: number;
  capacityConfidence?: number;
};

export type RoutingResult = RoutingCandidate & {
  score: number;
  scores: {
    capability: number;
    capacity: number;
    delivery: number;
    price: number;
    quality: number;
    compliance: number;
  };
  reasons: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const norm = (value: string) => value.trim().toLowerCase();

export function routeOrder(order: RoutingOrder, candidates: RoutingCandidate[]): RoutingResult[] {
  const deliveryTs = Date.parse(order.requiredDeliveryDate);
  const requiredCerts = new Set((order.complianceRequirements ?? []).map(norm));

  return candidates
    .filter((candidate) => candidate.productCategories.map(norm).includes(norm(order.productCategory)))
    .filter((candidate) => candidate.availableUnits > 0)
    .filter((candidate) => Date.parse(candidate.slotEndsOn) <= deliveryTs)
    .map((candidate) => {
      const capability = 100;
      const capacity = clamp((candidate.availableUnits / order.quantity) * 100);
      const delivery = clamp(candidate.onTimeRate ?? 70);
      const quality = clamp(100 - (candidate.defectRate ?? 5) * 10);
      const compliance = requiredCerts.size === 0
        ? 100
        : clamp(([...requiredCerts].filter((cert) => candidate.certifications.map(norm).includes(cert)).length / requiredCerts.size) * 100);

      let price = 70;
      if (order.targetUnitPrice && candidate.indicativeCostMin != null) {
        if (candidate.indicativeCostMin <= order.targetUnitPrice) price = 100;
        else price = clamp(100 - ((candidate.indicativeCostMin - order.targetUnitPrice) / order.targetUnitPrice) * 200);
      }

      const confidence = clamp(candidate.capacityConfidence ?? 50) / 100;
      const weighted = capability * 0.22 + capacity * 0.24 + delivery * 0.18 + price * 0.14 + quality * 0.12 + compliance * 0.10;
      const score = Math.round(weighted * (0.7 + 0.3 * confidence) * 100) / 100;

      const reasons = [
        `${candidate.availableUnits.toLocaleString()} units available`,
        `slot completes by ${candidate.slotEndsOn}`,
        `${Math.round(delivery)}% delivery reliability signal`,
      ];

      if (requiredCerts.size > 0) reasons.push(`${Math.round(compliance)}% compliance match`);
      if (order.targetUnitPrice) reasons.push(`${Math.round(price)}% target-price fit`);

      return {
        ...candidate,
        score,
        scores: { capability, capacity, delivery, price, quality, compliance },
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}
