import { env } from "../config/env.js";

// Global error handling middleware
// Express knows this is an error handler because it has 4 parameters (err, req, res, next)
// Any time you call next(error) anywhere in the app, it lands here
export function errorHandler(err, req, res, next) {
  // Log the error so we can debug it
  console.error(`[ERROR] ${err.message}`);

  // Get the status code — default to 500 (Internal Server Error) if not set
  const statusCode = err.statusCode || 500;

  // Send a consistent error response
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only show the full error stack in development (never in production)
    ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
}

// Helper to create errors with a specific status code
// Usage: throw createError(404, "Service not found")
export function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
