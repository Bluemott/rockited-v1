# Rockited Documentation Index

Focused operational docs for the storefront project. Keep this index current whenever docs are added or moved.

## Quick Navigation

- [ROADMAP.md](ROADMAP.md): Current implementation roadmap, issues, and priorities.
- [CHECKOUT-STRIPE.md](CHECKOUT-STRIPE.md): Stripe checkout and tax setup notes.
- [CHECKOUT-SHIPPING-BILLING.md](CHECKOUT-SHIPPING-BILLING.md): Checkout flow details.
- [SHIPPING.md](SHIPPING.md): Shipping behavior and configuration.
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md): Amplify, Route53, Lightsail, and SSL notes.
- [STAGING-SUBDOMAIN.md](STAGING-SUBDOMAIN.md): Staging domain setup workflow.
- [TESTING.md](TESTING.md): Verification and testing checklist.
- [STYLE.md](STYLE.md): Brand and UI style references.

## Architecture

```text
rockited4d.com (Route53) -> AWS Amplify (Next.js)
api.rockited4d.com (Route53) -> Lightsail (WordPress/WooCommerce)
Stripe -> checkout + webhooks
Shippo -> address validation + rates
```
