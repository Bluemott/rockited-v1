# DNS Setup Instructions for WordPress API Subdomain

## Overview

This guide covers DNS setup for the API subdomain. For main domain setup (rockited4d.com → Amplify), see `ROUTE53_AMPLIFY_SETUP.md`.

## Quick Setup Steps

Since `rockited4d.com` is already configured with Route 53 for your main website, you need to create a subdomain for your WordPress/WooCommerce API server.

### Step 1: Choose a Subdomain

Recommended: **`api.rockited4d.com`**

Other options:

- `shop.rockited4d.com`
- `store.rockited4d.com`
- `wp.rockited4d.com`

### Step 2: Create A Record in Route 53

1. Go to [Route 53 Console](https://console.aws.amazon.com/route53/)
2. Click **Hosted zones** in the left menu
3. Click on your `rockited4d.com` hosted zone
4. Click **Create record**

5. Configure the record:

   ```
   Record name: api
   Record type: A
   Value: 52.23.226.128  (your Lightsail static IP)
   TTL: 300 (or use Route 53 alias)
   Routing policy: Simple routing
   ```

6. Click **Create records**

### Step 3: Verify DNS Propagation

Wait 5-10 minutes, then verify:

**Windows (PowerShell):**

```powershell
nslookup api.rockited4d.com
```

**Mac/Linux:**

```bash
dig api.rockited4d.com
# or
nslookup api.rockited4d.com
```

**Expected output:**

```
Name:    api.rockited4d.com
Address: 52.23.226.128
```

### Step 4: Test HTTP Access

Once DNS propagates, test in your browser:

- `http://api.rockited4d.com` should load your WordPress site

### Step 5: Request SSL Certificate

After DNS is working, follow `SSL_SETUP_GUIDE_SUBDOMAIN.md` to request SSL certificate for the subdomain.

## Troubleshooting

### DNS Not Resolving

**Wait longer**: DNS propagation can take 5-30 minutes (up to 48 hours in rare cases)

**Check Route 53**:

- Verify the record was created
- Check the IP address is correct
- Ensure you're in the correct hosted zone

**Clear DNS Cache**:

- Windows: `ipconfig /flushdns`
- Mac: `sudo dscacheutil -flushcache`
- Linux: `sudo systemd-resolve --flush-caches`

### Still Not Working After 30 Minutes

1. Double-check the A record in Route 53
2. Verify the Lightsail static IP is correct
3. Check Lightsail firewall allows port 80/443
4. Try accessing via IP directly: `http://52.23.226.128`

## After DNS is Working

1. Follow `SSL_SETUP_GUIDE_SUBDOMAIN.md` to set up SSL
2. Update `.env.local`:
   ```env
   WOOCOMMERCE_URL=https://api.rockited4d.com
   ```
3. Update `next.config.ts` (already done in code)
