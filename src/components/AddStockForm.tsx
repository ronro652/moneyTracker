"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "./Toast";
import type { AssetType, TransactionType } from "@/types";

interface Props {
  onAdded: () => void;
  portfolioId: number;
  open?: boolean;
  onClose?: () => void;
}

interface SearchResult {
  ticker: string;
  name: string;
}

export default function AddStockForm({ onAdded, portfolioId, open, onClose }: Props) {
  const { toast } = useToast();
  const [assetType, setAssetType] = useState<AssetType>("stock");
  const [transactionType, setTransactionType] = useState<TransactionType>("buy");
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const isBottomSheet = open !== undefined;
  const isSell = transactionType === "sell";

  useEffect(() => {
    if (isBottomSheet && open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isBottomSheet, open]);

  const handleSearch = useCallback(
    (query: string) => {
      setTicker(query);
      setName("");
      setError("");
      if (searchTimeout) clearTimeout(searchTimeout);

      if (query.length < 1) {
        setSearchResults([]);
        setShowSearch(false);
        return;
      }

      const timeout = setTimeout(async () => {
        const typeParam = assetType === "crypto" ? "&type=crypto" : "";
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}${typeParam}`);
        const results = await res.json();
        setSearchResults(results);
        setShowSearch(results.length > 0);
      }, 300);
      setSearchTimeout(timeout);
    },
    [searchTimeout, assetType]
  );

  const selectResult = (result: SearchResult) => {
    setTicker(result.ticker);
    setName(result.name);
    setShowSearch(false);
    setSearchResults([]);
  };

  const switchAssetType = (type: AssetType) => {
    setAssetType(type);
    setTicker("");
    setName("");
    setSearchResults([]);
    setShowSearch(false);
    setError("");
  };

  const resetForm = () => {
    setTicker("");
    setName("");
    setShares("");
    setPrice("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !shares || !price) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: ticker.toUpperCase(),
        name: name || ticker.toUpperCase(),
        shares: parseFloat(shares),
        price_per_share: parseFloat(price),
        portfolio_id: portfolioId,
        asset_type: assetType,
        type: transactionType,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    const tickerName = name || ticker.toUpperCase();
    if (transactionType === "sell") {
      const gain = data.realized_gain ?? 0;
      const gainStr = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(gain);
      toast(`Sold ${shares} ${tickerName} — P/L: ${gainStr}`);
    } else {
      toast(`Bought ${shares} ${tickerName} at $${price}`);
    }

    resetForm();
    onAdded();
    onClose?.();
  };

  const isCrypto = assetType === "crypto";

  const formContent = (
    <form
      onSubmit={handleSubmit}
      className={
        isBottomSheet
          ? "flex flex-col gap-4"
          : "flex flex-wrap gap-3 items-end"
      }
    >
      <div className={isBottomSheet ? "flex gap-2" : "w-full mb-1 flex gap-2 flex-wrap"}>
        <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
          <button
            type="button"
            onClick={() => switchAssetType("stock")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !isCrypto
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Stock
          </button>
          <button
            type="button"
            onClick={() => switchAssetType("crypto")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isCrypto
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Crypto
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
          <button
            type="button"
            onClick={() => { setTransactionType("buy"); setError(""); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !isSell
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => { setTransactionType("sell"); setError(""); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isSell
                ? "bg-red-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className={isBottomSheet ? "" : "relative flex-1 min-w-[140px]"}>
        <label className="block text-xs text-gray-500 mb-1">
          {isCrypto ? "Coin" : "Ticker"}
        </label>
        <div className="relative">
          <input
            type="text"
            value={ticker}
            onChange={(e) => handleSearch(e.target.value.toUpperCase())}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            placeholder={isCrypto ? "BTC" : "AAPL"}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
            autoFocus={isBottomSheet}
          />
          {showSearch && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
              {searchResults.map((r) => (
                <button
                  key={r.ticker}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-3 py-3 hover:bg-blue-50 text-sm"
                >
                  <span className="font-bold text-gray-900">{r.ticker}</span>{" "}
                  <span className="text-gray-500 truncate">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {name && (
          <p className="text-xs text-gray-500 mt-1">Selected: {name}</p>
        )}
      </div>

      <div
        className={
          isBottomSheet ? "grid grid-cols-2 gap-3" : "contents"
        }
      >
        <div className={isBottomSheet ? "" : "flex-1 min-w-[120px]"}>
          <label className="block text-xs text-gray-500 mb-1">
            {isCrypto ? "Amount" : "Shares"}
          </label>
          <input
            type="number"
            step="any"
            min="0.000001"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder={isCrypto ? "0.5" : "10"}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div className={isBottomSheet ? "" : "flex-1 min-w-[120px]"}>
          <label className="block text-xs text-gray-500 mb-1">
            {isSell ? "Sell Price ($)" : "Buy Price ($)"}
          </label>
          <input
            type="number"
            step="any"
            min="0.0000001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={isCrypto ? "65000.00" : "150.00"}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`${
          isSell
            ? "bg-red-500 hover:bg-red-400 active:bg-red-600"
            : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
        } disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors ${
          isBottomSheet ? "w-full py-3.5 text-base mt-1" : "px-5 py-3 text-sm"
        }`}
      >
        {loading
          ? (isSell ? "Selling..." : "Buying...")
          : isSell
            ? (isCrypto ? "Sell Coin" : "Sell Stock")
            : (isCrypto ? "Buy Coin" : "Buy Stock")}
      </button>
    </form>
  );

  if (isBottomSheet) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
        <div
          className={`fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          <div className="px-5 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isSell ? "Sell Holding" : "Buy Holding"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 -m-2 text-gray-400 active:text-gray-700"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {formContent}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {isSell ? "Sell Holding" : "Buy Holding"}
      </h2>
      {formContent}
    </div>
  );
}
