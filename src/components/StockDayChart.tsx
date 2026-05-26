"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { IntradayCandle, ChartMeta } from "@/types";

interface Props {
  ticker: string;
  assetType: "stock" | "crypto";
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

interface CacheEntry {
  candles: IntradayCandle[];
  meta: ChartMeta;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

const emptyMeta: ChartMeta = { dayHigh: null, dayLow: null, fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null, previousClose: null };

async function fetchChartData(ticker: string, assetType: "stock" | "crypto"): Promise<{ candles: IntradayCandle[]; meta: ChartMeta }> {
  const key = `${ticker}-${assetType}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return { candles: cached.candles, meta: cached.meta };

  const res = await fetch(`/api/candles?ticker=${encodeURIComponent(ticker)}&asset_type=${assetType}`);
  const data = await res.json();
  const candles: IntradayCandle[] = data.candles ?? [];
  const meta: ChartMeta = data.meta ?? emptyMeta;

  cache.set(key, { candles, meta, ts: Date.now() });
  return { candles, meta };
}

export default function StockDayChart({ ticker, assetType }: Props) {
  const [candles, setCandles] = useState<IntradayCandle[]>([]);
  const [meta, setMeta] = useState<ChartMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchChartData(ticker, assetType)
      .then((data) => {
        if (cancelled) return;
        setCandles(data.candles);
        setMeta(data.meta);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ticker, assetType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[140px] text-gray-400 text-xs">
        <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading chart...
      </div>
    );
  }

  if (error || candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[140px] text-gray-400 text-xs">
        No intraday data available
      </div>
    );
  }

  const first = candles[0].close;
  const last = candles[candles.length - 1].close;
  const isPositive = last >= first;
  const strokeColor = isPositive ? "#10b981" : "#ef4444";
  const gradientId = `gradient-${ticker}`;

  const data = candles.map((c) => ({
    time: c.timestamp,
    price: c.close,
  }));

  const hasDayRange = meta.dayHigh !== null && meta.dayLow !== null;
  const has52w = meta.fiftyTwoWeekHigh !== null && meta.fiftyTwoWeekLow !== null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
      {/* Stats row */}
      {(hasDayRange || has52w) && (
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          {hasDayRange && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Day</span>
              <span className="text-xs font-medium text-rose-500">{fmt(meta.dayLow!)}</span>
              <div className="w-12 h-1.5 rounded-full bg-gray-100 relative overflow-hidden">
                {meta.dayHigh! > meta.dayLow! && (
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-rose-400 to-emerald-400"
                    style={{
                      left: `0%`,
                      width: `${((last - meta.dayLow!) / (meta.dayHigh! - meta.dayLow!)) * 100}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-xs font-medium text-emerald-600">{fmt(meta.dayHigh!)}</span>
            </div>
          )}
          {has52w && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">52W</span>
              <span className="text-xs font-medium text-rose-500">{fmt(meta.fiftyTwoWeekLow!)}</span>
              <div className="w-12 h-1.5 rounded-full bg-gray-100 relative overflow-hidden">
                {meta.fiftyTwoWeekHigh! > meta.fiftyTwoWeekLow! && (
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-rose-400 to-emerald-400"
                    style={{
                      left: `0%`,
                      width: `${((last - meta.fiftyTwoWeekLow!) / (meta.fiftyTwoWeekHigh! - meta.fiftyTwoWeekLow!)) * 100}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-xs font-medium text-emerald-600">{fmt(meta.fiftyTwoWeekHigh!)}</span>
            </div>
          )}
          {meta.previousClose !== null && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Prev Close</span>
              <span className="text-xs font-medium text-gray-700">{fmt(meta.previousClose)}</span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(t: number) => {
                const d = new Date(t * 1000);
                return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
              }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v: number) => fmt(v)}
              width={60}
              tickLine={false}
              axisLine={false}
              domain={([dataMin, dataMax]: readonly number[]) => {
                const pad = (dataMax - dataMin) * 0.1 || dataMax * 0.01;
                return [dataMin - pad, dataMax + pad] as const;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value) => [fmt(Number(value)), "Price"]}
              labelFormatter={(t) => {
                const d = new Date(Number(t) * 1000);
                return d.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: strokeColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
