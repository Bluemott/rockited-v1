import { z } from "zod";

const checkoutItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(500),
  price: z.number().min(0),
  quantity: z.number().int().min(1).max(100),
  image: z.string().optional(),
  sku: z.string().optional(),
  virtual: z.boolean().optional(),
  categories: z.array(z.object({ slug: z.string().optional() })).optional(),
});

const shippingAddressSchema = z.object({
  country: z.string().length(2, "Country must be 2-letter code"),
  postal_code: z.string().min(1, "Postal code is required"),
  state: z.string().optional(),
  city: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  name: z.string().optional(),
});

const selectedShippingRateSchema = z.object({
  method_id: z.string().min(1, "method_id is required"),
  method_title: z.string().optional(),
  cost: z.union([z.string(), z.number()]),
  estimated_delivery: z.string().optional(),
});

const standardizedAddressSchema = z.object({
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
});

/** POST /api/checkout request body */
export const checkoutBodySchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "At least one item is required").max(100),
  customerEmail: z.union([z.string().email(), z.literal("")]).optional(),
  shippingAddress: shippingAddressSchema.optional(),
  selectedShippingRate: selectedShippingRateSchema.optional(),
  standardizedAddress: standardizedAddressSchema.optional(),
}).refine(
  (data) => {
    if (data.shippingAddress && !data.selectedShippingRate) return false;
    if (data.selectedShippingRate && !data.shippingAddress) return false;
    return true;
  },
  { message: "shippingAddress and selectedShippingRate must be provided together" }
);

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;

/** POST /api/checkout/shipping request body (Stripe dynamic shipping) */
export const checkoutShippingBodySchema = z.object({
  checkoutSessionId: z.string().min(1, "checkoutSessionId is required").refine(
    (id) => id.startsWith("cs_") && id.length >= 10 && id.length <= 200,
    "Invalid checkout session ID format"
  ),
  shippingDetails: z.object({
    name: z.string().optional(),
    address: z.object({
      country: z.string().optional(),
      postal_code: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      line1: z.string().optional(),
      line2: z.string().optional(),
    }).optional(),
  }).passthrough(),
});

export type CheckoutShippingBody = z.infer<typeof checkoutShippingBodySchema>;
