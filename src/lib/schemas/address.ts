import { z } from "zod";

/** POST /api/address/validate request body */
export const addressValidateBodySchema = z.object({
  line1: z.string().min(1, "Street address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().min(1, "Postal code is required").refine(
    (v) => (v || "").replace(/\D/g, "").slice(0, 5).length === 5,
    "Valid 5-digit US ZIP is required"
  ),
});

export type AddressValidateBody = z.infer<typeof addressValidateBodySchema>;
