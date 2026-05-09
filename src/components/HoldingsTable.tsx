"use client";

import { useState, useMemo } from "react";
import { Holding } from "@/types";

type SortKey = "ticker" | "name" | "shares" | "avg_cost" | "price" | "value" | "gain" | "gainPct" | "day";
type SortDir = "asc" | "desc";

interface Props {
  holdings: Holding[];
  onDelete: (id: number) => void;
}

function getComputedFields(h: Holding) {
  const price = h.current_price || 0;
  const value = price * h.shares;
  const gain = (price - h.avg_cost) * h.shares;
  const gainPct = h.avg_cost > 0 ? ((price - h.avg_cost) / h.avg_cost) * 100 : 0;
  const dayChange = h.change_percent || 0;
  const priceChange = price * (dayChange / 100);
  return { price, value, gain, gainPct, dayChange, priceChange };
}

export default function HoldingsTable({ holdings, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const sorted = useMemo(() => {
    const arr = [...holdings];
    arr.sort((a, b) => {
      const af = getComputedFields(a);
      const bf = getComputedFields(b);
      let cmp = 0;
      switch (sortKey) {
        case "ticker": cmp = a.ticker.localeCompare(b.ticker); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "shares": cmp = a.shares - b.shares; break;
        case "avg_cost": cmp = a.avg_cost - b.avg_cost; break;
        case "price": cmp = af.price - bf.price; break;
        case "value": cmp = af.value - bf.value; break;
        case "gain": cmp = af.gain - bf.gain; break;
        case "gainPct": cmp = af.gainPct - bf.gainPct; break;
        case "day": cmp = af.dayChange - bf.dayChange; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [holdings, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "ticker" || key === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-gray-300 ml-0.5">&#8597;</span>;
    return <span className="text-blue-500 ml-0.5">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  if (holdings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Holdings</h2>
        <p className="text-gray-400 text-center py-8">
          No holdings yet. Add your first stock or coin above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Holdings</h2>

      {/* Mobile card view */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Mobile sort selector */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span>Sort by:</span>
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); }}
            className="bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-gray-700"
          >
            <option value="ticker">Ticker</option>
            <option value="name">Name</option>
            <option value="shares">Shares</option>
            <option value="avg_cost">Avg Cost</option>
            <option value="price">Price</option>
            <option value="value">Value</option>
            <option value="gain">Gain/Loss</option>
            <option value="gainPct">Change %</option>
            <option value="day">Day %</option>
          </select>
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-gray-700"
          >
            {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
        {sorted.map((h) => {
          const { price, value, gain, gainPct, dayChange, priceChange } = getComputedFields(h);

          return (
            <div
              key={h.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-base">
                      {h.ticker}
                    </span>
                    {h.asset_type === "crypto" && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        CRYPTO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {h.name}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(h.id)}
                  className="p-2 -m-2 text-gray-400 active:text-red-500 transition-colors"
                  title="Remove holding"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Shares</span>
                  <p className="text-gray-600">{h.shares}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Avg Cost</span>
                  <p className="text-gray-600">{fmt(h.avg_cost)}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Price</span>
                  <p className="text-gray-900 font-medium">
                    {price > 0 ? fmt(price) : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Value</span>
                  <p className="text-gray-900 font-medium">
                    {price > 0 ? fmt(value) : "—"}
                  </p>
                </div>
              </div>

              {price > 0 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-gray-400 text-xs">Gain/Loss</span>
                    <p
                      className={`text-sm font-medium ${
                        gain >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {fmt(gain)}{" "}
                      <span className="opacity-75">
                        ({gainPct >= 0 ? "+" : ""}
                        {gainPct.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Change %</span>
                    <p
                      className={`text-sm font-medium ${
                        gainPct >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {gainPct >= 0 ? "+" : ""}
                      {gainPct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-xs">Today</span>
                    <p
                      className={`text-sm font-medium ${
                        dayChange >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {dayChange >= 0 ? "+" : ""}
                      {dayChange.toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("ticker")}>
                Ticker <SortIcon col="ticker" />
              </th>
              <th className="text-left py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("name")}>
                Name <SortIcon col="name" />
              </th>
              <th className="text-right py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("shares")}>
                Shares <SortIcon col="shares" />
              </th>
              <th className="text-right py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("avg_cost")}>
                Avg Cost <SortIcon col="avg_cost" />
              </th>
              <th className="text-right py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("price")}>
                Price <SortIcon col="price" />
              </th>
              <th className="text-right py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("value")}>
                Value <SortIcon col="value" />
              </th>
              <th className="text-right py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("gain")}>
                Gain/Loss <SortIcon col="gain" />
              </th>
              <th className="text-right py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("gainPct")}>
                Change % <SortIcon col="gainPct" />
              </th>
              <th className="text-right py-3 px-2 cursor-pointer select-none hover:text-gray-800 transition-colors" onClick={() => toggleSort("day")}>
                Day % <SortIcon col="day" />
              </th>
              <th className="text-center py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const { price, value, gain, gainPct, dayChange, priceChange } = getComputedFields(h);

              return (
                <tr
                  key={h.id}
                  className="border-b border-gray-100 hover:bg-blue-50/50"
                >
                  <td className="py-3 px-2 font-bold text-gray-900">
                    <span className="inline-flex items-center gap-1.5">
                      {h.ticker}
                      {h.asset_type === "crypto" && (
                        <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          CRYPTO
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600 max-w-[150px] truncate">
                    {h.name}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-600">
                    {h.shares}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-600">
                    {fmt(h.avg_cost)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900">
                    {price > 0 ? fmt(price) : "—"}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900">
                    {price > 0 ? fmt(value) : "—"}
                  </td>
                  <td
                    className={`py-3 px-2 text-right font-medium ${
                      gain >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {price > 0 ? fmt(gain) : "—"}
                  </td>
                  <td
                    className={`py-3 px-2 text-right font-medium ${
                      gainPct >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {price > 0
                      ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%`
                      : "—"}
                  </td>
                  <td
                    className={`py-3 px-2 text-right ${
                      dayChange >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {price > 0
                      ? `${dayChange >= 0 ? "+" : ""}${dayChange.toFixed(2)}%`
                      : "—"}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => onDelete(h.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove holding"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
