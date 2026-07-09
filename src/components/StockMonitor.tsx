"use client";

import { useMemo, useState } from "react";
import { Holding, Portfolio } from "@/types";
import StockDayChart from "./StockDayChart";

interface Props {
  holdings: Holding[];
  portfolios: Portfolio[];
  refreshing: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
}

type SortKey = "value" | "day" | "gainPct" | "ticker";
type AssetFilter = "all" | "stocks";

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
  const prevPrice = h.dayChange !== 0 ? h.price / (1 + h.dayChange / 100) : h.price;
  const dayDollar = (h.price - prevPrice) * h.shares;
  return { value, gain, gainPct, dayDollar };
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
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("all");
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

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
    let agg = aggregateHoldings(holdings);
    if (assetFilter === "stocks") {
      agg = agg.filter((h) => h.asset_type !== "crypto");
    }
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
  }, [holdings, sortKey, assetFilter]);

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400 text-lg">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl p-6 shadow-lg shadow-indigo-500/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/70">Portfolio Value</p>
            <p className="text-3xl font-bold text-white tracking-tight">{fmt(totalValue)}</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-white/60 hover:text-white disabled:text-white/30 transition-colors"
            title="Refresh prices"
          >
            <svg className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/50 uppercase tracking-wide">Today&apos;s Change</p>
          <p className={`text-3xl font-bold tracking-tight mt-1 ${totalDayChange >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {totalDayChange >= 0 ? "+" : ""}{fmt(totalDayChange)}
          </p>
          <p className={`text-sm font-semibold mt-0.5 ${totalDayChange >= 0 ? "text-emerald-300/70" : "text-rose-300/70"}`}>
            {totalDayPct >= 0 ? "+" : ""}{totalDayPct.toFixed(2)}%
          </p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <div>
            <span className="text-xs text-white/50">Total Gain</span>
            <p className={`text-sm font-semibold ${totalGain >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {totalGain >= 0 ? "+" : ""}{fmtCompact(totalGain)}
              <span className="ml-1 opacity-70">({totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%)</span>
            </p>
          </div>
          {lastUpdated && (
            <p className="text-[11px] text-white/40">Updated {lastUpdated}</p>
          )}
        </div>
      </div>

      {/* Sort controls + asset filter */}
      <div className="flex items-center justify-between gap-1.5 px-1 flex-wrap">
        <div className="flex items-center gap-1.5">
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
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex bg-gray-100 rounded-xl p-0.5">
          {([
            ["all", "All"],
            ["stocks", "Stocks"],
          ] as [AssetFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setAssetFilter(key)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                assetFilter === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-gray-400 text-sm">No stocks to show</p>
        </div>
      ) : (
      <div className="space-y-2.5">
        {sorted.map((h, index) => {
          const { value, gain, gainPct, dayDollar } = getAggFields(h);
          const dayBorder = h.dayChange > 0 ? "border-l-4 border-emerald-400" : h.dayChange < 0 ? "border-l-4 border-rose-400" : "border-l-4 border-gray-200";
          const isExpanded = expandedTicker === h.ticker;

          return (
            <div
              key={h.ticker}
              className={`bg-white ${dayBorder} rounded-2xl px-5 py-4 shadow-md shadow-black/5 hover:shadow-lg transition-all cursor-pointer`}
              style={{ animation: 'slideUp 0.3s ease-out', animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
              onClick={() => setExpandedTicker(isExpanded ? null : h.ticker)}
            >
              {/* Top row: ticker + daily change hero */}
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-lg">{h.ticker}</span>
                    {h.asset_type === "crypto" && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        CRYPTO
                      </span>
                    )}
                    <svg
                      className={`w-3.5 h-3.5 text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{h.name}</p>
                </div>

                {h.price > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xl font-bold ${h.dayChange >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {h.dayChange >= 0 ? "+" : ""}{h.dayChange.toFixed(2)}%
                    </p>
                    <p className={`text-sm font-semibold ${h.dayChange >= 0 ? "text-emerald-600/70" : "text-rose-500/70"}`}>
                      {dayDollar >= 0 ? "+" : ""}{fmtCompact(dayDollar)}
                    </p>
                  </div>
                )}
              </div>

              {/* Price + position details */}
              {h.price > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wide">Price</span>
                    <p className="text-gray-900 font-semibold text-sm">{fmt(h.price)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wide">Value</span>
                    <p className="text-gray-800 font-semibold text-sm">{fmtCompact(value)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wide">Shares</span>
                    <p className="text-gray-700 text-sm">{h.shares}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-[10px] uppercase tracking-wide">Overall</span>
                    <p className={`font-semibold text-sm ${gain >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {gain >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Expandable day chart */}
              {isExpanded && (
                <StockDayChart ticker={h.ticker} assetType={h.asset_type} />
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
