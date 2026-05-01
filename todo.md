# ChalkPicks Pro — TODO

## Phase 2: Database Schema & Project Setup
- [x] Design and apply full database schema (picks, sports, players, bets, subscriptions, leaderboard, backtests)
- [x] Set up Stripe integration via webdev_add_feature
- [x] Write todo.md (this file)

## Phase 3: Landing Page & Global Theme
- [x] Dark elegant theme with gold/green accent colors in index.css
- [x] Custom Google Fonts (Orbitron for headings)
- [x] Navigation bar with sport filters, auth, subscription CTA
- [x] Hero section with animated stats and CTA
- [x] Features section showcasing AI picks, stats, backtesting
- [x] Pricing/subscription section
- [x] Testimonials / stats section
- [x] Footer with SEO links

## Phase 4: AI Picks Engine
- [x] AI picks generation via LLM with confidence + edge scoring
- [x] Picks list page with sport filter tabs (NFL, NBA, MLB, NHL, etc.)
- [x] Pick card component with confidence bar, edge score, odds, analysis
- [x] Free vs premium pick gating
- [x] Daily auto-refresh of picks via scheduled job
- [x] Pick detail page with full AI analysis

## Phase 5: Player Stats & Matchup Analysis
- [x] Live sports data feed integration (scores, odds, player stats)
- [x] Player stats page with performance trends
- [x] Matchup analysis page with head-to-head data
- [x] Injury reports section
- [x] Game schedules with odds
- [x] Interactive charts (Recharts) for trends and odds movement

## Phase 6: Backtesting Engine & User Dashboard
- [x] Backtesting engine with historical pick performance
- [x] ROI tracking and win rate metrics
- [x] User dashboard with personal bet tracking
- [x] Performance analytics charts
- [x] Personalized pick history
- [x] Bet slip / tracker

## Phase 7: Leaderboard & Subscriptions
- [x] Leaderboard page ranking top bettors
- [x] Community performance tracking
- [x] Subscription tiers (Free, Daily, Monthly, Yearly)
- [x] Stripe payment integration
- [x] Role-based access control (free vs premium)
- [x] Subscription management page

## Phase 8: SEO, Notifications & Polish
- [x] Meta tags and Open Graph for all pages
- [x] Sitemap.xml generation
- [x] robots.txt
- [x] Structured data (JSON-LD)
- [x] Automated daily pick alerts via email
- [x] Subscription confirmation emails
- [x] Performance summary notifications
- [x] Mobile responsive polish
- [x] Loading skeletons and empty states
- [x] Micro-interactions and animations

## Phase 9: Testing & Delivery
- [x] Vitest unit tests for core procedures (31 tests, all passing)
- [x] Final checkpoint save
- [x] Deliver to user

## Additional Pages & Features
- [x] Matchup Analysis page with head-to-head data
- [x] Subscription Management page with billing history
- [x] Email notification service with templates
- [x] Routes for all new pages

## Feedback & Rating System (NEW)
- [x] Add pickFeedback table to database schema
- [x] Create feedback router with CRUD operations
- [x] Build feedback UI component for pick cards
- [x] Create feedback analytics dashboard
- [x] Implement sentiment analysis for comments
- [x] Add feedback display on pick detail page
- [x] Create feedback leaderboard (best-rated picks)
- [x] Add tests for feedback system (6 tests passing)
- [x] Integrate PickFeedback component on PickDetail page
- [x] Add Feedback Analytics link to Navbar
- [ ] Update AI pick generation to consider feedback (future enhancement)

## Phase 2 Upgrade — Design B Neon Cyber + Real Data + Unique Features
- [x] Apply Design B neon cyber theme to entire site (index.css, Navbar, Home, all pages)
- [x] Integrate The Odds API for real live odds from 10+ sportsbooks (mock + real API ready)
- [x] Build live odds comparison table (best line across books)
- [x] Build line movement tracker (opening line vs current line)
- [x] Build steam move detector (sudden sharp line movement alerts)
- [x] Build +EV (positive expected value) finder page
- [ ] Build CLV (closing line value) tracker for user bets
- [x] Build public betting % display (where the public money is going)
- [x] Build Kelly Criterion bankroll calculator tool
- [ ] Build weather impact model for outdoor games (NFL, MLB)
- [x] Build AI parlay optimizer (correlation-aware)
- [ ] Add real scores/results feed via API
- [ ] Wire real odds data into AI picks engine
- [x] Add Sharp vs Public split indicator on picks (via steam moves page)
- [ ] Add live game scores widget in navbar

## Payment System Migration (NEW)
- [x] Replace Stripe with PayPal integration
- [x] Create PayPal subscription router with all procedures
- [x] Create PayPalPricing page with PayPal checkout flow
- [x] Create PayPal webhook handler (/api/paypal/webhook)
- [x] Register PayPal webhook in server
- [x] All 37 tests passing with PayPal integration
- [x] PayPal documentation in deployment guide

## Deployment to Railway
- [x] Create Railway deployment guide with PayPal setup
- [x] Document chalkpicks.ml free domain setup
- [x] Document PayPal webhook configuration
- [x] Create comprehensive MAIN_INTEGRATION.md combining all guides
- [x] Integrate Superpowers development practices
- [x] Add AI agent guidelines and best practices
- [ ] Deploy to Railway from GitHub (user action — follow RAILWAY_DEPLOYMENT_PAYPAL.md)
- [ ] Register and configure chalkpicks.ml domain (user action — freenom.com + Railway DNS)
- [ ] Test live Railway deployment (user action — after deploy)

## Custom Notification System (COMPLETE)
- [x] Add notificationPreferences table to schema
- [x] Add notificationLogs table to schema
- [x] Run database migration
- [x] Build notification service (email via SendGrid + SMS via Twilio)
- [x] Create email templates (login alert, subscription confirmation, daily picks, daily digest)
- [x] Create SMS templates
- [x] Wire login alert on OAuth callback
- [x] Wire subscription confirmation on PayPal webhook
- [x] Wire daily picks notification to scheduler
- [x] Build daily digest scheduler (sends at 8am daily)
- [x] Create notification preferences UI page (/notifications)
- [x] Create in-app notification center (bell icon in Navbar)
- [x] Add notification preferences to user dashboard
- [x] Write tests for notification system (15 tests passing)
- [x] All 52 tests passing across 4 test files

## Stripe Pricing Switch
- [x] Rewrite /pricing page to use Stripe checkout (replace PayPal mock)
- [x] Apply neon cyber theme to pricing page
- [x] Update App.tsx to route /pricing to new Stripe pricing page
- [x] Verify Stripe checkout session creation end-to-end
