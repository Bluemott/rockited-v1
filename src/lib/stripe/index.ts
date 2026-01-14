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
} from "./sessions";
