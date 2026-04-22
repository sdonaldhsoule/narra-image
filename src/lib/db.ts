import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { getEnv } from "@/lib/env";

declare global {
  var __narraPrisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: getEnv().DATABASE_URL,
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalThis.__narraPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__narraPrisma__ = db;
}
