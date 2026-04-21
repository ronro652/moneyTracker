"use client";

import { Holding, Transaction } from "@/types";

interface Props {
  holdings: Holding[];
  transactions?: Transaction[];
  ilsRate?: number | null;
}

export default function SummaryCards({ holdings, transactions = [], ilsRate }: Props) {
  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.current_price || 0) * h.shares,
    0
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.avg_cost * h.shares,
    0
  );
  const unrealizedGain = totalValue - totalCost;
  const unrealizedPct = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

  const realizedGain = transactions
    .filter((t) => t.type === "sell" && t.realized_gain !== null)
    .reduce((sum, t) => sum + (t.realized_gain ?? 0), 0);

  const totalProfit = unrealizedGain + realizedGain;

  const dailyChange = holdings.reduce((sum, h) => {
    if (!h.current_price || !h.change_percent) return sum;
    const prevPrice = h.current_price / (1 + h.change_percent / 100);
    return sum + (h.current_price - prevPrice) * h.shares;
  }, 0);

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
    },
    {
      label: "Total Profit",
      value: fmtUsd(totalProfit),
      sub: `Unrealized: ${fmtUsd(unrealizedGain)} | Realized: ${fmtUsd(realizedGain)}`,
      color: totalProfit >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Unrealized Gain",
      value: fmtUsd(unrealizedGain),
      sub: `${unrealizedPct >= 0 ? "+" : ""}${unrealizedPct.toFixed(2)}% on open positions`,
      color: unrealizedGain >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Today's Change",
      value: fmtUsd(dailyChange),
      sub: dailyChange >= 0 ? "Up today" : "Down today",
      color: dailyChange >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Total Invested",
      value: fmtUsd(totalCost),
      sub: ilsRate ? fmtIls(totalCost * ilsRate) : "Cost basis",
      color: "text-gray-900",
    },
    {
      label: "Realized Gains",
      value: fmtUsd(realizedGain),
      sub: ilsRate ? fmtIls(realizedGain * ilsRate) : `From ${transactions.filter((t) => t.type === "sell").length} sell${transactions.filter((t) => t.type === "sell").length !== 1 ? "s" : ""}`,
      color: realizedGain >= 0 ? "text-emerald-600" : "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
        >
          <p className="text-sm text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className={`text-xs mt-1 ${card.color} opacity-75 truncate`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
