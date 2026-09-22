import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ─── Sign Tokens ──────────────────────────────────────────────────────────────

/**
 * Create an access token for a user.
 * Access tokens are short-lived (15 min by default) and sent with every API request.
 * They carry the user's id and role so we don't need a DB lookup on every request.
 *
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} signed JWT string
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });
}

/**
 * Create a refresh token for a user.
 * Refresh tokens are long-lived (7 days by default) and only used to obtain a new
 * access token. We store them in the DB so we can revoke them on logout.
 *
 * @param {{ id: string }} payload  — only needs the user id
 * @returns {string} signed JWT string
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

// ─── Verify Tokens ────────────────────────────────────────────────────────────

/**
 * Verify and decode an access token.
 * Throws if the token is invalid or expired — callers must catch this.
 *
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

/**
 * Verify and decode a refresh token.
 * Throws if the token is invalid or expired.
 *
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}
