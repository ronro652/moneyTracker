"use client";

import { Holding } from "@/types";

interface Props {
  holdings: Holding[];
  onDelete: (id: number) => void;
}

export default function HoldingsTable({ holdings, onDelete }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  if (holdings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Holdings</h2>
        <p className="text-gray-400 text-center py-8">
          No holdings yet. Add your first stock above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Holdings</h2>

      {/* Mobile card view */}
      <div className="flex flex-col gap-3 md:hidden">
        {holdings.map((h) => {
          const price = h.current_price || 0;
          const value = price * h.shares;
          const gain = (price - h.avg_cost) * h.shares;
          const gainPct =
            h.avg_cost > 0 ? ((price - h.avg_cost) / h.avg_cost) * 100 : 0;
          const dayChange = h.change_percent || 0;

          return (
            <div
              key={h.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-bold text-gray-900 text-base">
                    {h.ticker}
                  </span>
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
              <th className="text-left py-3 px-2">Ticker</th>
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-right py-3 px-2">Shares</th>
              <th className="text-right py-3 px-2">Avg Cost</th>
              <th className="text-right py-3 px-2">Price</th>
              <th className="text-right py-3 px-2">Value</th>
              <th className="text-right py-3 px-2">Gain/Loss</th>
              <th className="text-right py-3 px-2">Day %</th>
              <th className="text-center py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const price = h.current_price || 0;
              const value = price * h.shares;
              const gain = (price - h.avg_cost) * h.shares;
              const gainPct =
                h.avg_cost > 0
                  ? ((price - h.avg_cost) / h.avg_cost) * 100
                  : 0;
              const dayChange = h.change_percent || 0;

              return (
                <tr
                  key={h.id}
                  className="border-b border-gray-100 hover:bg-blue-50/50"
                >
                  <td className="py-3 px-2 font-bold text-gray-900">
                    {h.ticker}
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
                    {price > 0 ? (
                      <>
                        {fmt(gain)}{" "}
                        <span className="text-xs opacity-75">
                          ({gainPct >= 0 ? "+" : ""}
                          {gainPct.toFixed(1)}%)
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
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
