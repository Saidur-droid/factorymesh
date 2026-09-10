import { z } from "zod";

export const capacitySlotSchema = z.object({
  startsOn: z.string().date(),
  endsOn: z.string().date(),
  lineType: z.string().trim().min(1).max(120).optional(),
  productCategory: z.string().trim().min(2).max(80),
  availableUnits: z.coerce.number().int().nonnegative().max(100_000_000),
  confidence: z.coerce.number().min(0).max(100).default(70),
  source: z.enum(["manual", "erp", "csv", "api"]).default("manual"),
}).refine((data) => data.endsOn >= data.startsOn, {
  message: "End date must be on or after start date",
  path: ["endsOn"],
});

export type CapacitySlotInput = z.infer<typeof capacitySlotSchema>;
