// Vitest setup file
// This file runs before each test file

// Mock localStorage for Zustand persistence (jsdom only)
if (typeof window !== "undefined") {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
}

// Env vars for API route tests (so @/lib/env can load when routes are imported)
if (typeof process !== "undefined") {
  process.env.WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || "https://example.com";
  process.env.WOOCOMMERCE_CONSUMER_KEY =
    process.env.WOOCOMMERCE_CONSUMER_KEY || "ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  process.env.WOOCOMMERCE_CONSUMER_SECRET =
    process.env.WOOCOMMERCE_CONSUMER_SECRET || "cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  process.env.STRIPE_SECRET_KEY =
    process.env.STRIPE_SECRET_KEY || "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  process.env.STRIPE_WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET || "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  process.env.NEXT_PUBLIC_SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
