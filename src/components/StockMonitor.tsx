"use client";

import { useMemo, useState } from "react";
import { Holding, Portfolio } from "@/types";

interface Props {
  holdings: Holding[];
  portfolios: Portfolio[];
  refreshing: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
}

type SortKey = "value" | "day" | "gainPct" | "ticker";

function getFields(h: Holding) {
  const price = h.current_price || 0;
  const value = price * h.shares;
  const gain = (price - h.avg_cost) * h.shares;
  const gainPct = h.avg_cost > 0 ? ((price - h.avg_cost) / h.avg_cost) * 100 : 0;
  const dayChange = h.change_percent || 0;
  const dayDollar = price > 0 ? (price / (1 + dayChange / 100) * h.shares * (dayChange / 100)) : 0;
  return { price, value, gain, gainPct, dayChange, dayDollar };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: n >= 100_000 || n <= -100_000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(n);

export default function StockMonitor({ holdings, portfolios, refreshing, lastUpdated, onRefresh }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const totalValue = useMemo(
    () => holdings.reduce((s, h) => s + (h.current_price || 0) * h.shares, 0),
    [holdings]
  );

  const totalDayChange = useMemo(
    () =>
      holdings.reduce((s, h) => {
        if (!h.current_price || !h.change_percent) return s;
        const prev = h.current_price / (1 + h.change_percent / 100);
        return s + (h.current_price - prev) * h.shares;
      }, 0),
    [holdings]
  );

  const totalDayPct = useMemo(() => {
    const prevTotal = totalValue - totalDayChange;
    return prevTotal > 0 ? (totalDayChange / prevTotal) * 100 : 0;
  }, [totalValue, totalDayChange]);

  const totalCost = useMemo(
    () => holdings.reduce((s, h) => s + h.avg_cost * h.shares, 0),
    [holdings]
  );
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const sorted = useMemo(() => {
    const arr = [...holdings];
    arr.sort((a, b) => {
      const af = getFields(a);
      const bf = getFields(b);
      switch (sortKey) {
        case "value": return bf.value - af.value;
        case "day": return bf.dayChange - af.dayChange;
        case "gainPct": return bf.gainPct - af.gainPct;
        case "ticker": return a.ticker.localeCompare(b.ticker);
      }
    });
    return arr;
  }, [holdings, sortKey]);

  const portfolioMap = useMemo(() => {
    const m = new Map<number, Portfolio>();
    for (const p of portfolios) m.set(p.id, p);
    return m;
  }, [portfolios]);

  if (holdings.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-lg">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Portfolio Value</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{fmt(totalValue)}</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-blue-600 disabled:text-gray-300 transition-colors"
            title="Refresh prices"
          >
            <svg className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <span className="text-xs text-gray-400">Today </span>
            <span className={`text-sm font-semibold ${totalDayChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {totalDayChange >= 0 ? "+" : ""}{fmt(totalDayChange)}
              <span className="ml-1 opacity-75">({totalDayPct >= 0 ? "+" : ""}{totalDayPct.toFixed(2)}%)</span>
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400">Total </span>
            <span className={`text-sm font-semibold ${totalGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {totalGain >= 0 ? "+" : ""}{fmtCompact(totalGain)}
              <span className="ml-1 opacity-75">({totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%)</span>
            </span>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-[11px] text-gray-300 mt-2">Updated {lastUpdated}</p>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-1.5 px-1">
        {([
          ["value", "Value"],
          ["day", "Day %"],
          ["gainPct", "Gain %"],
          ["ticker", "A–Z"],
        ] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              sortKey === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stock list */}
      <div className="space-y-2">
        {sorted.map((h) => {
          const { price, value, gain, gainPct, dayChange, dayDollar } = getFields(h);
          const portfolio = portfolioMap.get(h.portfolio_id);

          return (
            <div
              key={h.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                {/* Left: ticker + name */}
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{h.ticker}</span>
                    {h.asset_type === "crypto" && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        CRYPTO
                      </span>
                    )}
                    {portfolios.length > 1 && portfolio && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: portfolio.color }}
                      >
                        {portfolio.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{h.name}</p>
                </div>

                {/* Right: price + day change */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900">
                    {price > 0 ? fmt(price) : "—"}
                  </p>
                  {price > 0 && (
                    <p className={`text-xs font-medium ${dayChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {dayChange >= 0 ? "+" : ""}{dayChange.toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom row: value, shares, gain */}
              {price > 0 && (
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">Value</span>
                    <p className="text-gray-700 font-medium">{fmtCompact(value)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Shares</span>
                    <p className="text-gray-700">{h.shares}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-xs">Gain/Loss</span>
                    <p className={`font-medium ${gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {gain >= 0 ? "+" : ""}{fmtCompact(gain)}
                      <span className="text-xs opacity-75 ml-0.5">({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
