"use client";

import { useState } from "react";
import { Dividend } from "@/types";

interface Props {
  dividends: Dividend[];
}

const PAGE_SIZE = 20;

export default function DividendHistory({ dividends }: Props) {
  const [page, setPage] = useState(0);
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const fmtDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (dividends.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dividend History</h2>
        <p className="text-gray-400 text-center py-8">
          No dividends recorded yet. Dividends are auto-detected daily or can be added manually.
        </p>
      </div>
    );
  }

  const totalIncome = dividends.reduce((sum, d) => sum + d.amount, 0);
  const totalPages = Math.ceil(dividends.length / PAGE_SIZE);
  const paginated = dividends.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Dividend History</h2>
        <span className="text-sm font-medium text-emerald-600">
          Total: {fmt(totalIncome)}
        </span>
      </div>

      {/* Mobile card view */}
      <div className="flex flex-col gap-3 md:hidden">
        {paginated.map((d) => (
          <div
            key={d.id}
            className="border rounded-lg p-4 bg-blue-50/50 border-blue-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  DIV
                </span>
                <span className="font-bold text-gray-900">{d.ticker}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  d.source === "api"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {d.source.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-400">{fmtDate(d.ex_date)}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
              <div>
                <span className="text-gray-400 text-xs">$/Share</span>
                <p className="text-gray-700">{fmt(d.dividend_per_share)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Shares</span>
                <p className="text-gray-700">{d.shares}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Total</span>
                <p className="text-emerald-600 font-medium">{fmt(d.amount)}</p>
              </div>
              {d.pay_date && (
                <div>
                  <span className="text-gray-400 text-xs">Pay Date</span>
                  <p className="text-gray-700">{fmtDate(d.pay_date)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left py-3 px-2">Ex-Date</th>
              <th className="text-left py-3 px-2">Ticker</th>
              <th className="text-right py-3 px-2">$/Share</th>
              <th className="text-right py-3 px-2">Shares</th>
              <th className="text-right py-3 px-2">Total</th>
              <th className="text-left py-3 px-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-blue-50/50">
                <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                  {fmtDate(d.ex_date)}
                </td>
                <td className="py-3 px-2 font-bold text-gray-900">{d.ticker}</td>
                <td className="py-3 px-2 text-right text-gray-600">{fmt(d.dividend_per_share)}</td>
                <td className="py-3 px-2 text-right text-gray-600">{d.shares}</td>
                <td className="py-3 px-2 text-right text-emerald-600 font-medium">{fmt(d.amount)}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    d.source === "api"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {d.source.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, dividends.length)} of {dividends.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
