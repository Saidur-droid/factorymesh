import { z } from "zod";

export const productionBriefSchema = z.object({
  title: z.string().trim().min(3).max(140),
  productCategory: z.string().trim().min(2).max(80),
  quantity: z.coerce.number().int().positive().max(100_000_000),
  targetUnitPrice: z.coerce.number().positive().max(1_000_000).optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("USD"),
  requiredDeliveryDate: z.string().date(),
  shipToCountryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  materialRequirements: z.string().trim().max(5_000).optional(),
  complianceRequirements: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  notes: z.string().trim().max(5_000).optional(),
});

export type ProductionBriefInput = z.infer<typeof productionBriefSchema>;
