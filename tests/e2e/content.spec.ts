import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { E2E_BASE_URL, createPool, createTinyPngFile, createUser, createVerifiedEmail, createUserSetting, ensureCleanEmailArtifacts, login, requireE2E } from "./_helpers";

test("content upload allows supported YouTube URL and blocks invalid URL", async (t) => {
  if (!requireE2E(t)) return;
  const pool = createPool();
  const email = `e2e-content-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const password = "Password!123";

  try {
    await ensureCleanEmailArtifacts(pool, email);
    const user = await createUser(pool, { email, password, name: "E2E Musician", role: "musician" });
    await createUserSetting(pool, user.id, "e2e-musician");
    const session = await login(E2E_BASE_URL, email, password);

    const validForm = new FormData();
    validForm.set("title", "E2E URL Upload");
    validForm.set("description", "content upload verification");
    validForm.set("category", "guitar");
    validForm.set("videoUrl", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    validForm.set("pdfPrice", "1000");
    validForm.set("thumbnail", createTinyPngFile());
    const valid = await session.json("/api/contents", { method: "POST", body: validForm });
    assert.equal(valid.response.status, 200, JSON.stringify(valid.body));
    assert.ok((valid.body as any).content?.id);

    const invalidForm = new FormData();
    invalidForm.set("title", "E2E Invalid URL Upload");
    invalidForm.set("description", "content upload verification");
    invalidForm.set("category", "guitar");
    invalidForm.set("videoUrl", "https://example.com/not-supported-video");
    invalidForm.set("thumbnail", createTinyPngFile());
    const invalid = await session.json("/api/contents", { method: "POST", body: invalidForm });
    assert.equal(invalid.response.status, 400, JSON.stringify(invalid.body));
  } finally {
    await pool.query(`DELETE FROM contents WHERE author_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))`, [email]);
    await ensureCleanEmailArtifacts(pool, email);
    await pool.end();
  }
});
