import "dotenv/config";
import { ensureDatabase, finalizeDatabaseSetup, pool } from "../server/db";
import { runPendingMigrations } from "../server/lib/migrations";

async function main() {
  await ensureDatabase();
  const applied = await runPendingMigrations();
  console.log(`[db:migrate] applied=${applied.length}`);
  for (const id of applied) {
    console.log(`[db:migrate] ${id}`);
  }
  await finalizeDatabaseSetup();
}

main()
  .catch((error) => {
    console.error(`[db:migrate] failed: ${error instanceof Error ? error.stack || error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
