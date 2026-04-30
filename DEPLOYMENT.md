# ChalkPicks Pro — Deployment Guide

This guide covers deploying ChalkPicks Pro to Railway (recommended for full-stack apps with databases).

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with your code
- Stripe account with test keys

## Step 1: Create a Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select the `chalkpicks-pro` repository
5. Railway will automatically detect it's a Node.js project

## Step 2: Add a MySQL Database

1. In your Railway project, click "Add Service"
2. Select "MySQL"
3. Railway will provision a MySQL database automatically
4. The `DATABASE_URL` will be automatically set as an environment variable

## Step 3: Configure Environment Variables

In your Railway project settings, add these environment variables:

```
# Authentication
JWT_SECRET=your-jwt-secret-key-here
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Stripe
STRIPE_SECRET_KEY=sk_test_... (from Stripe Dashboard)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)

# App Configuration
VITE_APP_ID=your-app-id
VITE_APP_TITLE=ChalkPicks Pro
VITE_APP_LOGO=https://your-logo-url.png

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## Step 4: Deploy

1. Railway will automatically detect the build script from `package.json`
2. The deployment will:
   - Install dependencies with `pnpm`
   - Run `pnpm build` to compile TypeScript and Vite
   - Start the server with `pnpm start`

3. Once deployed, Railway will provide a public URL like `https://chalkpicks-pro.up.railway.app`

## Step 5: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add a new endpoint with URL: `https://your-railway-url.up.railway.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`
4. Copy the webhook signing secret and add it as `STRIPE_WEBHOOK_SECRET` in Railway

## Step 6: Set Up Custom Domain (Optional)

1. In Railway project settings, go to "Domains"
2. Click "Add Domain"
3. Enter your custom domain (e.g., `chalkpicks.pro`)
4. Update your domain registrar's DNS records to point to Railway
5. Railway will automatically provision SSL/TLS

## Step 7: Monitor & Logs

- View logs in Railway dashboard under "Logs"
- Monitor database performance in "MySQL" service
- Check for errors in "Deployments" tab

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check MySQL service is running
- Ensure SSL is enabled for production

### Build Failures
- Check build logs for TypeScript errors
- Verify all environment variables are set
- Ensure `pnpm` is installed

### Stripe Webhook Issues
- Verify webhook signing secret is correct
- Check webhook logs in Stripe Dashboard
- Ensure endpoint URL is accessible

### Performance Issues
- Scale up Railway resources if needed
- Enable caching for static assets
- Monitor database query performance

## Rollback

If you need to rollback to a previous version:
1. Go to "Deployments" in Railway
2. Click on a previous deployment
3. Click "Redeploy"

## Next Steps

1. Test all features in production
2. Monitor error logs and performance
3. Set up automated backups for MySQL
4. Configure email service for notifications (SendGrid, AWS SES, etc.)
5. Set up monitoring and alerting

## Support

For Railway support: https://railway.app/support
For ChalkPicks Pro issues: Check the GitHub repository
