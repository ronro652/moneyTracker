"use client";

import { Holding } from "@/types";

interface Props {
  holdings: Holding[];
}

export default function SummaryCards({ holdings }: Props) {
  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.current_price || 0) * h.shares,
    0
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.avg_cost * h.shares,
    0
  );
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dailyChange = holdings.reduce((sum, h) => {
    if (!h.current_price || !h.change_percent) return sum;
    const prevPrice = h.current_price / (1 + h.change_percent / 100);
    return sum + (h.current_price - prevPrice) * h.shares;
  }, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const cards = [
    {
      label: "Portfolio Value",
      value: fmt(totalValue),
      sub: `${holdings.length} holding${holdings.length !== 1 ? "s" : ""}`,
      color: "text-gray-900",
    },
    {
      label: "Total Gain/Loss",
      value: fmt(totalGain),
      sub: `${totalGainPercent >= 0 ? "+" : ""}${totalGainPercent.toFixed(2)}%`,
      color: totalGain >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Today's Change",
      value: fmt(dailyChange),
      sub: dailyChange >= 0 ? "Up today" : "Down today",
      color: dailyChange >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Total Invested",
      value: fmt(totalCost),
      sub: "Cost basis",
      color: "text-gray-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
        >
          <p className="text-sm text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className={`text-xs mt-1 ${card.color} opacity-75`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
