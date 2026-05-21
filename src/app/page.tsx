"use client";

import { useAuth } from "@/components/AuthProvider";
import AuthPage from "@/components/AuthPage";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  return <Dashboard />;
}
