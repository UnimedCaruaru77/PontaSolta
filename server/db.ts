import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.CLOUD_SQL_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "CLOUD_SQL_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const poolConfig: pg.PoolConfig = {
  connectionString,
};

if (process.env.USE_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });
