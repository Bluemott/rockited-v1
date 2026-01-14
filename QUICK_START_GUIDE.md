# Quick Start Guide - AWS Infrastructure Setup

This is a condensed guide for quickly setting up your AWS infrastructure. For detailed instructions, see the full guides.

## Current Status

- ✅ Domain `rockited4d.com` in Route53
- ✅ Lightsail instance with WordPress/WooCommerce (IP: 52.23.226.128)
- ✅ A record for `api.rockited4d.com` → Lightsail IP
- ⏳ SSL certificate needed
- ⏳ Main domain DNS needed

## Quick Setup (30-60 minutes)

### 1. SSL Certificate for API (15-20 minutes)

**SSH into Lightsail:**
```bash
# Via Lightsail console or SSH client
```

**Run bncert tool:**
```bash
sudo /opt/bitnami/bncert-tool
# Enter: api.rockited4d.com
# Enable HTTP to HTTPS redirect: Yes
```

**Verify:**
- Visit `https://api.rockited4d.com`
- Check for padlock icon

### 2. Main Domain DNS (10-15 minutes)

**In Amplify Console:**
1. App settings → Domain management
2. Add domain: `rockited4d.com`
3. Copy DNS records provided

**In Route53:**
1. Hosted zone: `rockited4d.com`
2. Create A record (alias) → Amplify distribution
3. Wait 5-30 minutes for propagation

### 3. Update Environment Variables (5 minutes)

**Local (.env.local):**
```env
WOOCOMMERCE_URL=https://api.rockited4d.com
NEXT_PUBLIC_SITE_URL=https://rockited4d.com
```

**Amplify Console:**
- App settings → Environment variables
- Add/update same variables

### 4. Test Everything (10-15 minutes)

**DNS:**
```powershell
nslookup api.rockited4d.com    # Should return 52.23.226.128
nslookup rockited4d.com         # Should return Amplify IPs
```

**SSL:**
- Visit `https://api.rockited4d.com` → Check padlock
- Visit `https://rockited4d.com` → Check padlock

**API:**
- Start dev server: `npm run dev`
- Test product pages load
- Test checkout flow

## Troubleshooting

**SSL not working?**
- Wait for DNS propagation
- Check ports 80/443 open in Lightsail
- Verify DNS record points to correct IP

**DNS not resolving?**
- Wait 5-30 minutes (up to 48 hours)
- Clear DNS cache: `ipconfig /flushdns`
- Verify Route53 records correct

**API errors?**
- Check `.env.local` has HTTPS URLs
- Verify CORS configured in WordPress
- Check browser console for errors

## Full Guides

- **Complete Setup**: `AWS_INFRASTRUCTURE_SETUP_GUIDE.md`
- **Route53 → Amplify**: `ROUTE53_AMPLIFY_SETUP.md`
- **SSL Setup**: `SSL_SETUP_GUIDE_SUBDOMAIN.md`
- **Testing**: `TESTING_CHECKLIST.md`

## Next Steps

After setup:
1. ✅ Monitor SSL auto-renewal
2. ✅ Set up CloudWatch alarms
3. ✅ Configure backups
4. ✅ Test end-to-end flow
