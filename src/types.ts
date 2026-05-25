export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Portfolio {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
  user_id: number;
}

export type AssetType = "stock" | "crypto";

export interface Holding {
  id: number;
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  current_price: number | null;
  change_percent: number | null;
  asset_type: AssetType;
  created_at: string;
  portfolio_id: number;
}

export interface PortfolioSnapshot {
  date: string;
  total_value: number;
  total_cost: number;
  portfolio_id: number;
}

export type TransactionType = "buy" | "sell";

export interface Transaction {
  id: number;
  portfolio_id: number;
  ticker: string;
  name: string;
  asset_type: AssetType;
  type: TransactionType;
  shares: number;
  price_per_share: number;
  total_amount: number;
  realized_gain: number | null;
  created_at: string;
}

export type DividendSource = "manual" | "api";

export interface Dividend {
  id: number;
  portfolio_id: number;
  holding_id: number | null;
  ticker: string;
  amount: number;
  dividend_per_share: number;
  shares: number;
  ex_date: string;
  pay_date: string | null;
  source: DividendSource;
  created_at: string;
}

export interface PriceData {
  price: number;
  changePercent: number;
}

export interface ExpectedDividend {
  ticker: string;
  name: string;
  current_shares: number;
  last_dividend_per_share: number;
  estimated_amount: number;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual" | "irregular";
  next_expected_date: string;
  annual_estimate: number;
  days_until: number;
}

export type WidgetType = "summary" | "chart" | "profit-chart" | "holdings" | "add-stock" | "allocation" | "transactions" | "dividends" | "expected-dividends";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  label: string;
  visible: boolean;
  order: number;
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "summary", type: "summary", label: "Summary Cards", visible: true, order: 0 },
  { id: "add-stock", type: "add-stock", label: "Add Stock", visible: true, order: 1 },
  { id: "chart", type: "chart", label: "Performance Chart", visible: true, order: 2 },
  { id: "profit-chart", type: "profit-chart", label: "Profit / Loss Chart", visible: true, order: 3 },
  { id: "allocation", type: "allocation", label: "Portfolio Allocation", visible: true, order: 4 },
  { id: "holdings", type: "holdings", label: "Holdings Table", visible: true, order: 5 },
  { id: "transactions", type: "transactions", label: "Transaction History", visible: true, order: 6 },
  { id: "dividends", type: "dividends", label: "Dividend History", visible: true, order: 7 },
  { id: "expected-dividends", type: "expected-dividends", label: "Expected Dividends", visible: true, order: 8 },
];

export const PORTFOLIO_COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];
