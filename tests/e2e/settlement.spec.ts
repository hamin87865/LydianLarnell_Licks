import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { E2E_BASE_URL, createContent, createMusicianApplication, createPaidPurchase, createPool, createUser, createUserSetting, ensureCleanEmailArtifacts, login, requireE2E } from "./_helpers";

test("settlement flow: pending becomes paid and duplicate pay is blocked", async (t) => {
  if (!requireE2E(t)) return;
  const pool = createPool();
  const adminEmail = `e2e-admin-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const musicianEmail = `e2e-settlement-musician-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const buyerEmail = `e2e-settlement-buyer-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const password = "Password!123";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const admin = await createUser(pool, { email: adminEmail, password, name: "E2E Admin", role: "admin" });
    const musician = await createUser(pool, { email: musicianEmail, password, name: "E2E Settlement Musician", role: "musician" });
    const buyer = await createUser(pool, { email: buyerEmail, password, name: "E2E Settlement Buyer" });
    await createUserSetting(pool, musician.id, "e2e-settlement-nick");
    await createMusicianApplication(pool, { userId: musician.id, email: musicianEmail, accountHolder: "정산테스터" });
    const content = await createContent(pool, { authorId: musician.id, authorName: musician.name, pdfPrice: 8000 });
    await createPaidPurchase(pool, { userId: buyer.id, contentId: content.id, amount: 8000, confirmedAt: new Date().toISOString() });

    const adminSession = await login(E2E_BASE_URL, adminEmail, password);
    const listBefore = await adminSession.json(`/api/admin/settlements?year=${year}&month=${month}`);
    assert.equal(listBefore.response.status, 200, JSON.stringify(listBefore.body));
    const target = (listBefore.body as any).settlements.find((item: any) => item.musicianUserId === musician.id);
    assert.ok(target, "seeded settlement should exist");
    assert.equal(target.status, "pending");

    const pay = await adminSession.json(`/api/admin/settlements/${musician.id}/pay?year=${year}&month=${month}`, {
      method: "POST",
    });
    assert.equal(pay.response.status, 200, JSON.stringify(pay.body));
    assert.equal((pay.body as any).settlement.status, "paid");

    const payAgain = await adminSession.json(`/api/admin/settlements/${musician.id}/pay?year=${year}&month=${month}`, {
      method: "POST",
    });
    assert.equal(payAgain.response.status, 409, JSON.stringify(payAgain.body));
  } finally {
    await pool.query(`DELETE FROM monthly_settlement_snapshots WHERE musician_user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))`, [musicianEmail]);
    await pool.query(`DELETE FROM monthly_settlement_status WHERE musician_user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))`, [musicianEmail]);
    await pool.query(`DELETE FROM purchases WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) IN (LOWER($1), LOWER($2), LOWER($3)))`, [adminEmail, musicianEmail, buyerEmail]);
    await pool.query(`DELETE FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) IN (LOWER($1), LOWER($2), LOWER($3)))`, [adminEmail, musicianEmail, buyerEmail]);
    await pool.query(`DELETE FROM contents WHERE author_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))`, [musicianEmail]);
    await pool.query(`DELETE FROM musician_applications WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))`, [musicianEmail]);
    await pool.query(`DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))`, [musicianEmail]);
    await ensureCleanEmailArtifacts(pool, adminEmail);
    await ensureCleanEmailArtifacts(pool, musicianEmail);
    await ensureCleanEmailArtifacts(pool, buyerEmail);
    await pool.end();
  }
});
