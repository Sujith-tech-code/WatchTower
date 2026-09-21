import { PrismaClient } from "@prisma/client";

// Create a single Prisma instance and reuse it throughout the app
// This prevents creating too many database connections
const prisma = new PrismaClient({
  log: ["error", "warn"], // log DB errors and warnings (not every query)
});

export default prisma;
