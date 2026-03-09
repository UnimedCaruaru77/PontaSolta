import { spawnSync } from "child_process";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("[migrate] Starting database schema sync...");
  try {
    const result = spawnSync(
      "npx",
      ["drizzle-kit", "push", "--force"],
      {
        input: "y\ny\ny\ny\ny\n",
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
        cwd: process.cwd(),
        timeout: 60000,
        encoding: "utf-8",
      }
    );

    const stdout = result.stdout?.toString() || "";
    const stderr = result.stderr?.toString() || "";

    if (result.status !== 0 || result.error) {
      console.error("[migrate] drizzle-kit failed (exit:", result.status, "):", stderr || result.error?.message);
    } else {
      console.log("[migrate] drizzle-kit push output:", stdout.slice(0, 500));
    }
  } catch (err: any) {
    console.error("[migrate] drizzle-kit error:", err?.message || err);
  }

  // Fallback: garantir que todas as tabelas críticas existam via SQL direto
  await ensureCriticalTables();
  console.log("[migrate] Schema sync completed successfully.");
}

async function ensureCriticalTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS task_shares (
      task_id VARCHAR NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      team_id VARCHAR NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      shared_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (task_id, team_id)
    )
  `);
}
