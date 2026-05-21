import Database from "better-sqlite3";
import path from "path";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

config({ path: ".env.local" });

const DB_PATH = path.join(process.cwd(), "money-tracker.db");

async function main() {
  console.log("Opening SQLite database...");
  const sqlite = new Database(DB_PATH, { readonly: true });

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // 1. Migrate users
  const users = sqlite.prepare("SELECT * FROM users").all() as {
    id: number; email: string; name: string; password_hash: string; created_at: string;
  }[];
  console.log(`Found ${users.length} user(s)`);

  const userIdMap = new Map<number, number>();

  for (const u of users) {
    const [inserted] = await db
      .insert(schema.users)
      .values({
        email: u.email,
        name: u.name,
        passwordHash: u.password_hash,
        createdAt: new Date(u.created_at),
      })
      .returning({ id: schema.users.id });
    userIdMap.set(u.id, inserted.id);
    console.log(`  User ${u.email}: old id ${u.id} → new id ${inserted.id}`);
  }

  // 2. Migrate portfolios
  const portfolios = sqlite.prepare("SELECT * FROM portfolios").all() as {
    id: number; name: string; description: string; color: string; user_id: number; created_at: string;
  }[];
  console.log(`Found ${portfolios.length} portfolio(s)`);

  const portfolioIdMap = new Map<number, number>();

  for (const p of portfolios) {
    const newUserId = userIdMap.get(p.user_id);
    if (!newUserId) {
      console.log(`  Skipping portfolio "${p.name}" — no matching user`);
      continue;
    }
    const [inserted] = await db
      .insert(schema.portfolios)
      .values({
        name: p.name,
        description: p.description || "",
        color: p.color || "#10b981",
        userId: newUserId,
        createdAt: new Date(p.created_at),
      })
      .returning({ id: schema.portfolios.id });
    portfolioIdMap.set(p.id, inserted.id);
    console.log(`  Portfolio "${p.name}": old id ${p.id} → new id ${inserted.id}`);
  }

  // 3. Migrate holdings
  const holdings = sqlite.prepare("SELECT * FROM holdings").all() as {
    id: number; ticker: string; name: string; shares: number; avg_cost: number;
    portfolio_id: number; asset_type: string; created_at: string;
  }[];
  console.log(`Found ${holdings.length} holding(s)`);

  for (const h of holdings) {
    const newPortfolioId = portfolioIdMap.get(h.portfolio_id);
    if (!newPortfolioId) {
      console.log(`  Skipping holding ${h.ticker} — no matching portfolio`);
      continue;
    }
    await db.insert(schema.holdings).values({
      ticker: h.ticker,
      name: h.name || h.ticker,
      shares: h.shares,
      avgCost: h.avg_cost,
      portfolioId: newPortfolioId,
      assetType: (h.asset_type === "crypto" ? "crypto" : "stock") as "stock" | "crypto",
      createdAt: new Date(h.created_at),
    });
    console.log(`  Holding ${h.ticker} (${h.shares} shares) → portfolio ${newPortfolioId}`);
  }

  // 4. Migrate transactions
  const txns = sqlite.prepare("SELECT * FROM transactions").all() as {
    id: number; portfolio_id: number; ticker: string; name: string; asset_type: string;
    type: string; shares: number; price_per_share: number; total_amount: number;
    realized_gain: number | null; created_at: string;
  }[];
  console.log(`Found ${txns.length} transaction(s)`);

  for (const t of txns) {
    const newPortfolioId = portfolioIdMap.get(t.portfolio_id);
    if (!newPortfolioId) continue;
    await db.insert(schema.investmentTransactions).values({
      portfolioId: newPortfolioId,
      ticker: t.ticker,
      name: t.name || t.ticker,
      assetType: (t.asset_type === "crypto" ? "crypto" : "stock") as "stock" | "crypto",
      type: (t.type === "sell" ? "sell" : "buy") as "buy" | "sell",
      shares: t.shares,
      pricePerShare: t.price_per_share,
      totalAmount: t.total_amount,
      realizedGain: t.realized_gain,
      createdAt: new Date(t.created_at),
    });
  }
  console.log(`  Migrated ${txns.length} transactions`);

  // 5. Migrate portfolio snapshots
  const snapshots = sqlite.prepare("SELECT * FROM portfolio_snapshots").all() as {
    id: number; date: string; total_value: number; total_cost: number; portfolio_id: number;
  }[];
  console.log(`Found ${snapshots.length} snapshot(s)`);

  for (const s of snapshots) {
    const newPortfolioId = portfolioIdMap.get(s.portfolio_id);
    if (!newPortfolioId) continue;
    await db
      .insert(schema.portfolioSnapshots)
      .values({
        date: s.date,
        totalValue: s.total_value,
        totalCost: s.total_cost,
        portfolioId: newPortfolioId,
      })
      .onConflictDoNothing();
  }
  console.log(`  Migrated ${snapshots.length} snapshots`);

  // 6. Migrate stock prices cache
  const prices = sqlite.prepare("SELECT * FROM stock_prices").all() as {
    ticker: string; price: number; change_percent: number; updated_at: string;
  }[];
  console.log(`Found ${prices.length} cached price(s)`);

  for (const p of prices) {
    await db
      .insert(schema.stockPrices)
      .values({
        ticker: p.ticker,
        price: p.price,
        changePercent: p.change_percent,
        updatedAt: new Date(p.updated_at),
      })
      .onConflictDoNothing();
  }

  // 7. Migrate exchange rates
  try {
    const rates = sqlite.prepare("SELECT * FROM exchange_rates").all() as {
      pair: string; rate: number; updated_at: string;
    }[];
    for (const r of rates) {
      await db
        .insert(schema.exchangeRates)
        .values({ pair: r.pair, rate: r.rate, updatedAt: new Date(r.updated_at) })
        .onConflictDoNothing();
    }
    console.log(`Migrated ${rates.length} exchange rate(s)`);
  } catch {
    console.log("No exchange_rates table found, skipping");
  }

  sqlite.close();
  console.log("\nMigration complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
