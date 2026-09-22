import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS — allows our frontend (different port/domain) to make requests to this server
app.use(
  cors({
    origin: env.frontendUrl,  // only allow requests from our frontend URL
    credentials: true,         // allow cookies to be sent (needed for refresh token cookie)
  })
);

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Parse cookies — needed so req.cookies.refreshToken works in auth routes
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check — GET /api/health
app.use("/api/health", healthRouter);

// Auth — POST /api/auth/register, /login, /refresh, /logout | GET /api/auth/me
app.use("/api/auth", authRouter);

// 404 handler — catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
// Must be last — catches errors from all routes above
app.use(errorHandler);

export default app;
