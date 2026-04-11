import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { E2E_BASE_URL, createPool, createUser, createVerifiedEmail, ensureCleanEmailArtifacts, HttpSession, requireE2E } from "./_helpers";

test("auth flow: email send/verify, signup, login, session", async (t) => {
  if (!requireE2E(t)) return;
  const pool = createPool();
  const email = `e2e-auth-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const password = "Password!123";

  try {
    await ensureCleanEmailArtifacts(pool, email);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const session = new HttpSession(E2E_BASE_URL);
      const sendResult = await session.json("/api/auth/email/send-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      assert.equal(sendResult.response.status, 200, JSON.stringify(sendResult.body));

      const codeResult = await pool.query(`SELECT code FROM email_verifications WHERE LOWER(email) = LOWER($1)`, [email]);
      assert.ok(codeResult.rows[0]?.code, "verification code should be persisted");

      const verifyResult = await session.json("/api/auth/email/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code: codeResult.rows[0].code }),
      });
      assert.equal(verifyResult.response.status, 200, JSON.stringify(verifyResult.body));
    } else {
      await createVerifiedEmail(pool, email);
    }

    const signupSession = new HttpSession(E2E_BASE_URL);
    const signupResult = await signupSession.json("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name: "E2E Auth User" }),
    });
    assert.equal(signupResult.response.status, 200, JSON.stringify(signupResult.body));

    const meResult = await signupSession.json("/api/auth/me");
    assert.equal(meResult.response.status, 200, JSON.stringify(meResult.body));
    assert.equal((meResult.body as any).user.email, email.toLowerCase());

    const logoutResult = await signupSession.json("/api/auth/logout", { method: "POST" });
    assert.equal(logoutResult.response.status, 200, JSON.stringify(logoutResult.body));

    const loginSession = new HttpSession(E2E_BASE_URL);
    const loginResult = await loginSession.json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    assert.equal(loginResult.response.status, 200, JSON.stringify(loginResult.body));

    const reloggedMe = await loginSession.json("/api/auth/me");
    assert.equal(reloggedMe.response.status, 200, JSON.stringify(reloggedMe.body));
    assert.equal((reloggedMe.body as any).user.email, email.toLowerCase());
  } finally {
    await ensureCleanEmailArtifacts(pool, email);
    await pool.end();
  }
});

test("login rejects invalid password", async (t) => {
  if (!requireE2E(t)) return;
  const pool = createPool();
  const email = `e2e-login-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  try {
    await ensureCleanEmailArtifacts(pool, email);
    await createUser(pool, { email, password: "Password!123", name: "E2E Login" });
    const session = new HttpSession(E2E_BASE_URL);
    const result = await session.json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "Wrong!123" }),
    });
    assert.equal(result.response.status, 401, JSON.stringify(result.body));
  } finally {
    await ensureCleanEmailArtifacts(pool, email);
    await pool.end();
  }
});
