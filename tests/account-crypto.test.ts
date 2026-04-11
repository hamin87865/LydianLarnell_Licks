import test from "node:test";
import assert from "node:assert/strict";
import { decryptAccountNumber, encryptAccountNumber, maskAccountNumber } from "../server/lib/accountCrypto";

test("account encryption roundtrip keeps last4 and hides plaintext", () => {
  process.env.ACCOUNT_ENCRYPTION_KEY = "test-account-key-12345678901234567890";
  const original = "123-456-78901234";
  const encrypted = encryptAccountNumber(original);

  assert.ok(encrypted.encrypted);
  assert.equal(encrypted.last4, "1234");
  assert.notEqual(encrypted.encrypted, original);
  assert.equal(decryptAccountNumber(encrypted.encrypted), original);
  assert.equal(maskAccountNumber(original, encrypted.last4), "**********1234");
});
