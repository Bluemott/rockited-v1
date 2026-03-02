import { z } from "zod";

const reviewerAvatarUrlsSchema = z
  .object({
    "24": z.string().optional(),
    "48": z.string().optional(),
    "96": z.string().optional(),
  })
  .optional();

/** Single review from WooCommerce products/reviews (for API response validation) */
export const reviewSchema = z.object({
  id: z.number(),
  date_created: z.string(),
  product_id: z.number(),
  product_name: z.string(),
  product_permalink: z.string(),
  reviewer: z.string(),
  review: z.string(),
  rating: z.number().min(0).max(5),
  verified: z.boolean().optional(),
  reviewer_avatar_urls: reviewerAvatarUrlsSchema,
});

export const siteReviewsResponseSchema = z.array(reviewSchema);

export type SiteReviewItem = z.infer<typeof reviewSchema>;
