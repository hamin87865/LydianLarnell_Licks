import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { randomBytes, scryptSync } from "crypto";
import { FEATURE_FLAGS } from "./lib/featureFlags";
import { assertPlaintextPasswordHashAllowed, isPlaintextPasswordHash } from "./lib/passwordPolicy";

const databaseUrl = process.env.DATABASE_URL;
const dbSslMode = (process.env.DB_SSL_MODE || "auto").toLowerCase();

function resolveSsl() {
  if (dbSslMode === "disable" || dbSslMode === "false") {
    return false;
  }

  if (dbSslMode === "require" || dbSslMode === "true") {
    return { rejectUnauthorized: false };
  }

  if (!databaseUrl) {
    return false;
  }

  const isLocalConnection = /localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\./i.test(databaseUrl);
  return isLocalConnection ? false : { rejectUnauthorized: false };
}

function maskHost(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const host = url.hostname || "unknown";

    if (host.length <= 4) {
      return `${host.slice(0, 1)}***`;
    }

    return `${host.slice(0, 2)}***${host.slice(-2)}`;
  } catch {
    return "unknown";
  }
}

function classifyDbError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";

  if (code === "28P01") return "DB 인증 실패";
  if (code === "3D000") return "DB 데이터베이스 없음";
  if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH"].includes(code)) return "DB 네트워크 연결 실패";
  if (/ssl/i.test(message)) return "DB SSL 설정 불일치";
  return "DB 연결 실패";
}

if (!databaseUrl) {
  console.warn("[db] DATABASE_URL 이 설정되지 않았습니다.");
} else {
  const ssl = resolveSsl();
  console.info(
    `[db] PostgreSQL 사용 (${ssl ? "ssl" : "non-ssl"}, host=${maskHost(databaseUrl)}, env=${process.env.NODE_ENV || "development"})`,
  );
}

export const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: resolveSsl(),
      }
    : undefined,
);

export async function ensureDatabase() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  }

  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire"
      ON "session" ("expire");
    `);
  } catch (error) {
    const reason = classifyDbError(error);
    throw new Error(`${reason}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function finalizeDatabaseSetup() {
  await pool.query(`DELETE FROM email_verifications WHERE expires_at < NOW() - INTERVAL '1 day' OR consumed_at IS NOT NULL;`);
  await pool.query(`DELETE FROM password_reset_requests WHERE expires_at < NOW() - INTERVAL '1 day';`);

  const isProduction = process.env.NODE_ENV === 'production';
  const requestedDefaultAdmin = process.env.CREATE_DEFAULT_ADMIN === 'true';
  const shouldCreateDefaultAdmin =
    (!isProduction && process.env.SKIP_DEFAULT_ADMIN !== 'true') ||
    (!isProduction && requestedDefaultAdmin) ||
    (isProduction && FEATURE_FLAGS.allowProductionDefaultAdmin && requestedDefaultAdmin);

  if (shouldCreateDefaultAdmin) {
    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
    const adminPassword = String(process.env.DEFAULT_ADMIN_PASSWORD || '').trim();
    const adminName = process.env.DEFAULT_ADMIN_NAME || '시스템 관리자';

    if (!adminPassword) {
      throw new Error('기본 관리자 생성에는 DEFAULT_ADMIN_PASSWORD 환경변수가 필요합니다.');
    }

    await pool.query(
      `
        INSERT INTO users (email, password_hash, name, role, upgrade_request_status)
        VALUES ($1, $2, $3, 'admin', 'none')
        ON CONFLICT (email) DO NOTHING
      `,
      [adminEmail, hashForSeed(adminPassword), adminName],
    );
  }
}

function hashForSeed(password: string) {
  assertPlaintextPasswordHashAllowed(password);
  if (isPlaintextPasswordHash(password)) return password;

  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function createSessionStore() {
  const PgStore = connectPgSimple(session);
  return new PgStore({
    pool,
    tableName: "session",
    createTableIfMissing: false,
  });
}
