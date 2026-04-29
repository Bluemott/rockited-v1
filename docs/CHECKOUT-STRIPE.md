# Checkout & Stripe

Checkout uses Stripe Embedded Checkout (custom UI) with the Payment Element. Shipping is collected first (Shippo rates); then a Checkout Session is created with preselected shipping and automatic tax when enabled.

## Stripe Tax (dev)

Tax is calculated by Stripe when **Stripe Tax** is enabled in the Dashboard and at least one **tax registration** exists. The app sends `automatic_tax.enabled=true` and product tax codes; no code change is required for basic tax.

### Dashboard setup (test mode)

1. **Enable Stripe Tax** — [Tax settings](https://dashboard.stripe.com/test/settings/tax) → turn on Stripe Tax / complete “Get started” if prompted.
2. **Head office address** — Same page: set or confirm head office (business/ship-from address).
3. **Preset product tax code** — Set default (e.g. “General – Physical goods”). The app sends `txcd_99999999` per line item.
4. **Add one test registration** — [Tax → Registrations](https://dashboard.stripe.com/test/tax/registrations): add at least one registration (e.g. **Idaho** or **New Jersey**). Sandbox registrations do not affect live mode.

### Environment

- Use test keys (`pk_test_*`, `sk_test_*`) in `.env.local`.
- Omit `STRIPE_TAX_ENABLED` or set `STRIPE_TAX_ENABLED=true` for tax. Set `STRIPE_TAX_ENABLED=false` to disable (e.g. before Dashboard is configured).

### Verifying tax

1. Run `npm run dev`, add a product, go to checkout.
2. Enter a shipping address in a state where you added a registration (e.g. Idaho or New Jersey), select shipping, proceed to payment.
3. The Payment Element shows “Tax” and amount when Stripe returns `total_details.amount_tax`. In Dashboard: [Payments](https://dashboard.stripe.com/test/payments) → payment → “Automatic tax calculation”; or [Tax transactions](https://dashboard.stripe.com/test/tax/transactions).

References: [Stripe Tax setup](https://docs.stripe.com/tax/set-up), [Testing Stripe Tax](https://docs.stripe.com/tax/testing), [Tax with Checkout](https://docs.stripe.com/tax/checkout).
