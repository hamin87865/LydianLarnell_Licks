import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const migrationScript = fs.readFileSync(new URL("../scripts/db-migrate.ts", import.meta.url), "utf8");

test("package.json exposes explicit db:migrate script", () => {
  assert.match(packageSource, /"db:migrate"\s*:/);
});

test("db migration script runs ensureDatabase and pending migrations", () => {
  assert.match(migrationScript, /ensureDatabase\(/);
  assert.match(migrationScript, /runPendingMigrations\(/);
});
