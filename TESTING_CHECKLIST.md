# Infrastructure Testing Checklist

Use this checklist to verify your AWS infrastructure setup is working correctly.

## Pre-Testing Requirements

- [ ] SSL certificate installed on Lightsail for `api.rockited4d.com`
- [ ] Route53 DNS records configured for both domains
- [ ] Environment variables updated in `.env.local` and Amplify console
- [ ] DNS propagation completed (wait 5-30 minutes)

---

## DNS Verification

### Test api.rockited4d.com

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

**Expected Result:**

- ✅ Resolves to `52.23.226.128` (Lightsail IP)
- ✅ No errors or timeouts

### Test rockited4d.com

**Windows (PowerShell):**

```powershell
nslookup rockited4d.com
```

**Mac/Linux:**

```bash
dig rockited4d.com
```

**Expected Result:**

- ✅ Resolves to Amplify IP addresses
- ✅ No errors or timeouts

### Test www.rockited4d.com (if configured)

**Windows (PowerShell):**

```powershell
nslookup www.rockited4d.com
```

**Mac/Linux:**

```bash
dig www.rockited4d.com
```

**Expected Result:**

- ✅ Resolves correctly
- ✅ Redirects to main domain (if configured)

---

## SSL Certificate Testing

### Test HTTPS on API Domain

1. **Browser Test**:
   - [ ] Visit `https://api.rockited4d.com`
   - [ ] Verify padlock icon appears in address bar
   - [ ] Click padlock → View certificate
   - [ ] Verify issuer is "Let's Encrypt"
   - [ ] Check expiration date (~90 days from now)
   - [ ] No security warnings displayed

2. **Command Line Test**:

   ```bash
   openssl s_client -connect api.rockited4d.com:443 -servername api.rockited4d.com
   ```

   - [ ] Connection successful
   - [ ] Certificate chain valid
   - [ ] No certificate errors

3. **SSL Labs Test** (Optional):
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter: `api.rockited4d.com`
   - [ ] Rating of A or A+ (after full propagation)

### Test HTTPS on Main Domain

1. **Browser Test**:
   - [ ] Visit `https://rockited4d.com`
   - [ ] Verify padlock icon appears
   - [ ] No security warnings
   - [ ] SSL certificate valid (AWS Certificate Manager)

2. **Redirect Test**:
   - [ ] Visit `http://rockited4d.com` (HTTP)
   - [ ] Should redirect to `https://rockited4d.com` (HTTPS)

---

## API Connectivity Testing

### Test WooCommerce REST API

1. **Basic API Test**:

   ```bash
   curl https://api.rockited4d.com/wp-json/wc/v3/products?per_page=1
   ```

   - [ ] Returns JSON response
   - [ ] No SSL errors
   - [ ] Response contains product data

2. **Authentication Test** (if needed):

   ```bash
   curl -u "ck_xxx:cs_xxx" https://api.rockited4d.com/wp-json/wc/v3/products
   ```

   - [ ] Authentication works
   - [ ] Returns authorized data

### Test from Next.js Application

1. **Start Development Server**:

   ```bash
   npm run dev
   ```

2. **Test Product Loading**:
   - [ ] Navigate to `/products` page
   - [ ] Products load correctly
   - [ ] No console errors
   - [ ] Network tab shows successful API calls

3. **Test Image Loading**:
   - [ ] Product images display correctly
   - [ ] Images load from `api.rockited4d.com`
   - [ ] No broken image links
   - [ ] Next.js Image optimization working

4. **Test Cart Functionality**:
   - [ ] Add products to cart
   - [ ] Cart persists correctly
   - [ ] No API errors

5. **Test Checkout Flow**:
   - [ ] Proceed to checkout
   - [ ] API calls succeed
   - [ ] Stripe integration works
   - [ ] No CORS errors

---

## End-to-End Testing

### Homepage

- [ ] Loads correctly at `https://rockited4d.com`
- [ ] All images load
- [ ] Navigation works
- [ ] No console errors

### Product Pages

- [ ] Product listings load
- [ ] Individual product pages work
- [ ] Product images display
- [ ] Add to cart functionality works

### Cart & Checkout

- [ ] Cart page loads
- [ ] Items persist in cart
- [ ] Checkout page loads
- [ ] Stripe checkout integration works
- [ ] Payment processing succeeds

### API Endpoints

- [ ] `/api/products` works
- [ ] `/api/checkout` works
- [ ] All API routes respond correctly

---

## Security Testing

### Security Headers

1. **Test with Security Headers Tool**:
   - Visit: https://securityheaders.com/
   - Enter: `https://rockited4d.com`
   - [ ] Rating of A or higher
   - [ ] Security headers present:
     - [ ] Content-Security-Policy
     - [ ] X-Frame-Options
     - [ ] X-Content-Type-Options
     - [ ] Strict-Transport-Security (HSTS)

### CORS Configuration

- [ ] API calls from `rockited4d.com` to `api.rockited4d.com` work
- [ ] No CORS errors in browser console
- [ ] CORS headers configured correctly

### Firewall Rules

- [ ] Port 80 (HTTP) open on Lightsail
- [ ] Port 443 (HTTPS) open on Lightsail
- [ ] Port 22 (SSH) restricted to your IP (recommended)

---

## Performance Testing

### Page Load Speed

- [ ] Homepage loads in < 3 seconds
- [ ] Product pages load quickly
- [ ] Images optimized and loading efficiently

### API Response Times

- [ ] API responses < 500ms
- [ ] No timeout errors
- [ ] Consistent response times

### CDN Performance (Amplify)

- [ ] Static assets served from CDN
- [ ] Global performance acceptable
- [ ] Cache headers configured correctly

---

## Monitoring & Alerts

### Set Up Basic Monitoring

- [ ] CloudWatch alarms configured (optional)
- [ ] Uptime monitoring set up (optional)
- [ ] Error tracking configured (optional)

---

## Troubleshooting Common Issues

### DNS Issues

**Problem**: Domain not resolving

**Check**:

- [ ] Route53 records are correct
- [ ] TTL values are reasonable
- [ ] DNS cache cleared
- [ ] Wait time sufficient (up to 48 hours)

### SSL Issues

**Problem**: Certificate errors

**Check**:

- [ ] Certificate installed correctly
- [ ] DNS pointing to correct IP
- [ ] Ports 80/443 open
- [ ] Certificate not expired

### API Issues

**Problem**: API calls failing

**Check**:

- [ ] HTTPS URL correct
- [ ] CORS configured
- [ ] WooCommerce REST API enabled
- [ ] Credentials correct
- [ ] Network connectivity

---

## Final Verification

Before going live:

- [ ] All DNS tests pass
- [ ] All SSL tests pass
- [ ] All API connectivity tests pass
- [ ] End-to-end flow works
- [ ] Security headers configured
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Monitoring set up (optional)

---

## Test Results Log

Date: **\*\***\_\_\_**\*\***

Tester: **\*\***\_\_\_**\*\***

**DNS Tests**: ✅ / ❌
**SSL Tests**: ✅ / ❌
**API Tests**: ✅ / ❌
**E2E Tests**: ✅ / ❌
**Security Tests**: ✅ / ❌

**Issues Found**:

- **Resolution**:

- ***

## Next Steps After Testing

1. ✅ Document any issues found
2. ✅ Fix any failing tests
3. ✅ Re-test after fixes
4. ✅ Set up monitoring
5. ✅ Configure backups
6. ✅ Plan for scaling (if needed)
