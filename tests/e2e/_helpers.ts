import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Pool } from "pg";

export const E2E_BASE_URL = String(process.env.E2E_BASE_URL || "").trim().replace(/\/$/, "");
export const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
export const E2E_ENABLED = Boolean(E2E_BASE_URL && DATABASE_URL);

export function requireE2E(t: { skip: (message?: string) => void }) {
  if (!DATABASE_URL && !E2E_BASE_URL) {
    t.skip("DATABASE_URL와 E2E_BASE_URL이 없어 실행형 E2E 테스트를 건너뜁니다.");
    return false;
  }

  if (!DATABASE_URL) {
    t.skip("DATABASE_URL가 없어 실행형 E2E 테스트를 건너뜁니다.");
    return false;
  }

  if (!E2E_BASE_URL) {
    t.skip("E2E_BASE_URL이 없어 실행형 E2E 테스트를 건너뜁니다.");
    return false;
  }

  return true;
}

export function createPool() {
  assert.ok(DATABASE_URL, "DATABASE_URL is required for E2E tests");
  return new Pool({ connectionString: DATABASE_URL });
}

export class HttpSession {
  private cookies = new Map<string, string>();
  constructor(private readonly baseUrl: string) {}

  async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (this.cookies.size > 0) {
      headers.set("cookie", Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join("; "));
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      redirect: "manual",
    });

    const setCookie = response.headers.getSetCookie?.() || [];
    for (const raw of setCookie) {
      const [pair] = raw.split(";", 1);
      const [name, value] = pair.split("=");
      if (name && value) this.cookies.set(name, value);
    }
    return response;
  }

  async json<T = any>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (init.body && !headers.has("content-type") && !(init.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }
    const response = await this.request(path, { ...init, headers });
    const text = await response.text();
    let body: T | string | null = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { response, body };
  }
}

export async function ensureCleanEmailArtifacts(pool: Pool, email: string) {
  await pool.query(`DELETE FROM password_reset_requests WHERE LOWER(email) = LOWER($1)`, [email]);
  await pool.query(`DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1)`, [email]);
  await pool.query(`DELETE FROM deleted_accounts WHERE LOWER(email) = LOWER($1)`, [email]);
  await pool.query(`DELETE FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
}

export async function createUser(pool: Pool, args: { email: string; password: string; name: string; role?: "basic" | "musician" | "admin" }) {
  const role = args.role || "basic";
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, upgrade_request_status)
     VALUES ($1, $2, $3, $4, 'none')
     RETURNING id, email, name, role`,
    [args.email.toLowerCase(), `plain:${args.password}`, args.name, role],
  );
  return result.rows[0] as { id: string; email: string; name: string; role: string };
}

export async function createVerifiedEmail(pool: Pool, email: string, code = "123456") {
  await pool.query(
    `INSERT INTO email_verifications (email, code, expires_at, verified_at, created_at)
     VALUES ($1, $2, NOW() + INTERVAL '5 minute', NOW(), NOW())
     ON CONFLICT (email)
     DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, verified_at = EXCLUDED.verified_at, consumed_at = NULL`,
    [email.toLowerCase(), code],
  );
}

export async function login(baseUrl: string, email: string, password: string) {
  const session = new HttpSession(baseUrl);
  const { response, body } = await session.json("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, JSON.stringify(body));
  return session;
}

export async function createMusicianApplication(pool: Pool, args: { userId: string; email: string; bankName?: string; accountNumber?: string; accountHolder?: string }) {
  await pool.query(
    `INSERT INTO musician_applications (user_id, name, nickname, category, email, bank_name, account_number, account_number_last4, account_holder, video_file_name, video_size, video_path, created_at, status)
     VALUES ($1, 'E2E Musician', 'e2e-m', 'guitar', $2, $3, $4, RIGHT(REGEXP_REPLACE(COALESCE($4, ''), '\\D', '', 'g'), 4), $5, 'video.mp4', 10, '/uploads/videos/test.mp4', NOW(), 'approved')`,
    [args.userId, args.email.toLowerCase(), args.bankName || '카카오뱅크', args.accountNumber || '3333222211110000', args.accountHolder || 'E2E Musician'],
  );
}

export async function createUserSetting(pool: Pool, userId: string, nickname: string) {
  await pool.query(
    `INSERT INTO user_settings (user_id, nickname, layout, language, notifications_enabled)
     VALUES ($1, $2, 'horizontal', 'ko', TRUE)
     ON CONFLICT (user_id)
     DO UPDATE SET nickname = EXCLUDED.nickname`,
    [userId, nickname],
  );
}

export async function createContent(pool: Pool, args: { authorId: string; authorName: string; title?: string; pdfPrice?: number; videoUrl?: string; hasPdf?: boolean }) {
  const result = await pool.query(
    `INSERT INTO contents (title, description, category, thumbnail, video_url, pdf_file, pdf_file_name, author_id, author_name, pdf_price)
     VALUES ($1, 'e2e description', 'guitar', '/uploads/thumbnails/e2e.png', $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      args.title || `e2e-content-${randomUUID()}`,
      args.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      args.hasPdf === false ? null : 'e2e/test.pdf',
      args.hasPdf === false ? null : 'test.pdf',
      args.authorId,
      args.authorName,
      args.pdfPrice ?? 3000,
    ],
  );
  return result.rows[0] as { id: string };
}

export async function createPaidPurchase(pool: Pool, args: { userId: string; contentId: string; amount: number; confirmedAt?: string }) {
  const orderId = `e2e-${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  const order = await pool.query(
    `INSERT INTO payment_orders (order_id, user_id, content_id, amount, currency, order_name, status, provider, requested_at, created_at, updated_at, approved_at, confirmed_at, payment_key)
     VALUES ($1, $2, $3, $4, 'KRW', 'E2E Order', 'paid', 'toss', NOW(), NOW(), NOW(), NOW(), COALESCE($5::timestamptz, NOW()), $6)
     RETURNING id, order_id`,
    [orderId, args.userId, args.contentId, args.amount, args.confirmedAt || null, `payment-${randomUUID()}`],
  );
  await pool.query(
    `INSERT INTO purchases (user_id, content_id, payment_order_id, status)
     VALUES ($1, $2, $3, 'active')`,
    [args.userId, args.contentId, order.rows[0].id],
  );
  return order.rows[0] as { id: string; order_id: string };
}

export function createTinyPngFile() {
  const dir = join(tmpdir(), 'lydian-larnell-e2e');
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${randomUUID()}.png`);
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnL8XkAAAAASUVORK5CYII=', 'base64');
  writeFileSync(filePath, bytes);
  return new File([bytes], 'thumbnail.png', { type: 'image/png' });
}
