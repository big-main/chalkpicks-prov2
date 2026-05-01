# ChalkPicks Pro — Complete Integration Guide

> **Combining:** Railway Deployment + PayPal Integration + Superpowers Development Practices + AI Agent Guidelines

This guide integrates the ChalkPicks Pro platform deployment with professional development practices from the Superpowers framework and best practices for AI-assisted development.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Deployment to Railway](#deployment-to-railway)
4. [Development Workflow](#development-workflow)
5. [AI Agent Guidelines](#ai-agent-guidelines)
6. [Troubleshooting](#troubleshooting)
7. [Scaling & Maintenance](#scaling--maintenance)

---

## Project Overview

**ChalkPicks Pro** is an AI-powered sports betting analytics platform featuring:

- **AI Picks Engine**: LLM-powered recommendations with confidence/edge scoring
- **Real-Time Stats**: Live games, player data, injury reports across NFL, NBA, MLB, NHL, Soccer
- **Advanced Backtesting**: Historical performance analysis with ROI tracking
- **User Feedback System**: 1-5 star ratings with sentiment analysis
- **PayPal Subscriptions**: Daily ($9.99), Monthly ($29.99), Yearly ($199.99)
- **Leaderboard**: Community rankings with period filtering
- **Automated Picks**: Daily generation at 5-minute intervals
- **Email Alerts**: Notifications for picks, subscriptions, performance
- **SEO Optimized**: Meta tags, sitemap, robots.txt, structured data

**Tech Stack:**
- Frontend: React 19 + Tailwind 4 + TypeScript
- Backend: Express 4 + tRPC 11 + MySQL
- Payments: PayPal (Sandbox → Live)
- Hosting: Railway (free $5/month credit)
- Domain: chalkpicks.ml (free via Freenom)

---

## Architecture

### Database Schema (13 Tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts, auth, roles |
| `picks` | AI-generated sports picks |
| `playerStats` | Real-time player performance data |
| `liveGames` | Current game scores and status |
| `userBets` | User bet tracking and history |
| `subscriptions` | PayPal subscription management |
| `leaderboard` | User rankings and performance |
| `backtests` | Historical backtest results |
| `pickFeedback` | User ratings and sentiment |
| `notifications` | Email and in-app alerts |
| `scheduledPicks` | Daily pick generation log |
| `sportsMeta` | Sports league metadata |
| `oddsMovement` | Historical odds tracking |

### API Routes (50+ tRPC Procedures)

**Public Procedures:**
- `picks.list` — Get today's picks with filters
- `picks.byId` — Get pick details with AI analysis
- `stats.liveGames` — Get live games by sport
- `stats.topPlayers` — Get top players with stats
- `stats.injuryReports` — Get injury reports by sport
- `leaderboard.list` — Get community rankings
- `subscription.plans` — Get subscription tier details

**Protected Procedures (Authenticated Users):**
- `picks.rate` — Submit pick feedback/rating
- `bets.add` — Track a user bet
- `bets.list` — Get user bet history
- `bets.summary` — Get performance stats
- `backtest.run` — Run backtesting analysis
- `subscription.createCheckout` — Create PayPal checkout
- `subscription.status` — Get user subscription status

**Admin Procedures:**
- `picks.generate` — Manually generate picks
- `notifications.send` — Send email alerts
- `feedback.analytics` — Get feedback analytics

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  ChalkPicks Pro  │  │   MySQL 8        │             │
│  │  (Node.js)       │  │   Database       │             │
│  │                  │  │                  │             │
│  │ • Express 4      │  │ • 13 tables      │             │
│  │ • tRPC 11        │  │ • Auto-backup    │             │
│  │ • React 19 SSR   │  │ • 1GB storage    │             │
│  │ • Scheduler      │  │                  │             │
│  │ • PayPal webhook │  │                  │             │
│  └──────────────────┘  └──────────────────┘             │
│           │                      │                       │
│           └──────────┬───────────┘                       │
│                      │                                   │
│            ┌─────────▼──────────┐                       │
│            │   SSL Certificate  │                       │
│            │  (Auto-provisioned)│                       │
│            └────────────────────┘                       │
│                      │                                   │
│            ┌─────────▼──────────┐                       │
│            │  chalkpicks.ml     │                       │
│            │  (Free .ml domain) │                       │
│            └────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐   ┌─────▼─────┐  ┌──────▼──────┐
   │  PayPal │   │   Manus   │  │  SendGrid   │
   │ Webhooks│   │    LLM    │  │   Email     │
   │         │   │    APIs   │  │             │
   └─────────┘   └───────────┘  └─────────────┘
```

---

## Deployment to Railway

### Prerequisites Checklist

- [ ] Railway account (https://railway.app)
- [ ] GitHub account with chalkpicks-prov2 repository
- [ ] PayPal Developer account (https://developer.paypal.com)
- [ ] Manus API keys (from your Manus account)
- [ ] chalkpicks.ml domain registered (free via Freenom)

### Step-by-Step Deployment

#### 1. Create Railway Project from GitHub

```bash
# In Railway dashboard:
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub account
4. Select "chalkpicks-prov2" repository
5. Railway auto-detects Node.js and begins build
```

#### 2. Add MySQL Database

```bash
# In Railway project:
1. Click "+ New Service"
2. Select "Database" → "MySQL"
3. Railway provisions MySQL 8 automatically
4. DATABASE_URL is auto-injected into environment
```

#### 3. Configure Environment Variables

In Railway project settings, add these variables:

**Authentication & Session:**
```
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
```

**Manus API Keys:**
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<your server-side Manus key>
VITE_FRONTEND_FORGE_API_KEY=<your frontend Manus key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

**PayPal Credentials (Sandbox):**
```
PAYPAL_CLIENT_ID=<from PayPal Developer Dashboard>
PAYPAL_CLIENT_SECRET=<from PayPal Developer Dashboard>
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=<set after Step 6>
```

**App Configuration:**
```
VITE_APP_ID=chalkpicks-pro
VITE_APP_TITLE=ChalkPicks Pro
VITE_APP_LOGO=https://chalkpicks.ml/logo.png
NODE_ENV=production
OWNER_NAME=<your name>
OWNER_OPEN_ID=<your Manus Open ID>
```

#### 4. Trigger Deployment

```bash
# In Railway:
1. Go to "Deployments" tab
2. Click "Redeploy" on latest deployment
3. Watch build logs:
   - pnpm install
   - pnpm build
   - pnpm start
4. Deployment succeeds when logs show:
   "Server running on http://localhost:XXXX/"
   "[Scheduler] Daily picks scheduler started"
```

#### 5. Register Free Domain (chalkpicks.ml)

```bash
# Via Freenom:
1. Go to https://www.freenom.com
2. Search for "chalkpicks.ml"
3. Add to cart (free 12-month option)
4. Create Freenom account and complete order
5. You now own chalkpicks.ml for free
```

#### 6. Connect Domain to Railway

**Method A: CNAME Record (Fastest — 5–15 minutes)**

```bash
# In Railway:
1. Go to chalkpicks-pro service → "Settings" → "Domains"
2. Click "Custom Domain"
3. Enter: chalkpicks.ml
4. Railway shows CNAME target (e.g., chalkpicks-pro-production.up.railway.app)

# In Freenom:
1. Go to "Services" → "My Domains" → "Manage Domain"
2. Click "Manage Freenom DNS"
3. Add DNS records:
   - Type: CNAME
   - Name: @ (root domain)
   - Target: chalkpicks-pro-production.up.railway.app
   - TTL: 3600
4. Also add www subdomain:
   - Type: CNAME
   - Name: www
   - Target: chalkpicks-pro-production.up.railway.app
5. Save changes

# Railway auto-provisions SSL within 5–15 minutes
```

#### 7. Configure PayPal Webhooks

```bash
# In PayPal Developer Dashboard:
1. Go to "Apps & Credentials"
2. Click "Webhooks"
3. Click "Add Webhook"
4. Webhook URL: https://chalkpicks.ml/api/paypal/webhook
5. Select events:
   - BILLING.SUBSCRIPTION.CREATED
   - BILLING.SUBSCRIPTION.UPDATED
   - BILLING.SUBSCRIPTION.CANCELLED
   - PAYMENT.CAPTURE.COMPLETED
6. Copy Webhook ID

# In Railway:
1. Add environment variable:
   PAYPAL_WEBHOOK_ID=<paste webhook ID>
2. Redeploy to apply changes
```

#### 8. Test the Deployment

```bash
# Visit https://chalkpicks.ml and verify:
✓ Homepage loads with AI tagline
✓ Sign in redirects to Manus OAuth
✓ After login, navbar shows user name
✓ "Today's Picks" page loads AI picks
✓ "Live Stats" shows games and players
✓ "Backtesting" runs analysis
✓ "Leaderboard" displays rankings
✓ "Pricing" page shows PayPal checkout
✓ PayPal sandbox checkout completes with test card: 4111 1111 1111 1111
```

#### 9. Switch to PayPal Live (Production Payments)

When ready for real money:

```bash
# In PayPal Developer Dashboard:
1. Switch to "Live" tab
2. Create Live app (or use existing)
3. Copy Live Client ID and Secret

# In Railway:
1. Update environment variables:
   PAYPAL_CLIENT_ID=<live client ID>
   PAYPAL_CLIENT_SECRET=<live client secret>
   PAYPAL_MODE=live
2. Create new Live webhook
3. Update PAYPAL_WEBHOOK_ID
4. Redeploy

# Important: PayPal requires KYC verification before accepting live payments
# Complete at: https://www.paypal.com/businessprofile
```

---

## Development Workflow

### Local Development Setup

```bash
# Clone and install
git clone https://github.com/big-main/chalkpicks-prov2.git
cd chalkpicks-prov2
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your local values

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
pnpm start
```

### Adding New Features

Follow the **Superpowers TDD cycle**:

#### 1. RED Phase — Write Failing Test

```typescript
// server/features.test.ts
describe("new-feature", () => {
  it("should do something", async () => {
    const caller = appRouter.createCaller(mockContext);
    const result = await caller.feature.newAction();
    expect(result).toBeDefined();
  });
});
```

Run: `pnpm test` → Test fails ✗

#### 2. GREEN Phase — Implement Minimal Code

```typescript
// server/routers/feature.ts
export const featureRouter = router({
  newAction: publicProcedure.query(async () => {
    return { success: true };
  }),
});
```

Run: `pnpm test` → Test passes ✓

#### 3. REFACTOR Phase — Improve & Verify

- Add error handling
- Optimize queries
- Add edge case tests
- Re-run full test suite

#### 4. Deploy to Railway

```bash
git add .
git commit -m "feat: add new feature"
git push origin main

# Railway auto-deploys on push
# Monitor at: https://railway.app/project/...
```

### Code Review Checklist

Before opening a PR:

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] No console errors or warnings
- [ ] Database migrations applied
- [ ] Environment variables documented
- [ ] API procedures have proper error handling
- [ ] UI components are responsive
- [ ] SEO meta tags updated if needed
- [ ] Changelog updated

---

## AI Agent Guidelines

### If You Are an AI Agent Working on ChalkPicks Pro

**Your job is to protect your human partner from embarrassment.** Follow these rules strictly:

#### 1. Read the Entire Codebase First

Before making changes:
- [ ] Read the project README
- [ ] Read the deployment guide
- [ ] Read the database schema
- [ ] Read existing routers and components
- [ ] Understand the architecture

#### 2. Verify the Problem is Real

- [ ] Your human partner experienced a specific failure
- [ ] You reproduced the failure locally
- [ ] You understand the root cause
- [ ] The fix is minimal and targeted

#### 3. Follow the TDD Cycle

- [ ] Write a failing test first
- [ ] Implement the minimal fix
- [ ] Verify the test passes
- [ ] Refactor and optimize
- [ ] Run the full test suite

#### 4. Test Everything

```bash
# Before committing:
pnpm test              # All tests pass
npx tsc --noEmit       # No TypeScript errors
pnpm build             # Build succeeds
pnpm start             # Server starts without errors
```

#### 5. Document Your Changes

```markdown
## What Changed
- Brief description of the change

## Why
- Explanation of the problem and solution

## How to Test
- Step-by-step reproduction of the fix

## Risks
- Potential side effects or breaking changes
```

#### 6. Show Your Human Partner the Diff

Before pushing:
- [ ] Show the complete diff
- [ ] Explain each change
- [ ] Get explicit approval
- [ ] Never push without permission

#### 7. Monitor the Deployment

After pushing:
- [ ] Watch Railway build logs
- [ ] Verify deployment succeeds
- [ ] Test the live site
- [ ] Monitor error logs for 24 hours

#### 8. Red Flags — Stop and Ask

If you encounter any of these, STOP and ask your human partner:

- [ ] Tests are failing and you don't know why
- [ ] Build is failing with cryptic errors
- [ ] You're making changes to 5+ files
- [ ] You're modifying database schema
- [ ] You're changing authentication logic
- [ ] You're unsure if the change is correct

### Common Mistakes to Avoid

| Mistake | Why It's Bad | Solution |
|---------|-------------|----------|
| Skipping tests | Breaks in production | Write tests first (RED-GREEN-REFACTOR) |
| Modifying without reading code | Introduces bugs | Read existing code thoroughly |
| Large PRs | Hard to review | Keep changes small and focused |
| No error handling | Silent failures | Add try-catch and error messages |
| Hardcoded values | Breaks on deployment | Use environment variables |
| No database migrations | Schema mismatches | Use Drizzle migrations |
| Ignoring TypeScript errors | Runtime crashes | Fix all TS errors before committing |

---

## Troubleshooting

### Build Fails on Railway

**Symptom:** Deployment logs show build errors.

**Solutions:**
1. Check all environment variables are set
2. Verify MySQL service is linked
3. Look for TypeScript errors in build log
4. Ensure `pnpm` is available (Railway supports it natively)

### App Loads but Shows Blank Page

**Symptom:** URL loads but page is empty.

**Solutions:**
1. Open browser DevTools → Console tab
2. Check for JavaScript errors
3. Verify `VITE_FRONTEND_FORGE_API_KEY` is set
4. Verify `VITE_OAUTH_PORTAL_URL` is correct

### Database Connection Error

**Symptom:** Server logs show `[Database] Failed to connect`.

**Solutions:**
1. Confirm MySQL service is running in Railway
2. Check `DATABASE_URL` is auto-injected
3. Verify SSL is enabled for MySQL

### Domain Not Resolving

**Symptom:** `chalkpicks.ml` shows error or Freenom parking page.

**Solutions:**
1. Wait 24–48 hours for DNS propagation
2. Use https://dnschecker.org to verify CNAME records
3. Confirm CNAME target matches exactly
4. Check Railway has issued SSL certificate

### PayPal Webhooks Not Arriving

**Symptom:** Subscriptions complete but database doesn't update.

**Solutions:**
1. Verify webhook URL is `https://chalkpicks.ml/api/paypal/webhook`
2. Check PayPal Developer Dashboard → Webhooks for delivery logs
3. Verify `PAYPAL_WEBHOOK_ID` matches
4. Test webhook manually from PayPal's "Simulate" button

---

## Scaling & Maintenance

### Monitoring

**Railway Dashboard:**
- Logs tab: Real-time server output
- Metrics tab: CPU, memory, request volume
- Deployments tab: Build history and rollback
- Variables tab: Environment management

**Key Metrics to Watch:**
- Server response time (target: <200ms)
- Error rate (target: <0.1%)
- Database query time (target: <50ms)
- Daily active users

### Performance Optimization

| Optimization | Benefit | Implementation |
|--------------|---------|-----------------|
| Redis Cache | 10x faster picks loading | Add Redis service ($3/month) |
| Database Indexing | 5x faster queries | Add indexes on frequently-queried columns |
| CDN for Static Assets | 50x faster images | Use Cloudflare or AWS CloudFront |
| API Rate Limiting | Prevent abuse | Implement in Express middleware |
| Scheduled Cleanup | Prevent bloat | Remove old picks/stats monthly |

### Scaling Beyond Free Tier

**Current Capacity (Free $5/month):**
- ~500 hours compute/month
- 1GB RAM
- Shared CPU
- 1GB MySQL storage
- ~1,000 daily active users

**When to Upgrade:**

| Metric | Action |
|--------|--------|
| >1,000 DAU | Upgrade to Railway Hobby ($5/month) |
| >10,000 DAU | Upgrade to Railway Pro ($20/month) |
| >100,000 DAU | Add dedicated database ($7/month) |
| >1M DAU | Add Redis cache ($3/month) |

### Backup & Recovery

**Automatic Backups:**
- Railway auto-backs up MySQL daily
- Backups retained for 30 days
- Restore via Railway dashboard

**Manual Backup:**
```bash
# Export database
mysqldump -u user -p database > backup.sql

# Import backup
mysql -u user -p database < backup.sql
```

### Monitoring Checklist

- [ ] Check server logs daily
- [ ] Monitor error rate (target: <0.1%)
- [ ] Review PayPal webhook delivery logs weekly
- [ ] Check database size monthly
- [ ] Review user feedback for bugs
- [ ] Test PayPal payments monthly
- [ ] Verify SSL certificate is valid
- [ ] Monitor domain expiration (renew before 30 days)

---

## Support & Resources

| Resource | URL |
|----------|-----|
| Railway Docs | https://docs.railway.app |
| Railway Support | https://railway.app/support |
| PayPal Developer | https://developer.paypal.com/docs |
| Manus API | https://manus.im/docs |
| Freenom Support | https://www.freenom.com/en/support.html |
| DNS Checker | https://dnschecker.org |
| SSL Checker | https://www.sslshopper.com/ssl-checker.html |

---

## Summary

| Item | Status |
|------|--------|
| Platform | ChalkPicks Pro (AI Sports Betting) |
| Hosting | Railway ($0/month with free credit) |
| Database | MySQL 8 (Railway managed) |
| Domain | chalkpicks.ml (free via Freenom) |
| Payments | PayPal (sandbox → live) |
| SSL | Auto-provisioned by Railway |
| Tests | 37 passing (all features covered) |
| Deployment Time | 30–45 minutes |
| Monthly Cost | **$0** (within free credit) |

---

*ChalkPicks Pro — The Smartest Sports Betting Analytics Platform*

**Last Updated:** May 1, 2026
**Version:** 1.0.0
**Maintainer:** big-main
