/**
 * Stripe testing utilities for test mode, test cards, and webhook testing.
 * Use test API keys (sk_test_*, pk_test_*) and these values only in non-production.
 * @see https://docs.stripe.com/testing
 */

/** Test card numbers for simulating payment scenarios (use with test API keys only). */
export const STRIPE_TEST_CARDS = {
  /** Successful payment (Visa). Use any future expiry and any 3-digit CVC. */
  SUCCESS: "4242424242424242",
  /** Requires 3D Secure authentication. */
  REQUIRES_3DS: "4000002760003184",
  /** Generic card declined. */
  DECLINED: "4000000000000002",
  /** Insufficient funds. */
  INSUFFICIENT_FUNDS: "4000000000009995",
  /** Incorrect CVC. */
  INCORRECT_CVC: "4000000000000127",
  /** Expired card. */
  EXPIRED_CARD: "4000000000000069",
  /** Processing error. */
  PROCESSING_ERROR: "4000000000000119",
} as const;

/** Stripe test PaymentMethod IDs for server-side or API testing (no card number in code). */
export const STRIPE_TEST_PAYMENT_METHODS = {
  /** Visa - successful payment. */
  VISA: "pm_card_visa",
  /** Mastercard - successful payment. */
  MASTERCARD: "pm_card_mastercard",
  /** Card that requires 3D Secure. */
  REQUIRES_3DS: "pm_card_authenticationRequired",
} as const;

/**
 * Returns true if the current Stripe configuration is test mode (test API keys).
 * Use to guard test-only behavior or display "Test mode" in the UI.
 */
export function isStripeTestMode(): boolean {
  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return !!(secret?.startsWith("sk_test_") || publishable?.startsWith("pk_test_"));
}

/**
 * Stripe CLI command for forwarding webhooks to the local server.
 * Run in a separate terminal while developing to receive checkout.session.completed etc.
 */
export const STRIPE_CLI_WEBHOOK_FORWARD_CMD =
  "stripe listen --forward-to localhost:3000/api/webhooks/stripe";

/**
 * Common Stripe CLI trigger commands for testing (use with Stripe CLI installed).
 * Example: stripe trigger checkout.session.completed
 */
export const STRIPE_CLI_TRIGGERS = {
  CHECKOUT_SESSION_COMPLETED: "checkout.session.completed",
  CHECKOUT_SESSION_ASYNC_PAYMENT_SUCCEEDED: "checkout.session.async_payment_succeeded",
  CHECKOUT_SESSION_ASYNC_PAYMENT_FAILED: "checkout.session.async_payment_failed",
} as const;
