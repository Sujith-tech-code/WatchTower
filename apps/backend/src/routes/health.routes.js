import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/health
// Returns server status and database connectivity
router.get("/", async (req, res) => {
  try {
    // Try a simple DB query to confirm database is connected
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "WatchTower API is running",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    // Server is up but database is not reachable
    res.status(503).json({
      success: false,
      message: "WatchTower API is running but database is not connected",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

export default router;
