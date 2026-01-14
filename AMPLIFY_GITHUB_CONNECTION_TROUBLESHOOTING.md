# Amplify GitHub Connection Troubleshooting

This guide helps you resolve issues when AWS Amplify can't find or connect to your GitHub repository.

## Your Repository Info

- **Repository**: `https://github.com/Bluemott/rockited-v1.git`
- **Current Branch**: `rockited_dev`
- **Default Branch**: `master`

## Common Issues & Solutions

### Issue 1: GitHub OAuth Not Authorized

**Problem**: Amplify can't access your GitHub account or repositories.

**Solution**:

1. **In AWS Amplify Console:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click **New app** → **Host web app**
   - Click **GitHub** as your source
   - If you see "Authorize AWS Amplify", click it
   - Sign in to GitHub and authorize AWS Amplify

2. **Check GitHub App Permissions:**
   - Go to GitHub → Settings → Applications → Authorized OAuth Apps
   - Find "AWS Amplify" or "Amazon Web Services"
   - Verify it has access to your repositories
   - If not, click "Grant" or re-authorize

3. **If Repository is Private:**
   - Ensure AWS Amplify has access to private repositories
   - During authorization, check "repo" scope
   - You may need to grant access to the specific organization/user

### Issue 2: Repository Not Showing in List

**Problem**: Your repository doesn't appear in the dropdown list.

**Solutions**:

1. **Refresh the Connection:**
   - In Amplify, click "Edit" on the source connection
   - Click "Disconnect" then reconnect
   - Re-authorize if prompted

2. **Check Repository Visibility:**
   - Verify the repository exists: https://github.com/Bluemott/rockited-v1
   - If it's private, ensure Amplify has access
   - Try making it public temporarily to test (then make private again)

3. **Search for Repository:**
   - In Amplify, use the search box
   - Type: `Bluemott/rockited-v1`
   - Or type: `rockited-v1`

4. **Check Organization/User:**
   - Ensure you're looking under the correct GitHub user/organization
   - Switch between "Personal" and organization accounts if applicable

### Issue 3: Branch Selection Issues

**Problem**: Amplify can't find your branch or shows wrong branches.

**Your Current Branch**: `rockited_dev`
**Default Branch**: `master`

**Solutions**:

1. **Select Correct Branch:**
   - When creating app, choose branch: `rockited_dev` or `master`
   - If `rockited_dev` doesn't show, try `master` first
   - You can add more branches later in app settings

2. **Verify Branch Exists:**

   ```bash
   git branch -a
   ```

   - Ensure branch is pushed to GitHub
   - Push if needed: `git push origin rockited_dev`

3. **Use Default Branch First:**
   - Try connecting with `master` branch first
   - After connection works, add `rockited_dev` in app settings

### Issue 4: Repository Access Denied

**Problem**: "Access denied" or "Repository not found" error.

**Solutions**:

1. **Check Repository URL:**
   - Verify: https://github.com/Bluemott/rockited-v1
   - Ensure repository name is correct
   - Check for typos in username or repo name

2. **Verify GitHub Account:**
   - Ensure you're signed into the correct GitHub account
   - The account must own or have access to the repository

3. **Check Repository Settings:**
   - Go to repository → Settings → Collaborators
   - Verify your account has access
   - If organization-owned, check organization permissions

### Issue 5: GitHub App Not Installed

**Problem**: No GitHub connection option or connection fails.

**Solution**:

1. **Install GitHub App (Alternative Method):**
   - Go to: https://github.com/apps/aws-amplify
   - Click "Install"
   - Select account: `Bluemott`
   - Choose repositories: `rockited-v1` or "All repositories"
   - Click "Install"

2. **Then in Amplify:**
   - Try connecting again
   - Select "GitHub" as source
   - Repository should now appear

## Step-by-Step: Fresh Connection

If nothing works, try this complete reset:

### Step 1: Disconnect Existing Connections

1. In Amplify Console, go to **App settings** → **General**
2. If you have an existing app, note the settings
3. Go to source connection settings
4. Click "Disconnect" if connection exists

### Step 2: Re-authorize GitHub

1. Go to GitHub → Settings → Applications → Authorized OAuth Apps
2. Find "AWS Amplify" or "Amazon Web Services"
3. Click "Revoke" to remove old authorization
4. Go back to Amplify Console

### Step 3: Create New Connection

1. In Amplify, click **New app** → **Host web app**
2. Click **GitHub**
3. Click **Authorize AWS Amplify** (if shown)
4. Sign in to GitHub
5. Authorize AWS Amplify with these permissions:
   - ✅ Access to repositories
   - ✅ Read repository contents
   - ✅ Read repository metadata
   - ✅ If private repo: Full repository access

### Step 4: Select Repository

1. After authorization, you should see a list of repositories
2. Search for: `rockited-v1` or `Bluemott/rockited-v1`
3. Select the repository
4. Choose branch: `master` (or `rockited_dev` if available)
5. Click **Next**

### Step 5: Configure Build Settings

1. Amplify should detect `amplify.yml` automatically
2. If not, use these settings:
   - **Build settings**: Use `amplify.yml` file
   - **App name**: `rockited-v1` (or your choice)
3. Click **Next** → **Save and deploy**

## Alternative: Manual Repository Connection

If OAuth continues to fail:

### Option 1: Use GitHub App Installation

1. Install AWS Amplify GitHub App:
   - https://github.com/apps/aws-amplify
   - Install for your account/organization
   - Grant access to `rockited-v1` repository

2. Then connect in Amplify using the app

### Option 2: Use Deploy Without Git (Manual)

1. In Amplify, click **New app** → **Deploy without Git**
2. Upload your code manually
3. **Note**: This won't auto-deploy on git push
4. You'll need to manually deploy updates

### Option 3: Use GitHub Actions + Amplify

1. Set up GitHub Actions workflow
2. Use Amplify CLI to deploy
3. More complex but gives full control

## Verification Checklist

After connecting, verify:

- [ ] Repository appears in Amplify
- [ ] Branch is selected correctly
- [ ] `amplify.yml` is detected
- [ ] Build settings are correct
- [ ] First deployment starts automatically

## Still Not Working?

### Check These:

1. **GitHub Status:**
   - Visit: https://www.githubstatus.com/
   - Ensure GitHub is operational

2. **AWS Region:**
   - Ensure you're in the correct AWS region
   - Some regions may have different GitHub integration

3. **Browser Issues:**
   - Try different browser
   - Clear browser cache
   - Try incognito/private mode

4. **Contact Support:**
   - AWS Support: https://console.aws.amazon.com/support/
   - GitHub Support: https://support.github.com/

## Quick Test

To verify your repository is accessible:

1. **Check Repository URL:**

   ```
   https://github.com/Bluemott/rockited-v1
   ```

   - Should load without errors
   - Should be accessible (public or you're logged in)

2. **Verify Branch Exists:**
   - Visit: https://github.com/Bluemott/rockited-v1/tree/rockited_dev
   - Or: https://github.com/Bluemott/rockited-v1/tree/master
   - Should show your code

3. **Check amplify.yml:**
   - Visit: https://github.com/Bluemott/rockited-v1/blob/rockited_dev/amplify.yml
   - File should exist and be readable

## Next Steps After Connection

Once connected:

1. ✅ Verify build settings (should auto-detect `amplify.yml`)
2. ✅ Set environment variables (see `AMPLIFY_ENV_VARS.md`)
3. ✅ Configure custom domain (see `ROUTE53_AMPLIFY_SETUP.md`)
4. ✅ Monitor first deployment
5. ✅ Test the deployed app

## Your Specific Setup

Based on your repository:

- **Repository**: `Bluemott/rockited-v1`
- **Branch to Use**: `rockited_dev` (or `master` if `rockited_dev` doesn't work)
- **Build Config**: `amplify.yml` (already exists ✅)
- **Framework**: Next.js (auto-detected)

**Recommended**: Start with `master` branch to ensure connection works, then add `rockited_dev` as an additional branch in app settings.
