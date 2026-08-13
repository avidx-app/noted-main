# Noted

This project is a simplified clone of the popular productivity application, Notion. It's designed to replicate some of the core features of Notion, providing a platform where users can create, edit, and organize their notes in a flexible and intuitive interface.

It uses Convex as the backend, which is a real-time database that allows for instant data updates. The application also uses Edgestore, a distributed key-value store, to manage the images and files uploaded by the users.The user authentication is handled by Clerk, a secure and scalable user authentication API.

## Features

**Productivity and Organization**s

- Notion-style editor for seamless note-taking
- Infinite children documents for hierarchical organization
- Expandable and fully collapsible sidebar for easy navigation
- Customizable icons for each document, updating in real-time
- Trash can with soft delete and file recovery options

**User Experience**

- Light and Dark mode to suit preferences
- Full mobile responsiveness for productivity on the go
- Landing page for a welcoming user entry point
- Cover image for each document to add a personal touch

**Data Management**

- Real-time database for instant data updates
- File upload, deletion, and replacement options

**Security and Sharing**

- Authentication to secure notes
- Option to publish your note to the web for sharing

## Technologies

![NextJS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Shadcn-ui](https://img.shields.io/badge/shadcn/ui-000000.svg?style=for-the-badge&logo=shadcn/ui&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF.svg?style=for-the-badge&logo=Clerk&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-ee342f.svg?style=for-the-badge&logo=Convex&logoColor=white)
![Edgestore](https://img.shields.io/badge/Edgestore-a57fff.svg?style=for-the-badge&logo=Edgestore&logoColor=white)
![Blocknote](https://img.shields.io/badge/Blocknote-ff8c00.svg?style=for-the-badge&logo=Blocknote&logoColor=white)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd noted-main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the template and fill in your own values:

```bash
cp .env.example .env.local
```

[`.env.example`](.env.example) is the canonical list of every variable this app reads, with a note
on where each one comes from and which are server-side secrets. `.env.local` is gitignored.

**Create your own project on each service.** Every one has a free tier, and step 4 walks through
them. Do not paste keys from a screenshot, a walkthrough, or a teammate: a `CLERK_SECRET_KEY` can
mint sessions for that application, and an `EDGE_STORE_SECRET_KEY` can read and write its files.
Shared credentials also make analytics useless, because everyone's events land in one project.

Convex is the exception to the copying — `npx convex dev` writes `CONVEX_DEPLOYMENT` and
`NEXT_PUBLIC_CONVEX_URL` for you the first time you run it.

### 4. Get API keys

#### Convex (Backend Database)

1. Go to [https://convex.dev](https://convex.dev) and sign up/login
2. Create a new project
3. Run `npx convex dev` in your project directory - this will automatically:
   - Log you into Convex
   - Create/connect to your deployment
   - Add `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to your `.env.local` file

#### Clerk (Authentication)

1. Go to [https://clerk.com](https://clerk.com) and sign up/login
2. Create a new application
3. In the Clerk Dashboard, go to **API Keys**
4. Copy the following keys to your `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_...`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_...`)

5. **Configure JWT Template for Convex** (IMPORTANT):
   - In Clerk Dashboard, go to **JWT Templates**
   - Click **New template**
   - **Name**: `convex` (MUST be exactly "convex" in lowercase - this is critical!)
   - **Token Lifetime**: 60 minutes (or default)
   - **Signing Algorithm**: RS256
   - **Custom Signing Key**: OFF (disabled)
   - **Claims**: `{}` (empty object - Clerk adds default claims automatically)
   - Click **Save**

   > ⚠️ **Important**: The template name MUST be exactly `convex` (lowercase). If you name it "Convex" or anything else, authentication will fail with a 404 error.

#### EdgeStore (File Storage)

1. Go to [https://edgestore.dev](https://edgestore.dev) and sign up/login
2. Create a new store
3. In the store dashboard, go to **Settings** or **API Keys**
4. Copy the following keys to your `.env.local`:
   - `EDGE_STORE_ACCESS_KEY`
   - `EDGE_STORE_SECRET_KEY`

#### Amplitude (Analytics, Feature Flags, and Experiments)

Each cohort student should create their own Amplitude project so Week 3 and Week 4 analytics, flagging, and experiment work happens inside their own workspace.

1. Go to [https://amplitude.com](https://amplitude.com) and create a free Starter account
2. Create a project called `noted-<your-handle>`
3. Copy the project's API key into `.env.local` for analytics:
   - `NEXT_PUBLIC_AMPLITUDE_API_KEY`
4. Go to **Experiment** → **Deployments**
5. Create a deployment named `server` with type **Server-side**
6. Create a deployment named `client` with type **Client-side**
7. Copy both deployment keys into `.env.local`:
   - `AMPLITUDE_EXPERIMENT_SERVER_DEPLOYMENT_KEY`
   - `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_CLIENT_DEPLOYMENT_KEY`
8. Go to **Experiment** → **Feature Flags**
9. Create a feature flag with this exact key:
   - `hiring-vibe-pms-page`
10. Assign the flag to the `server` deployment for the current `/hiring-vibe-pms` route gate
11. Use `on` as the enabled variant and `off` as the disabled/default variant
12. Restart `npm run dev` after adding or changing the keys

The app silently drops events when `NEXT_PUBLIC_AMPLITUDE_API_KEY` is missing, so local setup still works before analytics is configured. The `/hiring-vibe-pms` page is served only when the Amplitude server-side flag evaluates to `on`. If `AMPLITUDE_EXPERIMENT_SERVER_DEPLOYMENT_KEY` is missing or Amplitude cannot evaluate the flag, the page stays hidden (the flag defaults to `off`).

Use the deployment keys this way:

- **Server-side deployment key**: private; use for route-level gates, server components, API routes, and anything that should not render when the flag is off.
- **Client-side deployment key**: public; use for in-browser UI variations after the app has loaded, such as CTA copy, modal variants, banner tests, or component-level experiments.

Set the Amplitude keys in both local development and deployed environments:

| Where                        | Why                                                   | Variables                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.local`                 | Runs analytics and feature flags on your local app    | `NEXT_PUBLIC_AMPLITUDE_API_KEY`, `AMPLITUDE_EXPERIMENT_SERVER_DEPLOYMENT_KEY`, `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_CLIENT_DEPLOYMENT_KEY` |
| Render service → Environment | Runs analytics and feature flags on your deployed URL | `NEXT_PUBLIC_AMPLITUDE_API_KEY`, `AMPLITUDE_EXPERIMENT_SERVER_DEPLOYMENT_KEY`, `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_CLIENT_DEPLOYMENT_KEY` |
| Terminal command only        | Seeds synthetic Amplitude events                      | `AMPLITUDE_API_KEY=<same project API key as NEXT_PUBLIC_AMPLITUDE_API_KEY>`                                                                                             |

Seed the sample Amplitude events after your project exists:

```bash
npm run seed:amplitude:plan
AMPLITUDE_API_KEY=<your-amplitude-api-key> npm run seed:amplitude
```

The seeder emits synthetic product events that line up with the Convex cohort sample. Use them for Week 3 data memos and Week 4 starter-project planning.

Feature flag and experiment conventions live in [`docs/feature-flags-and-experiments.md`](docs/feature-flags-and-experiments.md).

### 5. Configure Convex Authentication

The `convex/auth.config.js` file should already be configured with your Clerk domain. Verify it matches your Clerk Frontend API URL:

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

Replace `your-clerk-domain` with your actual Clerk domain (found in your Clerk Dashboard → API Keys → Frontend API URL).

### 6. Run the application

**Terminal 1 - Start Convex:**

```bash
npx convex dev
```

Wait until you see "Convex functions ready!" before proceeding.

**Terminal 2 - Start Next.js:**

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 7. Seed the cohort sample data

After Convex is connected and `npx convex dev` has run successfully, seed your own Convex deployment:

```bash
npm run seed:convex:plan
npm run seed:convex
npm run seed:convex:clean
```

The Convex seeder temporarily writes `convex/cohortSampleSeed.ts`, pushes it to your Convex deployment, runs the seed mutation, and prints a summary. The cleanup command removes the temporary seed module from your working tree.

After Amplitude is configured, seed matching analytics events:

```bash
npm run seed:amplitude:plan
AMPLITUDE_API_KEY=<your-amplitude-api-key> npm run seed:amplitude
```

Use your Amplitude project API key for `AMPLITUDE_API_KEY`. This is the same value you put in `NEXT_PUBLIC_AMPLITUDE_API_KEY`, but the seeder uses the non-public name because it runs from your terminal.

### Troubleshooting

- **404 Error when logging in**: Make sure your Clerk JWT template is named exactly `convex` (lowercase)
- **Convex not connecting**: Ensure `npx convex dev` is running and shows "Convex functions ready!"
- **Environment variables not loading**: Restart your Next.js dev server after adding/changing `.env.local`
- **Clerk authentication errors**: Verify your Clerk domain in `convex/auth.config.js` matches your Clerk Dashboard Frontend API URL
- **No Amplitude events**: Confirm `NEXT_PUBLIC_AMPLITUDE_API_KEY` is set, restart `npm run dev`, and use `AMPLITUDE_API_KEY=... npm run seed:amplitude` for synthetic sample data
- **`/hiring-vibe-pms` hidden unexpectedly**: Confirm Amplitude flag `hiring-vibe-pms-page` serves the `on` variant and `AMPLITUDE_EXPERIMENT_SERVER_DEPLOYMENT_KEY` is set — the page defaults to hidden whenever Amplitude can't evaluate the flag

**Testing Production Locally:**

If you need to test against production services from your local machine:

1. **Create `.env.production.local`** file with production values:

   ```env
   # Production Convex URL
   NEXT_PUBLIC_CONVEX_URL=https://your-production-project.convex.cloud

   # Production Clerk and EdgeStore (same as staging, or separate if you have them)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # or pk_test_... if same
   CLERK_SECRET_KEY=sk_live_...  # or sk_test_... if same
   EDGE_STORE_ACCESS_KEY=...
   EDGE_STORE_SECRET_KEY=...
   ```

2. **Install dotenv-cli** (if not already installed):

   ```bash
   npm install --save-dev dotenv-cli
   ```

3. **Run with production env vars**:

   ```bash
   npm run dev:prod
   ```

   This will load `.env.production.local` and run the dev server connected to production services.

   ⚠️ **Warning**: Be careful when testing against production! You'll be using real production data.

**Alternative: Quick Switch Method**

If you don't want to install dotenv-cli, you can temporarily:

1. Rename `.env.local` to `.env.local.backup`
2. Copy `.env.production.local` to `.env.local`
3. Run `npm run dev`
4. When done, restore `.env.local` from backup
