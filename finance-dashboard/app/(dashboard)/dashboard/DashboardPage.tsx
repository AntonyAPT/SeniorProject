"use client";

import { useState } from "react";
import {
  Search,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Wallet,
  Eye,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function DashboardPage({ user }: { user: User }) {
  const [activeNav, setActiveNav] = useState("dashboard");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-blue rounded-lg flex items-center justify-center font-bold text-xl">
              S
            </div>
            <span className="text-xl font-bold text-gradient-blue">Stonks</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stocks, predictions..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* User Icon */}
          <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
            <UserIcon className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-800/50 p-6">
        <nav className="space-y-2">
          <NavItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Dashboard"
            active={activeNav === "dashboard"}
            onClick={() => setActiveNav("dashboard")}
          />
          <NavItem
            icon={<Wallet className="w-5 h-5" />}
            label="Portfolio"
            active={activeNav === "portfolio"}
            onClick={() => setActiveNav("portfolio")}
          />
          <NavItem
            icon={<Eye className="w-5 h-5" />}
            label="Watchlist"
            active={activeNav === "watchlist"}
            onClick={() => setActiveNav("watchlist")}
          />
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-slate-400">
              Monitor your predictions and portfolio performance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Portfolio Value"
              value="$124,532"
              change="+12.5%"
              isPositive={true}
            />
            <StatCard
              label="Today's P&L"
              value="$2,847"
              change="+2.3%"
              isPositive={true}
            />
            <StatCard
              label="Active Predictions"
              value="23"
              change="+5"
              isPositive={true}
            />
            <StatCard
              label="Accuracy Rate"
              value="78.4%"
              change="+3.2%"
              isPositive={true}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Market Overview</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                    1D
                  </button>
                  <button className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800/50 rounded-lg transition-colors">
                    1W
                  </button>
                  <button className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800/50 rounded-lg transition-colors">
                    1M
                  </button>
                  <button className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800/50 rounded-lg transition-colors">
                    1Y
                  </button>
                </div>
              </div>

              {/* Placeholder for Chart */}
              <div className="h-80 bg-slate-800/30 rounded-xl flex items-center justify-center border border-slate-700/30">
                <p className="text-slate-500">
                  Chart Component (integrate with Chart.js or Recharts)
                </p>
              </div>
            </div>

            {/* AI Predictions Panel */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">AI Predictions</h2>
              <div className="space-y-4">
                <PredictionCard
                  ticker="AAPL"
                  prediction="BUY"
                  confidence={87}
                  change="+2.4%"
                  isPositive={true}
                />
                <PredictionCard
                  ticker="TSLA"
                  prediction="HOLD"
                  confidence={72}
                  change="+0.8%"
                  isPositive={true}
                />
                <PredictionCard
                  ticker="NVDA"
                  prediction="BUY"
                  confidence={91}
                  change="+3.2%"
                  isPositive={true}
                />
                <PredictionCard
                  ticker="AMZN"
                  prediction="SELL"
                  confidence={68}
                  change="-1.2%"
                  isPositive={false}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <ActivityItem
                  action="New prediction generated"
                  ticker="AAPL"
                  time="2 minutes ago"
                  type="prediction"
                />
                <ActivityItem
                  action="Portfolio updated"
                  ticker="TSLA"
                  time="1 hour ago"
                  type="update"
                />
                <ActivityItem
                  action="Alert triggered"
                  ticker="NVDA"
                  time="3 hours ago"
                  type="alert"
                />
                <ActivityItem
                  action="New prediction generated"
                  ticker="AMZN"
                  time="5 hours ago"
                  type="prediction"
                />
              </div>
            </div>

            {/* Watchlist */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Watchlist</h2>
              <div className="space-y-3">
                <WatchlistItem
                  ticker="MSFT"
                  price="$412.50"
                  change="+1.8%"
                  isPositive={true}
                />
                <WatchlistItem
                  ticker="GOOGL"
                  price="$142.20"
                  change="-0.5%"
                  isPositive={false}
                />
                <WatchlistItem
                  ticker="META"
                  price="$489.30"
                  change="+2.1%"
                  isPositive={true}
                />
                <WatchlistItem
                  ticker="AMD"
                  price="$178.90"
                  change="+3.4%"
                  isPositive={true}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Navigation Item Component
function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-blue-500/10 text-blue-400 font-medium"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  change,
  isPositive,
}: {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-6 card-hover">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold">{value}</h3>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? "text-positive" : "text-negative"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
    </div>
  );
}

// Prediction Card Component
function PredictionCard({
  ticker,
  prediction,
  confidence,
  change,
  isPositive,
}: {
  ticker: string;
  prediction: string;
  confidence: number;
  change: string;
  isPositive: boolean;
}) {
  const getPredictionClass = (pred: string) => {
    if (pred === "BUY") return "text-positive bg-emerald-500/10";
    if (pred === "SELL") return "text-negative bg-red-500/10";
    return "text-neutral bg-amber-500/10";
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 hover:bg-slate-800/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold">{ticker}</span>
        <span
          className={`text-sm ${
            isPositive ? "text-positive" : "text-negative"
          }`}
        >
          {change}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${getPredictionClass(
            prediction
          )}`}
        >
          {prediction}
        </span>
        <span className="text-xs text-slate-400">{confidence}% confidence</span>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({
  action,
  ticker,
  time,
  type,
}: {
  action: string;
  ticker: string;
  time: string;
  type: string;
}) {
  const getIcon = () => {
    if (type === "prediction")
      return <BarChart3 className="w-4 h-4 text-positive" />;
    if (type === "alert")
      return <AlertCircle className="w-4 h-4 text-neutral" />;
    return <TrendingUp className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all">
      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{action}</p>
        <p className="text-xs text-slate-400">
          {ticker} • {time}
        </p>
      </div>
    </div>
  );
}

// Watchlist Item Component
function WatchlistItem({
  ticker,
  price,
  change,
  isPositive,
}: {
  ticker: string;
  price: string;
  change: string;
  isPositive: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer">
      <div>
        <p className="font-medium">{ticker}</p>
        <p className="text-sm text-slate-400">{price}</p>
      </div>
      <span
        className={`text-sm font-medium ${
          isPositive ? "text-positive" : "text-negative"
        }`}
      >
        {change}
      </span>
    </div>
  );
}
