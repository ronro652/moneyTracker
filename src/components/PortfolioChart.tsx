"use client";

import { useState, useMemo } from "react";
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
import { getBucketKey } from "@/lib/dateBucket";

type Range = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
const RANGES: Range[] = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

function cutoffDate(range: Range): Date | null {
  if (range === "ALL") return null;
  const now = new Date();
  switch (range) {
    case "1W": now.setDate(now.getDate() - 7); break;
    case "1M": now.setMonth(now.getMonth() - 1); break;
    case "3M": now.setMonth(now.getMonth() - 3); break;
    case "6M": now.setMonth(now.getMonth() - 6); break;
    case "1Y": now.setFullYear(now.getFullYear() - 1); break;
  }
  return now;
}

interface Props {
  snapshots: PortfolioSnapshot[];
  transactions?: Transaction[];
}

export default function PortfolioChart({ snapshots, transactions = [] }: Props) {
  const [range, setRange] = useState<Range>("ALL");

  const filtered = useMemo(() => {
    const cutoff = cutoffDate(range);
    if (!cutoff) return snapshots;
    return snapshots.filter((s) => {
      const d = s.date.includes(" ")
        ? new Date(s.date.replace(" ", "T") + ":00Z")
        : new Date(s.date + "T00:00:00Z");
      return d >= cutoff;
    });
  }, [snapshots, range]);

  if (snapshots.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md shadow-black/5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
          <h2 className="text-lg font-semibold text-gray-900">Portfolio Performance</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-40 sm:h-64 text-gray-400 text-sm text-center px-4">
          <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
          Add stocks and refresh prices to see your portfolio chart
        </div>
      </div>
    );
  }

  const data = filtered.map((s) => ({
    date: s.date,
    value: s.total_value,
    cost: s.total_cost,
  }));

  const txByDate = new Map<string, { buys: number; sells: number }>();
  for (const t of transactions) {
    const txDate = new Date(t.created_at);
    const key = getBucketKey(txDate);
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
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md shadow-black/5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
          <h2 className="text-lg font-semibold text-gray-900">Portfolio Performance</h2>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
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
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={fmt}
            width={65}
            domain={([dataMin, dataMax]: readonly number[]) => {
              const pad = (dataMax - dataMin) * 0.1 || dataMax * 0.05;
              return [Math.max(0, dataMin - pad), dataMax + pad] as const;
            }}
          />
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
