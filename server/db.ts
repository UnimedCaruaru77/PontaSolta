import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === "production";

const connectionString = isProduction
  ? process.env.CLOUD_SQL_URL
  : (process.env.DATABASE_URL || process.env.CLOUD_SQL_URL);

if (!connectionString) {
  throw new Error(
    isProduction
      ? "CLOUD_SQL_URL must be set in production."
      : "DATABASE_URL must be set in development. Did you forget to provision a database?",
  );
}

console.log(`[db] Environment: ${isProduction ? "production → CLOUD_SQL_URL" : "development → DATABASE_URL"}`);

const poolConfig: pg.PoolConfig = { connectionString };

if (isProduction) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });
