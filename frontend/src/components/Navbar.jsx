import React from "react";
import { User, LogOut, LayoutTemplate, Sparkles, Terminal, Home, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  portfolioId, 
  onOpenAuth, 
  onOpenDeveloperApi 
}) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F4]/90 backdrop-blur-md border-b border-[#E5DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* 1. Left Brand Area */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group select-none" 
          onClick={() => setCurrentView("landing")}
          title="Return to Platform Landing"
        >
          <div className="w-9 h-9 rounded-xl bg-[#6B3074] text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-sm group-hover:bg-[#5E1B89] transition">
            PA
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="font-extrabold text-base sm:text-lg text-[#1B1F3B] tracking-tight">
              Portfolio Agent
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#6B3074]/10 text-[#6B3074] border border-[#6B3074]/20 hidden sm:inline-flex items-center">
              Agent v1.0
            </span>
          </div>
        </div>

        {/* 2. Center Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 p-1 rounded-xl bg-[#F3EFEA] border border-[#E5DFD7] text-xs font-medium">
          <button
            onClick={() => setCurrentView("landing")}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              currentView === "landing"
                ? "bg-[#6B3074] text-white font-semibold shadow-sm"
                : "text-[#1B1F3B]/70 hover:text-[#1B1F3B] hover:bg-[#EAE4DC]"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Platform</span>
          </button>

          <button
            onClick={() => setCurrentView("form")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              currentView === "form"
                ? "bg-[#6B3074] text-white font-semibold shadow-sm"
                : "text-[#1B1F3B]/70 hover:text-[#1B1F3B] hover:bg-[#EAE4DC]"
            }`}
          >
            1. Profile & Projects
          </button>

          <button
            onClick={() => setCurrentView("progress")}
            disabled={!portfolioId}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              !portfolioId
                ? "text-[#1B1F3B]/30 cursor-not-allowed"
                : currentView === "progress"
                ? "bg-[#6B3074] text-white font-semibold shadow-sm"
                : "text-[#1B1F3B]/70 hover:text-[#1B1F3B] hover:bg-[#EAE4DC]"
            }`}
          >
            2. Agent Pipeline
          </button>

          <button
            onClick={() => setCurrentView("preview")}
            disabled={!portfolioId}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              !portfolioId
                ? "text-[#1B1F3B]/30 cursor-not-allowed"
                : currentView === "preview"
                ? "bg-[#6B3074] text-white font-semibold shadow-sm"
                : "text-[#1B1F3B]/70 hover:text-[#1B1F3B] hover:bg-[#EAE4DC]"
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>3. Portfolio Studio</span>
          </button>
        </nav>

        {/* 3. Right Actions Area */}
        <div className="flex items-center space-x-2.5">
          
          {/* Developer API Button */}
          <button
            onClick={onOpenDeveloperApi}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#1B1F3B]/20 bg-[#FAF7F4] hover:bg-[#EAE4DC] text-[#1B1F3B] text-xs font-medium transition shadow-xs"
            title="Open Developer REST API & Key Manager"
          >
            <Terminal className="w-3.5 h-3.5 text-[#6B3074]" />
            <span className="hidden sm:inline">Developer API</span>
            <span className="sm:hidden">API</span>
          </button>

          {/* User Account / Auth Actions */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#F3EFEA] border border-[#E5DFD7] text-xs">
                <div className="w-5 h-5 rounded-full bg-[#6B3074] text-white flex items-center justify-center font-bold text-[10px]">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="text-[#1B1F3B] font-semibold hidden sm:inline">{user.name}</span>
              </div>

              {/* Quick Studio Trigger button */}
              <button
                onClick={() => setCurrentView("form")}
                className="hidden lg:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-semibold text-xs shadow-coral transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Portfolio</span>
              </button>

              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg text-[#1B1F3B]/50 hover:text-rose-600 hover:bg-[#EAE4DC] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] text-white text-xs font-semibold shadow-coral transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
