# SSL Certificate Setup Guide for Lightsail WordPress (Subdomain)

## Architecture Overview

Since your main website (`rockited4d.com`) is already configured with Route 53 and has SSL, you need to use a **subdomain** for your WordPress/WooCommerce API server on Lightsail.

**Recommended subdomain options:**

- `api.rockited4d.com` - Common for API endpoints
- `shop.rockited4d.com` - Good for e-commerce backend
- `store.rockited4d.com` - Alternative for store backend
- `wp.rockited4d.com` - WordPress-specific

## Step-by-Step Instructions

### Step 1: Create DNS Record in Route 53

1. Go to [Route 53 Console](https://console.aws.amazon.com/route53/)
2. Select your hosted zone for `rockited4d.com`
3. Click **Create record**
4. Configure:
   - **Record name**: `api` (or your chosen subdomain)
   - **Record type**: `A`
   - **Value**: Your Lightsail static IP (e.g., `52.23.226.128`)
   - **TTL**: `300` (5 minutes) or use Route 53 alias
5. Click **Create records**

**Wait 5-10 minutes** for DNS propagation before proceeding.

### Step 2: Verify DNS Propagation

Before requesting SSL, verify the DNS record is working:

```bash
# Check if DNS is resolving
nslookup api.rockited4d.com
# or
dig api.rockited4d.com

# Should return your Lightsail static IP
```

You can also test in a browser: `http://api.rockited4d.com` should load your WordPress site.

### Step 3: Connect to Lightsail Instance

1. Sign in to the [Lightsail console](https://lightsail.aws.amazon.com/)
2. Click the SSH quick connect icon for your WordPress instance
3. The browser-based SSH terminal will open

### Step 4: Request SSL Certificate for Subdomain

1. Run the bncert tool:

   ```bash
   sudo /opt/bitnami/bncert-tool
   ```

2. When prompted for domains, enter:
   - **Primary domain**: `api.rockited4d.com` (or your chosen subdomain)
   - **Additional domains**: Leave empty or add `www.api.rockited4d.com` if needed

3. The tool will:
   - Request certificate from Let's Encrypt
   - Validate domain ownership (via DNS or HTTP challenge)
   - Install the certificate
   - Configure web server for HTTPS

### Step 5: Configure Redirects

When prompted:

- **HTTP to HTTPS redirect**: Select "Yes"
- **WWW redirect**: Not needed for subdomain, select "No" or skip

### Step 6: Verify SSL Certificate

1. Test your subdomain: `https://api.rockited4d.com`
2. Check for padlock icon in browser
3. Verify no security warnings

### Step 7: Update Environment Variables

After SSL is configured, update your `.env.local`:

```env
# WooCommerce Configuration
WOOCOMMERCE_URL=https://api.rockited4d.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://rockited4d.com
```

Also update `next.config.ts` to allow images from the subdomain.

## Troubleshooting

### DNS Not Resolving

**Problem**: `nslookup api.rockited4d.com` doesn't return your IP

**Solutions**:

- Wait longer for DNS propagation (can take up to 48 hours, usually 5-30 minutes)
- Verify Route 53 record was created correctly
- Check if you're using the correct hosted zone
- Try clearing DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Certificate Validation Fails

**Problem**: Let's Encrypt can't validate the domain

**Solutions**:

- Ensure DNS record points to Lightsail static IP
- Verify the subdomain is accessible via HTTP: `http://api.rockited4d.com`
- Wait for DNS propagation (check with `nslookup`)
- Make sure port 80 is open on Lightsail (for HTTP validation)

### bncert Tool Not Found

**Problem**: `command not found` when running bncert

**Solution**:

```bash
sudo /opt/bitnami/installer
```

Then run bncert again.

## Alternative: Using IP Address with Self-Signed Certificate

If you can't use a subdomain, you can use the IP address directly, but this requires:

- Self-signed certificate (browsers will show warnings)
- Or using a service like Cloudflare in front of Lightsail

**Not recommended** for production, but works for development.

## Next Steps

After SSL is configured:

1. Update `WOOCOMMERCE_URL` in `.env.local` to use HTTPS subdomain
2. Update `next.config.ts` to allow images from subdomain
3. Test WooCommerce API calls over HTTPS
4. Verify Stripe webhooks can reach your server (requires HTTPS)
