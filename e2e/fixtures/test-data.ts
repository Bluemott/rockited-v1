/**
 * Test data fixtures for E2E tests
 */

/**
 * Stripe test card numbers for different scenarios
 * See: https://stripe.com/docs/testing
 */
export const STRIPE_TEST_CARDS = {
  /** Success - Visa */
  SUCCESS: "4242 4242 4242 4242",
  /** Success - Visa (debit) */
  SUCCESS_DEBIT: "4000 0566 5566 5556",
  /** Decline - Generic decline */
  DECLINE: "4000 0000 0000 0002",
  /** Decline - Insufficient funds */
  INSUFFICIENT_FUNDS: "4000 0000 0000 9995",
  /** Decline - Lost card */
  LOST_CARD: "4000 0000 0000 9987",
  /** Decline - Stolen card */
  STOLEN_CARD: "4000 0000 0000 9979",
  /** Decline - Expired card */
  EXPIRED_CARD: "4000 0000 0000 0069",
  /** Decline - Incorrect CVC */
  INCORRECT_CVC: "4000 0000 0000 0127",
  /** Decline - Processing error */
  PROCESSING_ERROR: "4000 0000 0000 0119",
} as const;

/**
 * Test card details
 */
export const TEST_CARD_DETAILS = {
  EXPIRY_DATE: "12/34", // Future date
  CVC: "123",
  ZIP_CODE: "12345",
} as const;

/**
 * Mock product data for testing
 * In real tests, you'll use actual product IDs from WooCommerce
 */
export interface TestProduct {
  id: number;
  name: string;
  price: number;
  sku?: string;
}

/**
 * Example test products
 * Replace with actual product IDs from your WooCommerce store
 */
export const TEST_PRODUCTS: TestProduct[] = [
  {
    id: 1, // Replace with actual product ID
    name: "Test Product 1",
    price: 29.99,
    sku: "TEST-001",
  },
  {
    id: 2, // Replace with actual product ID
    name: "Test Product 2",
    price: 49.99,
    sku: "TEST-002",
  },
];

/**
 * Test user data (for future guest checkout tracking)
 */
export interface TestUser {
  email: string;
  name?: string;
  phone?: string;
}

export const TEST_USERS: TestUser[] = [
  {
    email: "test@example.com",
    name: "Test User",
  },
];
