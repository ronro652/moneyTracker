"use client";

import { Holding, Transaction, Dividend } from "@/types";

interface Props {
  holdings: Holding[];
  transactions?: Transaction[];
  dividends?: Dividend[];
  ilsRate?: number | null;
}

export default function SummaryCards({ holdings, transactions = [], dividends = [], ilsRate }: Props) {
  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.current_price || 0) * h.shares,
    0
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.avg_cost * h.shares,
    0
  );
  const unrealizedGain = totalValue - totalCost;

  const realizedGain = transactions
    .filter((t) => t.type === "sell" && t.realized_gain !== null)
    .reduce((sum, t) => sum + (t.realized_gain ?? 0), 0);

  const totalProfit = unrealizedGain + realizedGain;
  const totalReturnPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const buyTxns = transactions.filter((t) => t.type === "buy");
  const firstBuyDate = buyTxns.length > 0
    ? buyTxns.reduce((earliest, t) => (t.created_at < earliest ? t.created_at : earliest), buyTxns[0].created_at)
    : null;
  let cagr: number | null = null;
  if (firstBuyDate && totalCost > 0) {
    const years = (Date.now() - new Date(firstBuyDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (years >= 1) {
      const totalReturn = 1 + totalReturnPct / 100;
      cagr = totalReturn > 0 ? (Math.pow(totalReturn, 1 / years) - 1) * 100 : 0;
    }
  }

  const dailyChange = holdings.reduce((sum, h) => {
    if (!h.current_price || !h.change_percent) return sum;
    const prevPrice = h.current_price / (1 + h.change_percent / 100);
    return sum + (h.current_price - prevPrice) * h.shares;
  }, 0);

  const holdingPerfs = holdings
    .filter((h) => h.current_price && h.avg_cost > 0)
    .map((h) => ({
      ticker: h.ticker,
      gainPct: ((h.current_price! - h.avg_cost) / h.avg_cost) * 100,
    }));
  const bestPerf = holdingPerfs.length > 0
    ? holdingPerfs.reduce((best, h) => (h.gainPct > best.gainPct ? h : best))
    : null;
  const worstPerf = holdingPerfs.length > 0
    ? holdingPerfs.reduce((worst, h) => (h.gainPct < worst.gainPct ? h : worst))
    : null;

  const fmtUsd = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const fmtIls = (n: number) =>
    new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const cards = [
    {
      label: "Portfolio Value",
      value: fmtUsd(totalValue),
      sub: ilsRate ? fmtIls(totalValue * ilsRate) : `${holdings.length} holding${holdings.length !== 1 ? "s" : ""}`,
      color: "text-gray-900",
      subColor: "text-gray-400",
      bg: "bg-gradient-to-br from-indigo-50 to-white",
      border: "border-l-indigo-500",
      icon: (
        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Total Profit",
      value: fmtUsd(totalProfit),
      sub: `Unrealized: ${fmtUsd(unrealizedGain)} | Realized: ${fmtUsd(realizedGain)}`,
      color: totalProfit >= 0 ? "text-emerald-600" : "text-rose-500",
      subColor: totalProfit >= 0 ? "text-emerald-500/70" : "text-rose-400/70",
      bg: totalProfit >= 0 ? "bg-gradient-to-br from-emerald-50 to-white" : "bg-gradient-to-br from-rose-50 to-white",
      border: totalProfit >= 0 ? "border-l-emerald-500" : "border-l-rose-500",
      icon: totalProfit >= 0 ? (
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    },
    {
      label: "Total Return",
      value: `${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct.toFixed(2)}%`,
      sub: cagr !== null ? `CAGR: ${cagr >= 0 ? "+" : ""}${cagr.toFixed(2)}%/yr` : "CAGR available after 1 year",
      color: totalReturnPct >= 0 ? "text-emerald-600" : "text-rose-500",
      subColor: "text-gray-400",
      bg: "bg-gradient-to-br from-violet-50 to-white",
      border: "border-l-violet-500",
      icon: (
        <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
        </svg>
      ),
    },
    {
      label: "Today's Change",
      value: fmtUsd(dailyChange),
      sub: dailyChange >= 0 ? "Up today" : "Down today",
      color: dailyChange >= 0 ? "text-emerald-600" : "text-rose-500",
      subColor: "text-gray-400",
      bg: "bg-gradient-to-br from-amber-50 to-white",
      border: "border-l-amber-500",
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: "Total Invested",
      value: fmtUsd(totalCost),
      sub: ilsRate ? fmtIls(totalCost * ilsRate) : "Cost basis",
      color: "text-gray-900",
      subColor: "text-gray-400",
      bg: "bg-gradient-to-br from-blue-50 to-white",
      border: "border-l-blue-500",
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: "Dividend Income",
      value: fmtUsd(dividends.reduce((sum, d) => sum + d.amount, 0)),
      sub: totalValue > 0
        ? `Yield: ${((dividends.reduce((sum, d) => sum + d.amount, 0) / totalValue) * 100).toFixed(2)}% | ${dividends.length} payment${dividends.length !== 1 ? "s" : ""}`
        : `${dividends.length} payment${dividends.length !== 1 ? "s" : ""}`,
      color: dividends.reduce((sum, d) => sum + d.amount, 0) > 0 ? "text-emerald-600" : "text-gray-900",
      subColor: "text-gray-400",
      bg: "bg-gradient-to-br from-teal-50 to-white",
      border: "border-l-teal-500",
      icon: (
        <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Best / Worst",
      value: bestPerf ? `${bestPerf.ticker} ${bestPerf.gainPct >= 0 ? "+" : ""}${bestPerf.gainPct.toFixed(1)}%` : "—",
      sub: worstPerf && worstPerf.ticker !== bestPerf?.ticker
        ? `Worst: ${worstPerf.ticker} ${worstPerf.gainPct >= 0 ? "+" : ""}${worstPerf.gainPct.toFixed(1)}%`
        : `${holdings.length} holding${holdings.length !== 1 ? "s" : ""} tracked`,
      color: bestPerf && bestPerf.gainPct >= 0 ? "text-emerald-600" : "text-rose-500",
      subColor: "text-gray-400",
      bg: "bg-gradient-to-br from-orange-50 to-white",
      border: "border-l-orange-500",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className={`${card.bg} border-l-4 ${card.border} rounded-2xl p-5 shadow-md shadow-black/5`}
          style={{ animation: 'slideUp 0.4s ease-out', animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
        >
          <div className="flex items-center gap-2 mb-1">
            {card.icon}
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className={`text-xs mt-1.5 ${card.subColor || 'text-gray-400'} truncate`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
