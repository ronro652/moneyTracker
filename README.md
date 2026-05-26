# MoneyTracker

Personal stock and crypto portfolio tracker. Create multiple portfolios, track buy/sell transactions, monitor performance with charts and metrics (CAGR, total return, daily change), and view values in both USD and ILS.

**Live:** https://money-tracker-two-neon.vercel.app/

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 3 |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM |
| Validation | Zod 4 |
| Stock Data | Finnhub API |
| Logging | Pino |
| Error Tracking | Sentry |
| Testing | Vitest |
| CI | GitHub Actions |
| Deployment | Vercel |

## Features

- Multi-portfolio management with color coding
- Real-time stock and crypto prices via Finnhub
- Buy/sell transaction tracking with realized gain calculation
- Daily portfolio snapshots for performance charting
- Dividend tracking (manual + API-sourced) with future projections
- USD to ILS exchange rate conversion
- Intraday stock monitor with line charts
- Summary cards: total value, gains, daily change, CAGR
- Portfolio allocation pie chart
- Customizable dashboard widget layout
- Session-based auth with rate-limited login/register
- CSRF protection via origin-based middleware
- Automated daily cron job for price refresh (Vercel)

## Local Development

### Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) PostgreSQL database (free tier works)
- [Finnhub](https://finnhub.io) API key (free)

### Setup

```bash
git clone https://github.com/ronro652/moneyTracker.git
cd moneyTracker
npm install
```

Create `.env.local`:

```env
DATABASE_URL="postgresql://user:password@your-neon-host/dbname?sslmode=require"
FINNHUB_API_KEY="your_finnhub_api_key"
CRON_SECRET="any_random_hex_string"
```

Push the database schema and start:

```bash
npm run db:push
npm run dev
```

Open http://localhost:3000 and register an account.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Entry point (auth gate)
│   ├── layout.tsx                  # Root layout with auth provider
│   └── api/
│       ├── auth/                   # Login, register, logout, session
│       ├── portfolios/             # Portfolio CRUD
│       ├── holdings/               # Stock/crypto position CRUD
│       ├── transactions/           # Buy/sell history
│       ├── dividends/              # Dividend history
│       ├── expected-dividends/     # Dividend projections
│       ├── portfolio/              # Snapshot data for charts
│       ├── cron/snapshots/         # Daily price refresh (Vercel cron)
│       ├── search/                 # Ticker search via Finnhub
│       ├── exchange-rate/          # USD → ILS conversion
│       ├── prices/                 # API quota status
│       └── health/                 # DB connectivity check
├── components/
│   ├── Dashboard.tsx               # Main dashboard container
│   ├── AuthPage.tsx                # Login/register form
│   ├── SummaryCards.tsx            # KPI cards
│   ├── PortfolioChart.tsx          # Performance line chart
│   ├── HoldingsTable.tsx           # Current holdings table
│   ├── AddStockForm.tsx            # Add stock/crypto form
│   ├── TransactionHistory.tsx      # Transaction log
│   ├── DividendHistory.tsx         # Dividend income log
│   ├── ExpectedDividends.tsx       # Upcoming dividends
│   ├── PortfolioAllocation.tsx     # Pie chart breakdown
│   ├── StockMonitor.tsx            # Intraday stock monitor
│   ├── PortfolioSidebar.tsx        # Portfolio selector
│   ├── DashboardSettings.tsx       # Widget layout config
│   └── Toast.tsx                   # Notification system
├── lib/
│   ├── db/schema.ts                # Drizzle table definitions
│   ├── db/index.ts                 # Database client
│   ├── finnhub.ts                  # Finnhub API wrapper
│   ├── snapshots.ts                # Price refresh & snapshot logic
│   ├── auth.ts                     # Session management
│   ├── validations.ts              # Zod input schemas
│   ├── require-auth.ts             # API auth middleware
│   ├── rate-limit.ts               # Rate limiter
│   └── logger.ts                   # Pino logger
├── types.ts                        # Shared TypeScript interfaces
└── middleware.ts                    # CSRF protection
scripts/
└── backup.sh                       # Database backup with rotation
docs/
└── PROJECT_GUIDE.md                # Detailed setup and scaling guide
```

## Documentation

See [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) for the full project guide including scaling considerations, future feature ideas, and brokerage integration options.
