import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch, setAccessToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app startup, try to restore the session silently using the refresh cookie
  useEffect(() => {
    async function restoreSession() {
      try {
        // Refresh token from httpOnly cookie
        const res = await apiFetch("/auth/refresh", { method: "POST" });
        if (res?.data?.accessToken) {
          setAccessToken(res.data.accessToken);

          // Get user details
          const meRes = await apiFetch("/auth/me");
          if (meRes?.data?.user) {
            setUser(meRes.data.user);
          }
        }
      } catch (err) {
        // No active session — that's totally fine, user will see the login screen
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Register function
  async function register(name, email, password) {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (res?.data?.accessToken) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
    }
    return res;
  }

  // Login function
  async function login(email, password) {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res?.data?.accessToken) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
    }
    return res;
  }

  // Logout function
  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Even if network fails, clear local state
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
