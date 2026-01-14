# AWS Amplify Environment Variables Setup

This guide shows how to configure environment variables in AWS Amplify for your production deployment.

## Required Environment Variables

Your Next.js app requires these environment variables in Amplify:

```env
# WooCommerce Configuration
WOOCOMMERCE_URL=https://api.rockited4d.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://rockited4d.com

# Optional
STRIPE_LOGO_URL=/Rockited_Logo_For_Dark_BKGRND.png
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## Step-by-Step Instructions

### Step 1: Access Amplify Console

1. Sign in to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app from the list

### Step 2: Navigate to Environment Variables

1. In your app, click **App settings** in the left sidebar
2. Click **Environment variables** under **App settings**

### Step 3: Add Environment Variables

For each variable:

1. Click **Manage variables**
2. Click **Add variable**
3. Enter:
   - **Key**: Variable name (e.g., `WOOCOMMERCE_URL`)
   - **Value**: Variable value (e.g., `https://api.rockited4d.com`)
4. Click **Save**

### Step 4: Add All Required Variables

Add these variables one by one:

**WooCommerce:**
- `WOOCOMMERCE_URL` = `https://api.rockited4d.com`
- `WOOCOMMERCE_CONSUMER_KEY` = (your key from `.env.local`)
- `WOOCOMMERCE_CONSUMER_SECRET` = (your secret from `.env.local`)

**Stripe:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = (your publishable key)
- `STRIPE_SECRET_KEY` = (your secret key)
- `STRIPE_WEBHOOK_SECRET` = (your webhook secret)

**Site:**
- `NEXT_PUBLIC_SITE_URL` = `https://rockited4d.com`

**Optional:**
- `STRIPE_LOGO_URL` = `/Rockited_Logo_For_Dark_BKGRND.png`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` = (if using Google Analytics)

### Step 5: Configure for Different Branches (Optional)

If you have multiple branches (dev, staging, production):

1. Click **Manage variables**
2. For each variable, you can:
   - Set it for **All branches** (default)
   - Or set it for specific branches

**Example:**
- Production branch: `WOOCOMMERCE_URL=https://api.rockited4d.com`
- Development branch: `WOOCOMMERCE_URL=http://localhost:3000` (if needed)

### Step 6: Save and Redeploy

1. After adding all variables, click **Save**
2. Amplify will automatically trigger a new deployment
3. Or manually trigger: **Actions** → **Redeploy this version**

### Step 7: Verify Variables

After deployment:

1. Check build logs to ensure no environment variable errors
2. Test your app on the custom domain
3. Verify API calls work correctly
4. Check browser console for any errors

## Important Notes

### Public vs Private Variables

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are server-side only
- **Never** put secrets in `NEXT_PUBLIC_` variables

### HTTPS URLs Required

- In production, all URLs must use HTTPS
- `WOOCOMMERCE_URL` must be `https://api.rockited4d.com`
- `NEXT_PUBLIC_SITE_URL` must be `https://rockited4d.com`

### Stripe Keys

- Use **test keys** (`pk_test_`, `sk_test_`) for development
- Use **live keys** (`pk_live_`, `sk_live_`) for production
- Update webhook secret when switching environments

## Troubleshooting

### Variables Not Working

**Problem**: Environment variables not accessible in app

**Solutions**:
- Ensure variable names match exactly (case-sensitive)
- Restart/redeploy Amplify app
- Check build logs for errors
- Verify variables are saved in Amplify console

### Build Failures

**Problem**: Build fails with environment variable errors

**Solutions**:
- Check `src/lib/env.ts` validation
- Ensure all required variables are set
- Verify variable formats (URLs, keys, etc.)
- Check build logs for specific errors

### API Errors

**Problem**: API calls failing in production

**Solutions**:
- Verify `WOOCOMMERCE_URL` is HTTPS
- Check CORS configuration on WordPress
- Verify WooCommerce credentials are correct
- Test API endpoint directly: `https://api.rockited4d.com/wp-json/wc/v3/products`

## Security Best Practices

1. **Never commit `.env.local` to git**
   - Already in `.gitignore` ✅

2. **Use different keys for dev/prod**
   - Test keys for development
   - Live keys for production

3. **Rotate secrets regularly**
   - Update WooCommerce keys periodically
   - Update Stripe keys if compromised

4. **Monitor access**
   - Review Amplify access logs
   - Monitor API usage

## Quick Reference

**Minimum Required Variables:**
```env
WOOCOMMERCE_URL=https://api.rockited4d.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_SITE_URL=https://rockited4d.com
```

**Copy from `.env.local`:**
- Copy all values from your local `.env.local` file
- Update URLs to use HTTPS
- Ensure production Stripe keys (if using live mode)

## Next Steps

After configuring environment variables:

1. ✅ Trigger new deployment
2. ✅ Test app on custom domain
3. ✅ Verify all features work
4. ✅ Monitor for errors
5. ✅ Set up monitoring/alerts
