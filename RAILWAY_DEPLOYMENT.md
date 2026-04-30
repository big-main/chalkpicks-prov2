# ChalkPicks Pro — Railway Deployment Guide

Deploy ChalkPicks Pro to Railway and connect your custom domain www.chalkpicks.xyz.

## Step 1: Create Railway Account & Project

1. Go to https://railway.app and sign up
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select the `chalkpicks-pro` repository
6. Railway will auto-detect it's a Node.js project

## Step 2: Add MySQL Database

1. In your Railway project, click "Add Service"
2. Select "MySQL"
3. Railway provisions the database automatically
4. `DATABASE_URL` is auto-set as an environment variable

## Step 3: Configure Environment Variables

In Railway project settings, add these variables:

```
# Database (auto-set by Railway)
DATABASE_URL=mysql://...

# Authentication
JWT_SECRET=your-random-secret-key-here-min-32-chars
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Manus APIs (get from your Manus account)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Stripe (from your Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
VITE_APP_ID=chalkpicks-pro
VITE_APP_TITLE=ChalkPicks Pro
VITE_APP_LOGO=https://your-logo-url.png

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-manus-open-id
```

## Step 4: Deploy

1. Railway auto-detects the build script from `package.json`
2. Build process:
   - Installs dependencies with `pnpm`
   - Runs `pnpm build` to compile TypeScript and Vite
   - Starts server with `pnpm start`
3. Once deployed, Railway provides a URL like: `https://chalkpicks-pro-production.up.railway.app`

## Step 5: Connect Custom Domain (www.chalkpicks.xyz)

### Option A: Using Railway's Domain Management (Recommended)

1. In Railway project, go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter: `www.chalkpicks.xyz`
4. Railway generates nameservers (NS records)
5. Update your domain registrar:
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Find DNS settings for `chalkpicks.xyz`
   - Replace nameservers with Railway's nameservers
   - Wait 24-48 hours for DNS propagation

### Option B: Using CNAME Record (Faster)

1. In Railway project, go to "Settings" → "Domains"
2. Click "Add Domain" → "Custom Domain"
3. Enter: `www.chalkpicks.xyz`
4. Railway shows a CNAME target like: `cname.railway.app`
5. Update your domain registrar:
   - Go to DNS settings for `chalkpicks.xyz`
   - Create CNAME record: `www` → `cname.railway.app`
   - SSL certificate auto-provisions (5-10 minutes)

## Step 6: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://www.chalkpicks.xyz/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `invoice.paid`
5. Copy webhook signing secret
6. Add to Railway as `STRIPE_WEBHOOK_SECRET`

## Step 7: Test the Deployment

1. Visit `https://www.chalkpicks.xyz`
2. Sign in with your Manus account
3. Test features:
   - View picks on "Today's Picks" page
   - Check "Live Stats" page
   - Try "Backtesting" engine
   - View "Leaderboard"
   - Test Stripe checkout with card: `4242 4242 4242 4242`

## Step 8: Monitor & Logs

- **Logs**: Railway project → "Logs" tab
- **Database**: Railway project → "MySQL" service
- **Deployments**: Railway project → "Deployments" tab
- **Metrics**: Railway project → "Metrics" tab

## Troubleshooting

### Build Fails
- Check build logs for TypeScript errors
- Verify all environment variables are set
- Ensure `pnpm` is available

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check MySQL service is running
- Ensure SSL is enabled

### Domain Not Working
- Wait 24-48 hours for DNS propagation
- Check DNS records in your registrar
- Verify domain is added in Railway settings

### Stripe Webhook Issues
- Verify webhook signing secret is correct
- Check Stripe Dashboard → Developers → Webhooks for delivery logs
- Ensure endpoint URL is accessible

## Rollback to Previous Version

1. Go to Railway project → "Deployments"
2. Find previous deployment
3. Click "Redeploy"

## Scaling & Performance

- **Free Tier**: $5 credit/month (sufficient for most projects)
- **Scale Up**: If needed, upgrade to paid plan
- **Database**: MySQL scales automatically
- **Caching**: Enable Redis for better performance

## Next Steps

1. ✅ Deployment complete
2. ✅ Domain configured
3. Monitor error logs daily
4. Set up automated backups
5. Configure email service (SendGrid, AWS SES)
6. Enable monitoring & alerting

## Support

- Railway Support: https://railway.app/support
- Stripe Support: https://support.stripe.com
- ChalkPicks Pro: Check GitHub repository

---

**Deployment Status**: Ready for production ✅
