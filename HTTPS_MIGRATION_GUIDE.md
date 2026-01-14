# WordPress/WooCommerce HTTPS Migration Guide

This guide will help you migrate your WordPress/WooCommerce installation from HTTP (http://52.23.226.128) to HTTPS (https://rockited4d.com or https://api.rockited4d.com).

## Prerequisites

- You are logged into WordPress admin
- You have access to your WordPress database (via phpMyAdmin, cPanel, or command line)
- SSL certificate is installed on your server
- You know your HTTPS domain (e.g., `https://rockited4d.com` or `https://api.rockited4d.com`)

## Step 1: Update WordPress Site URL Settings

### Option A: Via WordPress Admin Dashboard

1. **Go to Settings → General**
   - In WordPress admin, navigate to: `Settings` → `General`

2. **Update WordPress Address (URL)**
   - Find "WordPress Address (URL)"
   - Change from: `http://52.23.226.128`
   - Change to: `https://rockited4d.com` (or your HTTPS domain)

3. **Update Site Address (URL)**
   - Find "Site Address (URL)"
   - Change from: `http://52.23.226.128`
   - Change to: `https://rockited4d.com` (or your HTTPS domain)

4. **Click "Save Changes"**
   - WordPress may log you out after saving (this is normal)

5. **Log back in** using your HTTPS URL

### Option B: Via wp-config.php (If Admin Access is Lost)

If you get locked out after changing URLs, you can manually set them in `wp-config.php`:

```php
define('WP_HOME','https://rockited4d.com');
define('WP_SITEURL','https://rockited4d.com');
```

Add these lines **before** the line that says `/* That's all, stop editing! */`

## Step 2: Update Database URLs (Critical for Images)

WordPress stores full URLs in the database. You need to replace all HTTP URLs with HTTPS.

### Option A: Using WordPress Admin (Recommended - Safer)

1. **Install "Better Search Replace" Plugin**
   - Go to: `Plugins` → `Add New`
   - Search for: "Better Search Replace"
   - Install and activate it

2. **Run Search and Replace**
   - Go to: `Tools` → `Better Search Replace`
   - **Search for:** `http://52.23.226.128`
   - **Replace with:** `https://rockited4d.com` (or your HTTPS domain)
   - **Select tables:** Check "Select All" or at minimum:
     - `wp_posts`
     - `wp_postmeta`
     - `wp_options`
   - **Check:** "Run as dry run?" (to preview changes first)
   - Click "Run Search/Replace"
   - Review the results
   - **Uncheck** "Run as dry run?" and run again to apply changes

3. **Verify Changes**
   - Check a few product pages to ensure images load correctly
   - Check media library to ensure images show HTTPS URLs

### Option B: Using phpMyAdmin (Advanced)

⚠️ **WARNING: Always backup your database first!**

1. **Backup Database**
   - Export your database before making changes

2. **Access phpMyAdmin**
   - Log into your hosting control panel
   - Open phpMyAdmin
   - Select your WordPress database

3. **Run SQL Query**
   ```sql
   UPDATE wp_posts 
   SET post_content = REPLACE(post_content, 'http://52.23.226.128', 'https://rockited4d.com');
   
   UPDATE wp_postmeta 
   SET meta_value = REPLACE(meta_value, 'http://52.23.226.128', 'https://rockited4d.com');
   
   UPDATE wp_options 
   SET option_value = REPLACE(option_value, 'http://52.23.226.128', 'https://rockited4d.com');
   ```

4. **Verify Changes**
   - Check a few records to ensure URLs were updated

### Option C: Using WP-CLI (Command Line)

If you have SSH access:

```bash
wp search-replace 'http://52.23.226.128' 'https://rockited4d.com' --all-tables --dry-run
# Review the output, then run without --dry-run:
wp search-replace 'http://52.23.226.128' 'https://rockited4d.com' --all-tables
```

## Step 3: Update WooCommerce Settings

1. **Go to WooCommerce → Settings**
   - Navigate to: `WooCommerce` → `Settings`

2. **Check General Settings**
   - Verify store address uses HTTPS
   - Update if needed

3. **Check Shipping Settings**
   - Review shipping zones and methods
   - Ensure any hardcoded URLs use HTTPS

4. **Check API Settings**
   - Go to: `WooCommerce` → `Settings` → `Advanced` → `REST API`
   - Verify API endpoints are accessible via HTTPS

## Step 4: Update .env.local File

1. **Open `.env.local` in your Next.js project**

2. **Update WOOCOMMERCE_URL**
   - Change from: `WOOCOMMERCE_URL=http://52.23.226.128`
   - Change to: `WOOCOMMERCE_URL=https://api.rockited4d.com` (or your HTTPS API domain)

3. **Update NEXT_PUBLIC_SITE_URL** (if in production)
   - Change from: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
   - Change to: `NEXT_PUBLIC_SITE_URL=https://rockited4d.com` (your production domain)

4. **Save the file**

## Step 5: Clear WordPress Cache

If you're using a caching plugin:

1. **WP Super Cache / W3 Total Cache**
   - Go to plugin settings
   - Clear all cache

2. **Cloudflare / CDN**
   - Purge cache in your CDN dashboard

3. **Browser Cache**
   - Clear your browser cache or use incognito mode

## Step 6: Revalidate Next.js ISR Cache

After updating WordPress, you need to revalidate your Next.js static pages:

### Option A: Wait for Automatic Revalidation
- Your products page has `revalidate = 3600` (1 hour)
- Pages will automatically update within 1 hour

### Option B: Force Revalidation (Immediate)

1. **Rebuild the Next.js app:**
   ```bash
   npm run build
   ```

2. **Or trigger on-demand revalidation** (if you have an API route set up)

3. **Or manually clear Next.js cache:**
   - Delete `.next` folder
   - Run `npm run build` again

## Step 7: Verify Everything Works

1. **Check WordPress Admin**
   - Log in via HTTPS URL
   - Verify all pages load correctly
   - Check media library shows HTTPS URLs

2. **Check Product Images**
   - View a product in WordPress
   - Inspect image URLs (should be HTTPS)
   - Check image source in browser dev tools

3. **Test WooCommerce API**
   - Try accessing: `https://api.rockited4d.com/wp-json/wc/v3/products`
   - Should return products with HTTPS image URLs

4. **Test Next.js App**
   - Start dev server: `npm run dev`
   - Visit product pages
   - Check browser console for errors
   - Verify images load correctly

## Step 8: Force HTTPS Redirect (Optional but Recommended)

Add to your `.htaccess` file (if using Apache):

```apache
# Force HTTPS
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

Or in `wp-config.php`:

```php
define('FORCE_SSL_ADMIN', true);
if (strpos($_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') !== false)
    $_SERVER['HTTPS']='on';
```

## Troubleshooting

### Images Still Show HTTP URLs

1. **Check database again** - Some URLs might be in serialized data
2. **Use "Better Search Replace" plugin** - It handles serialized data correctly
3. **Check theme files** - Some themes hardcode URLs
4. **Check custom fields** - ACF or other plugins might store URLs

### WordPress Admin Redirects to HTTP

1. **Check wp-config.php** - Ensure WP_HOME and WP_SITEURL are set correctly
2. **Check .htaccess** - Ensure redirect rules are correct
3. **Clear browser cache** - Old redirects might be cached

### WooCommerce API Returns HTTP URLs

1. **Check WooCommerce settings** - Ensure store address is HTTPS
2. **Regenerate permalinks** - Go to Settings → Permalinks, click "Save Changes"
3. **Check API endpoint** - Test directly in browser

### Next.js Still Shows Old Images

1. **Clear .next folder** - Delete and rebuild
2. **Check .env.local** - Ensure WOOCOMMERCE_URL is HTTPS
3. **Restart dev server** - Stop and start `npm run dev`
4. **Hard refresh browser** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Final Checklist

- [ ] WordPress Site URL updated to HTTPS
- [ ] Database URLs replaced (http://52.23.226.128 → https://rockited4d.com)
- [ ] WooCommerce settings verified
- [ ] .env.local updated with HTTPS WOOCOMMERCE_URL
- [ ] WordPress cache cleared
- [ ] Next.js cache cleared / rebuilt
- [ ] Product images load with HTTPS URLs
- [ ] WooCommerce API returns HTTPS URLs
- [ ] Next.js app displays images correctly
- [ ] No console errors in browser

## Need Help?

If you encounter issues:
1. Check browser console for specific error messages
2. Check WordPress debug log (if WP_DEBUG is enabled)
3. Verify SSL certificate is valid
4. Test API endpoint directly in browser
