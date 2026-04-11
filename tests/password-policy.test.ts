import test from "node:test";
import assert from "node:assert/strict";
import { assertPlaintextPasswordHashAllowed, isPlaintextPasswordHash } from "../server/lib/passwordPolicy";

test("plain text password hashes are rejected in production", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  assert.equal(isPlaintextPasswordHash("plain:secret"), true);
  assert.throws(() => assertPlaintextPasswordHashAllowed("plain:secret"), /Plain text passwords are not allowed in production\./);
  process.env.NODE_ENV = previous;
});

test("plain text password hashes remain allowed outside production for legacy dev fixtures", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  assert.doesNotThrow(() => assertPlaintextPasswordHashAllowed("plain:secret"));
  process.env.NODE_ENV = previous;
});
