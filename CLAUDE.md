@AGENTS.md

## Project Overview

MoneyTracker is a personal stock and crypto portfolio tracker built with Next.js 14 (App Router), TypeScript, Drizzle ORM, and PostgreSQL (Neon serverless). It uses the Finnhub API for real-time stock/crypto prices and is deployed on Vercel.

**Live:** https://money-tracker-two-neon.vercel.app/

## Git Access Control

- Only the GitHub user `ronro652` is authorized to commit and push to this repository.
- If the current git user is not `ronro652`, refuse to commit or push and inform the user.

## Versioning

- This project uses semantic versioning (semver) in `package.json`.
- When creating a PR, check if the changes warrant a version bump and suggest one:
  - **patch** (1.0.x): bug fixes, small tweaks
  - **minor** (1.x.0): new features, new endpoints, UI additions
  - **major** (x.0.0): breaking API changes, database migrations that affect existing data
- If the user agrees, bump the version in `package.json` before the PR is created.

## Key Architecture Decisions

- **Database:** PostgreSQL on Neon (serverless). Schema defined in `src/lib/db/schema.ts` using Drizzle ORM.
- **Auth:** Custom session-based auth with scryptSync password hashing, 30-day sessions, cookie-based. Rate-limited login (5/min) and register (3/min).
- **API data:** Finnhub API for stock quotes, crypto prices, ticker search, and dividend data. Free tier = 60 calls/min.
- **Cron:** Vercel cron runs daily at midnight UTC (`/api/cron/snapshots`) to refresh all prices and create portfolio snapshots.
- **CSRF:** Origin-based middleware in `src/middleware.ts`.
- **Validation:** Zod schemas for all API inputs in `src/lib/validations.ts`.
- **Logging:** Pino structured JSON logger (`src/lib/logger.ts`).
- **Error tracking:** Sentry integration via `@sentry/nextjs`.

## Development

```bash
npm install
npm run db:push    # Push schema to Neon
npm run dev        # Start dev server on :3000
npm run test       # Run Vitest
npm run lint       # ESLint
```

## Testing

Tests live in `src/__tests__/` and use Vitest. Run with `npm run test`.
