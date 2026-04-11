import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { E2E_BASE_URL, createContent, createPaidPurchase, createPool, createUser, ensureCleanEmailArtifacts, login, requireE2E } from "./_helpers";

test("payment flow: prepare succeeds, paid duplicate confirm is blocked, PDF permission is enforced", async (t) => {
  if (!requireE2E(t)) return;
  const pool = createPool();
  const buyerEmail = `e2e-buyer-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const musicianEmail = `e2e-musician-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const password = "Password!123";

  try {
    const buyer = await createUser(pool, { email: buyerEmail, password, name: "E2E Buyer" });
    const musician = await createUser(pool, { email: musicianEmail, password, name: "E2E Musician", role: "musician" });
    const content = await createContent(pool, { authorId: musician.id, authorName: musician.name, pdfPrice: 5000, hasPdf: true });

    const buyerSession = await login(E2E_BASE_URL, buyerEmail, password);

    const prepare = await buyerSession.json("/api/payments/prepare", {
      method: "POST",
      body: JSON.stringify({ contentId: content.id }),
    });
    assert.equal(prepare.response.status, 200, JSON.stringify(prepare.body));
    assert.ok((prepare.body as any).orderId);

    const deniedDownload = await buyerSession.request(`/api/contents/${content.id}/pdf-download`);
    assert.equal(deniedDownload.status, 403);

    const paidOrder = await createPaidPurchase(pool, { userId: buyer.id, contentId: content.id, amount: 5000 });
    const duplicateConfirm = await buyerSession.json("/api/payments/confirm", {
      method: "POST",
      body: JSON.stringify({ orderId: paidOrder.order_id, paymentKey: `dup-${randomUUID()}`, amount: 5000 }),
    });
    assert.equal(duplicateConfirm.response.status, 200, JSON.stringify(duplicateConfirm.body));
    assert.equal((duplicateConfirm.body as any).alreadyProcessed, true);

    const allowedDownload = await buyerSession.request(`/api/contents/${content.id}/pdf-download`);
    assert.equal(allowedDownload.status, 200);
  } finally {
    await pool.query(`DELETE FROM purchases WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) IN (LOWER($1), LOWER($2)))`, [buyerEmail, musicianEmail]);
    await pool.query(`DELETE FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) IN (LOWER($1), LOWER($2)))`, [buyerEmail, musicianEmail]);
    await pool.query(`DELETE FROM contents WHERE author_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($1))`, [musicianEmail]);
    await ensureCleanEmailArtifacts(pool, buyerEmail);
    await ensureCleanEmailArtifacts(pool, musicianEmail);
    await pool.end();
  }
});

test("payment confirm live sandbox success can run when explicit Toss fixtures are provided", { skip: !process.env.E2E_TOSS_PAYMENT_KEY || !process.env.E2E_TOSS_ORDER_ID || !process.env.E2E_TOSS_AMOUNT }, async (t) => {
  if (!requireE2E(t)) return;
  const session = await login(E2E_BASE_URL, String(process.env.E2E_TOSS_LOGIN_EMAIL), String(process.env.E2E_TOSS_LOGIN_PASSWORD));
  const result = await session.json("/api/payments/confirm", {
    method: "POST",
    body: JSON.stringify({
      orderId: process.env.E2E_TOSS_ORDER_ID,
      paymentKey: process.env.E2E_TOSS_PAYMENT_KEY,
      amount: Number(process.env.E2E_TOSS_AMOUNT),
    }),
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal((result.body as any).success, true);
});
