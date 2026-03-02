// Barrel export for Stripe API functions
// This maintains backward compatibility while organizing code into smaller modules

// Export Stripe client
export { stripe } from "./client";

// Export session functions
export {
  createCheckoutSession,
  createEmbeddedCheckoutSession,
  getCheckoutSession,
  getTaxCodeForProduct,
  type CartItem,
  type CheckoutSessionOptions,
  type PreselectedShipping,
  type PreselectedShippingAddress,
  type PreselectedShippingOption,
} from "./sessions";

// Export testing utilities (test cards, test mode detection, CLI commands)
export {
  STRIPE_TEST_CARDS,
  STRIPE_TEST_PAYMENT_METHODS,
  isStripeTestMode,
  STRIPE_CLI_WEBHOOK_FORWARD_CMD,
  STRIPE_CLI_TRIGGERS,
} from "./testing";
