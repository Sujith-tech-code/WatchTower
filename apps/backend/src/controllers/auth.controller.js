import * as authService from "../services/auth.service.js";

// ─── Cookie Config ────────────────────────────────────────────────────────────

// Options for the refresh token cookie.
// httpOnly: JS can't access it (protects against XSS attacks)
// sameSite: only sent on same-site requests (protects against CSRF)
// maxAge: 7 days in milliseconds
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  // secure: true  ← we'll turn this on in production (requires HTTPS)
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Set the refresh token as a secure httpOnly cookie on the response.
 * Also returns it in the JSON body for clients (like mobile) that can't use cookies.
 */
function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
}

/**
 * Clear the refresh token cookie (used on logout).
 */
function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
  });
}

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 *
 * Creates a new user account and returns tokens.
 */
export async function registerController(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Basic presence check — Zod validation comes in Phase 12
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, and password are required.",
      });
    }

    const { user, accessToken, refreshToken } = await authService.register({
      name,
      email,
      password,
    });

    // Put the refresh token in an httpOnly cookie
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user,
        accessToken,
        // Also include refreshToken in the body for API clients that don't use cookies
        refreshToken,
      },
    });
  } catch (err) {
    next(err); // pass to our global error handler in app.js
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Authenticates a user and returns tokens.
 */
export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required.",
      });
    }

    const { user, accessToken, refreshToken } = await authService.login({
      email,
      password,
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      message: "Logged in successfully.",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Cookie: refreshToken  (or Body: { refreshToken } for API clients)
 *
 * Exchanges a refresh token for a new access token + rotated refresh token.
 */
export async function refreshController(req, res, next) {
  try {
    // Accept the token from cookie (browser) or body (API clients / mobile)
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided.",
      });
    }

    const { accessToken, refreshToken } = await authService.refresh(token);

    // Rotate the cookie too
    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: { accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 * Cookie: refreshToken  (or Body: { refreshToken })
 *
 * Invalidates the refresh token so it can never be used again.
 */
export async function logoutController(req, res, next) {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;

    if (token) {
      // Invalidate it in the DB (ignore errors — already logged out is fine)
      await authService.logout(token).catch(() => {});
    }

    // Clear the cookie regardless
    clearRefreshCookie(res);

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── Me ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <accessToken>
 *
 * Returns the current user's info.
 * This route is protected — the authenticate middleware runs before it
 * and attaches req.user if the token is valid.
 */
export async function meController(req, res) {
  // req.user is set by the authenticate middleware (next file we write)
  res.json({
    success: true,
    data: { user: req.user },
  });
}
