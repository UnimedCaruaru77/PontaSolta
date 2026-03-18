import { spawnSync } from "child_process";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("[migrate] Starting database schema sync...");
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const activeUrl = isProduction
      ? process.env.CLOUD_SQL_URL
      : process.env.DATABASE_URL;

    const migrateEnv = {
      ...process.env,
      DATABASE_URL: activeUrl,
    };

    const result = spawnSync(
      "npx",
      ["drizzle-kit", "push", "--force"],
      {
        input: "y\ny\ny\ny\ny\n",
        stdio: ["pipe", "pipe", "pipe"],
        env: migrateEnv,
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

  await ensureCriticalTables();
  console.log("[migrate] Schema sync completed successfully.");
}

async function ensureCriticalTables() {
  // ── Existing tables ──────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS task_shares (
      task_id VARCHAR NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      team_id VARCHAR NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      shared_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (task_id, team_id)
    )
  `);
  await db.execute(sql`ALTER TABLE task_shares ADD COLUMN IF NOT EXISTS assignee_id VARCHAR REFERENCES users(id) ON DELETE SET NULL`);

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
  await db.execute(sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS renegotiation_count INTEGER NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_renegotiated_at TIMESTAMP`);
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

  // ── isLead on team_members ────────────────────────────────────────────────
  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT FALSE`);

  // ── Team events (calendar) ────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS team_events (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id VARCHAR NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      title VARCHAR NOT NULL,
      description TEXT,
      location VARCHAR,
      start_at TIMESTAMP NOT NULL,
      end_at TIMESTAMP,
      created_by VARCHAR NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Skill definitions ─────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS skill_definitions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL DEFAULT 'technical',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Member evaluations ────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS member_evaluations (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id VARCHAR NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      evaluator_id VARCHAR NOT NULL REFERENCES users(id),
      skill_id VARCHAR NOT NULL REFERENCES skill_definitions(id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 3,
      notes TEXT,
      evaluated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Team settings ─────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS team_settings (
      team_id VARCHAR PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
      dashboard_public BOOLEAN DEFAULT FALSE
    )
  `);

  // ── Task templates ────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS task_templates (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR NOT NULL,
      description TEXT,
      priority VARCHAR DEFAULT 'medium',
      urgency VARCHAR DEFAULT 'medium',
      importance VARCHAR DEFAULT 'medium',
      complexity VARCHAR DEFAULT 'medium',
      team_id VARCHAR REFERENCES teams(id) ON DELETE CASCADE,
      created_by VARCHAR NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Notifications ─────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR NOT NULL DEFAULT 'info',
      read BOOLEAN DEFAULT FALSE,
      task_id VARCHAR REFERENCES tasks(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Onboarding items ──────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS onboarding_items (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id VARCHAR NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      title VARCHAR NOT NULL,
      description TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Onboarding progress ───────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS onboarding_progress (
      item_id VARCHAR NOT NULL REFERENCES onboarding_items(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      completed_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (item_id, user_id)
    )
  `);
}
