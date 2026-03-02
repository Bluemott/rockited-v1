/**
 * Centralized return policy copy for checkout, product pages, and about/returns.
 * Single source of truth so summary stays aligned across the site.
 */

/** Short summary (1–2 sentences) for inline display and expandable default state. */
export const RETURN_POLICY_SUMMARY =
  "30-day return policy. Full refund or exchange if not satisfied. Items must be unused and in original condition.";

/** Bullet points for the expandable "read more" section (key conditions + refund timing). */
export const RETURN_POLICY_EXPANDABLE_BULLETS = [
  "Items must be in original condition, unused, with tags attached.",
  "Return in original packaging when possible; include order number or receipt.",
  "Refunds processed to original payment method within 5–7 business days after we receive the item.",
] as const;

/** Full policy page path. */
export const RETURN_POLICY_PATH = "/about/returns" as const;
