"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { PortfolioSnapshot, Transaction } from "@/types";

interface Props {
  snapshots: PortfolioSnapshot[];
  transactions?: Transaction[];
}

export default function PortfolioChart({ snapshots, transactions = [] }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h2>
        <div className="flex items-center justify-center h-40 sm:h-64 text-gray-400 text-sm text-center px-4">
          Add stocks and refresh prices to see your portfolio chart
        </div>
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    date: s.date,
    value: s.total_value,
    cost: s.total_cost,
  }));

  const txByDate = new Map<string, { buys: number; sells: number }>();
  for (const t of transactions) {
    const txDate = new Date(t.created_at + "Z");
    const bucket = Math.floor(txDate.getUTCHours() / 6) * 6;
    const key = `${txDate.toISOString().split("T")[0]} ${String(bucket).padStart(2, "0")}:00`;
    const entry = txByDate.get(key) || { buys: 0, sells: 0 };
    if (t.type === "buy") entry.buys += t.total_amount;
    else entry.sells += t.total_amount;
    txByDate.set(key, entry);
  }

  const buyMarkers: { date: string; value: number }[] = [];
  const sellMarkers: { date: string; value: number }[] = [];

  for (const d of data) {
    const tx = txByDate.get(d.date);
    if (tx?.buys) buyMarkers.push({ date: d.date, value: d.value });
    if (tx?.sells) sellMarkers.push({ date: d.date, value: d.value });
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h2>
      <div className="h-[220px] sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(d: string) => {
              const hasTime = d.includes(" ");
              const date = hasTime ? new Date(d.replace(" ", "T") + ":00Z") : new Date(d + "T00:00:00");
              const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              if (hasTime) {
                const h = date.getUTCHours();
                return `${day} ${h}:00`;
              }
              return day;
            }}
          />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={fmt} width={65} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#1e293b",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value) => [fmt(Number(value))]}
            labelFormatter={(label) => {
              const s = String(label);
              const hasTime = s.includes(" ");
              const date = hasTime ? new Date(s.replace(" ", "T") + ":00Z") : new Date(s + "T00:00:00");
              const dayStr = date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });
              if (hasTime) {
                return `${dayStr} ${date.getUTCHours()}:00`;
              }
              return dayStr;
            }}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#93c5fd"
            fill="url(#costGradient)"
            strokeWidth={2}
            name="Cost Basis"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            fill="url(#valueGradient)"
            strokeWidth={2}
            name="Market Value"
          />
          {buyMarkers.map((m, i) => (
            <ReferenceDot
              key={`buy-${i}`}
              x={m.date}
              y={m.value}
              r={5}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
          {sellMarkers.map((m, i) => (
            <ReferenceDot
              key={`sell-${i}`}
              x={m.date}
              y={m.value}
              r={5}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      </div>
      <div className="flex gap-4 sm:gap-6 mt-3 justify-center text-sm text-gray-600 flex-wrap">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600" />
          Market Value
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-300" />
          Cost Basis
        </span>
        {buyMarkers.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            Buy
          </span>
        )}
        {sellMarkers.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Sell
          </span>
        )}
      </div>
    </div>
  );
}
