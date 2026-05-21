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
  ReferenceLine,
} from "recharts";
import { PortfolioSnapshot } from "@/types";

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
}

export default function ProfitChart({ snapshots }: Props) {
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profit / Loss</h2>
        <div className="flex items-center justify-center h-40 sm:h-64 text-gray-400 text-sm text-center px-4">
          Add stocks and refresh prices to see your profit chart
        </div>
      </div>
    );
  }

  const data = filtered.map((s) => {
    const profit = s.total_value - s.total_cost;
    const profitPct = s.total_cost > 0 ? (profit / s.total_cost) * 100 : 0;
    return { date: s.date, profit, profitPct };
  });

  const lastPoint = data[data.length - 1];
  const isPositive = lastPoint && lastPoint.profit >= 0;

  const fmtDollar = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Profit / Loss</h2>
          {lastPoint && (
            <p className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
              {fmtDollar(lastPoint.profit)} ({fmtPct(lastPoint.profitPct)})
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r
                  ? "bg-white text-blue-600 shadow-sm"
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
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.2} />
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
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
              yAxisId="dollar"
              stroke="#9ca3af"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={fmtDollar}
              width={65}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              stroke="#9ca3af"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              width={50}
            />
            <ReferenceLine yAxisId="dollar" y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#1e293b",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value, name) => {
                if (name === "Profit $") return [fmtDollar(Number(value))];
                return [fmtPct(Number(value))];
              }}
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
              yAxisId="dollar"
              type="monotone"
              dataKey="profit"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              fill="url(#profitGradient)"
              strokeWidth={2}
              name="Profit $"
            />
            <Area
              yAxisId="pct"
              type="monotone"
              dataKey="profitPct"
              stroke="#8b5cf6"
              fill="none"
              strokeWidth={2}
              strokeDasharray="4 2"
              name="Profit %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 sm:gap-6 mt-3 justify-center text-sm text-gray-600 flex-wrap">
        <span className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`} />
          Profit $
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-violet-500" style={{ borderTop: "2px dashed #8b5cf6", background: "none" }} />
          Profit %
        </span>
      </div>
    </div>
  );
}
