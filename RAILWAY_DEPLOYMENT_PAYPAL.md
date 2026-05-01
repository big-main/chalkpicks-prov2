# ChalkPicks Pro — Railway Deployment Guide (PayPal + Free Domain)

Deploy ChalkPicks Pro to Railway with PayPal payments and your free chalkpicks.ml domain.

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
JWT_SECRET=your-random-secret-key-here-min-32-chars-long-make-it-unique
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Manus APIs (get from your Manus account)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key-here
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key-here
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# PayPal (from your PayPal Developer Dashboard)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # Change to 'live' when ready for production

# App Configuration
VITE_APP_ID=chalkpicks-pro
VITE_APP_TITLE=ChalkPicks Pro
VITE_APP_LOGO=https://your-logo-url.png

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-manus-open-id

# Node Environment
NODE_ENV=production
```

### How to Get PayPal Credentials:

1. Go to https://developer.paypal.com
2. Sign in with your PayPal account (create if needed)
3. Go to "Apps & Credentials"
4. Select "Sandbox" mode (for testing)
5. Under "Sandbox", click "Create App"
6. Copy your **Client ID** and **Client Secret**
7. Add these to Railway environment variables

## Step 4: Deploy

1. Railway auto-detects the build script from `package.json`
2. Build process:
   - Installs dependencies with `pnpm`
   - Runs `pnpm build` to compile TypeScript and Vite
   - Starts server with `pnpm start`
3. Once deployed, Railway provides a URL like: `https://chalkpicks-pro-production.up.railway.app`

## Step 5: Set Up Free Domain (chalkpicks.ml)

### Option A: Using Dot.tk (Recommended for .ml domains)

1. Go to https://www.dot.tk/
2. Search for "chalkpicks" and select "chalkpicks.ml"
3. Click "Get it now!"
4. Fill in your details (use real information)
5. For "Nameservers", select "Use your own nameservers"
6. You'll need Railway's nameservers (see Step 6)

### Option B: Using Freenom (Alternative)

1. Go to https://www.freenom.com/
2. Search for "chalkpicks.ml"
3. Add to cart and checkout (free)
4. Set up nameservers after registration

## Step 6: Connect Domain to Railway

1. In Railway project, go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter: `chalkpicks.ml`
4. Railway generates nameservers:
   - NS1: `ns1.railway.app`
   - NS2: `ns2.railway.app`
   - NS3: `ns3.railway.app`
   - NS4: `ns4.railway.app`
5. Go back to Dot.tk/Freenom and update nameservers with Railway's nameservers
6. Wait 24-48 hours for DNS propagation

### Alternative: CNAME Record (Faster, if Dot.tk allows)

1. In Railway project, go to "Settings" → "Domains"
2. Click "Add Domain" → "Custom Domain"
3. Enter: `chalkpicks.ml`
4. Railway shows a CNAME target
5. In Dot.tk DNS settings, create CNAME record pointing to Railway's target
6. SSL certificate auto-provisions (5-10 minutes)

## Step 7: Configure PayPal Webhooks

1. Go to https://developer.paypal.com → "Apps & Credentials"
2. Click "Webhooks" (under Sandbox)
3. Click "Create Webhook"
4. Webhook URL: `https://chalkpicks.ml/api/paypal/webhook`
5. Select events:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `PAYMENT.CAPTURE.COMPLETED`
6. Copy webhook ID
7. Add to Railway as `PAYPAL_WEBHOOK_ID`

## Step 8: Test the Deployment

1. Visit `https://chalkpicks.ml`
2. Sign in with your Manus account
3. Test features:
   - View picks on "Today's Picks" page
   - Check "Live Stats" page
   - Try "Backtesting" engine
   - View "Leaderboard"
   - Test PayPal checkout (use sandbox test cards)

### PayPal Sandbox Test Cards:

- **Visa**: 4111 1111 1111 1111
- **Mastercard**: 5555 5555 5555 4444
- **AmEx**: 3782 822463 10005

Use any future expiration date and any 3-digit CVV.

## Step 9: Monitor & Logs

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
- Check DNS records in Dot.tk/Freenom
- Verify domain is added in Railway settings
- Use online DNS checker: https://dnschecker.org/

### PayPal Webhook Issues
- Verify webhook URL is accessible: `https://chalkpicks.ml/api/paypal/webhook`
- Check PayPal Developer Dashboard → Webhooks for delivery logs
- Ensure PayPal credentials are correct in environment variables

### SSL Certificate Not Provisioning
- Wait 5-10 minutes for auto-provisioning
- Check Railway logs for certificate errors
- Verify domain DNS is pointing to Railway

## Switching to PayPal Production

When you're ready to go live with real payments:

1. In PayPal Developer Dashboard, switch from "Sandbox" to "Live"
2. Get your Live **Client ID** and **Client Secret**
3. Update Railway environment variables:
   ```
   PAYPAL_CLIENT_ID=your-live-client-id
   PAYPAL_CLIENT_SECRET=your-live-client-secret
   PAYPAL_MODE=live
   ```
4. Create new Live webhook in PayPal
5. Update `PAYPAL_WEBHOOK_ID` in Railway
6. Test with real payments

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
7. Switch to PayPal production when ready

## Support

- Railway Support: https://railway.app/support
- PayPal Support: https://developer.paypal.com/support/
- Dot.tk Support: https://www.dot.tk/en/support
- ChalkPicks Pro: Check GitHub repository

---

**Deployment Status**: Ready for production ✅

**Estimated Time**: 30-45 minutes (including DNS propagation)

**Cost**: FREE (Railway $5 credit/month + free .ml domain)
