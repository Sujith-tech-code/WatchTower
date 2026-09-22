import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Loader2 } from "lucide-react";

/**
 * Loading screen shown while we verify if the user has an active session
 */
function FullPageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      <p className="text-sm font-medium tracking-wide">Loading WatchTower...</p>
    </div>
  );
}

/**
 * Wrap routes that REQUIRE authentication (e.g. Dashboard, Services, Incidents).
 * If user is not logged in, redirect to /login.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Wrap routes that are ONLY for guests (e.g. /login, /register).
 * If user is already logged in, redirect to /dashboard.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;

  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
