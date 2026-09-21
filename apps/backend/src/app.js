import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.routes.js";

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS — allows our frontend (different port/domain) to make requests to this server
app.use(
  cors({
    origin: env.frontendUrl,  // only allow requests from our frontend URL
    credentials: true,         // allow cookies to be sent
  })
);

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check — GET /api/health
app.use("/api/health", healthRouter);

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
