"use client";

import { Holding, Portfolio } from "@/types";

interface Props {
  holdings: Holding[];
  portfolios: Portfolio[];
  activePortfolioId: number | null;
}

export default function PortfolioAllocation({ holdings, portfolios, activePortfolioId }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  if (activePortfolioId === null) {
    const portfolioValues = portfolios.map((p) => {
      const pHoldings = holdings.filter((h) => h.portfolio_id === p.id);
      const value = pHoldings.reduce((sum, h) => sum + (h.current_price || 0) * h.shares, 0);
      return { portfolio: p, value, count: pHoldings.length };
    }).filter((pv) => pv.count > 0);

    const total = portfolioValues.reduce((sum, pv) => sum + pv.value, 0);

    if (portfolioValues.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h2>
          <p className="text-gray-400 text-center py-8">No holdings across portfolios yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h2>
        <div className="flex h-4 rounded-full overflow-hidden mb-4">
          {portfolioValues.map((pv) => (
            <div
              key={pv.portfolio.id}
              className="transition-all"
              style={{
                width: `${total > 0 ? (pv.value / total) * 100 : 0}%`,
                backgroundColor: pv.portfolio.color,
              }}
              title={`${pv.portfolio.name}: ${fmt(pv.value)}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {portfolioValues.map((pv) => (
            <div key={pv.portfolio.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pv.portfolio.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{pv.portfolio.name}</p>
                <p className="text-xs text-gray-500">{pv.count} holding{pv.count !== 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900 font-medium">{fmt(pv.value)}</p>
                <p className="text-xs text-gray-500">{total > 0 ? ((pv.value / total) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filtered = holdings.filter((h) => h.portfolio_id === activePortfolioId);
  const tickerValues = filtered.map((h) => ({
    ticker: h.ticker,
    name: h.name,
    value: (h.current_price || 0) * h.shares,
  })).filter((t) => t.value > 0).sort((a, b) => b.value - a.value);

  const total = tickerValues.reduce((sum, t) => sum + t.value, 0);
  const portfolio = portfolios.find((p) => p.id === activePortfolioId);

  const tickerColors = [
    "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#14b8a6",
  ];

  if (tickerValues.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Holdings Allocation</h2>
        <p className="text-gray-400 text-center py-8">No priced holdings in this portfolio.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {portfolio ? `${portfolio.name} — ` : ""}Holdings Allocation
      </h2>
      <div className="flex h-4 rounded-full overflow-hidden mb-4">
        {tickerValues.map((t, i) => (
          <div
            key={t.ticker}
            className="transition-all"
            style={{
              width: `${(t.value / total) * 100}%`,
              backgroundColor: tickerColors[i % tickerColors.length],
            }}
            title={`${t.ticker}: ${fmt(t.value)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tickerValues.map((t, i) => (
          <div key={t.ticker} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: tickerColors[i % tickerColors.length] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 font-medium">{t.ticker}</p>
              <p className="text-xs text-gray-500 truncate">{t.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-900 font-medium">{fmt(t.value)}</p>
              <p className="text-xs text-gray-500">{((t.value / total) * 100).toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
