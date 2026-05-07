# Money Tracker - Product Options & Costs

## Goal 1: Better Price Refresh (no more 25/day limit)

### Option A: Upgrade Alpha Vantage
Stay with the current provider, just pay for more.

| Plan | Price | Requests | Refresh Rate |
|------|-------|----------|--------------|
| Free | $0/mo | 25/day | ~1 per ticker every 6h |
| Starter | $50/mo | 150/min | Every few seconds if needed |
| Growth | $100/mo | 300/min | Real-time capable |
| Enterprise | $200+/mo | 1200/min | Full real-time |

**Effort:** Change one env variable (API key). Zero code changes.
**Verdict:** Simplest upgrade but expensive for what you get.

---

### Option B: Switch to Finnhub (recommended for cost)
Free tier is 60 calls/min (vs Alpha Vantage's 25/day). Covers stocks + crypto.

| Plan | Price | Requests | Notes |
|------|-------|----------|-------|
| Free | $0/mo | 60/min | Stocks + crypto, real-time US quotes |
| Starter | $49/mo | 300/min | More endpoints, priority |
| Professional | $199/mo | 600/min | Full access |

**Effort:** ~2-3 hours. Rewrite `alpha-vantage.ts` to use Finnhub's API format.
**Verdict:** Best free tier by far. 60/min means you could refresh every minute with 6 tickers and still be under 10% of the limit.

---

### Option C: Switch to Twelve Data
Good middle ground with generous free tier and websocket support for real-time.

| Plan | Price | Requests | Notes |
|------|-------|----------|-------|
| Free | $0/mo | 800/day, 8/min | Stocks + crypto + forex |
| Grow | $29/mo | 8000/day | + websocket streaming |
| Pro | $79/mo | 50,000/day | Full real-time |

**Effort:** ~2-3 hours. Similar rewrite as Finnhub.
**Verdict:** Best if you want real-time websocket streaming later (push updates instead of polling).

---

### Option D: Yahoo Finance (unofficial)
Free, no API key needed. Uses `yahoo-finance2` npm package.

| Plan | Price | Requests | Notes |
|------|-------|----------|-------|
| Free | $0/mo | Unofficial, ~2000/hr | No key needed, stocks + crypto |

**Effort:** ~2 hours. Install `yahoo-finance2`, rewrite fetch functions.
**Verdict:** Great for personal use, but Yahoo can block or change the API without notice. Not recommended if this becomes a product other people use.

---

### Option E: Multiple providers (hedge your bets)
Use Finnhub as primary, fall back to Yahoo Finance if rate-limited.

**Effort:** ~4 hours.
**Verdict:** Most resilient, best for a real product.

---

### Recommendation for Goal 1
**Start with Finnhub free tier.** It gives you 60 requests/min for free - enough to refresh all tickers every minute. If you outgrow it, add Twelve Data as a fallback or upgrade to Finnhub Starter ($49/mo).

---

## Goal 2: Always On, Accessible From All Devices

Right now the app runs on your laptop via `npm run dev`. When your laptop sleeps, the app dies. Here are options to keep it running 24/7 with access from your phone.

### Option A: Vercel (recommended for ease)
Deploy as a serverless Next.js app. You already have Next.js - Vercel is its native home.

| Plan | Price | Notes |
|------|-------|-------|
| Hobby | $0/mo | 100GB bandwidth, fine for personal use |
| Pro | $20/mo | More bandwidth, analytics |

**What changes:**
- SQLite won't work on Vercel (no persistent filesystem). You'd need to switch to a hosted database.
- Database options:
  - **Turso** (SQLite-compatible, hosted): Free tier = 9GB, 500M reads/mo. Minimal code changes since it's SQLite-compatible.
  - **Supabase** (Postgres): Free tier = 500MB, generous limits. Requires rewriting SQL slightly.
  - **PlanetScale** (MySQL): Free tier discontinued, starts at $39/mo.
- The background `setInterval` cron won't work in serverless. You'd use Vercel Cron Jobs (free on Pro, or use an external cron service).

**Effort:** ~1-2 days. Mostly database migration.
**Verdict:** Best developer experience, automatic HTTPS, custom domain, zero DevOps. The database switch is the main work.

---

### Option B: Railway
Full server hosting (not serverless), so SQLite keeps working as-is.

| Plan | Price | Notes |
|------|-------|-------|
| Hobby | $5/mo | 8GB RAM, 8 vCPU |
| Pro | $20/mo | More resources, team features |

**What changes:**
- Almost nothing. `npm run build && npm start` just works.
- SQLite file persists on the server's volume.
- Background cron keeps working as-is.

**Effort:** ~1 hour. Push to GitHub, connect Railway, done.
**Verdict:** Least code changes. SQLite just works. Good for a personal product.

---

### Option C: VPS (DigitalOcean / Hetzner)
Rent a small server, run everything yourself.

| Provider | Price | Specs |
|----------|-------|-------|
| Hetzner CX22 | ~$4/mo | 2 vCPU, 4GB RAM (best value) |
| DigitalOcean Basic | $6/mo | 1 vCPU, 1GB RAM |
| Linode Nanode | $5/mo | 1 vCPU, 1GB RAM |

**What changes:**
- Nothing in the code. SQLite, cron, everything works.
- You manage the server: updates, SSL (use Caddy or nginx + Let's Encrypt), process manager (PM2 or systemd).

**Effort:** ~2-4 hours initial setup, ongoing maintenance.
**Verdict:** Cheapest long-term, full control, but you're the sysadmin.

---

### Option D: Run on Your Home Network (Raspberry Pi / old laptop)
Keep it truly free - run 24/7 on hardware you own.

| Item | Cost | Notes |
|------|------|-------|
| Raspberry Pi 5 | ~$60 one-time | Low power (~5W), always on |
| Old laptop | $0 | You may already have one |
| Tailscale | $0 | Access from anywhere securely |
| Cloudflare Tunnel | $0 | Public HTTPS access without port forwarding |

**What changes:** Nothing in the code.
**Effort:** ~2-3 hours setup.
**Verdict:** Zero monthly cost. Works great for personal use. Not ideal if you want others to use it.

---

### Making It Work on Phones
Once it's hosted (any option above), it already works on phone browsers since the UI is responsive. To make it feel more native:

| Approach | Effort | Result |
|----------|--------|--------|
| PWA (Progressive Web App) | ~2 hours | Add to home screen, offline support, push notifications. You already have a `manifest.webmanifest`. |
| React Native / Expo wrapper | ~1-2 weeks | True native app, App Store listing |
| Capacitor (Ionic) | ~3-5 days | Wrap your existing web app in a native shell |

**Recommendation:** Start with PWA. You're 90% there already (you have the manifest). Just add a service worker for offline caching and you get "Add to Home Screen" on both iOS and Android.

---

### Recommendation for Goal 2
**Railway ($5/mo)** for the least friction - zero code changes, push and go. Or **Hetzner VPS ($4/mo)** if you want full control. Add **PWA** support (~2 hours) so it works great on phones.

---

## Goal 3: Read Data Directly From Investment Sites

This is the most complex goal. There are three approaches:

### Option A: Plaid (industry standard)
Plaid connects to banks and brokerages (including Meitav, Interactive Brokers, etc.) and pulls holdings, balances, and transactions automatically.

| Plan | Price | Notes |
|------|-------|-------|
| Free (Development) | $0/mo | 100 connected accounts, limited |
| Production | Pay-per-connection | ~$0.30-$3 per connection/month depending on volume |
| Growth | Custom pricing | Starts around $500/mo for small scale |

**What it gives you:**
- Automatic daily sync of holdings, balances, cost basis
- Transaction history
- Multi-institution support
- Users authenticate via Plaid Link (secure OAuth flow - you never see their credentials)

**Israeli broker support:** Plaid's coverage of Israeli institutions (Meitav, Blink, etc.) is limited. You'd need to check their institution list.

**Effort:** ~3-5 days integration.
**Verdict:** Gold standard for US/EU brokers. Israeli coverage may be a problem.

---

### Option B: Scraping with browser automation
Use Puppeteer or Playwright to log into investment sites and extract portfolio data.

| Tool | Cost | Notes |
|------|------|-------|
| Playwright (self-hosted) | $0 | Runs on your server |
| Browserbase | $0.10/hr | Cloud browser sessions |
| Apify | $49/mo | Managed scraping platform |

**What it gives you:**
- Works with ANY site, including Israeli brokers (Meitav, Blink, etc.)
- Full control over what data you extract
- Can handle 2FA if you store session cookies

**Risks:**
- Breaks when sites change their UI
- May violate terms of service
- Requires ongoing maintenance
- Sites may block automated access

**Effort:** ~1-2 weeks per broker site. Ongoing maintenance.
**Verdict:** Only realistic option for Israeli brokers. Fragile but powerful.

---

### Option C: Broker APIs (where available)
Some brokers offer official APIs:

| Broker | API Available? | Notes |
|--------|---------------|-------|
| Interactive Brokers | Yes (free) | Full API, well documented |
| Alpaca | Yes (free) | US stocks only |
| Coinbase | Yes (free) | Crypto only |
| Binance | Yes (free) | Crypto only |
| Meitav | No official API | Would need scraping |
| Blink (Sparkasse) | No official API | Would need scraping |

**Effort:** ~1-2 days per broker with an API.
**Verdict:** Best where available. Use this for Binance/crypto, scraping for Israeli brokers.

---

### Option D: Manual CSV/Excel import
Let users upload portfolio exports from their broker sites.

| Approach | Cost | Notes |
|----------|------|-------|
| CSV parser | $0 | Most brokers let you export to CSV |
| PDF parser | $0 | Some only give PDF statements |

**Effort:** ~2-3 days (CSV), ~1 week (PDF).
**Verdict:** Low-tech but reliable. Good stepping stone before full automation.

---

### Recommendation for Goal 3
**Phase 1:** Add Binance API integration (you already track crypto there) + CSV import for Meitav/Blink. ~3-4 days.
**Phase 2:** Add Playwright scraping for Meitav/Blink sites. ~1-2 weeks.
**Phase 3:** Consider Plaid if you expand to US/EU users.

---

## Cost Summary: Recommended Stack

| Component | Choice | Monthly Cost |
|-----------|--------|-------------|
| Price API | Finnhub free tier | $0 |
| Hosting | Railway or Hetzner VPS | $4-5 |
| Database | SQLite (keep as-is) | $0 |
| Domain + SSL | Cloudflare | $10/year for domain |
| Broker data | Binance API + CSV import | $0 |
| Phone access | PWA | $0 |
| **Total** | | **~$5/mo** |

### If you want to go premium later:

| Component | Choice | Monthly Cost |
|-----------|--------|-------------|
| Price API | Twelve Data Grow (real-time websockets) | $29 |
| Hosting | Railway Pro or Vercel Pro | $20 |
| Database | Turso or Supabase | $0 (free tier) |
| Broker data | Plaid + scraping | $50-100 |
| **Total** | | **~$100-150/mo** |
