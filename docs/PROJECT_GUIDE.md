# MoneyTracker - Project Guide

## What Is This?

MoneyTracker is a personal stock and crypto portfolio tracker. You can create multiple portfolios, add holdings (stocks or crypto), record buy/sell transactions, and see how your investments are performing over time — with charts, metrics like CAGR and total return, and daily change tracking. It also converts values to ILS (Israeli Shekel).

---

## Technologies Used

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework — handles both the UI and API routes |
| **Language** | TypeScript 5 | Type-safe JavaScript |
| **UI Library** | React 18 | Component-based frontend |
| **Styling** | Tailwind CSS 3 | Utility-first CSS — no separate CSS files needed |
| **Charts** | Recharts 3 | Line charts, pie charts for portfolio visualization |
| **Database** | PostgreSQL (Neon serverless) | Cloud-hosted Postgres that works well with serverless |
| **ORM** | Drizzle ORM | Type-safe database queries, migrations, and schema management |
| **Validation** | Zod 4 | Runtime validation for API inputs |
| **Stock Data** | Finnhub API | Real-time stock quotes, crypto prices, ticker search |
| **Deployment** | Vercel | Hosting, serverless functions, and cron jobs |
| **Logging** | Pino | Structured JSON logging (pretty-printed in dev) |
| **Date Utils** | date-fns | Date formatting and math |
| **CI** | GitHub Actions | Lint, type-check, and build on every PR |

---

## How to Access the App

The app is live at **https://money-tracker-two-neon.vercel.app/** — this URL is permanent and updates automatically with every production deploy. You only need the local setup below if you're developing.

If you want a custom domain (like `tracker.yourdomain.com`), you can add one in Vercel project settings — the `.vercel.app` URL keeps working alongside it.

## How to Run Locally (For Development)

### Prerequisites

- **Node.js 20+** installed
- A **Neon database** (free tier works) — sign up at neon.tech
- A **Finnhub API key** (free) — sign up at finnhub.io

### Steps

1. **Clone the repo** and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd moneyTracker
   npm install
   ```

2. **Set up environment variables** — create a `.env.local` file in the project root:
   ```env
   DATABASE_URL="postgresql://user:password@your-neon-host/dbname?sslmode=require"
   FINNHUB_API_KEY="your_finnhub_api_key"
   CRON_SECRET="any_random_hex_string"
   ```

3. **Push the database schema** (creates all tables):
   ```bash
   npm run db:push
   ```

4. **Start the dev server**:
   ```bash
   npm run dev
   ```

5. **Open the app** at [http://localhost:3000](http://localhost:3000)

6. **Register an account** — the app will show a login/register page on first visit.

### Useful Database Commands

| Command | What It Does |
|---------|--------------|
| `npm run db:push` | Push schema changes to the database (dev) |
| `npm run db:generate` | Generate SQL migration files |
| `npm run db:migrate` | Run pending migrations (production) |
| `npm run db:studio` | Open Drizzle Studio — a visual database browser |

---

## Project Structure (Key Files)

```
src/
├── app/
│   ├── page.tsx                    # Entry point — routes to auth or dashboard
│   ├── layout.tsx                  # Root layout with auth provider
│   ├── api/
│   │   ├── auth/                   # Login, register, logout, session check
│   │   ├── portfolios/             # Create/update/delete portfolios
│   │   ├── holdings/               # Add/edit/remove stock positions
│   │   ├── transactions/           # Buy/sell transaction history
│   │   ├── cron/snapshots/         # Daily automated price refresh (Vercel cron)
│   │   ├── dividends/              # Dividend history CRUD
│   │   ├── expected-dividends/     # Upcoming dividend projections
│   │   ├── health/                 # Health check endpoint (DB connectivity)
│   │   ├── search/                 # Ticker/company search via Finnhub
│   │   ├── prices/                 # API quota check
│   │   ├── portfolio/              # Portfolio snapshot data for charts
│   │   └── exchange-rate/          # USD to ILS conversion
├── components/
│   ├── Dashboard.tsx               # Main dashboard container
│   ├── AuthPage.tsx                # Login/register form
│   ├── SummaryCards.tsx            # KPI cards (total value, gains, CAGR)
│   ├── PortfolioChart.tsx          # Performance line chart
│   ├── HoldingsTable.tsx           # Current holdings table
│   ├── AddStockForm.tsx            # Add stock/crypto form
│   ├── TransactionHistory.tsx      # Buy/sell log
│   ├── DividendHistory.tsx         # Dividend income log
│   ├── ExpectedDividends.tsx       # Upcoming dividend projections
│   ├── PortfolioAllocation.tsx     # Pie chart breakdown
│   ├── PortfolioSidebar.tsx        # Portfolio selector sidebar
│   ├── StockMonitor.tsx            # Intraday stock monitor view
│   ├── DashboardSettings.tsx       # Widget visibility/order config
│   └── Toast.tsx                   # Toast notification system
├── lib/
│   ├── db/schema.ts               # Database table definitions (Drizzle)
│   ├── db/index.ts                 # Database client connection
│   ├── finnhub.ts                  # Finnhub API wrapper
│   ├── snapshots.ts                # Price refresh & snapshot logic
│   ├── auth.ts                     # Session management
│   ├── validations.ts              # Zod input schemas
│   ├── require-auth.ts            # API auth middleware
│   ├── rate-limit.ts              # In-memory rate limiter for auth endpoints
│   └── logger.ts                  # Pino structured logger
├── types.ts                        # Shared TypeScript interfaces
scripts/
├── backup.sh                      # Database backup with rotation (pg_dump)
```

---

## What You Need to Scale It for More Users

### 1. Real Authentication

The app currently uses a homemade session system with `crypto.scryptSync` password hashing. This works for personal use, but for real users you should switch to a proper auth provider:

- **NextAuth.js (Auth.js)** — easy to add Google/GitHub/email login
- **Clerk** — drop-in auth with user management UI
- **Supabase Auth** — if you also want to move the database to Supabase

What to change: Replace `src/lib/auth.ts` and the `api/auth/` routes. The `users` and `sessions` tables in the schema would be replaced by the auth provider's system.

### 2. Finnhub API Rate Limits

Finnhub's free tier gives you **60 calls per minute**. With multiple users refreshing portfolios, you'll hit this fast.

Options:
- **Upgrade Finnhub plan** — paid plans have higher limits
- **Switch to a bulk API** — Yahoo Finance (unofficial), Polygon.io, or Alpha Vantage can return multiple quotes in one call
- **Add a shared price cache** — instead of each user triggering their own API call, have one cron job that refreshes all active tickers and caches them in the `stock_prices` table. Users read from cache only. The cron job already exists (`/api/cron/snapshots`) — it just needs to cover all users' tickers, not just trigger per-portfolio.

### 3. Database Scaling

Neon's free tier has limits (compute hours, storage). For more users:
- **Stay on Neon** and upgrade to a paid plan — it auto-scales well
- **Add connection pooling** — Neon supports this natively, just use the pooled connection string
- **Add indexes** — the schema may need indexes on frequently queried columns (user_id, portfolio_id, date) as data grows

### 4. Performance

- **Add loading states** — the dashboard fetches everything on mount; add skeleton loaders
- **Server-side rendering** — move some data fetching to server components instead of client-side `fetch`
- **Pagination** — the holdings table and transaction history should paginate for large portfolios
- **Rate limiting** — auth endpoints are rate-limited (login: 5/min, register: 3/min per IP). Consider adding per-user limits on data-fetching routes as usage grows

### 5. Security Hardening

- Add input sanitization beyond Zod validation
- Use environment-based secrets rotation
- Add 2FA support if handling real financial data

### 6. Database Backups

- **Neon PITR**: Neon provides built-in point-in-time recovery on paid plans (up to 7 days). Check your Neon dashboard for restore options.
- **Manual backups**: Run `./scripts/backup.sh` to dump the database to a timestamped `.sql.gz` file in `/backups`. The script auto-cleans to keep only the last 10 backups.
- **Recommended cadence**: Run the backup script before deployments and weekly via cron (e.g. `crontab -e` → `0 2 * * 0 /path/to/scripts/backup.sh`)

---

## Ideas to Make It Better

### Read Directly from a Brokerage Account

This is the big one — instead of manually entering every trade, connect directly to your broker. Here's how:

#### Option A: Plaid (Recommended for US/International Brokers)
- **What**: Plaid is a financial API that connects to most major brokerages (Interactive Brokers, Schwab, Fidelity, TD Ameritrade, Robinhood, etc.)
- **How it works**: User links their brokerage through Plaid's secure flow. You get read-only access to holdings, transactions, and balances.
- **Cost**: Free for 100 connected accounts (development), then paid per connection.
- **What to build**:
  1. Sign up at plaid.com, get API keys
  2. Add `plaid-node` package
  3. Create a "Link Account" button that opens Plaid Link (their prebuilt connection UI)
  4. After linking, call Plaid's `/investments/holdings/get` and `/investments/transactions/get` endpoints
  5. Sync the data into your existing `holdings` and `investment_transactions` tables
  6. Set up a daily cron to re-sync positions

#### Option B: Interactive Brokers API (If You Use IBKR)
- **What**: IBKR has a Client Portal API and TWS API
- **How it works**: You run their gateway locally or use their web API to pull portfolio data
- **Limitation**: Only works for IBKR accounts, requires the gateway to be running
- **Better for**: Power users who already use IBKR and want real-time data

#### Option C: CSV Import (Simplest)
- **What**: Let users upload a CSV export from their broker
- **How it works**: Most brokers let you export transaction history as CSV. Build a parser for each broker's format.
- **What to build**:
  1. Add a file upload component
  2. Create parsers for common CSV formats (IBKR, Schwab, etc.)
  3. Map CSV rows to your `investment_transactions` schema
  4. Auto-create holdings from the imported transactions
- **Pros**: No API costs, works with any broker, no authentication complexity
- **Cons**: Manual process, not real-time

#### Option D: Snapi / Saltedge (For Israeli Brokers)
- If you use Israeli brokers (like IBI, Meitav, or similar), look into **Saltedge** or local fintech APIs that support Israeli financial institutions. Plaid's coverage for Israeli brokers is limited.

### Other Feature Ideas

| Feature | Difficulty | Impact |
|---------|-----------|--------|
| **Watchlist** — track stocks you're interested in but don't own | Easy | Medium |
| **Alerts** — notify when a stock hits a target price | Medium | High |
| **Multiple currencies** — support EUR, GBP, not just USD/ILS | Medium | Medium |
| **Benchmarking** — compare portfolio performance vs. S&P 500 | Medium | High — "am I beating the market?" |
| **Tax reporting** — calculate realized gains for tax season | Hard | Very High |
| **Dark mode** — toggle between light/dark themes | Easy | Nice to have |
| **Export to PDF/Excel** — download portfolio reports | Easy | Medium |
| **Mobile app** — React Native or PWA for phone access | Hard | High |
| **Shared portfolios** — let multiple users view a portfolio | Medium | Medium |
| **Goal tracking** — set financial goals and track progress | Easy | Medium |
| **News feed** — show news for stocks in your portfolio (Finnhub has a news API) | Easy | Medium |
| **AI insights** — use Claude API to analyze portfolio and suggest rebalancing | Medium | Cool factor |

---

## Quick Reference

| What | Where |
|------|-------|
| Live app | https://money-tracker-two-neon.vercel.app/ (permanent Vercel URL) |
| Database | Neon PostgreSQL (check Neon dashboard) |
| Stock prices | Finnhub API (60 calls/min free tier) |
| Cron job | Runs daily at midnight UTC — refreshes all prices and takes snapshots |
| Auth | Custom sessions — cookie-based, 30-day expiry |
| Health check | `GET /api/health` — returns DB connectivity status |
| CI pipeline | GitHub Actions — lint, type-check, build on every PR to main |
| Version | Semver in `package.json` — currently 1.1.0 |
