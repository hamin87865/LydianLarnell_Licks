import fs from "fs";
import path from "path";
import { pool } from "../db";

export interface AppliedMigration {
  id: string;
  applied_at: string | Date;
}

export async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function migrationsDir() {
  return path.resolve(process.cwd(), "server", "migrations");
}

function checksumFor(content: string) {
  let hash = 0;
  for (let i = 0; i < content.length; i += 1) {
    hash = (hash * 31 + content.charCodeAt(i)) >>> 0;
  }
  return String(hash);
}

export async function runPendingMigrations() {
  await ensureMigrationTable();
  const dir = migrationsDir();
  if (!fs.existsSync(dir)) return [] as string[];

  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".sql")).sort();
  const applied = await pool.query<AppliedMigration>(`SELECT id, applied_at FROM schema_migrations`);
  const appliedMap = new Map(applied.rows.map((row) => [row.id, row]));
  const executed: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const sql = fs.readFileSync(fullPath, "utf8").trim();
    if (!sql) continue;
    const checksum = checksumFor(sql);

    if (appliedMap.has(file)) {
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)`, [file, checksum]);
      await client.query("COMMIT");
      executed.push(file);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return executed;
}
