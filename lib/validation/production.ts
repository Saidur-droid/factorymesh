import { z } from "zod";

export const productionEventSchema = z.object({
  orderId: z.string().uuid(),
  eventType: z.enum([
    "production.started",
    "cutting.completed",
    "sewing.progress",
    "finishing.completed",
    "qc.passed",
    "qc.failed",
    "shipment.booked",
    "shipment.dispatched",
    "exception.reported",
  ]),
  progressPercent: z.coerce.number().min(0).max(100).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type ProductionEventInput = z.infer<typeof productionEventSchema>;
