# ChalkPicks Pro — Railway Deployment Guide

> **Stack**: React 19 + Express 4 + tRPC 11 + MySQL + PayPal Payments
> **Domain**: chalkpicks.ml (free via Freenom/Dot.tk)
> **Hosting**: Railway (free $5/month credit)
> **Estimated Time**: 30–45 minutes

---

## Prerequisites Checklist

Before you begin, make sure you have the following ready:

| Item | Where to Get It | Status |
|------|----------------|--------|
| Railway account | https://railway.app | Required |
| GitHub account with chalkpicks-pro repo | https://github.com | Required |
| PayPal Developer account | https://developer.paypal.com | Required |
| Manus API keys | Your Manus account settings | Required |
| chalkpicks.ml domain registered | https://www.freenom.com | Required |

---

## Step 1 — Create a Railway Account and Project

1. Open https://railway.app in your browser.
2. Click **"Start a New Project"** and sign up using your GitHub account (recommended — it simplifies repo access).
3. Once logged in, click **"New Project"** from the dashboard.
4. Select **"Deploy from GitHub repo"**.
5. If prompted, authorize Railway to access your GitHub account.
6. From the repository list, select **`chalkpicks-pro`**.
7. Railway will scan the repo, detect it as a Node.js project, and begin the initial deployment (it will fail at first — that is expected until environment variables are set in Step 3).

> **Tip**: If you do not see your repository, click "Configure GitHub App" and grant Railway access to the specific repo.

---

## Step 2 — Add a MySQL Database

ChalkPicks Pro requires a MySQL database. Railway provisions one for you at no extra cost within your free credit.

1. Inside your Railway project dashboard, click **"+ New Service"** (top-right).
2. Select **"Database"** → **"MySQL"**.
3. Railway automatically provisions a MySQL 8 instance and injects the `DATABASE_URL` environment variable into your project.
4. To verify: click the MySQL service → **"Variables"** tab. You should see `DATABASE_URL` listed.

> **Important**: Do **not** manually copy or set `DATABASE_URL`. Railway links it automatically between services.

---

## Step 3 — Configure Environment Variables

In your Railway project, click the **chalkpicks-pro** service → **"Variables"** tab → **"New Variable"** and add each of the following:

### 3a. Authentication & Session

```
JWT_SECRET=<generate a random 64-character string>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
```

**Generating a secure JWT_SECRET** — run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3b. Manus API Keys

These keys power the AI picks engine (LLM calls), image generation, and notifications.

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<your server-side Manus API key>
VITE_FRONTEND_FORGE_API_KEY=<your frontend Manus API key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

**Where to find these keys:**
1. Log in to your Manus account at https://manus.im
2. Go to **Settings** → **API Keys**
3. Copy the **Server Key** → paste as `BUILT_IN_FORGE_API_KEY`
4. Copy the **Frontend Key** → paste as `VITE_FRONTEND_FORGE_API_KEY`

### 3c. PayPal Credentials

```
PAYPAL_CLIENT_ID=<your PayPal sandbox client ID>
PAYPAL_CLIENT_SECRET=<your PayPal sandbox client secret>
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=<set this after Step 7>
```

**How to get PayPal sandbox credentials:**
1. Go to https://developer.paypal.com and log in with your PayPal account.
2. Click **"Apps & Credentials"** in the top navigation.
3. Make sure you are on the **Sandbox** tab.
4. Click **"Create App"**.
5. Enter app name: `ChalkPicks Pro`
6. Select **"Merchant"** as the app type.
7. Click **"Create App"**.
8. Copy the **Client ID** and **Secret** shown on the next screen.

### 3d. App Configuration

```
VITE_APP_ID=chalkpicks-pro
VITE_APP_TITLE=ChalkPicks Pro
VITE_APP_LOGO=https://chalkpicks.ml/logo.png
NODE_ENV=production
```

### 3e. Owner Information

```
OWNER_NAME=<your full name>
OWNER_OPEN_ID=<your Manus Open ID>
```

**Finding your Manus Open ID:**
1. Log in to Manus at https://manus.im
2. Go to **Settings** → **Profile**
3. Copy the **Open ID** field

### Complete Variable Reference Table

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Auto-set by Railway MySQL service | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Session signing secret (64+ chars) | `a1b2c3d4...` |
| `OAUTH_SERVER_URL` | Manus OAuth backend | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal | `https://auth.manus.im` |
| `BUILT_IN_FORGE_API_URL` | Manus API base URL | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Server-side Manus key | `sk-...` |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend Manus key | `pk-...` |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend API URL | `https://api.manus.im` |
| `PAYPAL_CLIENT_ID` | PayPal app client ID | `AaBbCc...` |
| `PAYPAL_CLIENT_SECRET` | PayPal app secret | `EeFfGg...` |
| `PAYPAL_MODE` | `sandbox` or `live` | `sandbox` |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID (Step 7) | `1AB23456CD789...` |
| `VITE_APP_ID` | App identifier | `chalkpicks-pro` |
| `VITE_APP_TITLE` | Browser tab title | `ChalkPicks Pro` |
| `VITE_APP_LOGO` | Logo URL | `https://...` |
| `OWNER_NAME` | Your name | `John Smith` |
| `OWNER_OPEN_ID` | Your Manus Open ID | `usr_abc123` |
| `NODE_ENV` | Runtime environment | `production` |

---

## Step 4 — Trigger the Deployment

1. After setting all environment variables, go to the **"Deployments"** tab.
2. Click **"Redeploy"** on the latest deployment (or push a new commit to trigger automatically).
3. Railway runs the following build pipeline:
   - `pnpm install` — installs all dependencies
   - `pnpm build` — compiles TypeScript (server) and Vite (client)
   - `pnpm start` — starts the Express server on the assigned `PORT`
4. Watch the build logs in real time. A successful deployment ends with:
   ```
   Server running on http://localhost:XXXX/
   [Scheduler] Daily picks scheduler started
   ```
5. Railway assigns a public URL like:
   ```
   https://chalkpicks-pro-production.up.railway.app
   ```
6. Visit this URL to confirm the app is running before configuring the custom domain.

> **If the build fails**: Check the logs for missing environment variables. The most common cause is a missing `DATABASE_URL` (ensure the MySQL service is linked) or a missing `JWT_SECRET`.

---

## Step 5 — Register the Free chalkpicks.ml Domain

### Option A: Freenom (Recommended)

1. Go to https://www.freenom.com
2. In the search box, type `chalkpicks` and click **"Check Availability"**.
3. Select **`.ml`** from the results and click **"Get it now!"**.
4. Click **"Checkout"** → set period to **12 Months @ FREE**.
5. Create a Freenom account (or log in) and complete the order.
6. You now own `chalkpicks.ml` for free for 12 months (renewable annually).

### Option B: Dot.tk

1. Go to https://www.dot.tk/
2. Search for `chalkpicks.ml`.
3. Follow the registration flow — select the free 12-month option.

> **Note**: Free domains (.ml, .tk, .ga, .cf) are managed by Freenom. They are legitimate and functional but must be renewed annually. If you later want a permanent domain, consider purchasing `.com` or `.xyz` through Namecheap or Google Domains.

---

## Step 6 — Connect chalkpicks.ml to Railway

### Method A: CNAME Record (Fastest — 5–15 minutes)

1. In Railway, open your project → **chalkpicks-pro service** → **"Settings"** → **"Domains"**.
2. Click **"Custom Domain"** and enter: `chalkpicks.ml`
3. Railway displays a **CNAME target** like:
   ```
   chalkpicks-pro-production.up.railway.app
   ```
4. In Freenom, go to **"Services"** → **"My Domains"** → click **"Manage Domain"** next to chalkpicks.ml.
5. Click **"Manage Freenom DNS"**.
6. Add a new DNS record:
   - **Type**: `CNAME`
   - **Name**: `@` (or leave blank for root domain)
   - **Target**: `chalkpicks-pro-production.up.railway.app`
   - **TTL**: `3600`
7. Also add a `www` record:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: `chalkpicks-pro-production.up.railway.app`
   - **TTL**: `3600`
8. Save changes.
9. Railway automatically provisions an SSL certificate within 5–15 minutes.
10. Visit https://chalkpicks.ml — you should see ChalkPicks Pro.

### Method B: Nameservers (24–48 hours propagation)

1. In Railway, go to **"Settings"** → **"Domains"** → note the Railway nameservers.
2. In Freenom, go to **"Services"** → **"My Domains"** → **"Manage Domain"**.
3. Click **"Management Tools"** → **"Nameservers"**.
4. Select **"Use custom nameservers"** and enter Railway's nameservers.
5. Save. DNS propagation takes 24–48 hours.

> **Verify DNS propagation**: Use https://dnschecker.org — enter `chalkpicks.ml` and check for CNAME/A records pointing to Railway.

---

## Step 7 — Configure PayPal Webhooks

Webhooks allow PayPal to notify ChalkPicks Pro when subscriptions are created, updated, or cancelled.

1. Go to https://developer.paypal.com → **"Apps & Credentials"** → click your **ChalkPicks Pro** app.
2. Scroll down to **"Webhooks"** and click **"Add Webhook"**.
3. Set the **Webhook URL** to:
   ```
   https://chalkpicks.ml/api/paypal/webhook
   ```
4. Under **"Event types"**, select the following:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
5. Click **"Save"**.
6. PayPal shows a **Webhook ID** (a long alphanumeric string).
7. Copy this ID and add it to Railway environment variables:
   ```
   PAYPAL_WEBHOOK_ID=<paste webhook ID here>
   ```
8. Redeploy the app to apply the new variable.

---

## Step 8 — Run Database Migrations

ChalkPicks Pro uses Drizzle ORM. On first deployment, the database tables need to be created.

The app automatically runs migrations on startup via the `pnpm start` script. If you need to run them manually:

1. In Railway, click your **chalkpicks-pro** service → **"Shell"** tab.
2. Run:
   ```bash
   pnpm drizzle-kit migrate
   ```
3. Verify tables were created by checking the Railway MySQL service → **"Data"** tab.

> **Tables created**: users, picks, playerStats, liveGames, userBets, subscriptions, leaderboard, backtests, pickFeedback, notifications, scheduledPicks, sportsMeta, oddsMovement

---

## Step 9 — Test the Live Deployment

Visit https://chalkpicks.ml and verify each section:

### Authentication
- [ ] Click **"Sign In"** — redirects to Manus OAuth login
- [ ] After login, your name appears in the navbar
- [ ] Logout works correctly

### AI Picks
- [ ] Navigate to **"Today's Picks"**
- [ ] Picks load with confidence scores and sport badges
- [ ] Click a pick to view the full AI analysis
- [ ] Rating/feedback form appears at the bottom of pick detail

### Live Stats
- [ ] Navigate to **"Live Stats"**
- [ ] Games and player data load correctly
- [ ] Sport filter tabs work (NFL, NBA, MLB, NHL, Soccer)

### Backtesting
- [ ] Navigate to **"Backtesting"**
- [ ] Configure parameters and click **"Run Backtest"**
- [ ] Results show win rate, ROI, and bankroll chart

### Leaderboard
- [ ] Navigate to **"Leaderboard"**
- [ ] Rankings load with period filter (daily/weekly/monthly/all-time)

### PayPal Checkout
- [ ] Navigate to **"Pricing"**
- [ ] Click **"Subscribe with PayPal"** on any plan
- [ ] PayPal checkout window opens in a new tab
- [ ] Use sandbox test credentials to complete a test payment

**PayPal Sandbox Test Buyer Account:**
- Email: `sb-buyer@personal.example.com` (use your sandbox buyer from PayPal Developer Dashboard)
- Password: set in PayPal sandbox accounts

**PayPal Sandbox Test Cards:**

| Card Type | Number | Expiry | CVV |
|-----------|--------|--------|-----|
| Visa | `4111 1111 1111 1111` | Any future date | Any 3 digits |
| Mastercard | `5555 5555 5555 4444` | Any future date | Any 3 digits |
| AmEx | `3782 822463 10005` | Any future date | Any 4 digits |

---

## Step 10 — Monitor Your Deployment

### Railway Dashboard

| Tab | What to Check |
|-----|---------------|
| **Logs** | Server errors, scheduler output, webhook events |
| **Metrics** | CPU, memory, request volume |
| **Deployments** | Build history, rollback options |
| **Variables** | Environment variable management |

### Key Log Messages to Watch For

```
✅ Server running on http://localhost:XXXX/
✅ [Scheduler] Daily picks scheduler started
✅ [Scheduler] Generating daily picks for YYYY-MM-DD...
✅ [PayPal Webhook] Event received: BILLING.SUBSCRIPTION.CREATED
❌ [Database] Failed to connect — check DATABASE_URL
❌ [PayPal] Invalid credentials — check PAYPAL_CLIENT_ID/SECRET
```

### Health Check Endpoint

ChalkPicks Pro exposes a health endpoint at:
```
GET https://chalkpicks.ml/api/trpc/auth.me
```
A `200` response confirms the server is running.

---

## Switching to PayPal Live (Production Payments)

When you are ready to accept real money:

1. In PayPal Developer Dashboard, switch to the **Live** tab.
2. Create a new Live app (or use existing).
3. Copy the Live **Client ID** and **Client Secret**.
4. In Railway, update these variables:
   ```
   PAYPAL_CLIENT_ID=<live client ID>
   PAYPAL_CLIENT_SECRET=<live client secret>
   PAYPAL_MODE=live
   ```
5. Create a new Live webhook pointing to `https://chalkpicks.ml/api/paypal/webhook`.
6. Update `PAYPAL_WEBHOOK_ID` with the new Live webhook ID.
7. Redeploy.

> **Important**: PayPal requires your account to be verified (business verification) before accepting live payments. Complete KYC at https://www.paypal.com/businessprofile.

---

## Troubleshooting

### Build Fails on Railway

**Symptom**: Deployment logs show build errors.

**Solutions**:
- Check that all required environment variables are set (especially `DATABASE_URL` and `JWT_SECRET`).
- Verify the MySQL service is linked to the app service in Railway.
- Look for TypeScript errors in the build log — these indicate a code issue.
- Ensure `pnpm` is available: Railway supports pnpm natively for Node.js projects.

### App Loads but Shows Blank Page

**Symptom**: The URL loads but the page is empty or shows a white screen.

**Solutions**:
- Open browser DevTools → Console tab for JavaScript errors.
- Check that `VITE_FRONTEND_FORGE_API_KEY` and `VITE_OAUTH_PORTAL_URL` are set correctly.
- Verify the Vite build completed successfully in Railway logs.

### Database Connection Error

**Symptom**: Server logs show `[Database] Failed to connect`.

**Solutions**:
- Confirm the MySQL service is running in Railway (green status indicator).
- Check that `DATABASE_URL` is auto-injected (do not set it manually).
- In Railway, click MySQL service → **"Connect"** tab → verify the connection string format.

### Domain Not Resolving

**Symptom**: `chalkpicks.ml` shows a browser error or Freenom parking page.

**Solutions**:
- Wait up to 48 hours for DNS propagation.
- Use https://dnschecker.org to verify CNAME records are propagating.
- Confirm the CNAME target in Freenom matches exactly what Railway shows.
- Check that Railway has issued an SSL certificate (Settings → Domains → green lock icon).

### PayPal Checkout Not Opening

**Symptom**: Clicking "Subscribe with PayPal" shows an error toast.

**Solutions**:
- Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are correct.
- Confirm `PAYPAL_MODE=sandbox` during testing (not `live`).
- Check Railway logs for PayPal API error messages.
- Ensure the PayPal app is not restricted to specific domains.

### PayPal Webhooks Not Arriving

**Symptom**: Subscriptions complete but the database does not update.

**Solutions**:
- Confirm the webhook URL is `https://chalkpicks.ml/api/paypal/webhook` (not HTTP).
- In PayPal Developer Dashboard → Webhooks → check delivery logs for errors.
- Verify `PAYPAL_WEBHOOK_ID` matches the webhook created in Step 7.
- Test the webhook manually from PayPal's "Simulate" button.

### SSL Certificate Not Provisioning

**Symptom**: Browser shows "Not Secure" or certificate error.

**Solutions**:
- Wait 10–15 minutes after adding the custom domain.
- Verify DNS is fully propagated before Railway can issue the certificate.
- In Railway → Settings → Domains → click "Refresh" next to the domain.

---

## Rollback to a Previous Version

If a deployment breaks the app:

1. Go to Railway project → **"Deployments"** tab.
2. Find the last working deployment.
3. Click the three-dot menu → **"Redeploy"**.
4. Railway restores that exact build within seconds.

---

## Scaling Beyond the Free Tier

The Railway free tier ($5 credit/month) supports:
- Up to ~500 hours of compute per month
- 1 GB RAM
- Shared CPU
- 1 GB MySQL storage

When your traffic grows:

| Upgrade | Cost | Benefit |
|---------|------|---------|
| Railway Hobby Plan | $5/month | Removes sleep, more resources |
| Railway Pro Plan | $20/month | Team features, priority support |
| Dedicated MySQL | $7/month | Dedicated database instance |
| Redis Cache | $3/month | Faster pick loading |

---

## Post-Deployment Checklist

- [ ] App is live at https://chalkpicks.ml
- [ ] SSL certificate is active (green padlock)
- [ ] Sign in with Manus OAuth works
- [ ] Today's Picks page loads AI-generated picks
- [ ] Live Stats page shows games and player data
- [ ] Backtesting engine runs and returns results
- [ ] Leaderboard displays community rankings
- [ ] PayPal sandbox checkout completes successfully
- [ ] PayPal webhook receives test events
- [ ] Daily picks scheduler is running (check logs)
- [ ] Email notifications are configured
- [ ] Error monitoring is set up (Railway logs)

---

## Support Resources

| Resource | URL |
|----------|-----|
| Railway Documentation | https://docs.railway.app |
| Railway Support | https://railway.app/support |
| PayPal Developer Docs | https://developer.paypal.com/docs |
| PayPal Support | https://developer.paypal.com/support |
| Freenom Support | https://www.freenom.com/en/support.html |
| DNS Checker | https://dnschecker.org |
| SSL Checker | https://www.sslshopper.com/ssl-checker.html |

---

## Summary

| Item | Status |
|------|--------|
| Platform | ChalkPicks Pro |
| Hosting | Railway (free $5/month credit) |
| Database | MySQL 8 (Railway managed) |
| Domain | chalkpicks.ml (free via Freenom) |
| SSL | Auto-provisioned by Railway |
| Payments | PayPal (sandbox → live) |
| Estimated Cost | **$0/month** (within free credit) |
| Estimated Setup Time | **30–45 minutes** |

---

*ChalkPicks Pro — The Smartest Sports Betting Analytics Platform*
