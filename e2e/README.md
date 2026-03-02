# E2E Testing with Playwright

End-to-end tests for the storefront: smoke, cart, and checkout (including Stripe Embedded Checkout).

## Overview

Tests are layered by user journey:

- **Smoke** (`e2e/smoke/`) – Home and products load; cart empty state. No Stripe.
- **Cart** (`e2e/cart/`) – Add/update/remove items, badge, persist, proceed to checkout.
- **Checkout** (`e2e/checkout/`) – Happy path (product → cart → checkout → payment → success) and error scenarios (empty cart, API failure, declined/expired/invalid card).

**Note**: Checkout uses Stripe Embedded Checkout (`ui_mode: "custom"`) with separate iframes for shipping and payment. Tests fill the shipping address before the payment form.

## Prerequisites

1. **Node.js** (v18+)
2. **Dev server** at `http://localhost:3000` (or let Playwright start it).
3. **Stripe test keys** in `.env.local` for checkout tests.
4. **Products** – WooCommerce (or product API) must return products. "Failed to load products" or "Failed to initialize checkout" usually means env/API (keys, WooCommerce), not a test bug.

## Installation

```bash
npm install
npx playwright install
```

With system deps: `npx playwright install --with-deps`

## Running Tests

| Command | Description |
|--------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Interactive UI mode |
| `npm run test:e2e:headed` | Run with browser visible |
| `npm run test:e2e:debug` | Debug mode |
| `npm run test:e2e:report` | Open last HTML report |

### By tag

- **Smoke only** (fast, no Stripe):  
  `npx playwright test --grep @smoke`
- **Cart only** (no Stripe):  
  `npx playwright test --grep @cart`
- **Checkout** (includes Stripe):  
  `npx playwright test --grep @checkout`

### By file or browser

```bash
npx playwright test e2e/smoke/app.spec.ts
npx playwright test e2e/checkout/checkout.spec.ts
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Single test (for fixing a failure)

```bash
npx playwright test e2e/checkout/checkout.spec.ts -g "complete checkout"
```

## Test Structure

```
e2e/
├── smoke/
│   └── app.spec.ts           # Home, products, cart empty
├── cart/
│   └── cart.spec.ts          # Add/update/remove, persist, proceed to checkout
├── checkout/
│   ├── checkout.spec.ts      # Happy path (full flow to success)
│   └── checkout-errors.spec.ts  # Empty cart, API errors, card declines
├── fixtures/
│   ├── test-data.ts          # Stripe test cards, etc.
│   └── checkout.ts           # Optional fixture: cartWithOneProduct
├── utils/
│   ├── page-objects/         # ProductPage, CartPage, CheckoutPage, CheckoutSuccessPage
│   └── test-helpers.ts       # setupTest, clearCart, fillShippingAddressForm, fillStripePaymentForm, addFirstProductAndGoToCheckout
└── README.md
```

## Test Data

Stripe test cards are in `e2e/fixtures/test-data.ts` (e.g. success `4242...`, decline, expired, insufficient funds). See [Stripe Testing](https://stripe.com/docs/testing).

## Helpers

- **`setupTest(page)`** – Clear cart, go home. Use in `beforeEach`.
- **`addFirstProductAndGoToCheckout(page)`** – Add first product from `/products`, go to `/checkout`. Returns `{ productName }`.
- **`fillShippingAddressForm(page, fullName, address, city, state, zipCode)`** – Fill Stripe shipping iframe. Call before payment.
- **`fillStripePaymentForm(page, cardNumber?, expiry?, cvc?)`** – Fill Stripe payment iframe. Call after shipping.

Optional fixture: `e2e/fixtures/checkout.ts` exports a `test` with `cartWithOneProduct` (page on checkout with one item).

## Configuration

`playwright.config.ts`: baseURL `http://localhost:3000`, timeout 120s, trace/screenshot/video on failure, retries 2 (CI) / 1 (local). Browsers: Chromium, Firefox, WebKit.

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Dev server not running | Run `npm run dev` or use Playwright’s webServer (default). |
| Stripe not loading | Set Stripe test keys in `.env.local` (`pk_test_`, `sk_test_`). Check both shipping and payment iframes in console. |
| Cart persists between tests | Use `setupTest(page)` in `beforeEach`. If needed, clear `localStorage.removeItem("cart-storage")`. |
| Submit button never enabled | Fill shipping first; wait for "Validating…"/"Calculating…" to disappear; then fill payment. See test-helpers. |
| "Failed to load products" / "Failed to initialize checkout" | Fix env/API (WooCommerce, Stripe keys). Run with `--project=chromium` first. |
| Timeout errors | Ensure shipping then payment; wait for elements (e.g. `waitForSubmitButtonReady`). Config timeout is 120s. |

Reports and artifacts: `playwright-report/`, `test-results/` (in `.gitignore`). Use `npm run test:e2e:report` after a run.

## Best Practices

1. Use `setupTest(page)` in `beforeEach` for checkout/cart specs.
2. Use Page Objects and `addFirstProductAndGoToCheckout` to avoid duplicated setup.
3. Prefer element/response waits over fixed `page.waitForTimeout()`.
4. Fill shipping address before payment in Stripe Embedded Checkout.
5. Use descriptive test names and tags (`@smoke`, `@cart`, `@checkout`, `@stripe`).

## Resources

- [Playwright](https://playwright.dev/)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Embedded Checkout](https://stripe.com/docs/payments/checkout/embedded)
