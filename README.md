# ROCK IT ED Storefront

Next.js storefront for ROCK IT ED using WooCommerce (WordPress) for catalog/content, Stripe for payments, and Shippo for shipping rates/address validation.

## Project Overview

- **Frontend:** Next.js App Router + TypeScript + Tailwind.
- **Commerce backend:** WooCommerce REST API hosted on WordPress.
- **Payments:** Stripe Embedded Checkout with webhook-driven order finalization.
- **Shipping:** Shippo-based domestic US shipping flow.
- **Deployment:** AWS Amplify hosting with domain and DNS managed in AWS.

## Architecture Snapshot

```text
rockited4d.com            -> AWS Amplify (Next.js app)
api.rockited4d.com        -> Lightsail WordPress/WooCommerce API
Stripe                    -> Checkout + webhook callbacks
Shippo                    -> address validation + rates
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- WooCommerce API credentials
- Stripe test keys
- Shippo API key (for shipping workflows)

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Setup

Create `.env.local` from `.env.local.example` and fill required values:

- `WOOCOMMERCE_URL`
- `WOOCOMMERCE_CONSUMER_KEY`
- `WOOCOMMERCE_CONSUMER_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional but recommended for shipping:

- `SHIPPO_API_KEY`
- `SHIPPO_ORIGIN_NAME`
- `SHIPPO_ORIGIN_STREET1`
- `SHIPPO_ORIGIN_CITY`
- `SHIPPO_ORIGIN_STATE`
- `SHIPPO_ORIGIN_ZIP`

## Core Commands

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run type-check` - TypeScript checks
- `npm run lint` - lint checks
- `npm run test` - unit tests
- `npm run test:coverage` - coverage-enabled unit/API tests
- `npm run test:e2e` - run all Playwright suite projects
- `npm run test:e2e:smoke` - deterministic smoke/cart suite
- `npm run test:e2e:critical` - deterministic checkout-critical suite
- `npm run test:e2e:integration` - live Stripe integration suite
- `npm run test:e2e:preview` - run critical suite against `PLAYWRIGHT_BASE_URL`
- `npm run test:security` - dependency vulnerability audit
- `npm run format` - format codebase

## E2E CI and preview contract

- PR CI runs deterministic E2E (`test:e2e:critical`) and uploads `playwright-report` + `test-results` artifacts on every run.
- Preview E2E job runs when `PREVIEW_E2E_BASE_URL` secret is set and maps it to `PLAYWRIGHT_BASE_URL`.
- Integration checkout tests (`@integration`, Stripe-backed) should run in controlled environments (preview/nightly/manual), not every PR.
- If checkout/cart logic changes, also run `npm run test:e2e` or at minimum `npm run test:e2e:critical`.

## Dependency Maintenance

- `npm outdated` should return no results for normal update cycles.
- `npm audit` and `npm run test:security` should report zero vulnerabilities before release.
- Use `npm install <pkg>@latest` (or `npm install -D <pkg>@latest`) for targeted updates and re-run verification gates.
- If `postcss` advisories reappear through nested dependencies, keep the `overrides.postcss` pin in `package.json` updated to a non-vulnerable 8.5.x release.

## Documentation

- [Roadmap](docs/ROADMAP.md)
- [Documentation Index](docs/INDEX.md)
- [Checkout and Stripe](docs/CHECKOUT-STRIPE.md)
- [Checkout, Shipping, Billing](docs/CHECKOUT-SHIPPING-BILLING.md)
- [Shipping](docs/SHIPPING.md)
- [Infrastructure Notes](docs/INFRASTRUCTURE.md)
- [Testing Notes](docs/TESTING.md)
- [Staging Subdomain Setup](docs/STAGING-SUBDOMAIN.md)
- [Stripe Webhook Runbook](docs/runbooks/STRIPE-WEBHOOK.md)
- [CloudWatch Observability Runbook](docs/runbooks/CLOUDWATCH-OBSERVABILITY.md)

## Root Directory Hygiene

- Keep root focused on build/config entrypoints and high-signal files.
- Put operational docs in `docs/` and keep `README.md` concise.
- Do not commit generated artifacts (for example `.next`, coverage reports, local test outputs).
- Prefer feature-specific docs updates in the same PR as code changes.

## Current Priorities

See [docs/ROADMAP.md](docs/ROADMAP.md) for the active implementation backlog, risks, and integration hardening priorities.

## Payment Reliability Baseline

- Stripe webhooks are signature-verified and processed synchronously before returning success, so downstream order failures can return non-2xx and be retried by Stripe.
- Woo order creation rejects unmapped Stripe line items to avoid silent `product_id` fallback orders.
- Shipping behavior is fail-closed in production when Shippo is unavailable or returns no usable rates.
- Critical checkout/shipping/webhook logs now emit structured JSON events with redaction and correlation-friendly request IDs.
- Recommended verification after payment-path changes:
  - `npm run type-check`
  - `npm run lint`
  - `npm run test -- src/app/api/webhooks/stripe/route.test.ts src/app/api/checkout/shipping/route.test.ts src/app/api/checkout/route.test.ts src/app/api/shipping/calculate/route.test.ts`
  - `npm run test:security`
  - `npm run test:e2e` (checkout-critical path)
