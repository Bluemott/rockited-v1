# SSL Certificate Setup Guide for Lightsail WordPress Instance

## ⚠️ Important: Subdomain Required

**If your main domain (`rockited4d.com`) is already pointing to Route 53/CloudFront**, you need to use a **subdomain** for your WordPress API server.

**See `SSL_SETUP_GUIDE_SUBDOMAIN.md` for subdomain setup instructions.**

Common subdomain options:

- `api.rockited4d.com` - Recommended for API endpoints
- `shop.rockited4d.com` - Good for e-commerce backend
- `store.rockited4d.com` - Alternative option

---

## Prerequisites (For Main Domain Setup)

Before starting, ensure you have:

- ✅ Static IP attached to your Lightsail instance
- ✅ DNS records pointing `rockited4d.com` and `www.rockited4d.com` to the static IP
- ✅ Snapshot of your WordPress instance (backup)

**Note**: If your main domain is already in use elsewhere, use the subdomain guide instead.

## Step-by-Step Instructions

### Step 1: Connect to Your Instance

1. Sign in to the [Lightsail console](https://lightsail.aws.amazon.com/)
2. In the left navigation pane, choose the SSH quick connect icon for your WordPress instance
3. The browser-based SSH client terminal window will open

### Step 2: Check if bncert Tool is Installed

Run the following command:

```bash
sudo /opt/bitnami/bncert-tool
```

**If the tool is installed:**

- You'll see the bncert configuration menu
- Skip to Step 3

**If you see "command not found":**

- The tool needs to be installed
- Run: `sudo /opt/bitnami/installer`
- Then run: `sudo /opt/bitnami/bncert-tool` again

### Step 3: Request SSL Certificate

1. When the bncert tool menu appears, select option to configure HTTPS
2. Enter your domain names when prompted:
   - Primary domain: `rockited4d.com`
   - Additional domains: `www.rockited4d.com`
3. The tool will:
   - Request certificates from Let's Encrypt
   - Validate domain ownership (via DNS or HTTP challenge)
   - Install the certificates
   - Configure Apache/Nginx for HTTPS

### Step 4: Configure Redirects

When prompted:

- **HTTP to HTTPS redirect**: Select "Yes" to automatically redirect all HTTP traffic to HTTPS
- **WWW redirect**: Choose your preference:
  - Redirect www to non-www (`www.rockited4d.com` → `rockited4d.com`)
  - Redirect non-www to www (`rockited4d.com` → `www.rockited4d.com`)
  - No redirect (both work)

### Step 5: Verify SSL Certificate

1. Test your website: Visit `https://rockited4d.com` in your browser
2. Check for the padlock icon in the address bar
3. Verify the certificate is valid (no security warnings)

### Step 6: Auto-Renewal

The bncert tool automatically renews certificates every 80 days. No manual action needed.

## Troubleshooting

**Certificate validation fails:**

- Ensure DNS records are correctly pointing to your static IP
- Wait a few minutes for DNS propagation
- Verify the domain is accessible via HTTP before requesting HTTPS

**Tool not found:**

- Some older WordPress instances may not have bncert pre-installed
- Install it using: `sudo /opt/bitnami/installer`

**Need to update domains later:**

- Run `sudo /opt/bitnami/bncert-tool` again
- Select the option to update domain configuration

## After SSL Setup

Once SSL is configured:

1. Update `WOOCOMMERCE_URL` in `.env.local` to `https://rockited4d.com`
2. Update `NEXT_PUBLIC_SITE_URL` to use HTTPS
3. Update `next.config.ts` to allow HTTPS images from the domain
