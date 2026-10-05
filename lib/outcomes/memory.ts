export type OutcomeSample = {
  onTime: boolean;
  defectRate: number;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function classifyDeliveryOutcome(
  requiredDeliveryDate: string,
  actualShipDate: string,
) {
  return actualShipDate <= requiredDeliveryDate;
}

export function calculateFactoryOutcomeMetrics(samples: OutcomeSample[]) {
  if (samples.length === 0) {
    return { onTimeRate: null, defectRate: null, sampleSize: 0 };
  }

  const onTime = samples.filter((sample) => sample.onTime).length;
  const defectRate = samples.reduce((sum, sample) => sum + sample.defectRate, 0) / samples.length;

  return {
    onTimeRate: round2((onTime / samples.length) * 100),
    defectRate: round2(defectRate),
    sampleSize: samples.length,
  };
}
