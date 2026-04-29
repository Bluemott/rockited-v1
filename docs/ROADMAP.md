# ROCK IT ED Roadmap (2026 Refresh)

This roadmap reflects the current implementation and prioritizes stability, conversion, and operational readiness.

## Snapshot

- **Project focus:** Next.js storefront + WooCommerce (WordPress) catalog + Stripe checkout + Shippo shipping.
- **What is strong now:** Core checkout flow, webhook plumbing, product/catalog UX, baseline tests.
- **What needs focus now:** Documentation hygiene, integration hardening, observability, and production safeguards.

## Current State Matrix

### Implemented

- Checkout API input validation/sanitization and Stripe session creation are in place (`src/app/api/checkout/route.ts`).
- Stripe webhook signature verification and order creation path exist (`src/app/api/webhooks/stripe/route.ts`).
- WordPress blog ingestion and mapping are implemented (`src/lib/wordpress.ts`, `src/lib/blog.ts`).
- Sitemap and robots are generated (`src/app/sitemap.ts`, `src/app/robots.ts`).
- Amplify build pipeline configuration exists (`amplify.yml`).

### Needs Work

- Root metadata should be reviewed against current SEO conventions and explicit canonical strategy.
- Product listing still fetches up to 100 records in one request (`src/app/products/page.tsx`).
- WordPress API payloads are not yet validated with Zod schemas in the integration layer.
- Webhook processing reliability should be tightened (idempotency persistence and retry-safe event handling details).
- Ops docs and roadmap were stale and need an ongoing update cadence.

### Blocked / Dependent

- Remove Lightsail IP image patterns after full domain-only media URLs are guaranteed (`next.config.ts`).
- Deeper tax/payment method rollout depends on Stripe Dashboard/account settings and business policy decisions.
- WordPress hardening milestones depend on hosting/account access and plugin/policy choices.

## Current Issues and Risks (Highlight)

1. **Docs tracking conflict:** `.gitignore` excluded `docs/`, which blocks roadmap/doc versioning.
2. **Infrastructure coupling risk:** temporary IP-based image remote patterns remain configured in `next.config.ts`.
3. **WordPress contract risk:** responses are transformed without strict runtime schema validation.
4. **Webhook resilience risk:** asynchronous processing pattern needs explicit retry/idempotency observability guarantees.
5. **SEO consistency risk:** root metadata and canonical enforcement should be audited route-by-route.
6. **Root cleanliness drift:** documentation references and root artifacts need clearer organization standards.

## Tool-Driven Optimization Plan

### AWS Optimization

- **Hosting hardening:** verify Amplify branch/environment policy, custom headers/redirects, and domain enforcement.
- **Operational visibility:** add or tighten error and availability monitoring (CloudWatch alarms and dashboards or equivalent).
- **Deployment guardrails:** document required env vars and rollout checks per environment (dev/staging/prod).
- **Scalability posture:** revisit caching/revalidation assumptions for high-product and high-content growth.

### Stripe Optimization

- **Webhook reliability:** formalize event idempotency checks and replay-safe handling strategy.
- **Runbook maturity:** codify webhook health checks, failed event replay workflow, and incident handling.
- **Tax/payment configuration:** document required dashboard toggles and production readiness checklist.
- **Test coverage depth:** expand edge-case tests for checkout session creation and webhook branch behavior.

### WordPress / WooCommerce Optimization

- **Schema validation:** introduce Zod validation at API boundaries before transforming responses.
- **Fallback behavior:** standardize safe-null and degraded UI states for partial API failures.
- **Content operations:** document editorial and media conventions to improve SEO and consistency.
- **Performance hygiene:** review fetch strategy and cache behavior for posts/products under growth.

## Phased Roadmap

### Phase 1 (Now): Baseline and Hygiene

- Refresh roadmap and docs architecture (hybrid README + focused docs).
- Fix docs tracking and cross-link integrity.
- Document root-directory cleanliness rules and ownership.
- Reconfirm critical commands and verification workflow.

### Phase 2 (Next): Integration Hardening

- Stripe webhook reliability and runbook improvements.
- WordPress/WooCommerce response validation and safer fallback handling.
- Remove dependency on temporary image host patterns when infra is ready.
- Tighten checkout and API edge-case test coverage.

### Phase 3 (Soon): SEO and Conversion Improvements

- Canonical/metadata route audit and consistency fixes.
- Pagination/search/filter performance improvements.
- UX and trust refinements based on real user behavior and content maturity.

### Phase 4 (Later): Growth and Advanced Operations

- Advanced analytics and attribution.
- Broader payment and promotion strategy expansion.
- Internationalization readiness and structured content scaling.

## Immediate Next Actions

1. Keep this roadmap and README as the source of truth for priorities.
2. Track integration hardening tasks as small PRs with explicit verification output.
3. Review infra-dependent blockers monthly (image host cleanup, WordPress and Stripe production posture).

## Verification Commands

- `npm run type-check`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

# Professional E-commerce Roadmap for ROCK IT ED

This roadmap is organized by priority and focus area. Work through sections systematically to improve SEO, marketability, sales volume, professional appearance, security, and code quality.

## Project Status Summary

- **Phase 1**: ~95% complete (hreflang deferred for international expansion).
- **Phase 2**: ~85% complete (HTTP image patterns pending Lightsail domain; API/performance/a11y tests pending).
- **Phase 3**: ~40% complete (quick view, reviews, shipping done; trust badges, search, pagination pending).

## Phase 1: Critical SEO & Discoverability (High Priority)

### 1.1 SEO Foundation – COMPLETED

All items done: error pages (`src/app/not-found.tsx`, `src/app/error.tsx`) with SEO metadata, security headers, OG images, meta descriptions (150–160 chars), JSON-LD breadcrumbs on product and category pages.

### 1.2 Technical SEO

- **Remove wildcard image domain**: completed
- **Add canonical URLs**: completed
- **Improve sitemap**: completed (lastModified from product data, category pages)
- **Add XML sitemap index**: Partial – single sitemap with pagination in `src/app/sitemap.ts`; consider sitemap index if product count exceeds ~1000
- **Verify robots.txt**: completed (`src/app/robots.ts` – blocks /api/, /checkout/, /cart/)
- **Add hreflang tags**: Deferred – add when planning international expansion

### 1.3 Content SEO

- **Blog/content section**: Resources/blog exists (WordPress). TODO: migrate from markdown if applicable; add internal linking strategy
- **Product descriptions**: Ensure all products have rich, keyword-optimized descriptions
- **Image alt text optimization**: Audit all product images for descriptive, keyword-rich alt text
- **Internal linking strategy**: Deferred – add related product links, category cross-links; implement more robust strategy for all products and posts later

## Phase 2: Security & Code Quality (High Priority)

### 2.1 Security Enhancements

- **Remove HTTP image patterns**: Not done – remove `http://52.23.226.128` from `next.config.ts` when Lightsail uses domain-only URLs (security risk in production)
- **Implement rate limiting**: completed – `src/proxy.ts`, `src/lib/rate-limit.ts`; covers checkout, products, shipping, address, city-state
- **Add Content Security Policy**: completed – full CSP in `src/proxy.ts` for non-API routes
- **Environment variable validation**: completed – `src/lib/env.ts` (Zod, fail fast)
- **Secure API endpoints**: completed – checkout/shipping use `src/lib/schemas/checkout.ts` and `src/lib/sanitize.ts`
- **Add security headers (proxy)**: completed – `src/proxy.ts` (Next.js 16 uses proxy, not middleware); HSTS, X-Frame-Options, CSP, etc.
- **Remove exposed secrets**: Review `.env.local` – ensure it's in `.gitignore` (verify as needed)

### 2.2 Code Standards – COMPLETED

- **ESLint**: `.eslintrc.json` – next/core-web-vitals, Prettier, no-explicit-any
- **Prettier**: `npm run format`, `npm run format:check`
- **Type safety**: Stricter TypeScript; error on `any`
- **Error boundaries**: `src/components/error/ErrorBoundary.tsx` (e.g. checkout)
- **API response types**: TypeScript interfaces for API responses
- **Code organization**: completed

### 2.3 Testing & Quality Assurance

- **Unit tests**: completed – Vitest (`vitest.config.ts`), tests in `src/lib/__tests__/` (store, utils, package, poBox)
- **E2E tests**: completed – Playwright in `e2e/` (smoke, cart, checkout, stripe-payments). Run `npm run test:e2e`; verify against current checkout flow if failures occur
- **API tests**: Test API endpoints for error and edge cases - implemented/completed/needs testing.
- **Performance testing**: completed – Lighthouse CI ([lighthouserc.json](../lighthouserc.json), `npm run perf:lighthouse`, [.github/workflows/lighthouse.yml](../.github/workflows/lighthouse.yml)). Optional: tighten performance/accessibility budgets after baseline.
- **Accessibility audit**: Run automated a11y tests (axe-core, Lighthouse) - come back to lighthouse and accesibility after all features are added and tigethened up. i want to add most of the products and descriptions and blog so that the test can work under a real senario.

## Phase 3: Marketability & User Experience (Medium-High Priority)

### 3.1 Trust & Credibility

- **Customer reviews display**: completed – `src/components/product/ProductReviews.tsx`, `ReviewForm.tsx`, `/api/products/[id]/reviews`
- **Trust badges**: Add security badges (SSL, payment security) to checkout - complete.
- **Testimonials section**: completed – `src/components/home/TestimonialsSection.tsx`, `GET /api/reviews` (Recent & Most helpful tabs)
- **Social proof**: Add "Recently viewed" products, "Customers also bought" - added. might want to add settings or filtering in woocommerce so the products are more controled. 
- **Return policy visibility**: Make return policy more prominent (currently in about section) - added need to actually review return policy and other policy. 
- **Shipping information**: completed – `src/components/product/ShippingEstimator.tsx` on product pages; Shippo rates at checkout (USPS First Class, flat-rate envelope for small/light items). Set **Weight** and **Dimensions** on products in WooCommerce for accurate rates; optional “Envelope” shipping class for future use. See [docs/SHIPPING.md](SHIPPING.md).

### 3.2 Conversion Optimization

- **Exit-intent popup**: Optional; test impact
- **Abandoned cart recovery**: Implement cart abandonment emails (requires backend)
- **Product recommendations**: Enhance related/upsell product suggestions
- **Quick view modal**: completed – `src/components/product/QuickViewDialog.tsx` in `ProductCard.tsx`
- **Wishlist functionality**: Add wishlist/save for later
- **Product comparison**: Allow users to compare products side-by-side

### 3.3 User Experience Improvements

- **Loading states**: Enhance loading states and skeletons throughout the app
- **Error messages**: Improve error messages to be more user-friendly and actionable
- **Mobile optimization**: Audit mobile experience and touch interactions
- **Search functionality**: Add product search with filters and autocomplete
- **Filter improvements**: Enhance product filtering UI/UX
- **Pagination**: Not done – add proper pagination for product listings (currently fetches 100 products in `src/app/products/page.tsx`)

## Phase 4: Sales Volume Optimization (Medium Priority)

- Stripe Tax and multiple payment methods (e.g. wallets already supported; add more as needed)
- Product bundles and promo/discount codes
- Conversion funnel optimization and product presentation improvements
- Marketing features (e.g. featured products, campaigns)

## Phase 5: Analytics & Monitoring (Medium Priority)

- GA4 e-commerce events and conversion tracking
- Error tracking (e.g. Sentry)
- Lighthouse CI for performance monitoring
- Uptime and RUM (Real User Monitoring) as needed

## Phase 6: Professional Polish (Low-Medium Priority)

- Image optimization audit (next/image usage, formats, sizing)
- Copy review across key pages
- WCAG 2.1 AA compliance and accessibility audit

## Phase 7: Advanced Features (Future)

- i18n (e.g. next-intl) for international expansion
- Stripe subscriptions or recurring payments
- Live chat widget
- AR/VR product preview (optional)

## Blocked / Deferred

- **hreflang tags**: Until international expansion is planned
- **HTTP image pattern removal**: Until Lightsail uses domain-only URLs (no IP in production)
- **Internal linking strategy**: Deferred for a more robust implementation across all products and posts

## Key Commands

- `npm run type-check` – TypeScript
- `npm run lint` – ESLint
- `npm run format` – Prettier (write)
- `npm run format:check` – Prettier (check only)
- `npm run test` – Vitest unit tests
- `npm run test:coverage` – Vitest with coverage report
- `npm run test:e2e` – Playwright (checkout flow)
- `npx playwright test --project=chromium` – Quick E2E

