import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "money-tracker.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initDb(db);
  }
  return db;
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#10b981',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      shares REAL NOT NULL,
      avg_cost REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_value REAL NOT NULL,
      total_cost REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      price REAL NOT NULL,
      change_percent REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_prices_ticker
      ON stock_prices(ticker);
  `);

  migrate(db);
}

function migrate(db: Database.Database) {
  if (!hasColumn(db, "portfolios", "user_id")) {
    db.exec("ALTER TABLE portfolios ADD COLUMN user_id INTEGER REFERENCES users(id)");
  }

  if (!hasColumn(db, "holdings", "portfolio_id")) {
    db.exec("ALTER TABLE holdings ADD COLUMN portfolio_id INTEGER NOT NULL DEFAULT 1 REFERENCES portfolios(id)");
  }

  if (!hasColumn(db, "portfolio_snapshots", "portfolio_id")) {
    db.exec("ALTER TABLE portfolio_snapshots ADD COLUMN portfolio_id INTEGER NOT NULL DEFAULT 1 REFERENCES portfolios(id)");

    const hasOldIndex = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='sqlite_autoindex_portfolio_snapshots_1'"
    ).get();

    if (hasOldIndex) {
      db.exec(`
        CREATE TABLE portfolio_snapshots_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          total_value REAL NOT NULL,
          total_cost REAL NOT NULL,
          portfolio_id INTEGER NOT NULL DEFAULT 1 REFERENCES portfolios(id)
        );
        INSERT INTO portfolio_snapshots_new (id, date, total_value, total_cost, portfolio_id)
          SELECT id, date, total_value, total_cost, portfolio_id FROM portfolio_snapshots;
        DROP TABLE portfolio_snapshots;
        ALTER TABLE portfolio_snapshots_new RENAME TO portfolio_snapshots;
      `);
    }
  }

  const compositeIdx = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_snapshots_date_portfolio'"
  ).get();
  if (!compositeIdx) {
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_date_portfolio ON portfolio_snapshots(date, portfolio_id)");
  }
}
