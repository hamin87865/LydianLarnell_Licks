import test from "node:test";
import assert from "node:assert/strict";
import { validateRuntimeEnv } from "../server/lib/env";

test("runtime env validator catches partial email, toss config, and missing account key", () => {
  const result = validateRuntimeEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
    SESSION_SECRET: "a".repeat(32),
    UPLOAD_ROOT: "/var/data/uploads",
    EMAIL_USER: "test@example.com",
    VITE_TOSS_PAYMENTS_CLIENT_KEY: "client-key",
  });

  assert.equal(result.errors.includes("EMAIL_USER 와 EMAIL_PASS 는 함께 설정되어야 합니다."), true);
  assert.equal(result.errors.some((value) => value.includes("토스 결제 연동")), true);
  assert.equal(result.errors.includes("운영 환경에서는 ACCOUNT_ENCRYPTION_KEY 환경변수가 필요합니다."), true);
});

test("runtime env validator accepts minimal production env", () => {
  const result = validateRuntimeEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
    SESSION_SECRET: "a".repeat(32),
    UPLOAD_ROOT: "/var/data/uploads",
    ACCOUNT_ENCRYPTION_KEY: "x".repeat(32),
  });

  assert.deepEqual(result.errors, []);
});


test("runtime env validator blocks default admin auto creation in production", () => {
  const result = validateRuntimeEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
    SESSION_SECRET: "a".repeat(32),
    UPLOAD_ROOT: "/var/data/uploads",
    ACCOUNT_ENCRYPTION_KEY: "x".repeat(32),
    CREATE_DEFAULT_ADMIN: "true",
  });

  assert.equal(result.errors.includes("운영 환경에서는 CREATE_DEFAULT_ADMIN=true 를 사용할 수 없습니다."), true);
});
