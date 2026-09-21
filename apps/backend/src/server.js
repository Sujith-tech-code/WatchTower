import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";

const PORT = env.port;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 WatchTower backend running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${env.nodeEnv}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown — when the server is stopped (Ctrl+C),
// close the database connection cleanly before exiting
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected. Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received. Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected. Server closed.");
    process.exit(0);
  });
});
