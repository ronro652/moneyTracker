import {
  pgTable,
  serial,
  text,
  timestamp,
  doublePrecision,
  integer,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const assetTypeEnum = pgEnum("asset_type", ["stock", "crypto"]);
export const txnTypeEnum = pgEnum("txn_type", ["buy", "sell"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("idx_sessions_user").on(t.userId),
  }),
);

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("#10b981"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const holdings = pgTable(
  "holdings",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    name: text("name").notNull().default(""),
    shares: doublePrecision("shares").notNull(),
    avgCost: doublePrecision("avg_cost").notNull(),
    portfolioId: integer("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    assetType: assetTypeEnum("asset_type").notNull().default("stock"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    portfolioIdx: index("idx_holdings_portfolio").on(t.portfolioId),
  }),
);

export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    totalValue: doublePrecision("total_value").notNull(),
    totalCost: doublePrecision("total_cost").notNull(),
    portfolioId: integer("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
  },
  (t) => ({
    datePortfolioIdx: uniqueIndex("idx_snapshots_date_portfolio").on(t.date, t.portfolioId),
  }),
);

export const stockPrices = pgTable(
  "stock_prices",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull().unique(),
    price: doublePrecision("price").notNull(),
    changePercent: doublePrecision("change_percent").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const investmentTransactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    portfolioId: integer("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    name: text("name").notNull().default(""),
    assetType: assetTypeEnum("asset_type").notNull().default("stock"),
    type: txnTypeEnum("type").notNull(),
    shares: doublePrecision("shares").notNull(),
    pricePerShare: doublePrecision("price_per_share").notNull(),
    totalAmount: doublePrecision("total_amount").notNull(),
    realizedGain: doublePrecision("realized_gain"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    portfolioIdx: index("idx_transactions_portfolio").on(t.portfolioId),
  }),
);

export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  pair: text("pair").notNull().unique(),
  rate: doublePrecision("rate").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
