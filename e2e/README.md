# E2E Testing with Playwright

Playwright is the primary E2E framework for pre-launch hardening.

## Suite strategy

- **Deterministic suites** (`@smoke`, `@cart`, `@critical`) run in PR CI and should fail loud on missing product/test state.
- **Integration suite** (`@integration`, `@stripe`) validates real checkout/payment behavior and is meant for preview/nightly verification.
- **Preview support** uses `PLAYWRIGHT_BASE_URL` so tests can run against deployed URLs without launching local `npm run dev`.

Checkout uses Stripe Embedded Checkout (`ui_mode: "custom"`) with separate shipping and payment iframes.

## Prerequisites

1. **Node.js** (v18+)
2. **Dev server** at `http://localhost:3000` (or let Playwright start it automatically when `PLAYWRIGHT_BASE_URL` is not set).
3. **Stripe test keys** in `.env.local` for checkout tests.
4. **Products** – WooCommerce (or product API) must return products. "Failed to load products" or "Failed to initialize checkout" usually means env/API (keys, WooCommerce), not a test bug.

## Installation

```bash
npm install
npx playwright install
```

With system deps: `npx playwright install --with-deps`

## Running tests

- `npm run test:e2e` - all suite projects (`smoke`, `critical`, `integration`)
- `npm run test:e2e:smoke` - deterministic smoke/cart suite
- `npm run test:e2e:critical` - deterministic checkout-critical suite
- `npm run test:e2e:integration` - real Stripe integration coverage
- `npm run test:e2e:ui` - interactive mode
- `npm run test:e2e:headed` - headed browser mode
- `npm run test:e2e:debug` - debug runner
- `npm run test:e2e:report` - open last HTML report
- `PLAYWRIGHT_BASE_URL=https://preview.example.com npm run test:e2e:preview` - run critical suite against preview URL

### By tag

- **Smoke only** (fast, no Stripe):  
  `npx playwright test --grep @smoke`
- **Cart only** (no Stripe):  
  `npx playwright test --grep @cart`
- **Critical checkout (deterministic):**  
  `npx playwright test --grep @critical --grep-invert @integration`
- **Live integration (Stripe):**  
  `npx playwright test --grep @integration`

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

`playwright.config.ts` supports:

- `PLAYWRIGHT_BASE_URL` for preview/deployed targets.
- Conditional `webServer` startup only for local runs.
- Project split: `smoke`, `critical`, `integration` plus browser projects.
- Artifacts: traces/screenshots/videos on failures with HTML reporting.

## CI contract

- CI deterministic command: `npm run test:e2e:critical`
- CI preview command: `npm run test:e2e:preview` with `PLAYWRIGHT_BASE_URL` set.
- GitHub secret used for preview runs: `PREVIEW_E2E_BASE_URL`
- Required checkout env for integration flows: Stripe/Woo keys from `.env.local.example`

## Failure triage

1. Open uploaded `playwright-report` artifact first.
2. Inspect trace for first failing step (selectors/iframe readiness/network).
3. Check `test-results` screenshots/video for visual state mismatch.
4. Confirm env and API availability if failure mentions checkout init/products.
5. Re-run narrowed command locally (`-g "<test name>" --project=critical`).

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
