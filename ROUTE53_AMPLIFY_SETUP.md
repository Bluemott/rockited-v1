# Route53 to AWS Amplify Setup Guide

This guide walks through configuring Route53 to point your main domain (`rockited4d.com`) to AWS Amplify.

## Prerequisites

- ✅ Domain `rockited4d.com` registered in Route53
- ✅ AWS Amplify app created (or ready to create)
- ✅ Access to AWS Console

## Step-by-Step Instructions

### Step 1: Create/Configure Amplify App

1. Sign in to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. If you don't have an app yet:
   - Click **New app** → **Host web app**
   - Connect your repository (GitHub, GitLab, Bitbucket, etc.)
   - Configure build settings (use `amplify.yml` if present)
   - Deploy the app

3. If you already have an app:
   - Select your app from the list

### Step 2: Add Custom Domain in Amplify

1. In your Amplify app, go to **App settings** → **Domain management**
2. Click **Add domain**
3. Enter your domain: `rockited4d.com`
4. Click **Configure domain**

### Step 3: Configure Domain Settings

Amplify will show you domain configuration options:

1. **Subdomain**: `rockited4d.com` (apex domain)
2. **Subdomain**: `www.rockited4d.com` (optional, recommended)
3. Click **Configure domain**

### Step 4: Get DNS Records from Amplify

After configuring, Amplify will provide DNS records. You'll see something like:

**For apex domain (rockited4d.com):**

- Type: `A` or `ALIAS`
- Name: `@` or blank
- Value: Amplify distribution endpoint

**For www subdomain:**

- Type: `CNAME`
- Name: `www`
- Value: Amplify domain

**Note**: Copy these values - you'll need them for Route53.

### Step 5: Add DNS Records in Route53

1. Go to [Route 53 Console](https://console.aws.amazon.com/route53/)
2. Click **Hosted zones** in the left menu
3. Click on your `rockited4d.com` hosted zone
4. Click **Create record**

#### For Apex Domain (rockited4d.com):

1. **Record name**: Leave blank (or enter `@`)
2. **Record type**:
   - If Amplify provided an A record → Select `A`
   - If Amplify provided an ALIAS → Select `A` and enable **Alias**
3. **Alias**:
   - If using alias → Enable toggle
   - **Alias target**: Select **Alias to CloudFront distribution** or **Alias to another record**
   - Select the Amplify distribution from the dropdown
   - OR paste the Amplify domain value
4. **Routing policy**: Simple routing
5. **Evaluate target health**: Disable (optional)
6. Click **Create records**

#### For www Subdomain (Optional but Recommended):

1. Click **Create record** again
2. **Record name**: `www`
3. **Record type**: `CNAME`
4. **Value**: Enter the Amplify domain (e.g., `main-xxxxx.amplifyapp.com`) or `rockited4d.com`
5. **TTL**: `300` (5 minutes) or use default
6. **Routing policy**: Simple routing
7. Click **Create records**

### Step 6: Verify DNS Propagation

Wait 5-30 minutes for DNS propagation, then verify:

**Windows (PowerShell):**

```powershell
nslookup rockited4d.com
nslookup www.rockited4d.com
```

**Mac/Linux:**

```bash
dig rockited4d.com
dig www.rockited4d.com
```

**Expected results:**

- Should resolve to Amplify IP addresses
- Should not resolve to old IPs (if any)

### Step 7: Test Domain Access

1. Wait for DNS propagation (5-30 minutes, up to 48 hours in rare cases)
2. Test in browser: `https://rockited4d.com`
3. Test www subdomain: `https://www.rockited4d.com` (if configured)
4. Verify SSL certificate is working (Amplify provides SSL automatically)

### Step 8: Configure Redirects (Optional)

If you configured both `rockited4d.com` and `www.rockited4d.com`:

1. In Amplify console, go to **Domain management**
2. Configure redirects:
   - `www.rockited4d.com` → `rockited4d.com` (or vice versa)
   - Choose your preferred primary domain

## Troubleshooting

### DNS Not Propagating

**Problem**: Domain not resolving after 30+ minutes

**Solutions**:

- Verify Route53 records are correct
- Check TTL values (lower = faster propagation)
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Use different DNS server to test: `nslookup rockited4d.com 8.8.8.8`

### SSL Certificate Issues

**Problem**: SSL certificate not working

**Solutions**:

- Amplify automatically provisions SSL certificates via AWS Certificate Manager
- Wait 15-30 minutes after domain configuration
- Verify domain is properly configured in Amplify
- Check Amplify console for certificate status

### Domain Already in Use

**Problem**: "Domain already in use" error

**Solutions**:

- Check if domain is used in another AWS account
- Verify no other Amplify apps are using this domain
- Remove domain from other services first

## Alternative: Using CNAME for Apex Domain

If Route53 doesn't support ALIAS for your Amplify setup:

1. Use Route53's **ALIAS** record type (preferred)
2. If ALIAS not available, you may need to:
   - Use a service like CloudFlare that supports CNAME flattening
   - Or use Route53's special apex domain handling

**Note**: Route53 should support ALIAS records for Amplify distributions.

## Next Steps

After DNS is configured:

1. ✅ Update environment variables in Amplify console
2. ✅ Set `NEXT_PUBLIC_SITE_URL=https://rockited4d.com`
3. ✅ Test your Next.js app on the custom domain
4. ✅ Verify all API calls work correctly
5. ✅ Test checkout flow end-to-end

## Cost

- **Route53**: ~$0.50/month per hosted zone + $0.40 per million queries
- **Amplify**: Pay-as-you-go (build minutes, hosting)
- **SSL Certificate**: Free (via AWS Certificate Manager)

## References

- [AWS Amplify Custom Domains](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
- [Route53 Documentation](https://docs.aws.amazon.com/route53/)
- [Amplify Domain Management](https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain-managed-by-amazon-route-53.html)
