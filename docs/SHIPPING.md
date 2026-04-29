# Shipping (Shippo)

Domestic US shipping rates and address validation use [Shippo](https://goshippo.com). No WooCommerce plugin is required for storefront rates; the Next.js app calls the Shippo API directly.

## Product data for accurate rates

Rates are only as good as the data we send Shippo. In **WooCommerce** (Products → edit product → Shipping):

- **Weight** — Set for every shippable product (e.g. buttons: 0.1–0.2 lb).
- **Dimensions (L×W×H, inches)** — Set for every shippable product. For small items (buttons, pins), use real size (e.g. 3×2×0.5 in) so the app doesn’t assume a larger default box.

Without weight/dimensions, the app uses fallback defaults (smaller for very light orders, larger otherwise), which can overstate cost for small items.

## Optional: shipping class

You can add a shipping class such as **Envelope** or **Small item** in WooCommerce. The app may use it in the future to prefer envelope-eligible rate options (e.g. USPS Small Flat Rate Envelope) for those products.

## Env and Shippo dashboard

Set `SHIPPO_API_KEY` and origin address (`SHIPPO_ORIGIN_*`) in `.env.local`. Optional: `SHIPPO_CARRIER_ACCOUNT_IDS` to restrict to specific carriers (e.g. USPS). Ensure USPS is connected in the Shippo dashboard so First Class and flat-rate options appear.
