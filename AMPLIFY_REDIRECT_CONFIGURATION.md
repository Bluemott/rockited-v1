# Amplify Redirect Configuration - www to non-www

This guide shows how to configure a redirect from `www.rockited4d.com` to `rockited4d.com` in AWS Amplify when the console only offers the opposite option.

## The Problem

Amplify's console UI only shows a checkbox for:

- ✅ "Redirect non-www to www" (www.rockited4d.com → rockited4d.com)

But you need:

- ✅ "Redirect www to non-www" (www.rockited4d.com → rockited4d.com)

## Solution: Manual JSON Configuration

You'll need to add a redirect rule manually in Amplify's redirect/rewrite configuration.

### Step 1: Access Redirect Configuration

1. In Amplify Console, go to your app
2. Navigate to **App settings** → **Rewrites and redirects**
3. Or go to **Domain management** → Select your domain → **Manage redirects**

### Step 2: Add Redirect Rule

Click **Add redirect rule** or **Edit** if you see existing rules.

### Step 3: JSON Configuration

Add this redirect rule:

```json
{
  "source": "https://www.rockited4d.com/<*>",
  "target": "https://rockited4d.com/<*>",
  "type": "301",
  "status": "200"
}
```

Or if using the form-based interface, configure:

- **Source address**: `https://www.rockited4d.com/<*>`
- **Target address**: `https://rockited4d.com/<*>`
- **Type**: `301` (Permanent Redirect)
- **Country code**: (leave empty for all countries)

### Alternative: Using Rewrite Rules

If Amplify uses rewrite rules instead, use this format:

```json
{
  "source": "/<*>",
  "target": "https://rockited4d.com/<*>",
  "status": "301",
  "condition": {
    "key": "host",
    "operator": "equals",
    "value": "www.rockited4d.com"
  }
}
```

## Complete Redirect Configuration

For a complete setup, you'll want these redirects:

### 1. HTTP to HTTPS (for both domains)

```json
{
  "source": "http://rockited4d.com/<*>",
  "target": "https://rockited4d.com/<*>",
  "type": "301"
}
```

```json
{
  "source": "http://www.rockited4d.com/<*>",
  "target": "https://rockited4d.com/<*>",
  "type": "301"
}
```

### 2. www to non-www (HTTPS)

```json
{
  "source": "https://www.rockited4d.com/<*>",
  "target": "https://rockited4d.com/<*>",
  "type": "301"
}
```

## Amplify Console Format

If Amplify uses a different format in the console, try these variations:

### Format 1: Simple Redirect

```
Source: https://www.rockited4d.com/*
Target: https://rockited4d.com/*
Type: 301 Permanent Redirect
```

### Format 2: With Wildcard

```
Source: https://www.rockited4d.com/<*>
Target: https://rockited4d.com/<*>
Type: 301
```

### Format 3: Path-Specific

```
Source: /<*>
Target: https://rockited4d.com/<*>
Type: 301
Condition: Host equals www.rockited4d.com
```

## Step-by-Step in Amplify Console

1. **Go to Domain Management:**
   - App settings → Domain management
   - Click on `rockited4d.com` domain
   - Look for "Redirects" or "Rewrites and redirects" section

2. **Add Redirect Rule:**
   - Click "Add redirect" or "Edit redirects"
   - If there's a JSON editor, paste the JSON above
   - If there's a form, fill in:
     - Source: `https://www.rockited4d.com/<*>`
     - Target: `https://rockited4d.com/<*>`
     - Type: `301`

3. **Save Configuration:**
   - Click "Save" or "Deploy"
   - Wait for deployment to complete

## Verification

After configuration, test:

1. **Visit www version:**

   ```
   https://www.rockited4d.com
   ```

   - Should redirect to `https://rockited4d.com`
   - Check browser address bar shows non-www version

2. **Test with path:**

   ```
   https://www.rockited4d.com/products
   ```

   - Should redirect to `https://rockited4d.com/products`
   - Path should be preserved

3. **Check redirect type:**
   - Open browser DevTools → Network tab
   - Visit `https://www.rockited4d.com`
   - Should see `301 Moved Permanently` status

## Troubleshooting

### Redirect Not Working

**Problem**: www version doesn't redirect

**Solutions**:

- Wait 5-15 minutes for changes to propagate
- Clear browser cache
- Test in incognito/private mode
- Verify DNS is pointing to Amplify
- Check redirect rule syntax is correct

### Infinite Redirect Loop

**Problem**: Site keeps redirecting

**Solutions**:

- Check for conflicting redirect rules
- Ensure only one redirect rule for www → non-www
- Remove duplicate rules
- Verify target URL is correct

### Path Not Preserved

**Problem**: `/products` redirects to homepage

**Solutions**:

- Ensure wildcard `<*>` is in both source and target
- Check redirect rule includes path parameter
- Verify rule format matches Amplify's requirements

## Alternative: Using Next.js Middleware

If Amplify redirects don't work, you can also handle this in your Next.js app:

```typescript
// src/middleware.ts (add to existing middleware)
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Redirect www to non-www
  if (hostname.startsWith("www.")) {
    const newUrl = url.clone();
    newUrl.hostname = hostname.replace("www.", "");
    return NextResponse.redirect(newUrl, 301);
  }

  // ... rest of your middleware
}
```

However, it's better to handle this at the Amplify/CDN level for performance.

## Best Practices

1. **Use 301 Redirects**: Permanent redirects are better for SEO
2. **Preserve Paths**: Ensure `/products` redirects to `/products`, not homepage
3. **HTTPS Only**: Redirect all HTTP to HTTPS
4. **Single Canonical**: One primary domain (non-www) for SEO

## Expected Behavior

After configuration:

- ✅ `http://rockited4d.com` → `https://rockited4d.com` (HTTP to HTTPS)
- ✅ `http://www.rockited4d.com` → `https://rockited4d.com` (HTTP + www removal)
- ✅ `https://www.rockited4d.com` → `https://rockited4d.com` (www removal)
- ✅ `https://rockited4d.com` → Works normally (primary domain)

All paths should be preserved in redirects.
