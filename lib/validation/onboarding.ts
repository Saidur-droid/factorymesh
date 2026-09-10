import { z } from "zod";

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  organizationName: z.string().trim().min(2).max(160),
  role: z.enum(["buyer", "factory"]),
  countryCode: z.string().trim().length(2).transform((v) => v.toUpperCase()).default("BD"),
  city: z.string().trim().max(120).optional(),
  productCategories: z.array(z.string().trim().min(2).max(80)).max(30).default([]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
