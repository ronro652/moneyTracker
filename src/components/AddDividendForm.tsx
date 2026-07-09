"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface Props {
  portfolioId: number;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddDividendForm({ portfolioId, open, onClose, onAdded }: Props) {
  const { toast } = useToast();
  const [ticker, setTicker] = useState("");
  const [dividendPerShare, setDividendPerShare] = useState("");
  const [shares, setShares] = useState("");
  const [exDate, setExDate] = useState("");
  const [payDate, setPayDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setTicker("");
    setDividendPerShare("");
    setShares("");
    setExDate("");
    setPayDate("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !dividendPerShare || !shares || !exDate) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/dividends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: ticker.toUpperCase(),
        dividend_per_share: parseFloat(dividendPerShare),
        shares: parseFloat(shares),
        portfolio_id: portfolioId,
        ex_date: exDate,
        pay_date: payDate || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    toast(`Added dividend for ${ticker.toUpperCase()}`);
    resetForm();
    onAdded();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={handleClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center">
        <div
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:w-96 p-5 sm:p-6"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Add Dividend</h2>
            <button onClick={handleClose} className="p-2 -m-2 text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <p className="text-rose-500 text-sm bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-3">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">$/Share</label>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  value={dividendPerShare}
                  onChange={(e) => setDividendPerShare(e.target.value)}
                  placeholder="0.24"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Shares</label>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="10"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ex-Date</label>
                <input
                  type="date"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pay Date (optional)</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors w-full py-3.5 text-base mt-1"
            >
              {loading ? "Adding..." : "Add Dividend"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
