# Security Configuration Guide

This document outlines the security configuration for your AWS infrastructure setup.

## Current Security Status

### ✅ Implemented

1. **Next.js Security Headers** (in `next.config.ts`)
   - Cache-Control headers for sitemap and robots.txt
   - Additional headers can be added as needed

2. **Environment Variable Validation** (in `src/lib/env.ts`)
   - HTTPS enforcement in production
   - Required variable validation
   - Type-safe environment access

3. **HTTPS Enforcement**
   - SSL certificates for both domains
   - HTTP to HTTPS redirects configured

### ⚠️ Recommended Additions

## Security Headers Configuration

### Current Implementation

Your `next.config.ts` has basic headers. Consider adding comprehensive security headers:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ],
    },
    // ... existing sitemap/robots.txt headers
  ];
}
```

### WordPress/Lightsail Security Headers

Configure security headers in WordPress `.htaccess` or Apache config:

```apache
<IfModule mod_headers.c>
    # Security Headers
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

    # CORS Headers (for API access from main domain)
    Header set Access-Control-Allow-Origin "https://rockited4d.com"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

## CORS Configuration

### WooCommerce REST API CORS

1. **WordPress Plugin Method** (Recommended):
   - Install "CORS Headers" plugin
   - Configure allowed origins: `https://rockited4d.com`
   - Allow methods: GET, POST, OPTIONS
   - Allow credentials: Yes

2. **Manual .htaccess Method**:
   - Add CORS headers to WordPress root `.htaccess`
   - See example above

3. **Verify CORS**:
   ```bash
   curl -H "Origin: https://rockited4d.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://api.rockited4d.com/wp-json/wc/v3/products
   ```

## Firewall Configuration

### Lightsail Firewall Rules

**Required Ports:**

- ✅ Port 80 (HTTP) - Open to all (for Let's Encrypt validation)
- ✅ Port 443 (HTTPS) - Open to all (for API access)
- ⚠️ Port 22 (SSH) - Restrict to your IP address (recommended)

**Configure in Lightsail:**

1. Go to Lightsail console
2. Select your instance
3. Click **Networking** tab
4. Click **Firewall** section
5. Add/edit rules:
   - HTTP (80): Allow from anywhere
   - HTTPS (443): Allow from anywhere
   - SSH (22): Allow only from your IP

### Amplify Security

Amplify automatically provides:

- ✅ DDoS protection via AWS Shield
- ✅ SSL/TLS certificates via ACM
- ✅ Global CDN with security features

## Rate Limiting

### WordPress/Lightsail Rate Limiting

**Option 1: WordPress Plugin**

- Install "Wordfence Security" or "Limit Login Attempts"
- Configure API rate limits
- Set limits for WooCommerce REST API

**Option 2: Apache mod_evasive**

```bash
# Install mod_evasive
sudo apt-get install libapache2-mod-evasive

# Configure in Apache
# See: /etc/apache2/mods-available/evasive.conf
```

**Option 3: CloudFront (Future Enhancement)**

- Add CloudFront in front of Lightsail
- Configure rate limiting at CloudFront level
- Use AWS WAF for advanced protection

## SSL/TLS Configuration

### Certificate Management

- ✅ Let's Encrypt certificates via Bitnami bncert
- ✅ Auto-renewal configured
- ✅ HTTP to HTTPS redirect enabled

### TLS Version

Verify TLS 1.2+ is enabled:

```bash
openssl s_client -connect api.rockited4d.com:443 -tls1_2
```

### Certificate Monitoring

- Monitor certificate expiration
- Bitnami bncert auto-renews, but verify:
  ```bash
  sudo /opt/bitnami/bncert-tool --list
  ```

## Environment Variable Security

### ✅ Current Protection

- Environment variables validated at runtime
- HTTPS enforced in production
- Secrets not exposed to client (no `NEXT_PUBLIC_` prefix for secrets)

### Best Practices

1. **Never commit `.env.local`**
   - ✅ Already in `.gitignore`

2. **Use different keys for dev/prod**
   - Test keys for development
   - Live keys for production

3. **Rotate secrets regularly**
   - Update WooCommerce keys periodically
   - Update Stripe keys if compromised

4. **Monitor access**
   - Review API access logs
   - Monitor for unauthorized access

## API Security

### WooCommerce REST API

1. **Use HTTPS only**
   - ✅ Configured in environment variables

2. **Limit API access**
   - Use consumer keys with limited permissions
   - Rotate keys regularly
   - Monitor API usage

3. **Validate requests**
   - WordPress validates requests automatically
   - Consider additional validation if needed

### Stripe Webhook Security

1. **Verify webhook signatures**
   - ✅ Already implemented in webhook handler
   - Uses `STRIPE_WEBHOOK_SECRET`

2. **Use HTTPS endpoints**
   - ✅ Required for Stripe webhooks
   - Configured in Stripe dashboard

## Monitoring & Alerts

### Recommended Monitoring

1. **CloudWatch Alarms** (Optional)
   - Monitor Lightsail instance health
   - Alert on high CPU/memory usage
   - Monitor API response times

2. **Uptime Monitoring** (Optional)
   - Use AWS Route53 Health Checks
   - Or third-party service (UptimeRobot, Pingdom)

3. **Error Tracking** (Optional)
   - Set up Sentry or similar
   - Monitor application errors
   - Track API failures

### Security Monitoring

1. **Access Logs**
   - Review WordPress access logs
   - Monitor for suspicious activity
   - Check API usage patterns

2. **SSL Certificate Monitoring**
   - Verify auto-renewal working
   - Check certificate expiration dates

## Security Checklist

### Before Going Live

- [ ] Security headers configured in Next.js
- [ ] Security headers configured in WordPress
- [ ] CORS properly configured
- [ ] Firewall rules set correctly
- [ ] Rate limiting implemented
- [ ] SSL certificates valid and auto-renewing
- [ ] Environment variables secured
- [ ] API keys rotated and secured
- [ ] Monitoring set up (optional)
- [ ] Backups configured
- [ ] Access logs reviewed

### Ongoing Maintenance

- [ ] Review security headers quarterly
- [ ] Rotate API keys annually
- [ ] Monitor certificate expiration
- [ ] Review access logs monthly
- [ ] Update WordPress/plugins regularly
- [ ] Review firewall rules periodically

## Security Testing

### Test Security Headers

1. **Online Tools:**
   - https://securityheaders.com/
   - Enter: `https://rockited4d.com`
   - Aim for A or A+ rating

2. **SSL Testing:**
   - https://www.ssllabs.com/ssltest/
   - Enter: `api.rockited4d.com`
   - Aim for A or A+ rating

### Test CORS

```bash
# Should succeed
curl -H "Origin: https://rockited4d.com" \
     https://api.rockited4d.com/wp-json/wc/v3/products

# Should fail (different origin)
curl -H "Origin: https://evil.com" \
     https://api.rockited4d.com/wp-json/wc/v3/products
```

## Incident Response

### If Security Breach Detected

1. **Immediate Actions:**
   - Rotate all API keys
   - Review access logs
   - Check for unauthorized changes
   - Update passwords/credentials

2. **Investigation:**
   - Review CloudWatch logs
   - Check WordPress access logs
   - Review API usage patterns

3. **Remediation:**
   - Patch vulnerabilities
   - Update security configuration
   - Enhance monitoring

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [WordPress Security Hardening](https://wordpress.org/support/article/hardening-wordpress/)
