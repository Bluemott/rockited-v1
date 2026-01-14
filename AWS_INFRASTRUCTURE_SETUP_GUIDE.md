# AWS Infrastructure Setup - Complete Implementation Guide

This guide walks through the complete setup of your AWS infrastructure for rockited4d.com.

## Architecture Overview

```
rockited4d.com (Route53) → AWS Amplify (Next.js Frontend)
api.rockited4d.com (Route53) → Lightsail WordPress/WooCommerce (API Backend)
```

## Prerequisites

- ✅ Domain `rockited4d.com` registered in Route53
- ✅ Lightsail instance with Bitnami WordPress/WooCommerce (IP: 52.23.226.128)
- ✅ A record for `api.rockited4d.com` pointing to Lightsail IP
- AWS Console access
- SSH access to Lightsail instance

---

## Phase 1: Secure API Backend (Lightsail)

### Step 1: Connect to Lightsail Instance

1. Sign in to the [Lightsail console](https://lightsail.aws.amazon.com/)
2. Click on your WordPress instance
3. Click the **SSH quick connect** icon (or use your SSH client)
4. The browser-based SSH terminal will open

### Step 2: Verify Bitnami bncert Tool

Run the following command to check if bncert is available:

```bash
sudo /opt/bitnami/bncert-tool --help
```

**If the tool is not found**, install it:

```bash
sudo /opt/bitnami/installer
```

### Step 3: Request SSL Certificate

1. Run the bncert tool:

```bash
sudo /opt/bitnami/bncert-tool
```

2. Follow the interactive prompts:
   - **Primary domain**: Enter `api.rockited4d.com`
   - **Additional domains**: Leave empty (or add `www.api.rockited4d.com` if needed)
   - **HTTP to HTTPS redirect**: Select **Yes**
   - **WWW redirect**: Select **No** (not needed for subdomain)

3. The tool will:
   - Request certificate from Let's Encrypt
   - Validate domain ownership (via HTTP challenge on port 80)
   - Install the certificate
   - Configure web server for HTTPS
   - Set up automatic renewal

### Step 4: Verify SSL Certificate

1. Test in your browser: `https://api.rockited4d.com`
2. Check for padlock icon in address bar
3. Verify no security warnings
4. Check certificate details:
   - Click padlock icon → Certificate
   - Verify it's issued by "Let's Encrypt"
   - Check expiration date (should be ~90 days, auto-renews)

### Step 5: Configure Lightsail Firewall

1. In Lightsail console, go to your instance
2. Click **Networking** tab
3. Verify firewall rules:
   - ✅ Port 80 (HTTP) - Open to all
   - ✅ Port 443 (HTTPS) - Open to all
   - ✅ Port 22 (SSH) - Restricted to your IP (recommended)

**Note**: Ports 80 and 443 must be open for Let's Encrypt validation and HTTPS traffic.

---

## Phase 2: Configure Main Domain DNS (Route53 → Amplify)

### Step 1: Get Amplify Domain Information

1. Sign in to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app (or create one if not exists)
3. Go to **App settings** → **Domain management**
4. Note the Amplify domain (e.g., `main-xxxxx.amplifyapp.com`)

### Step 2: Configure Custom Domain in Amplify

1. In Amplify console, click **Add domain**
2. Enter `rockited4d.com`
3. Amplify will provide DNS records to add to Route53

### Step 3: Add DNS Records in Route53

1. Go to [Route 53 Console](https://console.aws.amazon.com/route53/)
2. Click **Hosted zones** → Select `rockited4d.com`
3. Click **Create record**

4. **For apex domain (rockited4d.com)**:
   - **Record name**: Leave blank (or enter `@`)
   - **Record type**: `A` (or use the type Amplify provides)
   - **Alias**: Enable
   - **Alias target**: Select the Amplify distribution
   - **Routing policy**: Simple routing
   - Click **Create records**

5. **For www subdomain (optional)**:
   - **Record name**: `www`
   - **Record type**: `CNAME`
   - **Value**: `rockited4d.com` (or Amplify domain)
   - Click **Create records**

### Step 4: Wait for DNS Propagation

- DNS propagation typically takes 5-30 minutes
- Can take up to 48 hours in rare cases
- Test with: `nslookup rockited4d.com` or `dig rockited4d.com`

---

## Phase 3: Update Application Configuration

### Step 1: Update Local Environment Variables

Update your `.env.local` file:

```env
WOOCOMMERCE_URL=https://api.rockited4d.com
NEXT_PUBLIC_SITE_URL=https://rockited4d.com
```

### Step 2: Update Amplify Environment Variables

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Add/Update:
   - `WOOCOMMERCE_URL` = `https://api.rockited4d.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://rockited4d.com`
   - (Add all other required variables from `.env.local`)

5. Click **Save**
6. Trigger a new deployment if needed

---

## Phase 4: Security & Best Practices

### Step 1: Verify Security Headers

Your `next.config.ts` already has security headers configured. Verify they're working:

1. Deploy to Amplify
2. Test headers using: https://securityheaders.com/
3. Check for:
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security (HSTS)

### Step 2: Configure CORS for WooCommerce

1. SSH into Lightsail instance
2. Edit WordPress `.htaccess` or Apache config:

```apache
# Add to .htaccess in WordPress root
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://rockited4d.com"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

Or use a WordPress plugin like "CORS Headers" for easier management.

### Step 3: Rate Limiting (Optional but Recommended)

Consider implementing rate limiting on Lightsail:

**Option 1: WordPress Plugin**

- Install "Wordfence" or "Limit Login Attempts" plugin
- Configure API rate limits

**Option 2: Server-Level (Apache)**

- Use `mod_evasive` or `mod_security`
- Configure in Apache virtual host

---

## Phase 5: Testing & Validation

### Step 1: DNS Verification

Test DNS resolution:

**Windows (PowerShell):**

```powershell
nslookup api.rockited4d.com
nslookup rockited4d.com
```

**Mac/Linux:**

```bash
dig api.rockited4d.com
dig rockited4d.com
```

**Expected results:**

- `api.rockited4d.com` → `52.23.226.128` (Lightsail IP)
- `rockited4d.com` → Amplify IP addresses

### Step 2: SSL Testing

1. **Browser test**: Visit `https://api.rockited4d.com`
   - Check for padlock icon
   - No security warnings
   - Certificate valid

2. **SSL Labs test** (optional):
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter: `api.rockited4d.com`
   - Check rating (aim for A or A+)

3. **Certificate details**:
   ```bash
   openssl s_client -connect api.rockited4d.com:443 -servername api.rockited4d.com
   ```

### Step 3: API Connectivity Testing

1. **Test WooCommerce API endpoint**:

   ```bash
   curl https://api.rockited4d.com/wp-json/wc/v3/products?per_page=1
   ```

2. **Test from Next.js app**:
   - Start dev server: `npm run dev`
   - Navigate to product pages
   - Verify products load correctly
   - Check browser console for errors

3. **Test image loading**:
   - Verify product images load from `api.rockited4d.com`
   - Check Next.js Image component works correctly

4. **Test checkout flow**:
   - Add items to cart
   - Proceed to checkout
   - Verify API calls succeed

### Step 4: End-to-End Testing

1. **Homepage**: Verify loads correctly
2. **Product pages**: Verify products display
3. **Cart**: Verify cart functionality
4. **Checkout**: Test complete checkout flow
5. **API calls**: Monitor network tab for successful requests

---

## Troubleshooting

### SSL Certificate Issues

**Problem**: Certificate validation fails

**Solutions**:

- Ensure DNS record for `api.rockited4d.com` points to Lightsail IP
- Verify port 80 is open (required for HTTP validation)
- Wait for DNS propagation (can take up to 48 hours)
- Check firewall rules in Lightsail

**Problem**: Certificate not auto-renewing

**Solution**:

- Bitnami bncert tool should auto-renew
- Check cron jobs: `sudo crontab -l`
- Manually renew if needed: `sudo /opt/bitnami/bncert-tool`

### DNS Issues

**Problem**: Domain not resolving

**Solutions**:

- Wait longer for DNS propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Verify Route53 records are correct
- Check TTL values (lower = faster propagation)

### API Connectivity Issues

**Problem**: CORS errors

**Solutions**:

- Verify CORS headers in WordPress/Apache config
- Check WooCommerce REST API settings
- Ensure `rockited4d.com` is in allowed origins

**Problem**: Images not loading

**Solutions**:

- Verify `next.config.ts` has correct image patterns
- Check image URLs are using HTTPS
- Verify WordPress media library is accessible

---

## Cost Summary

- **Route53**: ~$0.50/month per hosted zone + $0.40 per million queries
- **Lightsail**: Current instance pricing (unchanged)
- **Amplify**: Pay-as-you-go (build minutes, hosting)
- **SSL Certificate**: Free (Let's Encrypt via Bitnami)
- **Total**: Minimal additional cost

---

## Next Steps

After completing this setup:

1. ✅ Monitor SSL certificate auto-renewal
2. ✅ Set up CloudWatch alarms for uptime monitoring
3. ✅ Configure backup strategy for Lightsail
4. ✅ Consider CloudFront for API caching (future enhancement)
5. ✅ Set up monitoring and alerting

---

## Support Resources

- [AWS Lightsail Documentation](https://docs.aws.amazon.com/lightsail/)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Route53 Documentation](https://docs.aws.amazon.com/route53/)
- [Bitnami SSL Guide](https://docs.bitnami.com/aws/how-to/generate-install-lets-encrypt-ssl/)

---

## Checklist

- [ ] SSL certificate installed on Lightsail for `api.rockited4d.com`
- [ ] HTTPS working on `api.rockited4d.com`
- [ ] Route53 A record created for `rockited4d.com` → Amplify
- [ ] DNS propagation verified for both domains
- [ ] `.env.local` updated with HTTPS URLs
- [ ] Amplify environment variables updated
- [ ] API connectivity tested from Next.js app
- [ ] Images loading correctly from `api.rockited4d.com`
- [ ] Security headers verified
- [ ] CORS configured for WooCommerce API
- [ ] End-to-end testing completed
