"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import SummaryCards from "./SummaryCards";
import PortfolioChart from "./PortfolioChart";
import ProfitChart from "./ProfitChart";
import HoldingsTable from "./HoldingsTable";
import AddStockForm from "./AddStockForm";
import PortfolioSidebar from "./PortfolioSidebar";
import PortfolioAllocation from "./PortfolioAllocation";
import TransactionHistory from "./TransactionHistory";
import DividendHistory from "./DividendHistory";
import DashboardSettings from "./DashboardSettings";
import StockMonitor from "./StockMonitor";
import { useAuth } from "./AuthProvider";
import { ToastProvider } from "./Toast";
import { Holding, Portfolio, PortfolioSnapshot, Transaction, Dividend, DashboardWidget, DEFAULT_WIDGETS } from "@/types";

type View = "monitor" | "dashboard";

function loadWidgets(): DashboardWidget[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) {
      const parsed = JSON.parse(saved) as DashboardWidget[];
      const ids = new Set(parsed.map((w) => w.id));
      return [...parsed, ...DEFAULT_WIDGETS.filter((w) => !ids.has(w.id))];
    }
  } catch {}
  return DEFAULT_WIDGETS;
}

function saveWidgets(widgets: DashboardWidget[]) {
  localStorage.setItem("dashboard-widgets", JSON.stringify(widgets));
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [ilsRate, setIlsRate] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [apiQuota, setApiQuota] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [view, setView] = useState<View>("monitor");
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    setWidgets(loadWidgets());
  }, []);

  const handleWidgetsChange = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    saveWidgets(newWidgets);
  };

  const fetchPortfolios = useCallback(async () => {
    const res = await fetch("/api/portfolios");
    const data = await res.json();
    setPortfolios(data);
  }, []);

  const fetchHoldings = useCallback(async () => {
    const url = activePortfolioId
      ? `/api/holdings?portfolio_id=${activePortfolioId}`
      : "/api/holdings";
    const res = await fetch(url);
    const data = await res.json();
    setHoldings(data);
  }, [activePortfolioId]);

  const fetchSnapshots = useCallback(async () => {
    const url = activePortfolioId
      ? `/api/portfolio?portfolio_id=${activePortfolioId}`
      : "/api/portfolio";
    const res = await fetch(url);
    const data = await res.json();
    setSnapshots(data);
  }, [activePortfolioId]);

  const fetchTransactions = useCallback(async () => {
    const url = activePortfolioId
      ? `/api/transactions?portfolio_id=${activePortfolioId}`
      : "/api/transactions";
    const res = await fetch(url);
    const data = await res.json();
    setTransactions(data);
  }, [activePortfolioId]);

  const fetchDividends = useCallback(async () => {
    const url = activePortfolioId
      ? `/api/dividends?portfolio_id=${activePortfolioId}`
      : "/api/dividends";
    const res = await fetch(url);
    const data = await res.json();
    setDividends(data);
  }, [activePortfolioId]);

  const fetchIlsRate = useCallback(async () => {
    const res = await fetch("/api/exchange-rate?from=USD&to=ILS");
    const data = await res.json();
    if (data.rate) setIlsRate(data.rate);
  }, []);

  const fetchQuota = useCallback(async () => {
    const res = await fetch("/api/prices");
    const data = await res.json();
    if (data.quota) setApiQuota(data.quota);
  }, []);

  const refreshPrices = useCallback(async () => {
    setRefreshing(true);
    const res = await fetch("/api/prices", { method: "POST" });
    const data = await res.json();
    if (data.quota) setApiQuota(data.quota);
    await Promise.all([fetchHoldings(), fetchSnapshots(), fetchTransactions(), fetchDividends()]);
    lastRefreshRef.current = Date.now();
    setLastUpdated(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [fetchHoldings, fetchSnapshots, fetchTransactions, fetchDividends]);

  const throttledRefresh = useCallback(() => {
    const elapsed = Date.now() - lastRefreshRef.current;
    if (elapsed >= 60_000 && !refreshing) {
      refreshPrices();
    }
  }, [refreshPrices, refreshing]);

  useEffect(() => {
    fetchPortfolios();
    fetchIlsRate();
    fetchQuota();
  }, [fetchPortfolios, fetchIlsRate, fetchQuota]);

  // Auto-refresh on mount and when returning to the tab (throttled to once/min)
  useEffect(() => {
    throttledRefresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") throttledRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [throttledRefresh]);

  useEffect(() => {
    fetchHoldings();
    fetchSnapshots();
    fetchTransactions();
    fetchDividends();
  }, [fetchHoldings, fetchSnapshots, fetchTransactions, fetchDividends]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    await fetchHoldings();
  };

  const handleAdded = async () => {
    await Promise.all([fetchHoldings(), fetchTransactions(), fetchDividends()]);
    await refreshPrices();
  };

  const handlePortfolioChange = () => {
    fetchPortfolios();
    fetchHoldings();
    fetchSnapshots();
    fetchTransactions();
    fetchDividends();
  };

  const activePortfolio = portfolios.find((p) => p.id === activePortfolioId);
  const displayPortfolioId = activePortfolioId ?? portfolios[0]?.id ?? 1;

  const visibleWidgets = [...widgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case "summary":
        return <SummaryCards key={widget.id} holdings={holdings} transactions={transactions} dividends={dividends} ilsRate={ilsRate} />;
      case "add-stock":
        return (
          <div key={widget.id} className="hidden md:block">
            <AddStockForm onAdded={handleAdded} portfolioId={displayPortfolioId} />
          </div>
        );
      case "chart":
        return <PortfolioChart key={widget.id} snapshots={snapshots} transactions={transactions} />;
      case "profit-chart":
        return <ProfitChart key={widget.id} snapshots={snapshots} />;
      case "allocation":
        return (
          <PortfolioAllocation
            key={widget.id}
            holdings={holdings}
            portfolios={portfolios}
            activePortfolioId={activePortfolioId}
          />
        );
      case "holdings":
        return <HoldingsTable key={widget.id} holdings={holdings} portfolios={portfolios} activePortfolioId={activePortfolioId} onDelete={handleDelete} />;
      case "transactions":
        return <TransactionHistory key={widget.id} transactions={transactions} />;
      case "dividends":
        return <DividendHistory key={widget.id} dividends={dividends} />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
    <div className="min-h-screen bg-slate-50 text-gray-800">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors ${view === "monitor" ? "hidden" : ""}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Money Tracker</h1>
              <p className="text-xs text-gray-400">
                {activePortfolio ? activePortfolio.name : "All Portfolios"}
                {ilsRate && <span className="ml-2">USD/ILS {ilsRate.toFixed(2)}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView("monitor")}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                  view === "monitor"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="hidden sm:inline">Monitor</span>
              </button>
              <button
                onClick={() => setView("dashboard")}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                  view === "dashboard"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
            {view === "dashboard" && apiQuota && (
              <span className={`text-xs hidden sm:inline ${apiQuota.remaining === 0 ? "text-red-500 font-medium" : apiQuota.remaining <= 5 ? "text-amber-500" : "text-gray-400"}`}>
                {apiQuota.remaining === 0 ? "API limit reached" : `${apiQuota.remaining}/${apiQuota.limit}/min`}
              </span>
            )}
            {view === "dashboard" && lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:inline">Updated {lastUpdated}</span>
            )}
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
              title={`Sign out (${user?.name})`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            {view === "dashboard" && (
              <>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Dashboard settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={refreshPrices}
                  disabled={refreshing}
                  className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {refreshing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="hidden sm:inline">Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Refresh Prices</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 p-4 pt-20 overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PortfolioSidebar
              portfolios={portfolios}
              activePortfolioId={activePortfolioId}
              onSelect={(id) => { setActivePortfolioId(id); setSidebarOpen(false); }}
              onCreated={handlePortfolioChange}
              onDeleted={handlePortfolioChange}
              onUpdated={handlePortfolioChange}
            />
          </div>
        </div>
      )}

      {view === "monitor" ? (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6">
          <StockMonitor
            holdings={holdings}
            portfolios={portfolios}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            onRefresh={refreshPrices}
          />
        </div>
      ) : (
        <>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex gap-6">
              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <PortfolioSidebar
                    portfolios={portfolios}
                    activePortfolioId={activePortfolioId}
                    onSelect={setActivePortfolioId}
                    onCreated={handlePortfolioChange}
                    onDeleted={handlePortfolioChange}
                    onUpdated={handlePortfolioChange}
                  />
                </div>
              </aside>

              {/* Main content */}
              <main className="flex-1 min-w-0 space-y-4 sm:space-y-6 pb-24 md:pb-6">
                {visibleWidgets.map(renderWidget)}

                {lastUpdated && (
                  <p className="text-xs text-gray-400 text-center sm:hidden">
                    Updated {lastUpdated}
                  </p>
                )}
              </main>
            </div>
          </div>

          {/* Mobile FAB */}
          <button
            onClick={() => setShowAddSheet(true)}
            className="md:hidden fixed right-4 bottom-6 z-30 w-14 h-14 bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/25 flex items-center justify-center"
            style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Mobile bottom sheet */}
          <div className="md:hidden">
            <AddStockForm
              onAdded={handleAdded}
              portfolioId={displayPortfolioId}
              open={showAddSheet}
              onClose={() => setShowAddSheet(false)}
            />
          </div>
        </>
      )}

      <DashboardSettings
        widgets={widgets}
        onChange={handleWidgetsChange}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
    </ToastProvider>
  );
}
