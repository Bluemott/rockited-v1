# Staging subdomain (staging.rockited4d.com) via Route 53 + Amplify

Use a stable subdomain so Stripe webhooks, Payment Method Domains, and WooCommerce CORS can target one URL.

## 1. Add domain in AWS Amplify

1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/) → your app (staging branch).
2. **Hosting** → **Domain management** → **Add domain**.
3. Choose **Add subdomain**: enter `staging` for subdomain and select `rockited4d.com` (or type the full domain).
4. Amplify shows the DNS record to create, e.g.:
   - **Type:** CNAME (or A/ALIAS if using Route 53 and Amplify provides it)
   - **Name:** `staging` (or `staging.rockited4d.com` depending on provider)
   - **Value:** the Amplify-provided target (e.g. `d168yqc3vojcct.staging.amplifyapp.com` or similar).

## 2. Create the record in Route 53

1. Open [Route 53](https://console.aws.amazon.com/route53/) → **Hosted zones** → select `rockited4d.com`.
2. **Create record**:
   - **Record name:** `staging` (creates `staging.rockited4d.com`).
   - **Record type:** CNAME (or A – alias if Amplify gave an alias target).
   - **Value:** paste the **exact** target from Amplify (e.g. `d168yqc3vojcct.staging.amplifyapp.com`).
   - If Route 53 offers “Alias” and the target is an Amplify/CloudFront URL, choose **Alias** and pick the Amplify distribution if listed.
3. Save. Propagation usually takes a few minutes; Amplify will validate and issue SSL.

## 3. Update Amplify environment variables

1. In Amplify: **App settings** → **Environment variables**.
2. Set **`NEXT_PUBLIC_SITE_URL`** to `https://staging.rockited4d.com` (no trailing slash).
3. Save and **redeploy** the app (Redeploy this version or push a small commit to the staging branch) so the new URL is baked into the build.

## 4. Stripe

- **Webhooks:** [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Add endpoint:  
  `https://staging.rockited4d.com/api/webhooks/stripe`  
  Copy the **Signing secret** and set **`STRIPE_WEBHOOK_SECRET`** in Amplify env vars, then redeploy.
- **Payment Method Domains** (Apple Pay / Google Pay): [Payment method domains](https://dashboard.stripe.com/settings/payment_methods/domains) → Add `staging.rockited4d.com`.

## 5. WooCommerce / API (Lightsail)

- Allow the staging origin in CORS: add `https://staging.rockited4d.com` to allowed origins so the frontend can call the API.

## Checklist

| Step | Action |
|------|--------|
| Amplify | Domain management → Add subdomain `staging.rockited4d.com`, note DNS target |
| Route 53 | Create CNAME (or Alias) `staging` → Amplify target |
| Amplify | Set `NEXT_PUBLIC_SITE_URL=https://staging.rockited4d.com`, redeploy |
| Stripe | Webhook + Payment Method Domain for `staging.rockited4d.com` |
| WooCommerce | CORS allowed origin `https://staging.rockited4d.com` |

No code changes are required; the app already uses `NEXT_PUBLIC_SITE_URL` for canonicals, sitemap, and checkout redirects.
