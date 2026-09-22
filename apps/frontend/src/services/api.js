const API_BASE = "http://localhost:5000/api";

// In-memory token store — keeping the access token in memory (variable) is safer
// than localStorage, which is vulnerable to XSS attacks.
let inMemoryAccessToken = null;

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

/**
 * Base fetch wrapper that:
 * 1. Attaches the in-memory access token as a Bearer header.
 * 2. Sends cookies (credentials: "include") for the refresh token cookie.
 * 3. Handles automatic token refresh if a 401 is encountered.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // Default headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach access token if we have one
  if (inMemoryAccessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
  }

  const config = {
    ...options,
    headers,
    credentials: "include", // essential for sending httpOnly cookies across domains
  };

  let response = await fetch(url, config);

  // If 401 and we're not already trying to refresh or login/register, try refreshing
  if (response.status === 401 && !endpoint.startsWith("/auth/")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Re-run original request with new access token
      headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
      response = await fetch(url, { ...config, headers });
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "An error occurred");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Call the refresh endpoint to get a fresh access token using the httpOnly cookie.
 */
async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      setAccessToken(null);
      return false;
    }

    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      return true;
    }
  } catch {
    setAccessToken(null);
  }
  return false;
}
