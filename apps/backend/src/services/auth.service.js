import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";

// How many times bcrypt scrambles the password before hashing.
// 12 is the recommended balance of security vs speed (higher = slower but safer).
const SALT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Register a new user.
 * - Checks the email isn't already taken
 * - Hashes the password with bcrypt (never store plain text)
 * - Creates the User record in the database
 * - Returns a fresh access token + refresh token so the user is instantly logged in
 *
 * @param {{ name: string, email: string, password: string }} data
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export async function register({ name, email, password }) {
  // 1. Make sure the email isn't already registered
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // We throw a plain Error with a `status` property — our errorHandler reads it
    const err = new Error("An account with that email already exists.");
    err.status = 409; // 409 = Conflict
    throw err;
  }

  // 2. Hash the password — bcrypt adds a random "salt" before hashing,
  //    so even two users with the same password get different hashes
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Save the new user to MongoDB via Prisma
  const user = await prisma.user.create({
    data: { name, email, password: passwordHash },
    // Only return safe fields — never return the password hash!
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // 4. Create tokens so the user is logged in immediately after registering
  const { accessToken, refreshToken } = await _createTokenPair(user);

  return { user, accessToken, refreshToken };
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Log in an existing user.
 * - Finds the user by email
 * - Compares the provided password against the stored hash
 * - Returns fresh tokens on success
 *
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export async function login({ email, password }) {
  // 1. Look up the user by email
  const user = await prisma.user.findUnique({ where: { email } });

  // 2. Use a generic error message regardless of whether the email or password is wrong.
  //    Telling an attacker which one is wrong gives them useful information.
  const invalidErr = new Error("Invalid email or password.");
  invalidErr.status = 401; // 401 = Unauthorized

  if (!user) throw invalidErr;

  // 3. Compare the submitted password against the stored bcrypt hash
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw invalidErr;

  // 4. Build a safe user object (no password field) for the response
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  // 5. Issue new tokens
  const { accessToken, refreshToken } = await _createTokenPair(safeUser);

  return { user: safeUser, accessToken, refreshToken };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

/**
 * Exchange a valid refresh token for a new access token (and rotate the refresh token).
 * "Rotation" means we delete the old refresh token and issue a new one on every use.
 * This limits the damage if a refresh token is ever stolen — it can only be used once.
 *
 * @param {string} token  — the refresh token string from the client
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export async function refresh(token) {
  // 1. Verify the JWT signature and expiry
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const err = new Error("Invalid or expired refresh token.");
    err.status = 401;
    throw err;
  }

  // 2. Check the token still exists in our DB (proves it hasn't been logged out)
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error("Refresh token not found or expired.");
    err.status = 401;
    throw err;
  }

  // 3. Load the user so we can put fresh data into the new access token
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) {
    const err = new Error("User not found.");
    err.status = 401;
    throw err;
  }

  // 4. Delete the old refresh token (rotation — it's one-time-use)
  await prisma.refreshToken.delete({ where: { token } });

  // 5. Issue a fresh pair
  const { accessToken, refreshToken } = await _createTokenPair(user);

  return { accessToken, refreshToken };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * Invalidate a refresh token.
 * Removes it from the DB so it can never be used again, even if it hasn't expired.
 * The access token will naturally expire on its own (15 min).
 *
 * @param {string} token  — the refresh token string from the client
 */
export async function logout(token) {
  // Delete silently — if the token doesn't exist, that's fine (already logged out)
  await prisma.refreshToken.deleteMany({ where: { token } });
}

// ─── Private Helper ───────────────────────────────────────────────────────────

/**
 * Create an access + refresh token pair and store the refresh token in the DB.
 * Private — only used inside this file.
 *
 * @param {{ id: string, email: string, role: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
async function _createTokenPair(user) {
  // Sign both tokens
  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  // Parse the refresh expiry string (e.g. "7d") into a real Date for DB storage
  const expiresAt = _parseExpiry("7d");

  // Store the refresh token in the DB linked to this user
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Convert an expiry string like "7d" or "15m" into an absolute Date.
 * We need this to store `expiresAt` on the RefreshToken in the DB.
 *
 * @param {string} expiry  — "7d", "15m", "1h", etc.
 * @returns {Date}
 */
function _parseExpiry(expiry) {
  const unit = expiry.slice(-1);         // last character: "d", "m", "h"
  const value = parseInt(expiry, 10);    // numeric part

  const multipliers = { m: 60, h: 3600, d: 86400 };
  const seconds = value * (multipliers[unit] ?? 60);

  return new Date(Date.now() + seconds * 1000);
}
