import { execSync } from "child_process";

export async function runMigrations() {
  console.log("[migrate] Starting database schema sync...");
  try {
    execSync("npx drizzle-kit push --force", {
      stdio: "pipe",
      env: process.env,
      cwd: process.cwd(),
    });
    console.log("[migrate] Schema sync completed successfully.");
  } catch (err: any) {
    const output = err.stdout?.toString() || err.stderr?.toString() || String(err);
    console.error("[migrate] Schema sync failed:", output);
  }
}
