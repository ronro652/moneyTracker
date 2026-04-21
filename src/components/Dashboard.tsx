"use client";

import { useState, useEffect, useCallback } from "react";
import SummaryCards from "./SummaryCards";
import PortfolioChart from "./PortfolioChart";
import HoldingsTable from "./HoldingsTable";
import AddStockForm from "./AddStockForm";
import { Holding, PortfolioSnapshot } from "@/types";

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const fetchHoldings = useCallback(async () => {
    const res = await fetch("/api/holdings");
    const data = await res.json();
    setHoldings(data);
  }, []);

  const fetchSnapshots = useCallback(async () => {
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    setSnapshots(data);
  }, []);

  const refreshPrices = useCallback(async () => {
    setRefreshing(true);
    await fetch("/api/prices", { method: "POST" });
    await fetchHoldings();
    await fetchSnapshots();
    setLastUpdated(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [fetchHoldings, fetchSnapshots]);

  useEffect(() => {
    fetchHoldings();
    fetchSnapshots();
  }, [fetchHoldings, fetchSnapshots]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    await fetchHoldings();
  };

  const handleAdded = async () => {
    await fetchHoldings();
    await refreshPrices();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Money Tracker
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Stock Portfolio Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Updated {lastUpdated}
              </span>
            )}
            <button
              onClick={refreshPrices}
              disabled={refreshing}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-gray-700 text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">Refresh Prices</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
        <SummaryCards holdings={holdings} />

        {/* Desktop inline form */}
        <div className="hidden md:block">
          <AddStockForm onAdded={handleAdded} />
        </div>

        <PortfolioChart snapshots={snapshots} />
        <HoldingsTable holdings={holdings} onDelete={handleDelete} />

        {lastUpdated && (
          <p className="text-xs text-gray-500 text-center sm:hidden">
            Updated {lastUpdated}
          </p>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="md:hidden fixed right-4 bottom-6 z-30 w-14 h-14 bg-emerald-600 active:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-900/40 flex items-center justify-center"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Mobile bottom sheet */}
      <div className="md:hidden">
        <AddStockForm
          onAdded={handleAdded}
          open={showAddSheet}
          onClose={() => setShowAddSheet(false)}
        />
      </div>
    </div>
  );
}
