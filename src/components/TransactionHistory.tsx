"use client";

import { Transaction } from "@/types";

interface Props {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const fmtDate = (d: string) => {
    const date = new Date(d + "Z");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fmtTime = (d: string) => {
    const date = new Date(d + "Z");
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
        <p className="text-gray-400 text-center py-8">
          No transactions yet. Buy or sell to see your history here.
        </p>
      </div>
    );
  }

  const totalRealized = transactions
    .filter((t) => t.type === "sell" && t.realized_gain !== null)
    .reduce((sum, t) => sum + (t.realized_gain ?? 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
        {totalRealized !== 0 && (
          <span className={`text-sm font-medium ${totalRealized >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            Realized: {fmt(totalRealized)}
          </span>
        )}
      </div>

      {/* Mobile card view */}
      <div className="flex flex-col gap-3 md:hidden">
        {transactions.map((t) => (
          <div
            key={t.id}
            className={`border rounded-lg p-4 ${
              t.type === "buy"
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-red-50/50 border-red-200"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    t.type === "buy"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {t.type.toUpperCase()}
                </span>
                <span className="font-bold text-gray-900">{t.ticker}</span>
                {t.asset_type === "crypto" && (
                  <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    CRYPTO
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">{fmtDate(t.created_at)}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Shares</span>
                <p className="text-gray-700">{t.shares}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Price</span>
                <p className="text-gray-700">{fmt(t.price_per_share)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Total</span>
                <p className="text-gray-900 font-medium">{fmt(t.total_amount)}</p>
              </div>
              {t.type === "sell" && t.realized_gain !== null && (
                <div>
                  <span className="text-gray-400 text-xs">P/L</span>
                  <p className={`font-medium ${t.realized_gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {fmt(t.realized_gain)}
                  </p>
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
              <th className="text-left py-3 px-2">Date</th>
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Ticker</th>
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-right py-3 px-2">Shares</th>
              <th className="text-right py-3 px-2">Price</th>
              <th className="text-right py-3 px-2">Total</th>
              <th className="text-right py-3 px-2">P/L</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-blue-50/50">
                <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                  <span>{fmtDate(t.created_at)}</span>
                  <span className="text-gray-400 text-xs ml-1">{fmtTime(t.created_at)}</span>
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      t.type === "buy"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-2 font-bold text-gray-900">
                  <span className="inline-flex items-center gap-1.5">
                    {t.ticker}
                    {t.asset_type === "crypto" && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        CRYPTO
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-600 max-w-[150px] truncate">{t.name}</td>
                <td className="py-3 px-2 text-right text-gray-600">{t.shares}</td>
                <td className="py-3 px-2 text-right text-gray-600">{fmt(t.price_per_share)}</td>
                <td className="py-3 px-2 text-right text-gray-900 font-medium">{fmt(t.total_amount)}</td>
                <td className={`py-3 px-2 text-right font-medium ${
                  t.type === "sell" && t.realized_gain !== null
                    ? t.realized_gain >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                    : "text-gray-400"
                }`}>
                  {t.type === "sell" && t.realized_gain !== null
                    ? fmt(t.realized_gain)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
