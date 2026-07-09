"use client";

import { useState, useEffect } from "react";
import { Dividend } from "@/types";
import AddDividendForm from "./AddDividendForm";

interface Props {
  dividends: Dividend[];
  portfolioId: number;
  onAdded: () => void;
}

const PAGE_SIZE = 20;

export default function DividendHistory({ dividends, portfolioId, onAdded }: Props) {
  const [page, setPage] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [autoDetectionAvailable, setAutoDetectionAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dividends/status")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAutoDetectionAvailable(data.available);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const addButton = (
    <button
      onClick={() => setShowAddForm(true)}
      className="text-xs font-medium px-3 py-1.5 rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors flex items-center gap-1"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
      Add Dividend
    </button>
  );

  const addForm = (
    <AddDividendForm
      portfolioId={portfolioId}
      open={showAddForm}
      onClose={() => setShowAddForm(false)}
      onAdded={onAdded}
    />
  );

  if (dividends.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md shadow-black/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <h2 className="text-lg font-semibold text-gray-900">Dividend History</h2>
          </div>
          {addButton}
        </div>
        {autoDetectionAvailable === false ? (
          <p className="text-gray-400 text-center py-8">
            Automatic dividend detection isn&apos;t available on the current Finnhub plan.
            Use &quot;Add Dividend&quot; above to track dividends manually.
          </p>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No dividends recorded yet. Dividends are auto-detected daily or can be added manually.
          </p>
        )}
        {addForm}
      </div>
    );
  }

  const totalIncome = dividends.reduce((sum, d) => sum + d.amount, 0);
  const totalPages = Math.ceil(dividends.length / PAGE_SIZE);
  const paginated = dividends.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md shadow-black/5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <h2 className="text-lg font-semibold text-gray-900">Dividend History</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-emerald-600">
            Total: {fmt(totalIncome)}
          </span>
          {addButton}
        </div>
      </div>
      {addForm}

      {/* Mobile card view */}
      <div className="flex flex-col gap-3 md:hidden">
        {paginated.map((d) => (
          <div
            key={d.id}
            className="border rounded-2xl p-4 bg-teal-50/50 border-teal-200/60"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                  DIV
                </span>
                <span className="font-bold text-gray-900">{d.ticker}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
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
              <tr key={d.id} className="border-b border-gray-100 hover:bg-indigo-50/50">
                <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                  {fmtDate(d.ex_date)}
                </td>
                <td className="py-3 px-2 font-bold text-gray-900">{d.ticker}</td>
                <td className="py-3 px-2 text-right text-gray-600">{fmt(d.dividend_per_share)}</td>
                <td className="py-3 px-2 text-right text-gray-600">{d.shares}</td>
                <td className="py-3 px-2 text-right text-emerald-600 font-medium">{fmt(d.amount)}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
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
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
