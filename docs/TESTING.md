# Testing Checklist (Condensed)

## DNS

```powershell
nslookup api.rockited4d.com   # → 52.23.226.128
nslookup rockited4d.com      # → Amplify IPs
```

## SSL

- Visit `https://api.rockited4d.com` and `https://rockited4d.com` → padlock
- securityheaders.com, ssllabs.com/ssltest

## API

```bash
curl https://api.rockited4d.com/wp-json/wc/v3/products?per_page=1
```

## App

- `npm run dev` → products, cart, checkout
- E2E: `npx playwright test --project=chromium` (see `e2e/README.md`)

## Pre-Launch Gate

Run all of these before go-live:

```bash
npm run type-check
npm run lint
npm run test:coverage
npm run test:e2e
npm run test:security
npm run perf:lighthouse
```
