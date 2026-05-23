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

interface AggregatedHolding {
  ticker: string;
  name: string;
  shares: number;
  totalCost: number;
  avgCost: number;
  price: number;
  asset_type: "stock" | "crypto";
  dayChange: number;
  portfolioIds: number[];
}

function aggregateHoldings(holdings: Holding[]): AggregatedHolding[] {
  const map = new Map<string, AggregatedHolding>();
  for (const h of holdings) {
    const existing = map.get(h.ticker);
    if (existing) {
      existing.totalCost += h.avg_cost * h.shares;
      existing.shares += h.shares;
      existing.avgCost = existing.shares > 0 ? existing.totalCost / existing.shares : 0;
      if (!existing.portfolioIds.includes(h.portfolio_id)) {
        existing.portfolioIds.push(h.portfolio_id);
      }
    } else {
      map.set(h.ticker, {
        ticker: h.ticker,
        name: h.name,
        shares: h.shares,
        totalCost: h.avg_cost * h.shares,
        avgCost: h.avg_cost,
        price: h.current_price || 0,
        asset_type: h.asset_type,
        dayChange: h.change_percent || 0,
        portfolioIds: [h.portfolio_id],
      });
    }
  }
  return Array.from(map.values());
}

function getAggFields(h: AggregatedHolding) {
  const value = h.price * h.shares;
  const gain = (h.price - h.avgCost) * h.shares;
  const gainPct = h.avgCost > 0 ? ((h.price - h.avgCost) / h.avgCost) * 100 : 0;
  return { value, gain, gainPct };
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
    const agg = aggregateHoldings(holdings);
    agg.sort((a, b) => {
      const af = getAggFields(a);
      const bf = getAggFields(b);
      switch (sortKey) {
        case "value": return bf.value - af.value;
        case "day": return b.dayChange - a.dayChange;
        case "gainPct": return bf.gainPct - af.gainPct;
        case "ticker": return a.ticker.localeCompare(b.ticker);
      }
    });
    return agg;
  }, [holdings, sortKey]);

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
      <div className="space-y-2.5">
        {sorted.map((h) => {
          const { value, gain, gainPct } = getAggFields(h);

          return (
            <div
              key={h.ticker}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                {/* Left: ticker + name */}
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-lg">{h.ticker}</span>
                    {h.asset_type === "crypto" && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        CRYPTO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{h.name}</p>
                </div>

                {/* Right: price + day change */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 text-lg">
                    {h.price > 0 ? fmt(h.price) : "—"}
                  </p>
                  {h.price > 0 && (
                    <p className={`text-sm font-semibold ${h.dayChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {h.dayChange >= 0 ? "+" : ""}{h.dayChange.toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom row: value, shares, gain */}
              {h.price > 0 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-gray-400 text-xs">Value</span>
                    <p className="text-gray-800 font-semibold text-sm">{fmtCompact(value)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Shares</span>
                    <p className="text-gray-700 text-sm">{h.shares}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-xs">Gain/Loss</span>
                    <p className={`font-semibold text-sm ${gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
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
