# Infrastructure Setup (Condensed)

AWS Amplify + Route53 + Lightsail for rockited4d.com.

## Quick Setup (30–60 min)

1. **SSL** – SSH into Lightsail → `sudo /opt/bitnami/bncert-tool` → enter `api.rockited4d.com`, enable HTTP→HTTPS
2. **DNS** – Amplify → Domain management → Add `rockited4d.com` → Copy records to Route53 hosted zone
3. **Env vars** – Amplify → Environment variables → Add WooCommerce, Stripe, `NEXT_PUBLIC_SITE_URL`
4. **Verify** – `nslookup api.rockited4d.com`, `nslookup rockited4d.com`, visit both over HTTPS

## Amplify Env Vars

Required: `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`. Use HTTPS URLs in production.

## Route53 → Amplify

Amplify provides A/ALIAS records for apex and CNAME for www. Add them in the `rockited4d.com` hosted zone. Use ALIAS for apex when possible.

## SSL (API Subdomain)

DNS: Create A record `api` → Lightsail IP (e.g. 52.23.226.128). Then Lightsail: `sudo /opt/bitnami/bncert-tool` → `api.rockited4d.com`, HTTP→HTTPS yes.

## www → non-www Redirect (Amplify)

App settings → Rewrites and redirects. Add: Source `https://www.rockited4d.com/<*>`, Target `https://rockited4d.com/<*>`, Type `301`.

## GitHub Connection Issues

- Re-authorize: GitHub → Settings → Applications → AWS Amplify
- Or install https://github.com/apps/aws-amplify for your repo
- Repo: `Bluemott/rockited-v1`, branch: `rockited_dev` or `master`

## HTTPS Migration (WordPress)

1. Settings → General → WordPress/Site URL → `https://api.rockited4d.com`
2. DB search/replace: `http://52.23.226.128` → `https://api.rockited4d.com` (use Better Search Replace plugin)
3. Update `.env.local`: `WOOCOMMERCE_URL=https://api.rockited4d.com`

## Security

- Lightsail firewall: 80, 443 open; 22 restricted to your IP
- CORS: WordPress CORS plugin or .htaccess for `https://rockited4d.com`
- Test: securityheaders.com, ssllabs.com/ssltest
