import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Shield, LogOut, CheckCircle2, User, Mail, KeyRound } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Watch<span className="text-emerald-400">Tower</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Authentication Successful! 🎉
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Phase 2 is fully operational. You are logged in via JWT session.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                <User className="w-4 h-4 text-emerald-400" />
                <span>NAME</span>
              </div>
              <p className="text-base font-medium text-white">{user?.name}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>EMAIL</span>
              </div>
              <p className="text-base font-medium text-white">{user?.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>ROLE</span>
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {user?.role || "OWNER"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
