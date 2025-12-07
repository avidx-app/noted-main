# Deployment Guide: Render (Preview Environments & Production)

This guide will walk you through deploying your Noted application to Render with **Preview Environments** (like Vercel) and **Production**.

## 🎯 Deployment Strategy

**Your deployment setup:**
- ✅ **Production**: Auto-deploys from `main` branch
- ✅ **Preview Environments**: Each Pull Request automatically gets its own preview URL (acts as staging)

**How it works:**
- Merge to `main` → Automatically deploys to **Production** (when a pull request is merged or code is merged to main)
- Open a Pull Request → Automatically creates a **Preview Environment** (like Vercel) - each PR gets its own dedicated URL
- **No separate staging service needed** - Preview Environments act as staging, all connecting to the same staging third-party services (Convex staging, Clerk, EdgeStore)

---

## Prerequisites

Before you begin, make sure you have:

1. ✅ A GitHub account with your code pushed to a repository
2. ✅ A Render account ([sign up here](https://render.com))
3. ✅ Separate Convex deployments for staging and production
   - **Production Convex**: Used by production service
   - **Staging Convex**: Used by all preview environments (each PR preview connects to this)
4. ✅ Clerk application set up (can use same for both production and previews)
5. ✅ EdgeStore account with access keys (can use same for both production and previews)

---

## Step 1: Prepare Your Convex Deployments

You'll need **separate Convex deployments** for staging and production.

### For Production:

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Create a new deployment or use your existing production deployment
3. Copy the **Deployment URL** (looks like `https://your-project.convex.cloud`)
4. Save this URL - you'll need it for production environment variables

### For Staging:

1. In Convex Dashboard, create a **separate deployment** for staging
2. Copy the **Deployment URL** for staging
3. Save this URL - you'll need it for staging environment variables

> 💡 **Tip**: You can create multiple deployments in the same Convex project, or create separate projects entirely. The choice depends on whether you want to share data between environments.

---

## Step 2: Set Up Clerk (Authentication)

You have two options:

### Option A: Use the Same Clerk Application (Simpler)
- Use the same Clerk app for both staging and production
- Simpler setup, but users will be shared between environments

### Option B: Create Separate Clerk Applications (Recommended)
- Create separate Clerk apps for staging and production
- Better isolation between environments
- Users won't mix between staging and production

**For each Clerk application:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create/select your application
3. Go to **API Keys**
4. Copy the **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
5. **Important**: Make sure you have a JWT Template named exactly `convex` (lowercase) configured
   - Go to **JWT Templates** → Create new template
   - Name: `convex` (must be lowercase!)
   - Signing Algorithm: RS256
   - Save the template

---

## Step 3: Set Up EdgeStore

1. Go to [EdgeStore Dashboard](https://edgestore.dev)
2. Get your **Access Key** and **Secret Key**
3. Save these - you'll need them for both environments

> 💡 **Note**: You can use the same EdgeStore keys for both environments, or create separate stores if you want to isolate file storage.

---

## Step 4: Deploy to Render

### Method 1: Using render.yaml (Recommended)

Render can automatically detect and use the `render.yaml` file in your repository.

1. **Push your code to GitHub** (make sure `render.yaml` is committed)

2. **Log in to Render Dashboard** → [dashboard.render.com](https://dashboard.render.com)

3. **Create a New Blueprint**:
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically
   - Click **"Apply"**

4. **Configure Environment Variables**:
   
   **For Production Service** (`noted-production`):
   - Click on the production service
   - Go to **Environment** tab
   - Add these environment variables:
     ```
     NEXT_PUBLIC_CONVEX_URL=<your-production-convex-url>
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
     EDGE_STORE_ACCESS_KEY=<your-edgestore-access-key>
     EDGE_STORE_SECRET_KEY=<your-edgestore-secret-key>
     ```
   
   **For Preview Environments** (all PR previews):
   - Preview environments automatically inherit environment variables from your Blueprint
   - Go to your Blueprint → **Environment Groups** (or configure at the service level)
   - Add these environment variables (these will be used by ALL preview environments):
     ```
     NEXT_PUBLIC_CONVEX_URL=<your-staging-convex-url>  # Use staging Convex for all previews
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>  # Can use same as production
     EDGE_STORE_ACCESS_KEY=<your-edgestore-access-key>  # Can use same as production
     EDGE_STORE_SECRET_KEY=<your-edgestore-secret-key>  # Can use same as production
     ```
   - **Important**: All preview environments will connect to the same staging third-party services
   - This means all PR previews share the same staging Convex database, Clerk app, and EdgeStore

5. **Deploy**:
   - Production will automatically deploy when code is merged to `main` branch
   - Preview environments will automatically be created for each Pull Request
   - Wait for the build to complete (usually 3-5 minutes)
   - Your apps will be live at the URLs provided by Render

---

## Step 5: Configure Preview Environments (Like Vercel!)

## Step 5: Configure Preview Environments (Like Vercel!)

Render supports **Preview Environments** that work just like Vercel! Each pull request automatically gets its own dedicated preview URL. **These preview environments act as your staging** - no separate staging service needed!

### How Preview Environments Work:

- **Automatic Creation**: When you open a Pull Request, Render automatically creates a preview environment
- **Dedicated URL**: Each PR gets its own unique URL (like `noted-production-pr-123.onrender.com`)
- **Shared Staging Services**: All preview environments connect to the same staging third-party services:
  - Same staging Convex database (all previews share the same data)
  - Same Clerk application
  - Same EdgeStore storage
- **Isolated Code**: Each preview runs its own code from the PR branch
- **Auto-Cleanup**: Preview environments are automatically destroyed when the PR is merged or closed

### Configuration:

The `render.yaml` file is already configured with:
```yaml
previews:
  generation: automatic  # Creates preview for every PR
```

**Preview Modes:**
- `automatic`: Creates preview for every PR (recommended)
- `manual`: Only creates preview if PR title includes `[render preview]`

**To skip a preview** for a specific PR, add `[skip preview]` or `[render skip]` to the PR title.

### Accessing Preview URLs:

1. Open a Pull Request on GitHub
2. Render automatically creates the preview environment (usually takes 3-5 minutes)
3. Go to Render Dashboard → Your Blueprint → Find the preview deployment
4. Click **"View deployment"** to get the preview URL
5. Share the URL with your team for testing!

**Important**: All preview environments share the same staging Convex database, so data created in one preview will be visible in other previews. This is intentional - they all act as staging environments.

---

## Step 6: Update Convex Auth Configuration

After deployment, you need to update your Convex auth configuration to allow requests from your Render URLs.

1. **For Production**:
   - Go to your production Convex deployment dashboard
   - Update `convex/auth.config.js` to include your Clerk domain
   - Make sure the Clerk domain matches your Clerk application

2. **For Staging (used by all Preview Environments)**:
   - Go to your staging Convex deployment dashboard
   - Update `convex/auth.config.js` to include your Clerk domain
   - Make sure the Clerk domain matches your Clerk application
   - **Note**: All preview environments will use this staging Convex deployment

The `auth.config.js` should look like:
```javascript
export default {
  providers: [
    {
      domain: "https://your-clerk-domain.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

---

## Step 7: Configure Custom Domains (Optional)

### Production Domain:

1. In Render dashboard, go to your production service
2. Go to **Settings** → **Custom Domains**
3. Add your custom domain (e.g., `app.yourdomain.com`)
4. Follow Render's instructions to configure DNS

### Preview Environment Domains:

- Preview environments automatically get their own URLs (like `noted-production-pr-123.onrender.com`)
- Custom domains are not typically needed for preview environments
- Each preview URL is unique and automatically generated

---

## Step 8: Verify Deployment

After deployment completes:

1. **Check Production**:
   - Visit your production URL
   - Test sign up / sign in
   - Create a document
   - Upload an image
   - Verify everything works

2. **Check Preview Environments**:
   - Open a Pull Request on GitHub
   - Wait for Render to create the preview environment (usually 3-5 minutes)
   - Go to Render Dashboard → Your Blueprint → Find the preview deployment
   - Click **"View deployment"** to get the preview URL
   - Test the preview URL - it should work exactly like production!
   - Each PR gets its own unique preview URL
   - **Note**: All previews share the same staging Convex database, so data is shared across previews

---

## Environment Variables Summary

Here's a checklist of all environment variables you need:

### Production Service (Render):
- [ ] `NEXT_PUBLIC_CONVEX_URL` - Production Convex deployment URL
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- [ ] `EDGE_STORE_ACCESS_KEY` - EdgeStore access key
- [ ] `EDGE_STORE_SECRET_KEY` - EdgeStore secret key

### Preview Environments (All PR Previews - Render):
- [ ] `NEXT_PUBLIC_CONVEX_URL` - **Staging Convex deployment URL** (all previews share this)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (can be same as production)
- [ ] `EDGE_STORE_ACCESS_KEY` - EdgeStore access key (can be same as production)
- [ ] `EDGE_STORE_SECRET_KEY` - EdgeStore secret key (can be same as production)

**Important**: Configure these at the Blueprint level (Environment Groups) so all preview environments inherit them. All preview environments will connect to the same staging Convex database.

### Local Development (.env.local):

**Recommended: Use staging services for local development**

Your `.env.local` should use **staging services** to match your preview environments:

```env
# Use STAGING Convex URL (matches preview environments)
NEXT_PUBLIC_CONVEX_URL=https://your-staging-project.convex.cloud

# Can use same Clerk and EdgeStore as staging/production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
EDGE_STORE_ACCESS_KEY=...
EDGE_STORE_SECRET_KEY=...
```

**Why use staging for local development?**
- ✅ Matches your preview environments (easier to test)
- ✅ Safer - won't accidentally affect production data
- ✅ Can test with real staging data
- ✅ Same environment as your PR previews

**You don't need separate sections** - just use staging values in your `.env.local`. Production values are only set in Render dashboard, not in your local file.

### Testing Production Locally (Optional):

If you need to test against production services from your local machine:

1. **Create `.env.production.local`** file with production values:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-production-project.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   EDGE_STORE_ACCESS_KEY=...
   EDGE_STORE_SECRET_KEY=...
   ```

2. **Install dotenv-cli**:
   ```bash
   npm install --save-dev dotenv-cli
   ```

3. **Run with production env vars**:
   ```bash
   npm run dev:prod
   ```

   ⚠️ **Warning**: Be careful when testing against production! You'll be using real production data.

---

## Troubleshooting

### Build Fails

**Error**: "Build command failed"
- **Solution**: Check that all dependencies are in `package.json`. Run `npm install` locally to verify.

**Error**: "Module not found"
- **Solution**: Make sure all imports are correct. Check for case-sensitive file names.

### Runtime Errors

**Error**: "Convex connection failed"
- **Solution**: 
  - Verify `NEXT_PUBLIC_CONVEX_URL` is set correctly
  - Check that Convex deployment is active
  - Verify `convex/auth.config.js` has correct Clerk domain

**Error**: "Clerk authentication failed"
- **Solution**:
  - Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct
  - Check that JWT Template named `convex` exists in Clerk
  - Verify Clerk domain in `convex/auth.config.js` matches your Clerk app

**Error**: "EdgeStore upload failed"
- **Solution**:
  - Verify `EDGE_STORE_ACCESS_KEY` and `EDGE_STORE_SECRET_KEY` are set
  - Check EdgeStore dashboard to ensure keys are active

### Environment Variables Not Loading

- **Solution**: 
  - Make sure variables are set in Render dashboard (not just in `.env.local`)
  - Restart the service after adding new variables
  - Variables starting with `NEXT_PUBLIC_` are exposed to the browser

---

## Best Practices

1. **Separate Environments**: Keep preview/staging and production completely separate
   - **Production Convex**: Used only by production service
   - **Staging Convex**: Used by all preview environments (all PR previews share this)
   - **Clerk**: Can use same application for both, or separate (optional)
   - **EdgeStore**: Can use same store for both, or separate (optional)

2. **Branch Strategy**:
   - `main` branch → Production (auto-deploy enabled - deploys when code is merged to main)
   - Any Pull Request → Preview Environment (automatically created, acts as staging)
   - **No separate staging service needed** - Preview Environments serve as staging

3. **Environment Variables**:
   - Never commit `.env.local` to Git
   - Always set variables in Render dashboard
   - Use production Convex for production service
   - Use staging Convex for all preview environments (configure at Blueprint level)

4. **Monitoring**:
   - Set up Render's built-in monitoring
   - Check logs regularly for errors
   - Set up alerts for failed deployments

---

## Next Steps

After successful deployment:

1. ✅ Test preview environments by opening a Pull Request
2. ✅ Verify all preview environments connect to staging Convex
3. ✅ Set up monitoring and alerts
4. ✅ Configure custom domain for production
5. ✅ Document your deployment process for your team

---

## Need Help?

- [Render Documentation](https://render.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [EdgeStore Documentation](https://edgestore.dev/docs)

---

**Happy Deploying! 🚀**

