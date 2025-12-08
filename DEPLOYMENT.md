# Deployment Guide: Render (Staging & Production)

This guide will walk you through deploying your Noted application to Render with **Staging** and **Production** environments.

> 💡 **Note**: By default, this guide uses Render's **Free tier** plan. Free tier services spin down after 15 minutes of inactivity and may take up to 1 minute to spin back up. For production apps, consider upgrading to the Starter plan ($7/month) for always-on availability. 

## 🎯 Deployment Strategy

**Your deployment setup:**
- ✅ **Production**: Auto-deploys from `main` branch
- ✅ **Staging**: Separate staging service that auto-deploys from `staging` branch

**How it works:**
- Merge to `main` → Automatically deploys to **Production**
- Push to `staging` → Automatically deploys to **Staging**
- Both services connect to different third-party services (Production uses Production Convex/Clerk, Staging uses Development Convex/Clerk)

---

## Prerequisites

Before you begin, make sure you have:

1. ✅ A GitHub account with your code pushed to a repository
2. ✅ A Render account ([sign up here](https://render.com))
3. ✅ Convex project with separate deployments for staging and production
   - **Production Deployment**: Used by production service
   - **Development Deployment**: Used by staging service
   - Both deployments can be in the same Convex project (recommended, similar to Clerk setup)
4. ✅ Clerk application set up with Development and Production instances (recommended)
5. ✅ EdgeStore account with access keys (can use same for both production and staging)

---

## Step 1: Prepare Your Convex Deployments

**Recommended: Use the Same Convex Project with Separate Deployments**

Just like Clerk, Convex allows you to have multiple deployments within the same project. This is the best approach:

- ✅ **Production Deployment**: Use for production (e.g., "robust-wolf-630")
- ✅ **Development Deployment**: Use for staging environment (e.g., "rugged-hawk-26")
- ✅ Same project, easier to manage
- ✅ Better isolation than using the same deployment
- ✅ Simpler than creating separate Convex projects

### Setup Steps:

1. **Go to [Convex Dashboard](https://dashboard.convex.dev)**
   - Select your project (e.g., "noted-main")
   - You'll see a dropdown in the top navigation to switch between deployments

2. **Create or Select Production Deployment**:
   - Switch to or create your **Production** deployment
   - Copy the **Deployment URL** (looks like `https://your-project.convex.cloud`)
   - Save this URL - you'll need it for production environment variables
   - Note the deployment name (e.g., "robust-wolf-630")

3. **Create or Select Development Deployment**:
   - Switch to or create your **Development** deployment (for staging)
   - Copy the **Deployment URL** for this deployment
   - Save this URL - you'll need it for staging environment variables
   - Note the deployment name (e.g., "rugged-hawk-26")

> 💡 **Tip**: Both deployments are in the same Convex project, making it easier to manage. Each deployment has its own database, so data is isolated between production and staging.

---

## Step 2: Set Up Clerk (Authentication)

**Recommended: Use Clerk's Production Instance Feature**

Clerk allows you to have both **Development** and **Production** instances within the same project. This is the best approach:

- ✅ **Development Instance**: Use for staging environment (uses `pk_test_...` keys)
- ✅ **Production Instance**: Use for production (uses `pk_live_...` keys)
- ✅ Same project, easier to manage
- ✅ Better isolation than using the same instance
- ✅ Simpler than creating separate Clerk applications

### Setup Steps:

1. **Go to [Clerk Dashboard](https://dashboard.clerk.com)**
   - Select your project
   - You'll see "Development" instance by default

2. **Create Production Instance**:
   - In the top navigation, click the dropdown next to "Development"
   - Click **"Create production instance"**
   - This creates a separate Production instance in the same project

3. **Configure Development Instance** (for staging):
   - Make sure you're on the **Development** instance
   - Go to **API Keys**
   - Copy the **Publishable Key** (starts with `pk_test_...`)
   - Copy the **Secret Key** (starts with `sk_test_...`)
   - **Important**: Make sure you have a JWT Template named exactly `convex` (lowercase) configured
     - Go to **JWT Templates** → Create new template (if it doesn't exist)
     - Name: `convex` (must be exactly "convex" in lowercase!)
     - Signing Algorithm: RS256
     - Save the template

4. **Configure Production Instance** (for production):
   - Switch to the **Production** instance (use the dropdown in top navigation)
   - Go to **API Keys**
   - Copy the **Publishable Key** (starts with `pk_live_...`)
   - Copy the **Secret Key** (starts with `sk_live_...`)
   - **Important**: Make sure you have a JWT Template named exactly `convex` (lowercase) configured
     - Go to **JWT Templates** → Create new template (if it doesn't exist)
     - Name: `convex` (must be exactly "convex" in lowercase!)
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
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-production-publishable-key>  # pk_live_... from Production instance
     CLERK_SECRET_KEY=<your-clerk-production-secret-key>  # sk_live_... from Production instance
     EDGE_STORE_ACCESS_KEY=<your-edgestore-access-key>
     EDGE_STORE_SECRET_KEY=<your-edgestore-secret-key>
     ```
   
   **For Staging Service** (`noted-staging`) - **Free Tier Alternative**:
   - Click on the staging service
   - Go to **Environment** tab
   - Add these environment variables:
     ```
     NEXT_PUBLIC_CONVEX_URL=<your-development-convex-url>  # Use Development deployment
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-development-publishable-key>  # pk_test_... from Development instance
     CLERK_SECRET_KEY=<your-clerk-development-secret-key>  # sk_test_... from Development instance
     EDGE_STORE_ACCESS_KEY=<your-edgestore-access-key>  # Can use same as production
     EDGE_STORE_SECRET_KEY=<your-edgestore-secret-key>  # Can use same as production
     ```
   
5. **Deploy**:
   - **Production**: Will automatically deploy when code is merged to `main` branch
   - **Staging**: Will automatically deploy when code is pushed to `staging` branch
   - Wait for the build to complete (usually 3-5 minutes)
   - Your apps will be live at the URLs provided by Render

---

## Step 5: Set Up Staging Service

### How Staging Service Works:

- **Separate Service**: A dedicated `noted-staging` service runs alongside production
- **Branch-Based**: Deploys automatically from `staging` branch
- **Isolated Environment**: Uses Development Convex deployment and Clerk Development instance
- **Always Available**: Staging is always running at a fixed URL for testing

### Setup Steps:

1. **Create a Staging Branch** (if you don't have one):
   ```bash
   git checkout -b staging
   git push -u origin staging
   ```

2. **The `render.yaml` file already includes the staging service**:
   ```yaml
   - type: web
     name: noted-staging
     branch: staging
   ```

3. **Configure Environment Variables** (already covered in Step 4):
   - Staging service uses Development Convex deployment
   - Staging service uses Clerk Development instance (`pk_test_...`)

4. **Workflow**:

   **Option A: Direct Push (Quick Testing)**
   ```bash
   # Work on your feature branch
   git checkout -b feature/my-feature
   # ... make your changes ...
   
   # Push directly to staging to test
   git checkout staging
   git merge feature/my-feature  # or cherry-pick specific commits
   git push origin staging
   # → Staging automatically deploys! Test at staging URL
   ```

   **Option B: PR Workflow (Recommended for Code Review)**
   ```bash
   # Work on your feature branch
   git checkout -b feature/my-feature
   # ... make your changes ...
   git push origin feature/my-feature
   
   # Create PR: feature/my-feature → staging
   # Review code, then merge PR
   # → Staging automatically deploys! Test at staging URL
   ```

   **Then, when ready for production:**
   ```bash
   # Merge staging to main
   git checkout main
   git merge staging
   git push origin main
   # → Production automatically deploys!
   ```

   **Summary:**
   - Push to `staging` branch → Staging automatically deploys (no PR needed!)
   - Merge `staging` to `main` → Production automatically deploys
   - Test features in staging before merging to production!

### Benefits:
- ✅ **Always Available**: Fixed staging URL for testing
- ✅ **Isolated**: Separate from production, uses staging services
- ✅ **Simple**: Just push to staging branch to deploy

---

## Step 6: Update Convex Auth Configuration

> ⚠️ **CRITICAL STEP**: After deployment, you **MUST** update your Convex auth configuration for each deployment. This is required for authentication to work properly. If you skip this step, you'll get authentication errors like "No auth provider found matching the given token".

### ⚠️ Deployment Checklist:

- [ ] Update `convex/auth.config.js` with Production Clerk domain
- [ ] **Deploy to Production Convex deployment** (`CONVEX_DEPLOYMENT=prod:xxx npx convex deploy`)
- [ ] Update `convex/auth.config.js` with Development Clerk domain (if different)
- [ ] **Deploy to Development Convex deployment** (for staging)
- [ ] Test authentication in production
- [ ] Test authentication in staging

**Remember**: Updating the file is NOT enough - you MUST deploy it to the Convex deployment!

---

After deployment, you need to update your Convex auth configuration to match the Clerk instance used by each deployment. **Each Convex deployment has its own `auth.config.js` file**, so you need to update them separately.

### For Production Convex Deployment:

1. **Go to [Convex Dashboard](https://dashboard.convex.dev)**
   - Select your project
   - **Switch to your Production deployment** (use the dropdown in top navigation)
   - This is the deployment used by your production service (e.g., `prod:robust-wolf-630`)

2. **Update `auth.config.js` for Production**:
   - Go to **Files** tab in the Convex dashboard
   - Find and open `convex/auth.config.js`
   - Update the `domain` field to match your **Clerk Production instance** Frontend API URL
   - To find your Production Clerk domain:
     - Go to [Clerk Dashboard](https://dashboard.clerk.com)
     - Switch to **Production instance** (top navigation dropdown)
     - Go to **API Keys**
     - Copy the **Frontend API URL** (this is your Clerk domain - could be `https://xxx.clerk.accounts.dev` or a custom domain like `https://clerk.yourdomain.com`)
   - Save the file

3. **⚠️ DEPLOY THE CHANGES (REQUIRED)**:
   - **IMPORTANT**: Updating the file in the dashboard or locally is NOT enough - you MUST deploy it to the Production Convex deployment!
   - **Option A: Deploy from local repo** (Recommended):
     - Make sure `convex/auth.config.js` in your repo has the Production Clerk domain
     - Run: `CONVEX_DEPLOYMENT=prod:your-deployment-name npx convex deploy`
     - Example: `CONVEX_DEPLOYMENT=prod:robust-wolf-630 npx convex deploy`
   - **Option B: Update in dashboard**:
     - After updating in the Convex dashboard, you still need to ensure it's deployed
     - The dashboard should auto-save, but verify the deployment is active
   - **Verify deployment**: Check that your production app authentication works after deploying

### For Staging (Development Convex Deployment):

1. **Go to [Convex Dashboard](https://dashboard.convex.dev)**
   - Select your project
   - **Switch to your Development deployment** (use the dropdown in top navigation)
   - This is the deployment used by your staging service

2. **Update `auth.config.js` for Development**:
   - Go to **Files** tab in the Convex dashboard
   - Find and open `convex/auth.config.js`
   - Update the `domain` field to match your **Clerk Development instance** Frontend API URL
   - To find your Development Clerk domain:
     - Go to [Clerk Dashboard](https://dashboard.clerk.com)
     - Make sure you're on **Development instance** (top navigation dropdown)
     - Go to **API Keys**
     - Copy the **Frontend API URL** (this is your Clerk domain - usually `https://xxx.clerk.accounts.dev`)
   - Save the file

3. **⚠️ DEPLOY THE CHANGES (REQUIRED)**:
   - **IMPORTANT**: You MUST deploy the updated `auth.config.js` to the Development Convex deployment
   - **Option A: Deploy from local repo** (Recommended):
     - Make sure `convex/auth.config.js` in your repo has the Development Clerk domain
     - Run: `npx convex dev` (this deploys to Development deployment) or `CONVEX_DEPLOYMENT=dev:your-deployment-name npx convex deploy`
   - **Option B: Update in dashboard**:
     - After updating in the Convex dashboard, verify the deployment is active
   - **Verify deployment**: Check that your staging app authentication works after deploying

### Example `auth.config.js` format:

```javascript
export default {
  providers: [
    {
      domain: "https://your-clerk-domain.clerk.accounts.dev",  // Or custom domain like https://clerk.yourdomain.com
      applicationID: "convex",  // Must be exactly "convex" (lowercase)
    },
  ],
};
```

### Important Notes:

- ✅ **Production Convex deployment** → Must use **Production Clerk domain**
- ✅ **Development Convex deployment** → Must use **Development Clerk domain**
- ✅ Each deployment has its own `auth.config.js` file - update them separately
- ✅ The `applicationID` must always be `"convex"` (lowercase) - this matches your Clerk JWT Template name
- ⚠️ **CRITICAL**: After updating `auth.config.js`, you **MUST deploy it** to the Convex deployment. Simply updating the file is not enough!
- ⚠️ **If you get authentication errors**, check that:
  1. The Clerk domain in `auth.config.js` matches the Clerk instance you're using
  2. You have deployed the updated `auth.config.js` to the correct Convex deployment
  3. The deployment was successful (check Convex dashboard or deployment logs)

---

## Step 7: Configure Custom Domains (Optional)

### Production Domain:

1. In Render dashboard, go to your production service
2. Go to **Settings** → **Custom Domains**
3. Add your custom domain (e.g., `app.yourdomain.com`)
4. Follow Render's instructions to configure DNS

### Staging Domain:

- Staging service gets its own URL (like `noted-staging.onrender.com`)
- You can optionally add a custom domain for staging if needed

---

## Step 8: Verify Deployment

After deployment completes:

1. **Check Production**:
   - Visit your production URL
   - Test sign up / sign in
   - Create a document
   - Upload an image
   - Verify everything works

2. **Check Staging**:
   - Visit your staging URL (from Render dashboard)
   - Test sign up / sign in (uses Clerk Development instance)
   - Create a document (uses Development Convex deployment)
   - Upload an image
   - Verify everything works
   - **Note**: Staging uses Development Convex deployment and Clerk Development instance, so data is separate from production

---

## Environment Variables Summary

Here's a checklist of all environment variables you need:

### Production Service (Render):
- [ ] `NEXT_PUBLIC_CONVEX_URL` - Production Convex deployment URL
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk Production instance publishable key (`pk_live_...`)
- [ ] `CLERK_SECRET_KEY` - Clerk Production instance secret key (`sk_live_...`)
- [ ] `EDGE_STORE_ACCESS_KEY` - EdgeStore access key
- [ ] `EDGE_STORE_SECRET_KEY` - EdgeStore secret key

### Staging Service (Free Tier Alternative - Render):
- [ ] `NEXT_PUBLIC_CONVEX_URL` - **Development Convex deployment URL** (same project, different deployment)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk Development instance publishable key (`pk_test_...`)
- [ ] `CLERK_SECRET_KEY` - Clerk Development instance secret key (`sk_test_...`)
- [ ] `EDGE_STORE_ACCESS_KEY` - EdgeStore access key (can be same as production)
- [ ] `EDGE_STORE_SECRET_KEY` - EdgeStore secret key (can be same as production)

**Important**: Configure these at the service level in Render dashboard for the staging service.

### Local Development (.env.local):

**Recommended: Use staging services for local development**

Your `.env.local` should use **staging services** to match your staging environment:

```env
# Use Development Convex deployment URL (matches staging - same project, different deployment)
NEXT_PUBLIC_CONVEX_URL=https://your-development-deployment.convex.cloud

# Use Clerk Development instance (matches staging)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # From Development instance
CLERK_SECRET_KEY=sk_test_...  # From Development instance
EDGE_STORE_ACCESS_KEY=...
EDGE_STORE_SECRET_KEY=...
```

**Why use staging for local development?**
- ✅ Matches your staging environment (easier to test)
- ✅ Safer - won't accidentally affect production data
- ✅ Can test with real staging data
- ✅ Same environment as your staging service

**You don't need separate sections** - just use staging values in your `.env.local`. Production values are only set in Render dashboard, not in your local file.

### Testing Production Locally (Optional):

If you need to test against production services from your local machine:

1. **Create `.env.production.local`** file with production values:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-production-project.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # From Production instance
   CLERK_SECRET_KEY=sk_live_...  # From Production instance
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

**Error**: "Clerk authentication failed" or "No auth provider found matching the given token"
- **Solution**:
  - ⚠️ **Most Common Issue**: The `convex/auth.config.js` in your Convex deployment doesn't match your Clerk instance **OR you haven't deployed the updated file**
  - **For Production**: 
    1. Make sure your Production Convex deployment's `auth.config.js` uses your **Production Clerk domain**
    2. **CRITICAL**: Deploy the updated file: `CONVEX_DEPLOYMENT=prod:your-deployment-name npx convex deploy`
  - **For Staging**: 
    1. Make sure your Development Convex deployment's `auth.config.js` uses your **Development Clerk domain**
    2. **CRITICAL**: Deploy the updated file to Development deployment
  - Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct
  - Check that JWT Template named `convex` exists in Clerk (both Development and Production instances)
  - **Remember**: Updating the file locally or in dashboard is NOT enough - you MUST deploy it!

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

1. **Separate Environments**: Keep staging and production completely separate
   - **Production Convex Deployment**: Used only by production service (same project, different deployment)
   - **Development Convex Deployment**: Used by staging service (same project, different deployment)
   - **Clerk**: Use Development instance (`pk_test_...`) for staging, Production instance (`pk_live_...`) for production (same project, different instances)
   - **EdgeStore**: Can use same store for both, or separate (optional)

2. **Branch Strategy**:
   - `main` branch → Production (auto-deploy enabled - deploys when code is merged to main)
   - `staging` branch → Staging (auto-deploy enabled - deploys when code is pushed to staging)
   - **Staging service provides a dedicated staging environment for testing**

3. **Environment Variables**:
   - Never commit `.env.local` to Git
   - Always set variables in Render dashboard
   - Use Production Convex deployment for production service (same project, different deployment)
   - Use Development Convex deployment for staging service (same project, different deployment)
   - Configure variables at the service level in Render dashboard

4. **Monitoring**:
   - Set up Render's built-in monitoring
   - Check logs regularly for errors
   - Set up alerts for failed deployments

---

## Next Steps

After successful deployment:

1. ✅ **Update Convex auth configuration** (Step 6) - **CRITICAL**: 
   - Update `convex/auth.config.js` with Production Clerk domain
   - **DEPLOY IT**: Run `CONVEX_DEPLOYMENT=prod:your-deployment-name npx convex deploy`
   - Do NOT skip the deployment step - updating the file is not enough!
2. ✅ Test staging by pushing to staging branch
3. ✅ Verify staging connects to Development Convex deployment
4. ✅ **Test production authentication** - verify sign in/sign up works (if it fails, you likely didn't deploy the auth config)
5. ✅ Set up monitoring and alerts
6. ✅ Configure custom domain for production (and staging if needed)
7. ✅ Document your deployment process for your team

---

## Need Help?

- [Render Documentation](https://render.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [EdgeStore Documentation](https://edgestore.dev/docs)

---

**Happy Deploying! 🚀**

