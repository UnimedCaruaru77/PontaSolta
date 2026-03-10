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

  // Add assignee_id to task_shares if missing
  await db.execute(sql`
    ALTER TABLE task_shares ADD COLUMN IF NOT EXISTS assignee_id VARCHAR REFERENCES users(id) ON DELETE SET NULL
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tags (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR NOT NULL,
      color VARCHAR NOT NULL DEFAULT '#22c55e',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id VARCHAR NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      tag_id VARCHAR NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, tag_id)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS task_dependencies (
      task_id VARCHAR NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      depends_on_task_id VARCHAR NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (task_id, depends_on_task_id)
    )
  `);

  // Add renegotiation columns to tasks if missing
  await db.execute(sql`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS renegotiation_count INTEGER NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_renegotiated_at TIMESTAMP
  `);

  // Add renegotiated status to status enum if missing
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum WHERE enumlabel = 'renegotiated'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status')
      ) THEN
        ALTER TYPE status ADD VALUE 'renegotiated';
      END IF;
    END$$
  `);
}
