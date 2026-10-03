import { z } from "zod";

export const capacitySlotSchema = z.object({
  startsOn: z.iso.date(),
  endsOn: z.iso.date(),
  lineType: z.string().trim().min(1).max(120).optional(),
  productCategory: z.string().trim().min(2).max(80),
  availableUnits: z.coerce.number().int().positive().max(100_000_000),
}).refine((data) => data.endsOn >= data.startsOn, {
  message: "End date must be on or after start date",
  path: ["endsOn"],
});

export type CapacitySlotInput = z.infer<typeof capacitySlotSchema>;
