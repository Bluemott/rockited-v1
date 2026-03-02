# YourBrand - Next.js WooCommerce Marketing Site

A modern, responsive e-commerce website built with Next.js 14, TypeScript, and Tailwind CSS. Features WooCommerce as a headless backend and Stripe for payments.

## Features

- 🛍️ **Product Catalog**: Display products from WooCommerce with ISR (Incremental Static Regeneration)
- 🛒 **Shopping Cart**: Persistent cart with local storage using Zustand
- 💳 **Stripe Checkout**: Secure payment processing
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- ⚡ **Performance**: Optimized with Next.js 14 App Router and ISR
- 🎨 **Dark Theme**: Clean, modern design with dark theme preference
- 📦 **Real-time Inventory**: Live pricing and stock status updates
- ↩️ **Return policy**: Summary on checkout and product pages with link to full policy at /about/returns

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: WooCommerce REST API
- **Payments**: Stripe Checkout
- **State Management**: Zustand
- **Deployment**: AWS Amplify
- **Hosting**: AWS CloudFront CDN

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- WooCommerce store with REST API enabled
- Stripe account

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd rockited-v1
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

4. Configure your environment variables in `.env.local`:

```env
# WooCommerce Configuration
WOOCOMMERCE_URL=https://your-lightsail-instance.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For checkout and shipping setup (Stripe test mode, Tax, WooCommerce, local URL), see the `docs/` folder locally (CHECKOUT-STRIPE.md).

#### Shippo setup (domestic US shipping)

Shipping is **domestic US only** via [Shippo](https://goshippo.com). We use Shippo for address validation and shipping rates. Set `SHIPPO_API_KEY` and your origin address (`SHIPPO_ORIGIN_STREET1`, `SHIPPO_ORIGIN_CITY`, `SHIPPO_ORIGIN_STATE`, `SHIPPO_ORIGIN_ZIP`, etc.) in `.env.local`; see [Shippo API](https://docs.goshippo.com/). Test keys (`shippo_test_*`) work for rates; address validation may require a live key. For accurate estimates, set **Weight** and **Dimensions** (L×W×H in inches) on each shippable product in WooCommerce. See [docs/SHIPPING.md](docs/SHIPPING.md) for details. We do not ship to PO boxes.

#### Checkout, shipping & billing

- **Shipping**: Collected on the checkout page, validated with Shippo (address validation), then Shippo rates are fetched. The customer selects a shipping method; that cost is passed to Stripe as a shipping option and **charged in the same payment** as the products (no separate charge).
- **Billing**: Collected by Stripe (Payment Element), prefilled from the shipping address when available.
- **Configuration**: Stripe keys (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`), Shippo (`SHIPPO_API_KEY` + origin address), and optionally `STRIPE_TAX_ENABLED` (default true) and `STRIPE_LOGO_URL`. See `.env.local.example` and `docs/CHECKOUT-SHIPPING-BILLING.md` for flow details.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Verification:** `npm run type-check`, `npm run lint`, `npm run test`, `npm run test:e2e` (optional). **npm audit:** Remaining high-severity findings (minimatch ReDoS) are in the ESLint/Next lint stack; upgrading to ESLint 10 would fix them but is blocked by eslint-plugin-react compatibility. Lighthouse CI (`@lhci/cli`) was removed to reduce audit surface; use `npx lighthouse` for one-off audits if needed.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── product/          # Product-specific components
│   └── layout/           # Layout components
└── lib/                   # Utilities & configs
    ├── woocommerce.ts    # WooCommerce API client
    ├── stripe.ts         # Stripe integration
    ├── store.ts          # Zustand store
    └── types.ts          # TypeScript types
```

## Deployment

### AWS Amplify

1. Connect your GitHub repository to AWS Amplify
2. The `amplify.yml` file is already configured for the build process
3. Set environment variables in the Amplify console
4. Deploy your custom domain

### Environment Variables for Production

Make sure to set these in your Amplify console:

- `WOOCOMMERCE_URL`
- `WOOCOMMERCE_CONSUMER_KEY`
- `WOOCOMMERCE_CONSUMER_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SHIPPO_API_KEY` (domestic US shipping)
- `SHIPPO_ORIGIN_STREET1`, `SHIPPO_ORIGIN_CITY`, `SHIPPO_ORIGIN_STATE`, `SHIPPO_ORIGIN_ZIP` (ship-from address)

## WooCommerce Setup

1. Enable REST API in your WooCommerce store
2. Generate API credentials (Consumer Key & Secret)
3. Ensure your WooCommerce store is accessible from the internet
4. Configure CORS if needed for your domain

## Stripe Setup

1. Create a Stripe account
2. Get your publishable and secret keys (use **test** keys for development: `pk_test_*`, `sk_test_*`)
3. Configure webhook endpoints (see [Stripe testing](#stripe-testing) for local webhooks)
4. For Apple Pay / Google Pay: register your domain in [Payment Method Domains](https://dashboard.stripe.com/settings/payment_method_domains) and enable wallets in Payment Methods settings

### Stripe Tax (dev)

To test tax calculation in development:

1. **Enable Stripe Tax** — [Tax settings](https://dashboard.stripe.com/test/settings/tax) (test mode) → turn on Stripe Tax / complete “Get started” if prompted.
2. **Head office address** — Same page: set or confirm head office (business/ship-from address).
3. **Preset product tax code** — Set default product tax code (e.g. “General – Physical goods”). The app sends `txcd_99999999` per line item; Dashboard default is fallback.
4. **Add one test registration** — [Tax → Registrations](https://dashboard.stripe.com/test/tax/registrations): add at least one registration (e.g. **Idaho** or **New Jersey**) so tax can be calculated. Sandbox registrations do not affect live mode.

Use test keys and omit `STRIPE_TAX_ENABLED` or set `STRIPE_TAX_ENABLED=true`. Run checkout with a shipping address in a registered state; the Payment Element shows the tax line when `total_details.amount_tax` is present. See [Stripe Tax setup](https://docs.stripe.com/tax/set-up) and [Testing Stripe Tax](https://docs.stripe.com/tax/testing).

### Stripe testing

- **Test keys**: Use `sk_test_*` and `pk_test_*` in `.env.local` for development. Never use live keys locally.
- **Local webhooks**: Install [Stripe CLI](https://docs.stripe.com/stripe-cli) and run:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
  Use the webhook signing secret from the CLI output in `.env.local` as `STRIPE_WEBHOOK_SECRET`.
- **Test cards**: [Stripe test cards](https://docs.stripe.com/testing) — e.g. `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (declined), `4000 0027 6000 3184` (3D Secure). See `src/lib/stripe/testing.ts` and `e2e/fixtures/test-data.ts` for constants.
- **E2E payment tests**: `npm run test:e2e` runs checkout and Stripe payment flows; focus on payment-only tests with `npm run test:e2e e2e/checkout/stripe-payments.spec.ts`.

### Testing

- **Type check**: `npm run type-check`
- **Lint**: `npm run lint`
- **Unit tests**: `npm run test` — Vitest; includes **API route tests** in `src/app/api/**/*.test.ts` (checkout, webhooks, shipping, address, products, inventory). Use `npm run test src/app/api` to run only API tests.
- **E2E (Playwright)**: `npm run test:e2e` — recommended after checkout/cart changes. Checkout flow: shipping address (optional Google autofill), address validation (no PO boxes), shipping options, then payment; billing is prefilled from shipping in Stripe. Verify: US address, validate & get shipping, at least one rate appears and total updates; optionally product page → enter ZIP → Get estimate → rates or message appear.

### Performance (Lighthouse CI)

Lighthouse CI runs against the production build to monitor performance and accessibility. Config: [lighthouserc.json](lighthouserc.json).

```bash
npm run build && npm run perf:lighthouse
```

This starts the production server, audits the configured URLs (homepage, products, cart), and asserts against `lighthouse:recommended` plus optional performance/accessibility score thresholds. For collect-only (no assertions): `npm run perf:lighthouse:collect`. GitHub Actions runs Lighthouse CI on push/PR (see [.github/workflows/lighthouse.yml](.github/workflows/lighthouse.yml)).

## Performance Features

- **ISR (Incremental Static Regeneration)**: Product pages are statically generated and revalidated
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic code splitting with Next.js
- **CDN**: AWS CloudFront for global content delivery

## Cost Optimization

- **ISR over SSR**: Reduces serverless function invocations
- **Static Generation**: Homepage and product listings are pre-built
- **Client-side Inventory**: Real-time checks only when needed
- **AWS Free Tier**: Designed to stay within AWS free tier limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yourbrand.com or create an issue in the repository.
