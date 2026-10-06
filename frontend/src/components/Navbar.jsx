import React from "react";
import { User, LogOut, LayoutTemplate, Layers, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ currentView, setCurrentView, portfolioId, onOpenAuth, agentStatus }) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView("form")}>
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
            PA
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm sm:text-base text-zinc-900 tracking-tight">
                Portfolio Agent
              </span>
              {agentStatus?.gemini_configured ? (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium hidden sm:inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Gemini Flash
                </span>
              ) : (
                <span 
                  className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 font-medium hidden sm:inline-flex items-center gap-1.5"
                  title="Operating in deterministic offline mode with verified factual guardrails."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                  Verified Fallback
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block">Automated Role-Tailored Engineering Portfolios</p>
          </div>
        </div>

        {/* Workflow Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/80 text-xs font-medium">
          <button
            onClick={() => setCurrentView("form")}
            className={`px-3 py-1.5 rounded-md transition ${
              currentView === "form"
                ? "bg-white text-zinc-900 font-semibold shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            1. Profile & Projects
          </button>

          <button
            onClick={() => setCurrentView("progress")}
            disabled={!portfolioId}
            className={`px-3 py-1.5 rounded-md transition ${
              !portfolioId
                ? "text-zinc-400 cursor-not-allowed"
                : currentView === "progress"
                ? "bg-white text-zinc-900 font-semibold shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            2. Agent Pipeline
          </button>

          <button
            onClick={() => setCurrentView("preview")}
            disabled={!portfolioId}
            className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1.5 ${
              !portfolioId
                ? "text-zinc-400 cursor-not-allowed"
                : currentView === "preview"
                ? "bg-zinc-900 text-white font-medium shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>3. Portfolio Studio</span>
          </button>
        </nav>

        {/* User Account / Auth Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
                <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="text-zinc-800 font-medium hidden sm:inline">{user.name}</span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
