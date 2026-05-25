"use client";

import { useState, useEffect, useCallback } from "react";
import { ExpectedDividend } from "@/types";

interface Props {
  activePortfolioId: number | null;
}

export default function ExpectedDividends({ activePortfolioId }: Props) {
  const [expected, setExpected] = useState<ExpectedDividend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpected = useCallback(async () => {
    setLoading(true);
    const url = activePortfolioId
      ? `/api/expected-dividends?portfolio_id=${activePortfolioId}`
      : "/api/expected-dividends";
    const res = await fetch(url);
    const data = await res.json();
    setExpected(data);
    setLoading(false);
  }, [activePortfolioId]);

  useEffect(() => {
    fetchExpected();
  }, [fetchExpected]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const fmtDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const freqLabel: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    "semi-annual": "Semi-Annual",
    annual: "Annual",
    irregular: "Irregular",
  };

  const freqColor: Record<string, string> = {
    monthly: "bg-violet-100 text-violet-700",
    quarterly: "bg-indigo-100 text-indigo-700",
    "semi-annual": "bg-blue-100 text-blue-700",
    annual: "bg-teal-100 text-teal-700",
    irregular: "bg-gray-100 text-gray-600",
  };

  const totalAnnual = expected.reduce((s, e) => s + e.annual_estimate, 0);
  const nextPayout = expected.length > 0 ? expected[0] : null;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md shadow-black/5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Expected Dividends</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (expected.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md shadow-black/5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Expected Dividends</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No dividend history to project from yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md shadow-black/5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Expected Dividends</h2>
        </div>
        <span className="text-sm font-medium text-emerald-600">
          Est. Annual: {fmt(totalAnnual)}
        </span>
      </div>

      {/* Next payout highlight */}
      {nextPayout && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border-l-4 border-emerald-500 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-0.5">Next Expected Payout</p>
              <p className="text-lg font-bold text-gray-900">{nextPayout.ticker}</p>
              <p className="text-xs text-gray-500">{nextPayout.name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-600">{fmt(nextPayout.estimated_amount)}</p>
              <p className="text-xs text-gray-500">
                {fmtDate(nextPayout.next_expected_date)}
                <span className="ml-1.5 text-emerald-600 font-medium">
                  ({nextPayout.days_until === 0 ? "Today" : nextPayout.days_until === 1 ? "Tomorrow" : `in ${nextPayout.days_until}d`})
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile card view */}
      <div className="flex flex-col gap-3 md:hidden">
        {expected.map((e, i) => (
          <div
            key={e.ticker}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
            style={{ animation: "slideUp 0.3s ease-out", animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{e.ticker}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${freqColor[e.frequency]}`}>
                  {freqLabel[e.frequency]}
                </span>
              </div>
              <span className="text-xs text-gray-400">{fmtDate(e.next_expected_date)}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Shares</span>
                <p className="text-gray-700">{e.current_shares}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">$/Share</span>
                <p className="text-gray-700">{fmt(e.last_dividend_per_share)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Est. Payout</span>
                <p className="text-emerald-600 font-medium">{fmt(e.estimated_amount)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Annual Est.</span>
                <p className="text-emerald-600 font-medium">{fmt(e.annual_estimate)}</p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-500">
                  {e.days_until === 0 ? "Due today" : e.days_until === 1 ? "Due tomorrow" : `${e.days_until} days away`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left py-3 px-2">Ticker</th>
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-center py-3 px-2">Frequency</th>
              <th className="text-right py-3 px-2">Shares</th>
              <th className="text-right py-3 px-2">$/Share</th>
              <th className="text-right py-3 px-2">Est. Payout</th>
              <th className="text-right py-3 px-2">Annual Est.</th>
              <th className="text-left py-3 px-2">Next Date</th>
            </tr>
          </thead>
          <tbody>
            {expected.map((e, i) => (
              <tr
                key={e.ticker}
                className="border-b border-gray-100 hover:bg-indigo-50/50"
                style={{ animation: "slideUp 0.3s ease-out", animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                <td className="py-3 px-2 font-bold text-gray-900">{e.ticker}</td>
                <td className="py-3 px-2 text-gray-600 max-w-[150px] truncate">{e.name}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${freqColor[e.frequency]}`}>
                    {freqLabel[e.frequency]}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-gray-600">{e.current_shares}</td>
                <td className="py-3 px-2 text-right text-gray-600">{fmt(e.last_dividend_per_share)}</td>
                <td className="py-3 px-2 text-right text-emerald-600 font-medium">{fmt(e.estimated_amount)}</td>
                <td className="py-3 px-2 text-right text-emerald-600 font-medium">{fmt(e.annual_estimate)}</td>
                <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                  {fmtDate(e.next_expected_date)}
                  <span className={`ml-1.5 text-xs font-medium ${e.days_until <= 7 ? "text-emerald-600" : e.days_until <= 30 ? "text-amber-500" : "text-gray-400"}`}>
                    {e.days_until === 0 ? "Today" : e.days_until === 1 ? "Tomorrow" : `${e.days_until}d`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-300 mt-3 text-center">
        Projections based on historical dividend patterns. Actual payments may vary.
      </p>
    </div>
  );
}
