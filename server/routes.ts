import type { Express, Request, Response } from "express";
import session from "express-session";
import { type Server } from "http";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { ensureDatabase, finalizeDatabaseSetup, pool, createSessionStore } from "./db";
import { runPendingMigrations } from "./lib/migrations";
import type { PoolClient, QueryResultRow } from "pg";
import { ApiError, sendError } from "./lib/errors";
import { getRequestAuditMeta } from "./lib/audit";
import { normalizeOptionalText, parseEmail, parseKrwAmount, parseUuid, requireMinPaidPdfPrice } from "./lib/validators";
import { decryptAccountNumber, encryptAccountNumber, maskAccountNumber } from "./lib/accountCrypto";
import { assertPlaintextPasswordHashAllowed, isPlaintextPasswordHash } from "./lib/passwordPolicy";
import { FEATURE_FLAGS } from "./lib/featureFlags";
import { assertPathInsideRoot, CONTRACTS_DIR, ensureUploadDirs, PDFS_DIR, PROFILE_IMAGES_DIR, resolveStoredPath, THUMBNAILS_DIR, toPublicUrlFromAbsolutePath, toStoredRelativePath, UPLOAD_ROOT, VIDEOS_DIR } from "./lib/storagePaths";
import multer from "multer";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { isSupportedVideoUrl } from "@shared/videoPolicy";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "basic" | "musician" | "admin";
  upgradeRequestStatus: "none" | "pending" | "approved" | "rejected";
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  name: string;
  role: "basic" | "musician" | "admin";
  upgrade_request_status: "none" | "pending" | "approved" | "rejected";
}

interface PublicProfileSettingsRow extends QueryResultRow {
  nickname: string | null;
  profile_image: string | null;
  bio: string | null;
  instagram: string | null;
  layout: string | null;
  language: string | null;
}

interface SettlementStatusRow extends QueryResultRow {
  musician_user_id: string;
  status: string;
  paid_at: string | Date | null;
  paid_by_admin_id: string | null;
}

interface SettlementDetailRow extends QueryResultRow {
  musician_user_id: string;
  real_name: string | null;
  nickname: string | null;
  musician_name: string;
  bank_name: string | null;
  account_number: string | null;
  account_number_encrypted: string | null;
  account_number_last4: string | null;
  account_holder: string | null;
  content_id: string;
  title: string;
  pdf_price: string | number | null;
  sale_count: number | string | null;
  subtotal_amount: string | number | null;
}

interface SettlementItem {
  contentId: string;
  title: string;
  price: number;
  count: number;
  subtotal: number;
}

interface SettlementAccountInfo {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
}

interface SettlementSummary {
  musicianUserId: string;
  name: string;
  realName: string;
  nickname?: string;
  totalAmount: number;
  maskedAccount: string;
  account: SettlementAccountInfo;
  status: "pending" | "paid";
  statusLabel: string;
  paidAt: string | Date | null;
  paidByAdminId: string | null;
  payoutAmount: number;
  platformRevenue: number;
  items: SettlementItem[];
}

interface SettlementSnapshotRow extends QueryResultRow {
  musician_user_id: string;
  snapshot: unknown;
  status: string;
  paid_at: string | Date | null;
  paid_by_admin_id: string | null;
}

interface ApplicationRow extends QueryResultRow {
  id: string;
  user_id: string;
  name: string;
  nickname: string;
  category: string;
  email: string;
  bank_name: string | null;
  account_number: string | null;
  account_number_encrypted: string | null;
  account_number_last4: string | null;
  account_holder: string | null;
  video_file_name: string;
  video_size: number | null;
  video_path: string | null;
  signed_contract_file_name: string | null;
  signed_contract_size: number | null;
  signed_contract_path: string | null;
  contract_checked: boolean | null;
  rejected_reason: string | null;
  admin_memo: string | null;
  created_at: string | Date;
  status: string;
}

interface ContentRow extends QueryResultRow {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  video_url: string | null;
  video_file: string | null;
  pdf_file: string | null;
  pdf_file_name: string | null;
  author_id: string;
  author_name: string;
  created_at: string | Date;
  pdf_price: string | number | null;
  is_sanctioned?: boolean | null;
  sanction_reason?: string | null;
  sanctioned_at?: string | Date | null;
}

interface UserSettingsRow extends QueryResultRow {
  user_id: string;
  nickname: string | null;
  profile_image: string | null;
  bio: string | null;
  email: string | null;
  instagram: string | null;
  layout: string | null;
  language: string | null;
  notifications_enabled: boolean | null;
  last_nickname_change: number | null;
}

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeAuditMetadata(metadata?: JsonRecord | null): JsonRecord | null {
  if (!metadata) return null;

  const blockedKeys = new Set(["accountNumber", "account_number", "rawPayload", "raw_prepare_payload", "raw_confirm_payload", "payload"]);
  const output: JsonRecord = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (blockedKeys.has(key)) continue;
    if (typeof value === "string" && value.length > 500) {
      output[key] = `${value.slice(0, 497)}...`;
      continue;
    }
    output[key] = value;
  }

  return output;
}

async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  assertPlaintextPasswordHashAllowed(passwordHash);

  if (isPlaintextPasswordHash(passwordHash)) {
    return passwordHash.slice(6) === password;
  }

  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;

  const computedHash = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (computedHash.length !== storedBuffer.length) return false;

  return timingSafeEqual(computedHash, storedBuffer);
}

function mapUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    upgradeRequestStatus: row.upgrade_request_status,
  };
}

function mapPublicUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    upgradeRequestStatus: row.upgrade_request_status,
  };
}

function mapPublicProfileSettings(row: PublicProfileSettingsRow) {
  return {
    nickname: row.nickname || undefined,
    profileImage: row.profile_image || undefined,
    bio: row.bio || undefined,
    instagram: row.instagram || undefined,
    layout: row.layout || "horizontal",
    language: row.language || "ko",
  };
}

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*[^A-Za-z0-9]).{8,}$/;

function isAllowedRequestOrigin(req: Request) {
  const requestOrigin = req.get("origin");
  const requestReferer = req.get("referer");
  const allowedOrigins = new Set<string>();

  for (const value of [process.env.CLIENT_URL, process.env.CLIENT_URL_WWW, process.env.RENDER_EXTERNAL_URL]) {
    if (value) allowedOrigins.add(value);
  }

  if (allowedOrigins.size === 0 && req.headers.host) {
    const proto = req.secure || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    allowedOrigins.add(`${proto}://${req.headers.host}`);
  }

  const matches = (candidate?: string) => {
    if (!candidate) return false;
    try {
      const parsed = new URL(candidate);
      return allowedOrigins.has(parsed.origin);
    } catch {
      return false;
    }
  };

  if (requestOrigin) return matches(requestOrigin);
  if (requestReferer) return matches(requestReferer);
  return process.env.NODE_ENV !== "production";
}

function requireAuth(req: Request, res: Response): SessionUser | null {
  if (!req.session.user) {
    sendError(res, 401, "UNAUTHORIZED", "로그인이 필요합니다.");
    return null;
  }
  return req.session.user;
}

function requireAdmin(req: Request, res: Response): SessionUser | null {
  const user = requireAuth(req, res);
  if (!user) return null;

  if (user.role !== "admin") {
    sendError(res, 403, "FORBIDDEN", "관리자 권한이 필요합니다.");
    return null;
  }

  return user;
}

ensureUploadDirs();

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}


function safeUnlink(filePath?: string | null) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("파일 정리 실패:", error);
  }
}

function getFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

function validateFileSignature(file: Express.Multer.File, type: "image" | "video" | "pdf") {
  const header = fs.readFileSync(file.path).subarray(0, 32);
  const ext = getFileExtension(file.originalname);

  if (type === "pdf") {
    const isPdf = header.subarray(0, 4).toString() === "%PDF";
    if (!isPdf || ext !== ".pdf" || file.mimetype !== "application/pdf") {
      throw new Error("PDF 파일 검증에 실패했습니다.");
    }
    return;
  }

  if (type === "image") {
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isGif = header.subarray(0, 3).toString() === "GIF";
    const isWebp = header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP";
    const allowedExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

    if (!(isPng || isJpeg || isGif || isWebp) || !allowedExt.includes(ext)) {
      throw new Error("이미지 파일 검증에 실패했습니다.");
    }
    return;
  }

  const isIsoBaseMedia = header.subarray(4, 8).toString().includes("ftyp");
  const isWebm = header.subarray(0, 4).toString("hex") === "1a45dfa3";
  const allowedVideoExt = [".mp4", ".mov", ".m4v", ".webm"];
  const validSignature = ext === ".webm" ? isWebm : isIsoBaseMedia;

  if (!allowedVideoExt.includes(ext) || !file.mimetype.startsWith("video/") || !validSignature) {
    throw new Error("영상 파일 검증에 실패했습니다. mp4/mov/m4v/webm 파일만 업로드할 수 있습니다.");
  }
}

function assertOwnedFilePath(filePath: string, allowedDir: string) {
  const absolutePath = assertPathInsideRoot(filePath);
  const normalizedRoot = path.resolve(allowedDir);
  const relative = path.relative(normalizedRoot, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("허용되지 않은 파일 경로입니다.");
  }
  return absolutePath;
}

function normalizeAmount(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : value;
  const amount = typeof normalized === "number" ? normalized : Number(normalized);

  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    return null;
  }

  return amount;
}

function summarizeSuccessfulPaymentPayload(payment: JsonRecord) {
  const easyPay = isJsonRecord(payment.easyPay) ? payment.easyPay : {};
  const card = isJsonRecord(payment.card) ? payment.card : {};

  return {
    paymentKey: normalizeOptionalText(payment.paymentKey),
    orderId: normalizeOptionalText(payment.orderId),
    amount: normalizeAmount(payment.totalAmount ?? payment.balanceAmount),
    method: normalizeOptionalText(payment.method),
    approvedAt: normalizeOptionalText(payment.approvedAt),
    status: normalizeOptionalText(payment.status),
    easyPayProvider: normalizeOptionalText(easyPay.provider),
    cardCompany: normalizeOptionalText(card.company),
    cardNumber: normalizeOptionalText(card.number),
  };
}

function summarizeFailedPaymentPayload(payload: JsonRecord = {}) {
  return {
    code: normalizeOptionalText(payload.code),
    message: normalizeOptionalText(payload.message),
    orderId: normalizeOptionalText(payload.orderId),
    paymentKey: normalizeOptionalText(payload.paymentKey),
    amount: normalizeAmount(payload.amount ?? payload.totalAmount ?? payload.balanceAmount),
    reason: normalizeOptionalText(payload.reason),
    status: normalizeOptionalText(payload.status),
  };
}

async function logAdminAudit(params: {
  adminUserId?: string | null;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  reason?: string | null;
  requestIp?: string | null;
  userAgent?: string | null;
  metadata?: JsonRecord | null;
}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_user_id, action_type, target_type, target_id, reason, request_ip, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        params.adminUserId || null,
        params.actionType,
        params.targetType,
        params.targetId || null,
        params.reason || null,
        params.requestIp || null,
        params.userAgent || null,
        JSON.stringify(sanitizeAuditMetadata(params.metadata) || {}),
      ],
    );
  } catch (error) {
    console.error("관리자 감사 로그 저장 실패:", error);
  }
}

async function logPaymentAudit(params: {
  userId?: string | null;
  orderId?: string | null;
  contentId?: string | null;
  actionType: string;
  status: string;
  requestIp?: string | null;
  userAgent?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: JsonRecord | null;
}) {
  try {
    await pool.query(
      `INSERT INTO payment_audit_logs (user_id, order_id, content_id, action_type, status, request_ip, user_agent, error_code, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        params.userId || null,
        params.orderId || null,
        params.contentId || null,
        params.actionType,
        params.status,
        params.requestIp || null,
        params.userAgent || null,
        params.errorCode || null,
        params.errorMessage || null,
        JSON.stringify(sanitizeAuditMetadata(params.metadata) || {}),
      ],
    );
  } catch (error) {
    console.error("결제 감사 로그 저장 실패:", error);
  }
}

function resolveNotificationsEnabled(value: unknown, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}


function calculateVatAmount(amount: number) {
  return Math.round(amount * 0.1);
}

function calculateTotalAmountWithVat(amount: number) {
  return amount + calculateVatAmount(amount);
}

function canAccessPaidPdf(content: { pdf_price: number | string; author_id: string }, userId?: string | null, hasPurchased = false) {
  const price = Number(content.pdf_price || 0);
  if (price <= 0) return true;
  if (!userId) return false;
  if (content.author_id === userId) return true;
  return hasPurchased;
}

function requireUuidOrThrow(value: unknown, field: string) {
  const parsed = parseUuid(value);
  if (!parsed) {
    throw new ApiError(400, "INVALID_REQUEST", "잘못된 요청입니다.", { field });
  }
  return parsed;
}

function requireEmailOrThrow(value: unknown, field: string) {
  const parsed = parseEmail(value);
  if (!parsed) {
    throw new ApiError(400, "INVALID_REQUEST", "잘못된 요청입니다.", { field });
  }
  return parsed;
}

function requireKrwAmountOrThrow(value: unknown, field: string, { minPaidPdf = false } = {}) {
  const parsed = minPaidPdf ? requireMinPaidPdfPrice(value) : parseKrwAmount(value);
  if (parsed === null) {
    throw new ApiError(400, "INVALID_REQUEST", "잘못된 요청입니다.", { field });
  }
  return parsed;
}

function getStoredAccountNumber(row: { account_number_encrypted?: string | null; account_number?: string | null }) {
  return decryptAccountNumber(row.account_number_encrypted, row.account_number);
}

function mapApplicationRow(row: ApplicationRow) {
  const accountNumber = getStoredAccountNumber(row);
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    nickname: row.nickname,
    category: row.category,
    email: row.email,
    bankName: row.bank_name,
    accountNumber: maskAccountNumber(accountNumber, row.account_number_last4),
    accountHolder: row.account_holder,
    rejectedReason: row.rejected_reason || undefined,
    adminMemo: row.admin_memo || undefined,
    videoFileName: row.video_file_name,
    videoSize: row.video_size ? Number(row.video_size) : undefined,
    videoPath: row.video_path || undefined,
    signedContractFileName: row.signed_contract_file_name || undefined,
    signedContractSize: row.signed_contract_size ? Number(row.signed_contract_size) : undefined,
    signedContractPath: row.signed_contract_path || undefined,
    contractChecked: row.contract_checked,
    createdAt: row.created_at,
    status: row.status,
  };
}

async function resolveAuthorDisplayName(userId: string, fallbackName: string) {
  const settingsResult = await pool.query(`SELECT nickname FROM user_settings WHERE user_id = $1`, [userId]);
  const nickname = normalizeOptionalText(settingsResult.rows[0]?.nickname);
  return nickname || fallbackName;
}

function getAppBaseUrl(req: Request) {
  const configured = normalizeOptionalText(process.env.APP_BASE_URL);
  if (configured) return configured;

  const proto = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
  const host = req.get("x-forwarded-host") || req.get("host");
  if (!host) {
    throw new Error("APP_BASE_URL 환경변수가 필요합니다.");
  }
  return `${proto}://${host}`;
}

function createPaymentOrderId() {
  return randomBytes(24).toString("base64url").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
}

function encodeBasicAuth(secretKey: string) {
  return Buffer.from(`${secretKey}:`).toString("base64");
}

async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
  const secretKey = normalizeOptionalText(process.env.TOSS_SECRET_KEY || process.env.TOSS_PAYMENTS_SECRET_KEY);
  if (!secretKey) {
    throw new Error("TOSS_PAYMENTS_SECRET_KEY 환경변수가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodeBasicAuth(secretKey)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.code || "토스 결제 승인에 실패했습니다.";
    const error = new Error(message) as Error & { status?: number; code?: string; payload?: unknown };
    error.status = response.status;
    error.code = data?.code;
    error.payload = data;
    throw error;
  }

  return data as JsonRecord;
}

function assertNicknameChangeAllowed(existingSettings: Pick<UserSettingsRow, "nickname" | "last_nickname_change"> | null | undefined, requestedNickname: string | null) {
  const currentNickname = normalizeOptionalText(existingSettings?.nickname);
  if (!requestedNickname || requestedNickname === currentNickname) {
    return existingSettings?.last_nickname_change ?? null;
  }

  const lastChange = existingSettings?.last_nickname_change ? Number(existingSettings.last_nickname_change) : null;
  const now = Date.now();
  const cooldownMs = 14 * 24 * 60 * 60 * 1000;

  if (lastChange && now - lastChange < cooldownMs) {
    throw new Error("닉네임은 14일에 한 번만 변경할 수 있습니다.");
  }

  return now;
}

function createEphemeralToken(size = 24) {
  return randomBytes(size).toString("hex");
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === "videoFile") {
      cb(null, VIDEOS_DIR);
      return;
    }

    if (file.fieldname === "pdfFile") {
      cb(null, PDFS_DIR);
      return;
    }

    if (file.fieldname === "signedContractFile") {
      cb(null, CONTRACTS_DIR);
      return;
    }

    if (file.fieldname === "thumbnail") {
      cb(null, THUMBNAILS_DIR);
      return;
    }

    if (file.fieldname === "profileImageFile") {
      cb(null, PROFILE_IMAGES_DIR);
      return;
    }

    cb(null, UPLOAD_ROOT);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${sanitizeFileName(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "videoFile") {
      if (file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(new Error("영상 파일만 업로드 가능합니다."));
      }
      return;
    }

    if (file.fieldname === "pdfFile") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("PDF 파일만 업로드 가능합니다."));
      }
      return;
    }

    if (file.fieldname === "signedContractFile") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("서명한 계약서는 PDF 파일만 업로드 가능합니다."));
      }
      return;
    }

    if (file.fieldname === "thumbnail" || file.fieldname === "profileImageFile") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("이미지 파일만 업로드 가능합니다."));
      }
      return;
    }

    cb(null, true);
  },
});

function normalizeEmail(email: string) {
  return String(email).trim().toLowerCase();
}

function filePathToPublicUrl(filePath: string) {
  return toPublicUrlFromAbsolutePath(filePath);
}

function mapContent(row: ContentRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    thumbnail: row.thumbnail,
    videoUrl: row.video_url || "",
    videoFile: row.video_file || undefined,
    pdfFile: row.pdf_file || undefined,
    pdfFileName: row.pdf_file_name || undefined,
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at,
    pdfPrice: Number(row.pdf_price || 0),
    isSanctioned: row.is_sanctioned,
    sanctionReason: row.sanction_reason || undefined,
    sanctionedAt: row.sanctioned_at || undefined,
  };
}

function mapUserSettings(row: UserSettingsRow) {
  return {
    nickname: row.nickname || undefined,
    profileImage: row.profile_image || undefined,
    bio: row.bio || undefined,
    email: row.email || undefined,
    instagram: row.instagram || undefined,
    layout: row.layout || "horizontal",
    language: row.language || "ko",
    notificationsEnabled: row.notifications_enabled,
    lastNicknameChange: row.last_nickname_change ? Number(row.last_nickname_change) : null,
  };
}

function createEmailCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildVerificationEmailHtml(title: string, description: string, code: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin-bottom: 12px;">${title}</h2>
      <p>${description}</p>
      <div style="margin: 20px 0; font-size: 28px; font-weight: 700; letter-spacing: 6px;">
        ${code}
      </div>
      <p>인증코드는 5분 동안 유효합니다.</p>
    </div>
  `;
}

async function sendNewContentNotificationEmail(content: { title: string; authorName: string; category: string; id: string }, uploaderId: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return;
  }

  const subscribersResult = await pool.query(
    `SELECT DISTINCT u.email
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN user_settings us ON us.user_id = u.id
     WHERE s.target_id = $1
       AND s.notify = TRUE
       AND u.deleted_at IS NULL
       AND COALESCE(us.notifications_enabled, TRUE) = TRUE`,
    [uploaderId],
  );

  if (subscribersResult.rows.length === 0) {
    return;
  }

  await Promise.allSettled(
    subscribersResult.rows.map((row) =>
      transporter.sendMail({
        from: `"Lydian Larnell" <${process.env.EMAIL_USER}>`,
        to: row.email,
        subject: `[Lydian Larnell] ${content.authorName} 님의 새 영상 업로드 알림`,
        text: `${content.authorName} 님이 새 콘텐츠를 업로드했습니다.
제목: ${content.title}
카테고리: ${content.category}
확인 경로: /content/${content.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2 style="margin-bottom: 12px;">새 영상 업로드 알림</h2>
            <p><strong>${content.authorName}</strong> 님이 새 콘텐츠를 업로드했습니다.</p>
            <p>제목: <strong>${content.title}</strong></p>
            <p>카테고리: ${content.category}</p>
            <p>사이트에서 확인해 주세요.</p>
          </div>
        `,
      }),
    ),
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function saveEmailVerification(email: string, code: string, expires: Date) {
  await pool.query(
    `INSERT INTO email_verifications (email, code, expires_at, verified_at, consumed_at, created_at)
     VALUES ($1, $2, $3, NULL, NULL, NOW())
     ON CONFLICT (email)
     DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, verified_at = NULL, consumed_at = NULL, created_at = NOW()`,
    [email, code, expires],
  );
}

async function getEmailVerification(email: string) {
  const result = await pool.query(
    `SELECT email, code, expires_at, verified_at, consumed_at FROM email_verifications WHERE email = $1`,
    [email],
  );
  return result.rows[0] || null;
}

async function markEmailVerificationVerified(email: string) {
  await pool.query(`UPDATE email_verifications SET verified_at = NOW() WHERE email = $1`, [email]);
}

async function consumeEmailVerification(email: string) {
  await pool.query(`UPDATE email_verifications SET consumed_at = NOW() WHERE email = $1`, [email]);
}

async function deleteEmailVerification(email: string) {
  await pool.query(`DELETE FROM email_verifications WHERE email = $1`, [email]);
}

async function savePasswordResetRequest(email: string, code: string, expires: Date) {
  await pool.query(
    `INSERT INTO password_reset_requests (email, code, expires_at, verified_at, verified_token, created_at)
     VALUES ($1, $2, $3, NULL, NULL, NOW())
     ON CONFLICT (email)
     DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, verified_at = NULL, verified_token = NULL, created_at = NOW()`,
    [email, code, expires],
  );
}

async function getPasswordResetRequest(email: string) {
  const result = await pool.query(
    `SELECT email, code, expires_at, verified_at, verified_token FROM password_reset_requests WHERE email = $1`,
    [email],
  );
  return result.rows[0] || null;
}

async function markPasswordResetVerified(email: string, verifiedToken: string) {
  await pool.query(
    `UPDATE password_reset_requests SET verified_at = NOW(), verified_token = $2 WHERE email = $1`,
    [email, verifiedToken],
  );
}

async function deletePasswordResetRequest(email: string) {
  await pool.query(`DELETE FROM password_reset_requests WHERE email = $1`, [email]);
}

function normalizeSettlementYear(value: unknown) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return year;
}

function normalizeSettlementMonth(value: unknown) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return month;
}

function getSettlementRange(year: number, month: number) {
  const startMonth = String(month).padStart(2, "0");
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthText = String(nextMonth).padStart(2, "0");
  const start = new Date(`${year}-${startMonth}-01T00:00:00+09:00`);
  const end = new Date(`${nextYear}-${nextMonthText}-01T00:00:00+09:00`);
  return { start, end };
}

function toMoneyNumber(value: unknown) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function toSettlementStatusLabel(status: string) {
  return status === "paid" ? "지급완료" : "지급대기";
}

function formatMaskedAccount(bankName?: string | null, accountNumber?: string | null, accountLast4?: string | null) {
  const bank = normalizeOptionalText(bankName);
  const masked = maskAccountNumber(accountNumber, accountLast4);
  if (!bank && !masked) return "미등록";
  if (bank && masked) return `${bank} / ${masked}`;
  return bank || masked || "미등록";
}

async function getSettlementSummary(year: number, month: number, options?: { musicianUserId?: string }) {
  const { start, end } = getSettlementRange(year, month);
  const params: Array<string> | Array<string | number> = [start.toISOString(), end.toISOString()];
  const musicianFilterSql = options?.musicianUserId ? ` AND c.author_id = $3 ` : "";
  if (options?.musicianUserId) params.push(options.musicianUserId);

  const detailResult = await pool.query<SettlementDetailRow>(
    `SELECT
       c.author_id AS musician_user_id,
       u.name AS real_name,
       NULLIF(TRIM(us.nickname), '') AS nickname,
       COALESCE(NULLIF(TRIM(us.nickname), ''), u.name, c.author_name) AS musician_name,
       bank.bank_name,
       bank.account_number,
       bank.account_number_encrypted,
       bank.account_number_last4,
       bank.account_holder,
       c.id AS content_id,
       c.title,
       c.pdf_price,
       COUNT(*)::int AS sale_count,
       COALESCE(c.pdf_price, 0)::numeric * COUNT(*)::numeric AS subtotal_amount
     FROM purchases p
     JOIN contents c ON c.id = p.content_id
     JOIN users u ON u.id = c.author_id AND u.deleted_at IS NULL
     JOIN payment_orders po ON po.id = p.payment_order_id
     LEFT JOIN user_settings us ON us.user_id = c.author_id
     LEFT JOIN LATERAL (
       SELECT ma.bank_name, ma.account_number, ma.account_number_encrypted, ma.account_number_last4, ma.account_holder
       FROM musician_applications ma
       WHERE ma.user_id = c.author_id
       ORDER BY CASE ma.status WHEN 'approved' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END, ma.created_at DESC
       LIMIT 1
     ) bank ON TRUE
     WHERE p.status = 'active'
       AND po.status = 'paid'
       AND COALESCE(c.pdf_price, 0) > 0
       AND COALESCE(po.confirmed_at, p.created_at) >= $1::timestamptz
       AND COALESCE(po.confirmed_at, p.created_at) < $2::timestamptz
       ${musicianFilterSql}
     GROUP BY c.author_id, u.name, nickname, musician_name, bank.bank_name, bank.account_number, bank.account_number_encrypted, bank.account_number_last4, bank.account_holder, c.id, c.title, c.pdf_price
     ORDER BY musician_name ASC, c.title ASC`,
    params,
  );

  const statusParams: Array<number | string> = [year, month];
  const statusFilterSql = options?.musicianUserId ? ` AND musician_user_id = $3 ` : "";
  if (options?.musicianUserId) statusParams.push(options.musicianUserId);

  const statusResult = await pool.query<SettlementStatusRow>(
    `SELECT musician_user_id, status, paid_at, paid_by_admin_id
     FROM monthly_settlement_status
     WHERE year = $1 AND month = $2 ${statusFilterSql}`,
    statusParams,
  );

  const statusByUserId = new Map<string, SettlementStatusRow>(statusResult.rows.map((row) => [row.musician_user_id, row]));
  const grouped = new Map<string, SettlementSummary>();

  for (const row of detailResult.rows) {
    const musicianUserId = row.musician_user_id;
    const decryptedAccountNumber = getStoredAccountNumber(row);
    const current = grouped.get(musicianUserId) || {
      musicianUserId,
      name: row.musician_name,
      realName: normalizeOptionalText(row.real_name) || row.musician_name,
      nickname: normalizeOptionalText(row.nickname) || undefined,
      totalAmount: 0,
      maskedAccount: formatMaskedAccount(row.bank_name, decryptedAccountNumber, row.account_number_last4),
      account: {
        accountHolder: normalizeOptionalText(row.account_holder) || "미등록",
        bankName: normalizeOptionalText(row.bank_name) || "미등록",
        accountNumber: normalizeOptionalText(decryptedAccountNumber) || "미등록",
      },
      status: "pending" as const,
      statusLabel: toSettlementStatusLabel("pending"),
      paidAt: null,
      paidByAdminId: null,
      payoutAmount: 0,
      platformRevenue: 0,
      items: [],
    };

    const price = toMoneyNumber(row.pdf_price);
    const count = Number(row.sale_count || 0);
    const subtotal = toMoneyNumber(row.subtotal_amount);

    current.totalAmount += subtotal;
    current.items.push({
      contentId: row.content_id,
      title: row.title,
      price,
      count,
      subtotal,
    });

    grouped.set(musicianUserId, current);
  }

  const liveSettlements = Array.from(grouped.values()).map((entry) => {
    const statusRow = statusByUserId.get(entry.musicianUserId);
    const status = statusRow?.status === "paid" ? "paid" : "pending";
    const totalAmount = toMoneyNumber(entry.totalAmount);
    const payoutAmount = Math.floor(totalAmount * 0.8);
    const platformRevenue = totalAmount - payoutAmount;

    return {
      ...entry,
      totalAmount,
      status,
      statusLabel: toSettlementStatusLabel(status),
      paidAt: statusRow?.paid_at || null,
      paidByAdminId: statusRow?.paid_by_admin_id || null,
      payoutAmount,
      platformRevenue,
    } satisfies SettlementSummary;
  });

  const snapshotParams: Array<number | string> = [year, month];
  const snapshotFilterSql = options?.musicianUserId ? ` AND musician_user_id = $3 ` : "";
  if (options?.musicianUserId) snapshotParams.push(options.musicianUserId);

  const snapshotResult = await pool.query<SettlementSnapshotRow>(
    `SELECT musician_user_id, snapshot, status, paid_at, paid_by_admin_id
     FROM monthly_settlement_snapshots
     WHERE year = $1 AND month = $2 ${snapshotFilterSql}`,
    snapshotParams,
  );

  const liveSettlementByUserId = new Map<string, SettlementSummary>(liveSettlements.map((item) => [item.musicianUserId, item]));

  for (const row of snapshotResult.rows) {
    if (row.status !== "paid" || !row.musician_user_id || !isJsonRecord(row.snapshot)) continue;

    const snapshot = row.snapshot as Partial<SettlementSummary>;
    liveSettlementByUserId.set(row.musician_user_id, {
      musicianUserId: typeof snapshot.musicianUserId === "string" ? snapshot.musicianUserId : row.musician_user_id,
      name: typeof snapshot.name === "string" ? snapshot.name : "",
      realName: typeof snapshot.realName === "string" ? snapshot.realName : (typeof snapshot.name === "string" ? snapshot.name : ""),
      nickname: typeof snapshot.nickname === "string" ? snapshot.nickname : undefined,
      totalAmount: toMoneyNumber(snapshot.totalAmount),
      maskedAccount: typeof snapshot.maskedAccount === "string" ? snapshot.maskedAccount : "미등록",
      account: isJsonRecord(snapshot.account)
        ? {
            accountHolder: typeof snapshot.account.accountHolder === "string" ? snapshot.account.accountHolder : "미등록",
            bankName: typeof snapshot.account.bankName === "string" ? snapshot.account.bankName : "미등록",
            accountNumber: typeof snapshot.account.accountNumber === "string" ? snapshot.account.accountNumber : "미등록",
          }
        : { accountHolder: "미등록", bankName: "미등록", accountNumber: "미등록" },
      status: "paid",
      statusLabel: "지급완료",
      paidAt: row.paid_at || (snapshot.paidAt as string | Date | null | undefined) || null,
      paidByAdminId: row.paid_by_admin_id || (typeof snapshot.paidByAdminId === "string" ? snapshot.paidByAdminId : null),
      payoutAmount: toMoneyNumber(snapshot.payoutAmount),
      platformRevenue: toMoneyNumber(snapshot.platformRevenue),
      items: Array.isArray(snapshot.items)
        ? snapshot.items.map((item) => {
            const safeItem: JsonRecord = isJsonRecord(item) ? item : {};
            return {
              contentId: typeof safeItem.contentId === "string" ? safeItem.contentId : "",
              title: typeof safeItem.title === "string" ? safeItem.title : "",
              price: toMoneyNumber(safeItem.price),
              count: Number(safeItem.count || 0),
              subtotal: toMoneyNumber(safeItem.subtotal),
            } satisfies SettlementItem;
          })
        : [],
    });
  }

  const mergedSettlements = Array.from(liveSettlementByUserId.values());
  mergedSettlements.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return String(a.name).localeCompare(String(b.name), "ko");
  });

  return mergedSettlements;
}

async function buildBootstrapData(currentUserId?: string) {
  const usersResult = await pool.query<UserRow>(`
    SELECT id, email, name, role, upgrade_request_status
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
  `);

  const settingsResult = await pool.query<UserSettingsRow>(`SELECT * FROM user_settings`);

  const contentsResult = await pool.query<ContentRow>(`
    SELECT
      id,
      title,
      description,
      category,
      thumbnail,
      video_url,
      video_file,
      pdf_file,
      pdf_file_name,
      author_id,
      author_name,
      created_at,
      pdf_price,
      is_sanctioned,
      sanction_reason,
      sanctioned_at
    FROM contents
    ORDER BY created_at DESC
  `);

  const purchasesResult = currentUserId
    ? await pool.query(`SELECT content_id FROM purchases WHERE user_id = $1 AND status = 'active'`, [currentUserId])
    : { rows: [] as Array<{ content_id: string }> };

  const subsResult = currentUserId
    ? await pool.query(`SELECT target_id, notify FROM subscriptions WHERE user_id = $1`, [currentUserId])
    : { rows: [] as Array<{ target_id: string; notify: boolean }> };

  const users = usersResult.rows.map(mapUser);

  const userSettings = settingsResult.rows.reduce<Record<string, ReturnType<typeof mapUserSettings>>>((acc, row) => {
    acc[row.user_id] = mapUserSettings(row);
    return acc;
  }, {});

  const contents = contentsResult.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    thumbnail: row.thumbnail,
    videoUrl: row.video_url || "",
    videoFile: row.video_file || undefined,
    pdfFile: row.pdf_file || undefined,
    pdfFileName: row.pdf_file_name || undefined,
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at,
    pdfPrice: Number(row.pdf_price || 0),
    isSanctioned: row.is_sanctioned,
    sanctionReason: row.sanction_reason || undefined,
    sanctionedAt: row.sanctioned_at || undefined,
  }));

  const purchases = purchasesResult.rows.map((row) => ({
    userId: currentUserId,
    contentId: row.content_id,
  }));

  const subscriptions = subsResult.rows.map((row) => ({
    targetId: row.target_id,
    notify: row.notify,
  }));

  return { users, userSettings, contents, purchases, subscriptions };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await ensureDatabase();
  await runPendingMigrations();
  await finalizeDatabaseSetup();

  const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!sessionSecret || sessionSecret.length < 32)) {
    throw new Error("SESSION_SECRET 환경변수는 운영 환경에서 32자 이상이어야 합니다.");
  }

  app.use(
    session({
      secret: sessionSecret || "development-session-secret-change-me",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: createSessionStore(),
      cookie: {
        httpOnly: true,
        sameSite: process.env.SESSION_SAME_SITE === "none" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  app.use(async (req, res, next) => {
    if (!req.session.user) {
      next();
      return;
    }

    try {
      const result = await pool.query(
        `SELECT id, email, name, role, upgrade_request_status FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [req.session.user.id],
      );

      const row = result.rows[0];
      if (!row) {
        req.session.destroy(() => {});
        res.clearCookie("connect.sid");
        res.status(401).json({ message: "사용자를 찾을 수 없습니다. 다시 로그인해 주세요." });
        return;
      }

      req.session.user = mapUser(row);
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      next();
      return;
    }

    if (!isAllowedRequestOrigin(req)) {
      res.status(403).json({ message: "허용되지 않은 요청 출처입니다." });
      return;
    }

    next();
  });

  app.get("/api/bootstrap", async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    const data = await buildBootstrapData(user.id);
    res.json(data);
  });

  app.get("/api/admin/payment-orders", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const result = await pool.query(
      `SELECT order_id, user_id, content_id, amount, order_name, payment_key, status, provider, created_at, updated_at, approved_at, failed_at, expired_at, expires_at
       FROM payment_orders
       ORDER BY created_at DESC
       LIMIT 200`,
    );

    res.json({
      orders: result.rows.map((row) => ({
        orderId: row.order_id,
        userId: row.user_id,
        contentId: row.content_id,
        amount: Number(row.amount || 0),
        orderName: row.order_name,
        paymentKey: row.payment_key || undefined,
        status: row.status,
        provider: row.provider,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        approvedAt: row.approved_at || undefined,
        failedAt: row.failed_at || undefined,
        expiredAt: row.expired_at || undefined,
        expiresAt: row.expires_at || undefined,
      })),
    });
  });

  app.get("/api/admin/audit-logs", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const [adminLogsResult, paymentLogsResult] = await Promise.all([
      pool.query(
        `SELECT id, admin_user_id, action_type, target_type, target_id, reason, metadata, created_at
         FROM admin_audit_logs
         ORDER BY created_at DESC
         LIMIT 200`,
      ),
      pool.query(
        `SELECT id, user_id, order_id, content_id, action_type, status, metadata, created_at
         FROM payment_audit_logs
         ORDER BY created_at DESC
         LIMIT 200`,
      ),
    ]);

    res.json({
      adminLogs: adminLogsResult.rows,
      paymentLogs: paymentLogsResult.rows,
    });
  });

  app.get("/api/contents", async (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    const contentsResult = category
      ? await pool.query(
          `SELECT c.id, c.title, c.description, c.category, c.thumbnail, c.video_url, c.video_file, c.pdf_file, c.pdf_file_name, c.author_id, c.author_name, c.created_at, c.pdf_price, c.is_sanctioned, c.sanction_reason, c.sanctioned_at
           FROM contents c
           JOIN users u ON u.id = c.author_id
           WHERE c.category = $1 AND u.deleted_at IS NULL
           ORDER BY c.created_at DESC`,
          [category],
        )
      : await pool.query(
          `SELECT c.id, c.title, c.description, c.category, c.thumbnail, c.video_url, c.video_file, c.pdf_file, c.pdf_file_name, c.author_id, c.author_name, c.created_at, c.pdf_price, c.is_sanctioned, c.sanction_reason, c.sanctioned_at
           FROM contents c
           JOIN users u ON u.id = c.author_id
           WHERE u.deleted_at IS NULL
           ORDER BY c.created_at DESC`,
        );

    const settingsResult = await pool.query(`SELECT user_id, nickname FROM user_settings WHERE nickname IS NOT NULL`);
    const authorNicknames = settingsResult.rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.user_id] = row.nickname;
      return acc;
    }, {});

    res.json({ contents: contentsResult.rows.map(mapContent), authorNicknames });
  });

  app.get("/api/contents/:id", async (req, res) => {
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.category, c.thumbnail, c.video_url, c.video_file, c.pdf_file, c.pdf_file_name, c.author_id, c.author_name, c.created_at, c.pdf_price, c.is_sanctioned, c.sanction_reason, c.sanctioned_at
       FROM contents c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = $1 AND u.deleted_at IS NULL`,
      [req.params.id],
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ content: null, hasPurchased: false });
    }

    let hasPurchased = false;
    if (req.session.user) {
      const purchaseResult = await pool.query(
        `SELECT 1 FROM purchases WHERE user_id = $1 AND content_id = $2 AND status = 'active' LIMIT 1`,
        [req.session.user.id, req.params.id],
      );
      hasPurchased = Boolean(purchaseResult.rows[0]);
    }

    res.json({ content: mapContent(row), hasPurchased });
  });

  app.get("/api/contents/:id/pdf-download", async (req, res) => {
    let contentId: string;
    try {
      contentId = requireUuidOrThrow(req.params.id, "id");
    } catch (error) {
      if (error instanceof ApiError) return sendError(res, error.status, error.code, error.message, error.details);
      throw error;
    }

    const result = await pool.query(
      `SELECT c.id, c.pdf_file, c.pdf_file_name, c.pdf_price, c.author_id, c.is_sanctioned
       FROM contents c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = $1 AND u.deleted_at IS NULL`,
      [contentId],
    );

    const content = result.rows[0];
    if (!content) {
      return sendError(res, 404, "NOT_FOUND", "콘텐츠를 찾을 수 없습니다.");
    }

    if (!content.pdf_file) {
      return sendError(res, 404, "NOT_FOUND", "PDF 파일을 찾을 수 없습니다.");
    }

    if (content.is_sanctioned) {
      return sendError(res, 403, "FORBIDDEN", "제재된 콘텐츠는 다운로드할 수 없습니다.");
    }

    const currentUser = requireAuth(req, res);
    if (!currentUser) return;

    const purchaseResult = await pool.query(
      `SELECT 1 FROM purchases WHERE user_id = $1 AND content_id = $2 AND status = 'active' LIMIT 1`,
      [currentUser.id, contentId],
    );
    const hasPurchased = Boolean(purchaseResult.rows[0]);

    if (!canAccessPaidPdf(content, currentUser.id, hasPurchased)) {
      return sendError(res, 403, "FORBIDDEN", "구매한 회원만 PDF를 다운로드할 수 있습니다.");
    }

    const absolutePath = assertOwnedFilePath(resolveStoredPath(String(content.pdf_file)), PDFS_DIR);
    if (!fs.existsSync(absolutePath)) {
      return sendError(res, 404, "NOT_FOUND", "PDF 파일이 존재하지 않습니다.");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(content.pdf_file_name || 'download.pdf')}`);
    return res.sendFile(absolutePath);
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "로그인되지 않았습니다." });
    }

    const result = await pool.query(
      `SELECT id, email, name, role, upgrade_request_status FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [req.session.user.id],
    );

    if (!result.rows[0]) {
      req.session.destroy(() => {});
      res.clearCookie("connect.sid");
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const user = mapUser(result.rows[0]);
    req.session.user = user;
    res.json({ user });
  });

  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body ?? {};

    if (!email || !password || !name) {
      return res.status(400).json({ message: "이름, 이메일, 비밀번호를 모두 입력해 주세요." });
    }

    const normalizedEmail = requireEmailOrThrow(email, "email");

    if (!PASSWORD_REGEX.test(String(password))) {
      return sendError(res, 400, "INVALID_REQUEST", "비밀번호는 8자 이상이며 영문과 특수문자를 포함해야 합니다.", { field: "newPassword" });
    }

    const verification = await getEmailVerification(normalizedEmail);
    if (!verification || !verification.verified_at || verification.consumed_at || new Date(verification.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: "이메일 인증을 완료한 뒤 회원가입해 주세요." });
    }

    const existing = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [normalizedEmail]
    );

    if (existing.rows[0]) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, upgrade_request_status)
      VALUES ($1, $2, $3, 'basic', 'none')
      RETURNING id, email, name, role, upgrade_request_status`,
      [normalizedEmail, hashPassword(password), name],
    );

    const user = mapUser(result.rows[0]);
    await consumeEmailVerification(normalizedEmail);

    req.session.regenerate((err) => {
      if (err) {
        sendError(res, 500, "SESSION_ERROR", "세션 생성에 실패했습니다.");
        return;
      }

      req.session.user = user;
      res.json({ user });
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return sendError(res, 400, "INVALID_REQUEST", "잘못된 요청입니다.", { field: !email ? "email" : "password" });
    }

    const normalizedEmail = requireEmailOrThrow(email, "email");

    const result = await pool.query(
      `SELECT id, email, name, role, upgrade_request_status, password_hash
      FROM users
      WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [normalizedEmail],
    );

    const row = result.rows[0];
    if (!row || !verifyPassword(password, row.password_hash)) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    if (isPlaintextPasswordHash(row.password_hash)) {
      assertPlaintextPasswordHashAllowed(row.password_hash);
      await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashPassword(password), row.id]);
    }

    const user = mapUser(row);
    req.session.regenerate((err) => {
      if (err) {
        sendError(res, 500, "SESSION_ERROR", "세션 생성에 실패했습니다.");
        return;
      }

      req.session.user = user;
      res.json({ user });
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.post("/api/auth/password-reset/send-code", async (req, res) => {
    const { email } = req.body ?? {};

    if (!email) {
      return sendError(res, 400, "INVALID_REQUEST", "잘못된 요청입니다.", { field: "email" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return sendError(res, 500, "EMAIL_CONFIG_MISSING", "이메일 발송 환경변수가 설정되지 않았습니다. EMAIL_USER, EMAIL_PASS를 확인해 주세요.");
    }

    const normalizedEmail = requireEmailOrThrow(email, "email");

    const userResult = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [normalizedEmail],
    );

    if (!userResult.rows[0]) {
      return sendError(res, 404, "NOT_FOUND", "회원가입되지 않은 이메일입니다.");
    }

    const code = createEmailCode();
    const expires = new Date(Date.now() + 1000 * 60 * 5);

    try {
      await transporter.sendMail({
        from: `"Lydian Larnell" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: "Lydian Larnell 비밀번호 재설정 인증코드",
        text: `비밀번호 재설정 인증코드는 ${code} 입니다. 5분 이내에 입력해 주세요.`,
        html: buildVerificationEmailHtml("비밀번호 재설정 인증코드", "아래 6자리 인증코드를 입력해 주세요.", code),
      });

      await savePasswordResetRequest(normalizedEmail, code, expires);

      return res.json({
        success: true,
        message: "인증코드가 발송되었습니다.",
      });
    } catch (error) {
      console.error("비밀번호 재설정 메일 발송 실패:", error);
      return sendError(res, 500, "EMAIL_SEND_FAILED", "메일 발송에 실패했습니다.");
    }
  });

  app.post("/api/auth/password-reset/verify-code", async (req, res) => {
    const { email, code } = req.body ?? {};

    if (!email || !code) {
      return sendError(res, 400, "INVALID_REQUEST", "잘못된 요청입니다.", { field: !email ? "email" : "code" });
    }

    const normalizedEmail = requireEmailOrThrow(email, "email");
    const normalizedCode = String(code).trim();

    const userResult = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [normalizedEmail],
    );

    if (!userResult.rows[0]) {
      return sendError(res, 404, "NOT_FOUND", "회원가입되지 않은 이메일입니다.");
    }

    const saved = await getPasswordResetRequest(normalizedEmail);

    if (!saved) {
      return sendError(res, 400, "INVALID_REQUEST", "인증코드가 존재하지 않습니다.");
    }

    if (new Date(saved.expires_at).getTime() < Date.now()) {
      await deletePasswordResetRequest(normalizedEmail);
      return sendError(res, 400, "INVALID_REQUEST", "인증코드가 만료되었습니다.");
    }

    if (saved.code !== normalizedCode) {
      return sendError(res, 400, "INVALID_REQUEST", "인증되지 않았습니다.");
    }

    const verifiedToken = createEphemeralToken();
    await markPasswordResetVerified(normalizedEmail, verifiedToken);

    return res.json({
      verified: true,
      message: "인증되었습니다.",
      resetToken: verifiedToken,
    });
  });

  app.post("/api/auth/password-reset/confirm", async (req, res) => {
    const { email, code, newPassword, resetToken } = req.body ?? {};

    if (!email || !code || !newPassword || !resetToken) {
      return sendError(res, 400, "INVALID_REQUEST", "잘못된 요청입니다.");
    }

    const normalizedEmail = requireEmailOrThrow(email, "email");
    const normalizedCode = String(code).trim();
    const password = String(newPassword);

    const userResult = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [normalizedEmail],
    );

    const user = userResult.rows[0];

    if (!user) {
      return sendError(res, 404, "NOT_FOUND", "회원가입되지 않은 이메일입니다.");
    }

    const saved = await getPasswordResetRequest(normalizedEmail);

    if (!saved) {
      return sendError(res, 400, "INVALID_REQUEST", "인증코드가 존재하지 않습니다.");
    }

    if (new Date(saved.expires_at).getTime() < Date.now()) {
      await deletePasswordResetRequest(normalizedEmail);
      return sendError(res, 400, "INVALID_REQUEST", "인증코드가 만료되었습니다.");
    }

    if (saved.code !== normalizedCode || !saved.verified_at || saved.verified_token !== String(resetToken)) {
      return sendError(res, 400, "INVALID_REQUEST", "비밀번호 재설정 인증이 완료되지 않았습니다.");
    }

    if (!PASSWORD_REGEX.test(password)) {
      return sendError(res, 400, "INVALID_REQUEST", "비밀번호는 8자 이상이며 영문과 특수문자를 포함해야 합니다.", { field: "newPassword" });
    }

    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashPassword(password), user.id]);
    await deletePasswordResetRequest(normalizedEmail);

    return res.json({ success: true, message: "비밀번호가 재설정되었습니다." });
  });

  app.post("/api/auth/email/send-code", async (req, res) => {
    const { email } = req.body ?? {};

    if (!email) {
      return sendError(res, 400, "INVALID_REQUEST", "잘못된 요청입니다.", { field: "email" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return sendError(res, 500, "EMAIL_CONFIG_MISSING", "이메일 발송 환경변수가 설정되지 않았습니다.");
    }

    const normalizedEmail = requireEmailOrThrow(email, "email");

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [normalizedEmail],
    );

    if (existingUser.rows[0]) {
      return sendError(res, 409, "ALREADY_EXISTS", "이미 가입된 이메일입니다.");
    }

    const code = createEmailCode();
    const expires = new Date(Date.now() + 1000 * 60 * 5);

    try {
      await transporter.sendMail({
        from: `"Lydian Larnell" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: "Lydian Larnell 이메일 인증코드",
        text: `인증코드는 ${code} 입니다. 5분 이내에 입력해 주세요.`,
        html: buildVerificationEmailHtml("이메일 인증코드", "아래 6자리 인증코드를 입력해 주세요.", code),
      });

      await saveEmailVerification(normalizedEmail, code, expires);

      return res.json({ success: true, message: "인증코드가 발송되었습니다." });
    } catch (error) {
      console.error("메일 발송 실패:", error);
      return sendError(res, 500, "EMAIL_SEND_FAILED", "메일 발송에 실패했습니다.");
    }
  });

  app.post("/api/auth/email/verify-code", async (req, res) => {
    const { email, code } = req.body ?? {};

    if (!email || !code) {
      return sendError(res, 400, "INVALID_REQUEST", "잘못된 요청입니다.", { field: !email ? "email" : "code" });
    }

    const normalizedEmail = requireEmailOrThrow(email, "email");
    const saved = await getEmailVerification(normalizedEmail);

    if (!saved) {
      return sendError(res, 400, "INVALID_REQUEST", "인증코드가 존재하지 않습니다.");
    }

    if (new Date(saved.expires_at).getTime() < Date.now()) {
      await deleteEmailVerification(normalizedEmail);
      return sendError(res, 400, "INVALID_REQUEST", "인증코드가 만료되었습니다.");
    }

    if (saved.code !== String(code).trim()) {
      return sendError(res, 400, "INVALID_REQUEST", "인증되지 않았습니다.");
    }

    await markEmailVerificationVerified(normalizedEmail);
    return res.json({ verified: true, message: "인증되었습니다." });
  });

  app.get("/api/users/me/settings", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await pool.query(`SELECT * FROM user_settings WHERE user_id = $1`, [user.id]);
    res.json({ settings: result.rows[0] ? mapUserSettings(result.rows[0]) : {} });
  });

  app.put("/api/users/me/settings", upload.single("profileImageFile"), async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const existingSettingsResult = await pool.query(`SELECT * FROM user_settings WHERE user_id = $1`, [user.id]);
    const existingSettings = existingSettingsResult.rows[0];

    const profileImageFile = req.file;
    const body = req.body ?? {};

    try {
      if (profileImageFile) {
        validateFileSignature(profileImageFile, "image");
      }
    } catch (error) {
      safeUnlink(profileImageFile?.path);
      return res.status(400).json({ message: error instanceof Error ? error.message : "프로필 이미지 검증에 실패했습니다." });
    }

    const profileImagePath = profileImageFile
      ? `${filePathToPublicUrl(profileImageFile.path)}`
      : normalizeOptionalText(body.profileImage) ?? existingSettings?.profile_image ?? null;

    let nextNicknameChange: number | null = existingSettings?.last_nickname_change ? Number(existingSettings.last_nickname_change) : null;
    let normalizedNickname: string | null = null;

    try {
      normalizedNickname = normalizeOptionalText(body.nickname);
      nextNicknameChange = assertNicknameChangeAllowed(existingSettings, normalizedNickname);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "닉네임 변경 제한 검사에 실패했습니다." });
    }

    await pool.query(
      `INSERT INTO user_settings (user_id, nickname, profile_image, bio, email, instagram, layout, language, notifications_enabled, last_nickname_change)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (user_id)
       DO UPDATE SET
         nickname = EXCLUDED.nickname,
         profile_image = COALESCE(EXCLUDED.profile_image, user_settings.profile_image),
         bio = EXCLUDED.bio,
         email = EXCLUDED.email,
         instagram = EXCLUDED.instagram,
         layout = EXCLUDED.layout,
         language = EXCLUDED.language,
         notifications_enabled = EXCLUDED.notifications_enabled,
         last_nickname_change = EXCLUDED.last_nickname_change`,
      [
        user.id,
        normalizedNickname,
        profileImagePath,
        normalizeOptionalText(body.bio),
        normalizeOptionalText(body.email),
        normalizeOptionalText(body.instagram),
        normalizeOptionalText(body.layout) || existingSettings?.layout || "horizontal",
        normalizeOptionalText(body.language) || existingSettings?.language || "ko",
        resolveNotificationsEnabled(body.notificationsEnabled, existingSettings?.notifications_enabled ?? true),
        nextNicknameChange,
      ],
    );

    const result = await pool.query(`SELECT * FROM user_settings WHERE user_id = $1`, [user.id]);
    res.json({ success: true, settings: result.rows[0] ? mapUserSettings(result.rows[0]) : {} });
  });

  app.get("/api/users/me/contents", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await pool.query(
      `SELECT id, title, description, category, thumbnail, video_url, video_file, pdf_file, pdf_file_name, author_id, author_name, created_at, pdf_price, is_sanctioned, sanction_reason, sanctioned_at
       FROM contents
       WHERE author_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    );

    res.json({ contents: result.rows.map(mapContent) });
  });

  app.get("/api/subscriptions", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await pool.query(
      `SELECT s.target_id, s.notify, u.name, us.nickname
       FROM subscriptions s
       JOIN users u ON u.id = s.target_id
       LEFT JOIN user_settings us ON us.user_id = s.target_id
       WHERE s.user_id = $1 AND u.deleted_at IS NULL
       ORDER BY s.created_at DESC`,
      [user.id],
    );

    res.json({
      subscriptions: result.rows.map((row) => ({
        targetId: row.target_id,
        notify: row.notify,
        name: row.nickname || row.name,
      })),
    });
  });

  app.get("/api/users/:id/profile", async (req, res) => {
    const targetId = req.params.id;
    const userResult = await pool.query(
      `SELECT id, email, name, role, upgrade_request_status FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [targetId],
    );

    const targetUser = userResult.rows[0];
    if (!targetUser || targetUser.role !== "musician") {
      return res.status(404).json({ message: "뮤지션을 찾을 수 없습니다." });
    }

    const settingsResult = await pool.query(`SELECT * FROM user_settings WHERE user_id = $1`, [targetId]);
    const contentsResult = await pool.query(
      `SELECT id, title, description, category, thumbnail, video_url, video_file, pdf_file, pdf_file_name, author_id, author_name, created_at, pdf_price, is_sanctioned, sanction_reason, sanctioned_at
       FROM contents
       WHERE author_id = $1
       ORDER BY created_at DESC`,
      [targetId],
    );

    let subscription = { subscribed: false, notify: false };
    if (req.session.user) {
      const subscriptionResult = await pool.query(
        `SELECT notify FROM subscriptions WHERE user_id = $1 AND target_id = $2 LIMIT 1`,
        [req.session.user.id, targetId],
      );
      if (subscriptionResult.rows[0]) {
        subscription = { subscribed: true, notify: Boolean(subscriptionResult.rows[0].notify) };
      }
    }

    res.json({
      user: mapPublicUser(targetUser),
      settings: settingsResult.rows[0] ? mapPublicProfileSettings(settingsResult.rows[0]) : {},
      contents: contentsResult.rows.map(mapContent),
      subscription,
    });
  });

  app.delete("/api/users/me", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const reason = (req.body?.reason as string | undefined) || "";

    await pool.query(`INSERT INTO deleted_accounts (user_id, email, reason) VALUES ($1, $2, $3)`, [user.id, user.email, reason]);
    await pool.query(`UPDATE users SET deleted_at = NOW() WHERE id = $1`, [user.id]);

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.post(
    "/api/applications",
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "signedContractFile", maxCount: 1 },
    ]),
    async (req, res) => {
      const user = requireAuth(req, res);
      if (!user) return;

      const {
        name,
        nickname,
        category,
        email,
        bankName,
        accountNumber,
        accountHolder,
        contractChecked,
      } = req.body ?? {};

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const videoFile = files?.videoFile?.[0];
      const signedContractFile = files?.signedContractFile?.[0];

      if (!name || !nickname || !category || !email || !bankName || !accountNumber || !accountHolder || !videoFile) {
        safeUnlink(videoFile?.path);
        safeUnlink(signedContractFile?.path);
        return res.status(400).json({ message: "지원 정보가 누락되었습니다." });
      }

      if (!signedContractFile) {
        safeUnlink(videoFile?.path);
        return res.status(400).json({ message: "서명한 계약서를 업로드해 주세요." });
      }

      if (contractChecked !== "true") {
        safeUnlink(videoFile?.path);
        safeUnlink(signedContractFile?.path);
        return res.status(400).json({ message: "계약서를 확인하고 동의 체크를 해주세요." });
      }

      try {
        validateFileSignature(videoFile, "video");
        validateFileSignature(signedContractFile, "pdf");
      } catch (error) {
        safeUnlink(videoFile.path);
        safeUnlink(signedContractFile.path);
        return res.status(400).json({ message: error instanceof Error ? error.message : "파일 검증에 실패했습니다." });
      }

      const existing = await pool.query(
        `SELECT id FROM musician_applications WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
        [user.id],
      );

      if (existing.rows[0]) {
        safeUnlink(videoFile.path);
        safeUnlink(signedContractFile.path);
        return res.status(409).json({ message: "이미 대기 중인 승급 요청이 있습니다." });
      }

      const videoPath = `${filePathToPublicUrl(videoFile.path)}`;
      const signedContractPath = `${toStoredRelativePath(signedContractFile.path)}`;
      const encryptedAccount = encryptAccountNumber(String(accountNumber));

      const result = await pool.query(
        `INSERT INTO musician_applications (
          user_id,
          name,
          nickname,
          category,
          email,
          bank_name,
          account_number,
          account_number_encrypted,
          account_number_last4,
          account_holder,
          video_file_name,
          video_size,
          video_path,
          signed_contract_file_name,
          signed_contract_size,
          signed_contract_path,
          contract_checked,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
        )
        RETURNING
          id,
          user_id,
          name,
          nickname,
          category,
          email,
          bank_name,
          account_number,
          account_number_encrypted,
          account_number_last4,
          account_holder,
          video_file_name,
          video_size,
          video_path,
          signed_contract_file_name,
          signed_contract_size,
          signed_contract_path,
          contract_checked,
          created_at,
          status`,
        [
          user.id,
          name,
          nickname,
          category,
          normalizeEmail(email),
          bankName,
          encryptedAccount.isPlaintextFallback ? String(accountNumber) : null,
          encryptedAccount.encrypted,
          encryptedAccount.last4,
          accountHolder,
          videoFile.originalname,
          videoFile.size,
          videoPath,
          signedContractFile.originalname,
          signedContractFile.size,
          signedContractPath,
          true,
          "pending",
        ],
      );

      await pool.query(`UPDATE users SET upgrade_request_status = 'pending' WHERE id = $1`, [user.id]);

      const refreshed = await pool.query(
        `SELECT id, email, name, role, upgrade_request_status FROM users WHERE id = $1`,
        [user.id],
      );

      req.session.user = mapUser(refreshed.rows[0]);

      const row = result.rows[0];

      res.json({
        application: mapApplicationRow(row),
        user: req.session.user,
      });
    },
  );

  app.get("/api/admin/dashboard", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const appsResult = await pool.query(
      `SELECT id, user_id, name, nickname, category, email, bank_name, account_number, account_number_encrypted, account_number_last4, account_holder, rejected_reason, admin_memo, video_file_name, video_size, video_path, signed_contract_file_name, signed_contract_size, signed_contract_path, contract_checked, created_at, status
       FROM musician_applications
       ORDER BY created_at DESC`,
    );
    const settingsResult = await pool.query<UserSettingsRow>(`SELECT * FROM user_settings`);
    const contentsResult = await pool.query(`SELECT id, author_id, is_sanctioned FROM contents ORDER BY created_at DESC`);

    const normalizedApps = appsResult.rows.map(mapApplicationRow);

    const settings = settingsResult.rows.reduce<Record<string, ReturnType<typeof mapUserSettings>>>((acc, row) => {
      acc[row.user_id] = mapUserSettings(row);
      return acc;
    }, {});

    const contents = contentsResult.rows.map((row) => ({ id: row.id, authorId: row.author_id, isSanctioned: row.is_sanctioned }));

    res.json({
      applications: normalizedApps.filter((app) => app.status === "pending"),
      processedApplications: normalizedApps.filter((app) => app.status !== "pending"),
      settings,
      contents,
    });
  });

  app.get("/api/admin/applications/:id/contract-download", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    let applicationId: string;
    try {
      applicationId = requireUuidOrThrow(req.params.id, "id");
    } catch (error) {
      if (error instanceof ApiError) return sendError(res, error.status, error.code, error.message, error.details);
      throw error;
    }

    const result = await pool.query(
      `SELECT id, signed_contract_path, signed_contract_file_name FROM musician_applications WHERE id = $1`,
      [applicationId],
    );

    const application = result.rows[0];
    if (!application) {
      return sendError(res, 404, "NOT_FOUND", "신청서를 찾을 수 없습니다.");
    }

    if (!application.signed_contract_path) {
      return sendError(res, 404, "NOT_FOUND", "계약서 파일을 찾을 수 없습니다.");
    }

    const absolutePath = assertOwnedFilePath(resolveStoredPath(String(application.signed_contract_path)), CONTRACTS_DIR);
    if (!fs.existsSync(absolutePath)) {
      return sendError(res, 404, "NOT_FOUND", "계약서 파일이 존재하지 않습니다.");
    }

    await logAdminAudit({
      adminUserId: admin.id,
      actionType: "contract_download",
      targetType: "application",
      targetId: application.id,
      metadata: { fileName: application.signed_contract_file_name || null },
      ...getRequestAuditMeta(req),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(application.signed_contract_file_name || 'signed-contract.pdf')}`);
    return res.sendFile(absolutePath);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const targetId = req.params.id;
    const userResult = await pool.query(
      `SELECT id, email, role FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [targetId],
    );

    const targetUser = userResult.rows[0];
    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (targetUser.role === "admin") {
      return res.status(400).json({ message: "관리자 계정은 삭제할 수 없습니다." });
    }

    const sanctionedCountResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM contents WHERE author_id = $1 AND is_sanctioned = TRUE`,
      [targetId],
    );

    if ((sanctionedCountResult.rows[0]?.count ?? 0) < 2) {
      return res.status(400).json({ message: "제재 영상이 2개 이상일 때만 계정 삭제가 가능합니다." });
    }

    await pool.query(`INSERT INTO deleted_accounts (user_id, email, reason) VALUES ($1, $2, $3)`, [targetId, targetUser.email, "관리자 삭제"]);
    await pool.query(`UPDATE users SET deleted_at = NOW() WHERE id = $1`, [targetId]);

    await logAdminAudit({
      adminUserId: admin.id,
      actionType: "delete_user",
      targetType: "user",
      targetId,
      reason: "관리자 삭제",
      metadata: { email: targetUser.email, sanctionedCount: sanctionedCountResult.rows[0]?.count ?? 0 },
    });

    res.json({ success: true });
  });

  app.post("/api/admin/applications/:id/approve", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;

    const appResult = await pool.query(`SELECT *, account_number_encrypted, account_number_last4 FROM musician_applications WHERE id = $1`, [id]);
    const application = appResult.rows[0];

    if (!application) {
      return res.status(404).json({ message: "지원서를 찾을 수 없습니다." });
    }

    const adminMemo = normalizeOptionalText(req.body?.adminMemo);

    await pool.query(`UPDATE users SET role = 'musician', upgrade_request_status = 'approved' WHERE id = $1`, [application.user_id]);
    await pool.query(`UPDATE musician_applications SET status = 'approved', rejected_reason = NULL, admin_memo = COALESCE($2, admin_memo) WHERE id = $1`, [id, adminMemo]);

    await logAdminAudit({
      adminUserId: admin.id,
      actionType: "approve_application",
      targetType: "musician_application",
      targetId: id,
      metadata: { userId: application.user_id, nickname: application.nickname, adminMemo: adminMemo || null },
    });

    await pool.query(
      `INSERT INTO user_settings (user_id, nickname)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET nickname = COALESCE(user_settings.nickname, EXCLUDED.nickname)`,
      [application.user_id, application.nickname],
    );

    res.json({ success: true });
  });

  app.post("/api/admin/applications/:id/reject", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;

    const appResult = await pool.query(`SELECT *, account_number_encrypted, account_number_last4 FROM musician_applications WHERE id = $1`, [id]);
    const application = appResult.rows[0];

    if (!application) {
      return res.status(404).json({ message: "지원서를 찾을 수 없습니다." });
    }

    const rejectedReason = normalizeOptionalText(req.body?.reason);
    const adminMemo = normalizeOptionalText(req.body?.adminMemo);

    if (!rejectedReason) {
      return sendError(res, 400, "INVALID_REQUEST", "거절 사유가 필요합니다.");
    }

    await pool.query(`UPDATE users SET upgrade_request_status = 'rejected' WHERE id = $1`, [application.user_id]);
    await pool.query(`UPDATE musician_applications SET status = 'rejected', rejected_reason = $2, admin_memo = $3 WHERE id = $1`, [id, rejectedReason, adminMemo]);

    await logAdminAudit({
      adminUserId: admin.id,
      actionType: "reject_application",
      targetType: "musician_application",
      targetId: id,
      reason: rejectedReason,
      metadata: { userId: application.user_id, adminMemo: adminMemo || null },
    });

    res.json({ success: true });
  });

  app.post("/api/admin/contents/:id/sanction", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { reason } = req.body ?? {};

    if (!reason) {
      return res.status(400).json({ message: "삭제 사유가 필요합니다." });
    }

    await pool.query(
      `UPDATE contents
      SET is_sanctioned = TRUE,
          sanction_reason = $1,
          sanctioned_at = NOW()
      WHERE id = $2`,
      [reason, id]
    );

    await logAdminAudit({
      adminUserId: admin.id,
      actionType: "sanction_content",
      targetType: "content",
      targetId: id,
      reason: String(reason),
    });

    res.json({ success: true });
  });

  app.post("/api/admin/contents/:id/unsanction", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;

    await pool.query(
      `UPDATE contents
      SET is_sanctioned = FALSE,
          sanction_reason = NULL,
          sanctioned_at = NULL
      WHERE id = $1`,
      [id]
    );

    await logAdminAudit({
      adminUserId: admin.id,
      actionType: "unsanction_content",
      targetType: "content",
      targetId: id,
    });

    res.json({ success: true });
  });

  app.post(
    "/api/contents",
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "videoFile", maxCount: 1 },
      { name: "pdfFile", maxCount: 1 },
    ]),
    async (req, res) => {
      const user = requireAuth(req, res);
      if (!user) return;

      if (user.role !== "musician" && user.role !== "admin") {
        return res.status(403).json({ message: "뮤지션만 업로드할 수 있습니다." });
      }

      const {
        title,
        description,
        category,
        videoUrl,
        pdfPrice,
      } = req.body ?? {};

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const thumbnailFile = files?.thumbnail?.[0];
      const videoFile = files?.videoFile?.[0];
      const pdfFile = files?.pdfFile?.[0];

      const cleanupFiles = () => {
        safeUnlink(thumbnailFile?.path);
        safeUnlink(videoFile?.path);
        safeUnlink(pdfFile?.path);
      };

      if (!title || !description || !category) {
        cleanupFiles();
        return res.status(400).json({ message: "제목, 설명, 카테고리는 필수입니다." });
      }

      if (!thumbnailFile) {
        cleanupFiles();
        return res.status(400).json({ message: "썸네일 이미지는 필수입니다." });
      }

      if (!videoUrl) {
        cleanupFiles();
        return res.status(400).json({ message: "영상은 URL 방식만 등록할 수 있습니다." });
      }

      if (videoFile && !FEATURE_FLAGS.allowVideoFileUpload) {
        cleanupFiles();
        return res.status(400).json({ message: "영상은 URL 방식만 등록할 수 있습니다." });
      }

      if (videoUrl && videoFile) {
        cleanupFiles();
        return res.status(400).json({ message: "영상 URL과 영상 파일은 동시에 등록할 수 없습니다." });
      }

      if (!isSupportedVideoUrl(String(videoUrl))) {
        cleanupFiles();
        return res.status(400).json({ message: "지원하지 않는 영상 URL 형식입니다." });
      }

      const parsedPdfPrice = Number(pdfPrice || 0);
      if (pdfFile && parsedPdfPrice > 0 && parsedPdfPrice < 1000) {
        cleanupFiles();
        return res.status(400).json({ message: "유료 PDF 가격은 1000원 이상이어야 합니다." });
      }

      try {
        validateFileSignature(thumbnailFile, "image");
        if (videoFile) validateFileSignature(videoFile, "video");
        if (pdfFile) validateFileSignature(pdfFile, "pdf");
      } catch (error) {
        cleanupFiles();
        return res.status(400).json({ message: error instanceof Error ? error.message : "파일 검증에 실패했습니다." });
      }

      const thumbnailPath = `${filePathToPublicUrl(thumbnailFile.path)}`;
      const videoFilePath = videoFile ? `${filePathToPublicUrl(videoFile.path)}` : null;
      const pdfFilePath = pdfFile ? `${toStoredRelativePath(pdfFile.path)}` : null;
      const resolvedAuthorName = await resolveAuthorDisplayName(user.id, user.name);

      const result = await pool.query(
        `INSERT INTO contents (title, description, category, thumbnail, video_url, video_file, pdf_file, pdf_file_name, author_id, author_name, pdf_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, title, description, category, thumbnail, video_url, video_file, pdf_file, pdf_file_name, author_id, author_name, created_at, pdf_price`,
        [
          String(title).trim(),
          String(description).trim(),
          String(category).trim(),
          thumbnailPath,
          normalizeOptionalText(videoUrl),
          videoFilePath,
          pdfFilePath,
          pdfFile?.originalname || null,
          user.id,
          resolvedAuthorName,
          Number.isFinite(parsedPdfPrice) ? parsedPdfPrice : 0,
        ],
      );

      const row = result.rows[0];

      void sendNewContentNotificationEmail(
        {
          title: row.title,
          authorName: row.author_name,
          category: row.category,
          id: row.id,
        },
        user.id,
      );

      res.json({
        content: {
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          thumbnail: row.thumbnail,
          videoUrl: row.video_url || "",
          videoFile: row.video_file || undefined,
          pdfFile: row.pdf_file || undefined,
          pdfFileName: row.pdf_file_name || undefined,
          authorId: row.author_id,
          authorName: row.author_name,
          createdAt: row.created_at,
          pdfPrice: Number(row.pdf_price || 0),
        },
      });
    },
  );

  app.delete("/api/contents/:id", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM contents WHERE id = $1 AND author_id = $2 RETURNING id, thumbnail, video_file, pdf_file`,
      [id, user.id],
    );

    const deleted = result.rows[0];
    if (!deleted) {
      return res.status(404).json({ message: "삭제할 콘텐츠를 찾을 수 없습니다." });
    }

    for (const filePath of [deleted.thumbnail, deleted.video_file, deleted.pdf_file]) {
      if (filePath) {
        safeUnlink(resolveStoredPath(String(filePath)));
      }
    }

    res.json({ success: true });
  });

  app.post("/api/subscriptions/toggle", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const { targetId } = req.body ?? {};

    if (!targetId) {
      return res.status(400).json({ message: "대상 사용자가 필요합니다." });
    }

    const existing = await pool.query(
      `SELECT id FROM subscriptions WHERE user_id = $1 AND target_id = $2`,
      [user.id, targetId],
    );

    if (existing.rows[0]) {
      await pool.query(`DELETE FROM subscriptions WHERE user_id = $1 AND target_id = $2`, [user.id, targetId]);
      return res.json({ subscribed: false, notify: false });
    }

    await pool.query(`INSERT INTO subscriptions (user_id, target_id, notify) VALUES ($1, $2, TRUE)`, [user.id, targetId]);

    res.json({ subscribed: true, notify: true });
  });

  app.post("/api/subscriptions/notify", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const { targetId, notify } = req.body ?? {};

    await pool.query(`UPDATE subscriptions SET notify = $3 WHERE user_id = $1 AND target_id = $2`, [
      user.id,
      targetId,
      !!notify,
    ]);

    res.json({ success: true });
  });

  app.get("/api/admin/settlements", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const year = normalizeSettlementYear(req.query.year);
    const month = normalizeSettlementMonth(req.query.month);

    if (!year || !month) {
      return sendError(res, 400, "INVALID_REQUEST", "year, month가 올바르지 않습니다.");
    }

    const settlements = await getSettlementSummary(year, month);
    return res.json({ year, month, settlements });
  });

  app.post("/api/admin/settlements/resync", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const year = normalizeSettlementYear(req.body?.year ?? req.query.year);
    const month = normalizeSettlementMonth(req.body?.month ?? req.query.month);

    if (!year || !month) {
      return sendError(res, 400, "INVALID_REQUEST", "year, month가 올바르지 않습니다.");
    }

    const settlements = await getSettlementSummary(year, month);

    await logAdminAudit({
      adminUserId: admin.id,
      actionType: "settlement_manual_resync",
      targetType: "settlement_month",
      targetId: `${year}:${month}`,
      metadata: { year, month, count: settlements.length },
      ...getRequestAuditMeta(req),
    });

    return res.json({ success: true, year, month, settlements });
  });

  app.get("/api/settlements/me", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role !== "musician") {
      return sendError(res, 403, "FORBIDDEN", "뮤지션 권한이 필요합니다.");
    }

    const year = normalizeSettlementYear(req.query.year);
    const month = normalizeSettlementMonth(req.query.month);

    if (!year || !month) {
      return sendError(res, 400, "INVALID_REQUEST", "year, month가 올바르지 않습니다.");
    }

    const settlements = await getSettlementSummary(year, month, { musicianUserId: user.id });
    return res.json({
      year,
      month,
      settlement: settlements[0] || null,
    });
  });

  app.post("/api/admin/settlements/:musicianUserId/pay", async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    let musicianUserId: string;
    try {
      musicianUserId = requireUuidOrThrow(req.params.musicianUserId, "musicianUserId");
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(res, error.status, error.code, error.message, error.details);
      }
      throw error;
    }

    const year = normalizeSettlementYear(req.body?.year);
    const month = normalizeSettlementMonth(req.body?.month);

    if (!year || !month) {
      return sendError(res, 400, "INVALID_REQUEST", "year, month가 올바르지 않습니다.");
    }

    const settlements = await getSettlementSummary(year, month, { musicianUserId });
    const target = settlements.find((item) => item.musicianUserId === musicianUserId);

    if (!target) {
      return sendError(res, 404, "NOT_FOUND", "정산 대상이 없습니다.");
    }

    if (target.status === "paid") {
      return sendError(res, 409, "ALREADY_PAID", "이미 지급완료 처리된 정산입니다.");
    }

    const paidSettlement = await withTransaction(async (client) => {
      const result = await client.query<SettlementStatusRow>(
        `INSERT INTO monthly_settlement_status (musician_user_id, year, month, status, paid_at, paid_by_admin_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'paid', NOW(), $4, NOW(), NOW())
         ON CONFLICT (musician_user_id, year, month)
         DO UPDATE SET status = 'paid', paid_at = NOW(), paid_by_admin_id = EXCLUDED.paid_by_admin_id, updated_at = NOW()
         WHERE monthly_settlement_status.status <> 'paid'
         RETURNING musician_user_id, year, month, status, paid_at, paid_by_admin_id`,
        [musicianUserId, year, month, admin.id],
      );

      if (!result.rows[0]) {
        throw new ApiError(409, 'ALREADY_PAID', '이미 지급완료 처리된 정산입니다.');
      }

      const paidRow = result.rows[0];
      const paidSettlementSnapshot: SettlementSummary = {
        ...target,
        status: 'paid',
        statusLabel: '지급완료',
        paidAt: paidRow.paid_at,
        paidByAdminId: paidRow.paid_by_admin_id,
      };

      await client.query(
        `INSERT INTO monthly_settlement_snapshots (musician_user_id, year, month, total_amount, payout_amount, platform_revenue, status, paid_at, paid_by_admin_id, snapshot, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7, $8, $9::jsonb, NOW(), NOW())
         ON CONFLICT (musician_user_id, year, month)
         DO UPDATE SET total_amount = EXCLUDED.total_amount,
                       payout_amount = EXCLUDED.payout_amount,
                       platform_revenue = EXCLUDED.platform_revenue,
                       status = EXCLUDED.status,
                       paid_at = EXCLUDED.paid_at,
                       paid_by_admin_id = EXCLUDED.paid_by_admin_id,
                       snapshot = EXCLUDED.snapshot,
                       updated_at = NOW()`,
        [
          musicianUserId,
          year,
          month,
          target.totalAmount,
          target.payoutAmount,
          target.platformRevenue,
          paidRow.paid_at,
          paidRow.paid_by_admin_id,
          JSON.stringify(paidSettlementSnapshot),
        ],
      );

      await client.query(
        `INSERT INTO admin_audit_logs (admin_user_id, action_type, target_type, target_id, reason, request_ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
        [
          admin.id,
          'settlement_paid',
          'monthly_settlement_status',
          `${musicianUserId}:${year}:${month}`,
          null,
          getRequestAuditMeta(req).requestIp || null,
          getRequestAuditMeta(req).userAgent || null,
          JSON.stringify(sanitizeAuditMetadata({ musicianUserId, year, month, totalAmount: target.totalAmount, payoutAmount: target.payoutAmount }) || {}),
        ],
      );

      return paidSettlementSnapshot;
    });

    return res.json({
      success: true,
      settlement: paidSettlement,
    });
  });

  app.post("/api/payments/prepare", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    let contentId: string;
    try {
      contentId = requireUuidOrThrow(req.body?.contentId, "contentId");
    } catch (error) {
      if (error instanceof ApiError) return sendError(res, error.status, error.code, error.message, error.details);
      throw error;
    }

    const contentResult = await pool.query(
      `SELECT c.id, c.title, c.author_id, c.author_name, c.pdf_price, c.pdf_file, c.is_sanctioned
       FROM contents c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = $1 AND u.deleted_at IS NULL`,
      [contentId],
    );

    const content = contentResult.rows[0];
    if (!content) {
      return sendError(res, 404, "NOT_FOUND", "콘텐츠를 찾을 수 없습니다.");
    }

    if (content.is_sanctioned) {
      return sendError(res, 403, "FORBIDDEN", "제재된 콘텐츠는 결제할 수 없습니다.");
    }

    const supplyAmount = normalizeAmount(content.pdf_price);
    if (!content.pdf_file || supplyAmount === null || supplyAmount <= 0) {
      return sendError(res, 400, "INVALID_REQUEST", "유료 PDF 콘텐츠만 결제를 준비할 수 있습니다.");
    }

    const purchaseResult = await pool.query(
      `SELECT 1 FROM purchases WHERE user_id = $1 AND content_id = $2 AND status = 'active' LIMIT 1`,
      [user.id, contentId],
    );

    if (purchaseResult.rows[0]) {
      return sendError(res, 409, "ALREADY_PURCHASED", "이미 구매한 콘텐츠입니다.");
    }

    const expiredPendingResult = await pool.query(
      `UPDATE payment_orders
       SET status = 'expired', expired_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND content_id = $2 AND status = 'pending'`,
      [user.id, contentId],
    );

    const userResult = await pool.query(
      `SELECT u.email, u.name, us.nickname
       FROM users u
       LEFT JOIN user_settings us ON us.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [user.id],
    );
    const buyer = userResult.rows[0];

    const orderId = createPaymentOrderId();
    const orderName = `${content.title} PDF`;
    const appBaseUrl = getAppBaseUrl(req);
    const successUrl = `${appBaseUrl}/payment/success`;
    const failUrl = `${appBaseUrl}/payment/fail`;

    await pool.query(
      `INSERT INTO payment_orders (order_id, user_id, content_id, amount, currency, order_name, status, provider, requested_at, expires_at, raw_prepare_payload)
       VALUES ($1, $2, $3, $4, 'KRW', $5, 'pending', 'toss', NOW(), NOW() + INTERVAL '15 minutes', $6::jsonb)`,
      [orderId, user.id, content.id, calculateTotalAmountWithVat(supplyAmount), orderName, JSON.stringify({ contentId: content.id, supplyAmount, vatAmount: calculateVatAmount(supplyAmount), amount: calculateTotalAmountWithVat(supplyAmount), orderName })],
    );

    await logPaymentAudit({
      userId: user.id,
      orderId,
      contentId: content.id,
      actionType: "prepare",
      status: "pending",
      metadata: { supplyAmount, vatAmount: calculateVatAmount(supplyAmount), amount: calculateTotalAmountWithVat(supplyAmount), expiredPreviousPendingCount: expiredPendingResult.rowCount },
      ...getRequestAuditMeta(req),
    });

    return res.json({
      orderId,
      orderName,
      amount: calculateTotalAmountWithVat(supplyAmount),
      customerKey: user.id,
      customerEmail: buyer?.email || user.email,
      customerName: buyer?.nickname || buyer?.name || user.name,
      successUrl,
      failUrl,
      contentId: content.id,
    });
  });

  app.get("/api/payments/status", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const orderId = normalizeOptionalText(req.query?.orderId);
    if (!orderId) {
      return sendError(res, 400, "INVALID_REQUEST", "orderId가 필요합니다.");
    }

    const orderResult = await pool.query(
      `SELECT order_id, content_id, amount, payment_key, status, approved_at, confirmed_at, failed_at, failure_code, failure_message, expires_at, updated_at
       FROM payment_orders
       WHERE order_id = $1 AND user_id = $2
       LIMIT 1`,
      [orderId, user.id],
    );

    const order = orderResult.rows[0];
    if (!order) {
      return sendError(res, 404, "NOT_FOUND", "주문 정보를 찾을 수 없습니다.");
    }

    const purchaseResult = await pool.query(
      `SELECT id, status, created_at FROM purchases WHERE payment_order_id = (SELECT id FROM payment_orders WHERE order_id = $1) LIMIT 1`,
      [orderId],
    );

    await logPaymentAudit({
      userId: user.id,
      orderId,
      contentId: order.content_id,
      actionType: "status_check",
      status: String(order.status),
      metadata: { hasPurchase: Boolean(purchaseResult.rows[0]) },
      ...getRequestAuditMeta(req),
    });

    return res.json({
      orderId: order.order_id,
      contentId: order.content_id,
      amount: normalizeAmount(order.amount),
      paymentKey: order.payment_key || undefined,
      status: order.status,
      approvedAt: order.approved_at,
      confirmedAt: order.confirmed_at,
      failedAt: order.failed_at,
      failureCode: order.failure_code || undefined,
      failureMessage: order.failure_message || undefined,
      expiresAt: order.expires_at,
      updatedAt: order.updated_at,
      purchase: purchaseResult.rows[0]
        ? {
            id: purchaseResult.rows[0].id,
            status: purchaseResult.rows[0].status,
            createdAt: purchaseResult.rows[0].created_at,
          }
        : null,
    });
  });

  app.post("/api/payments/confirm", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const paymentKey = normalizeOptionalText(req.body?.paymentKey);
    const orderId = normalizeOptionalText(req.body?.orderId);
    const requestedAmount = parseKrwAmount(req.body?.amount);

    if (!paymentKey || !orderId || requestedAmount === null || requestedAmount <= 0) {
      return sendError(res, 400, "INVALID_REQUEST", "paymentKey, orderId, amount가 모두 필요합니다.");
    }

    await logPaymentAudit({
      userId: user.id,
      orderId: String(orderId),
      actionType: "confirm_request",
      status: "requested",
      metadata: { requestedAmount },
      ...getRequestAuditMeta(req),
    });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT po.id, po.order_id, po.user_id, po.content_id, po.amount, po.currency, po.order_name, po.payment_key, po.status, po.expires_at
         FROM payment_orders po
         WHERE po.order_id = $1
         FOR UPDATE`,
        [orderId],
      );

      const order = orderResult.rows[0];
      if (!order) {
        await client.query("ROLLBACK");
        await logPaymentAudit({ userId: user.id, orderId: String(orderId), actionType: "confirm_rejected", status: "order_not_found" });
        return sendError(res, 404, "NOT_FOUND", "주문 정보를 찾을 수 없습니다.");
      }

      if (order.user_id !== user.id) {
        await client.query("ROLLBACK");
        await logPaymentAudit({ userId: user.id, orderId: String(orderId), contentId: order.content_id, actionType: "confirm_rejected", status: "owner_mismatch" });
        return sendError(res, 403, "FORBIDDEN", "현재 사용자와 주문 사용자가 일치하지 않습니다.");
      }

      if (order.status === "paid") {
        const purchaseResult = await client.query(
          `SELECT id FROM purchases WHERE payment_order_id = $1 OR (user_id = $2 AND content_id = $3 AND status = 'active') LIMIT 1`,
          [order.id, user.id, order.content_id],
        );

        await client.query("COMMIT");
        if (purchaseResult.rows[0]) {
          await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "confirm_duplicate", status: "already_paid" });
          return res.json({
            success: true,
            orderId: order.order_id,
            contentId: order.content_id,
            paymentKey: order.payment_key || String(paymentKey),
            alreadyProcessed: true,
          });
        }

        await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "confirm_rejected", status: "already_paid_without_purchase" });
        return sendError(res, 409, "ALREADY_PROCESSED", "이미 승인된 주문입니다.");
      }

      if (order.status !== "pending") {
        await client.query("ROLLBACK");
        await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "confirm_rejected", status: `invalid_status:${order.status}` });
        return sendError(res, 409, "INVALID_ORDER_STATUS", "승인 가능한 주문 상태가 아닙니다.");
      }

      if (order.expires_at && new Date(order.expires_at).getTime() <= Date.now()) {
        await client.query(
          `UPDATE payment_orders
           SET status = 'expired', expired_at = NOW(), updated_at = NOW(), raw_payload = $2::jsonb, raw_confirm_payload = $2::jsonb, failure_code = 'ORDER_EXPIRED', failure_message = '만료된 주문입니다.'
           WHERE id = $1`,
          [order.id, JSON.stringify(summarizeFailedPaymentPayload({ reason: "ORDER_EXPIRED", orderId: order.order_id, amount: requestedAmount }))],
        );
        await client.query("COMMIT");
        await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "expire", status: "expired", metadata: { phase: "confirm", expiresAt: order.expires_at } });
        return sendError(res, 409, "ORDER_EXPIRED", "만료된 주문입니다. 다시 결제를 시도해 주세요.");
      }

      if (normalizeAmount(order.amount) !== requestedAmount) {
        await client.query(
          `UPDATE payment_orders
           SET status = 'failed', failed_at = NOW(), updated_at = NOW(), raw_payload = $2::jsonb, raw_confirm_payload = $2::jsonb, failure_code = 'PAYMENT_CONFIRM_FAILED', failure_message = COALESCE(($2::jsonb ->> 'message'), failure_message)
           WHERE id = $1`,
          [order.id, JSON.stringify(summarizeFailedPaymentPayload({ reason: 'AMOUNT_MISMATCH', orderId: order.order_id, amount: requestedAmount, dbAmount: normalizeAmount(order.amount) }))],
        );
        await client.query("COMMIT");
        await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "confirm_failed", status: "amount_mismatch", metadata: { requestedAmount, dbAmount: normalizeAmount(order.amount) } });
        return sendError(res, 400, "AMOUNT_MISMATCH", "주문 금액 검증에 실패했습니다.");
      }

      const duplicatePaymentKeyResult = await client.query(
        `SELECT order_id FROM payment_orders WHERE payment_key = $1 AND order_id <> $2 LIMIT 1`,
        [paymentKey, orderId],
      );
      if (duplicatePaymentKeyResult.rows[0]) {
        await client.query("ROLLBACK");
        await logPaymentAudit({ userId: user.id, orderId: String(orderId), contentId: order.content_id, actionType: "confirm_rejected", status: "duplicate_payment_key" });
        return sendError(res, 409, "DUPLICATE_PAYMENT_KEY", "이미 처리된 paymentKey입니다.");
      }

      const purchaseResult = await client.query(
        `SELECT id FROM purchases WHERE user_id = $1 AND content_id = $2 AND status = 'active' LIMIT 1`,
        [user.id, order.content_id],
      );
      if (purchaseResult.rows[0]) {
        await client.query("ROLLBACK");
        await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "confirm_rejected", status: "purchase_exists" });
        return sendError(res, 409, "ALREADY_PURCHASED", "이미 구매가 활성화된 콘텐츠입니다.");
      }

      const payment = await confirmTossPayment(String(paymentKey), String(orderId), requestedAmount);
      const approvedAmount = normalizeAmount(payment.totalAmount ?? payment.balanceAmount ?? requestedAmount);

      if (String(payment.orderId) !== String(order.order_id) || approvedAmount !== normalizeAmount(order.amount) || String(payment.paymentKey) !== String(paymentKey)) {
        await client.query(
          `UPDATE payment_orders
           SET status = 'failed', failed_at = NOW(), updated_at = NOW(), raw_payload = $2::jsonb, raw_confirm_payload = $2::jsonb, failure_code = 'PAYMENT_CONFIRM_FAILED', failure_message = COALESCE(($2::jsonb ->> 'message'), failure_message)
           WHERE id = $1`,
          [order.id, JSON.stringify(summarizeFailedPaymentPayload({ reason: 'PROVIDER_RESPONSE_MISMATCH', orderId: String(payment.orderId), paymentKey: String(payment.paymentKey), amount: approvedAmount }))],
        );
        await client.query("COMMIT");
        await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "confirm_failed", status: "provider_response_mismatch" });
        return sendError(res, 400, "PROVIDER_RESPONSE_MISMATCH", "결제 승인 응답 검증에 실패했습니다.");
      }

      const summarizedPayment = summarizeSuccessfulPaymentPayload(payment);

      await client.query(
        `UPDATE payment_orders
         SET payment_key = $2,
             status = 'paid',
             raw_payload = $3::jsonb,
             raw_confirm_payload = $3::jsonb,
             approved_at = NOW(),
             confirmed_at = NOW(),
             updated_at = NOW(),
             failed_at = NULL,
             expired_at = NULL,
             failure_code = NULL,
             failure_message = NULL
         WHERE id = $1`,
        [order.id, String(paymentKey), JSON.stringify(summarizedPayment)],
      );

      await client.query(
        `INSERT INTO purchases (user_id, content_id, payment_order_id, status, revoked_at)
         VALUES ($1, $2, $3, 'active', NULL)
         ON CONFLICT (user_id, content_id)
         DO UPDATE SET payment_order_id = EXCLUDED.payment_order_id, status = 'active', revoked_at = NULL`,
        [user.id, order.content_id, order.id],
      );

      await client.query("COMMIT");
      await logPaymentAudit({ userId: user.id, orderId: order.order_id, contentId: order.content_id, actionType: "confirm_success", status: "paid", metadata: summarizedPayment, ...getRequestAuditMeta(req) });
      return res.json({
        success: true,
        orderId: order.order_id,
        contentId: order.content_id,
        paymentKey: String(paymentKey),
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);

      const knownOrderId = typeof req.body?.orderId === "string" ? req.body.orderId : null;
      if (knownOrderId) {
        const errorPayload = isJsonRecord(error) && isJsonRecord(error.payload)
          ? error.payload
          : { message: error instanceof Error ? error.message : String(error) };
        const payload = isJsonRecord(error) && "payload" in error
          ? summarizeFailedPaymentPayload(errorPayload)
          : summarizeFailedPaymentPayload({ message: error instanceof Error ? error.message : String(error), orderId: knownOrderId, amount: requestedAmount });
        await pool.query(
          `UPDATE payment_orders
           SET status = 'failed', failed_at = NOW(), updated_at = NOW(), raw_payload = $2::jsonb, raw_confirm_payload = $2::jsonb, failure_code = 'PAYMENT_CONFIRM_FAILED', failure_message = COALESCE(($2::jsonb ->> 'message'), failure_message)
           WHERE order_id = $1 AND status = 'pending'`,
          [knownOrderId, JSON.stringify(payload)],
        ).catch(() => undefined);
        await logPaymentAudit({ userId: user.id, orderId: knownOrderId, actionType: "confirm_failed", status: payload.code || payload.reason || "error", metadata: payload, errorCode: String(payload.code || payload.reason || "error"), errorMessage: String(payload.message || (error instanceof Error ? error.message : "결제 승인 실패")), ...getRequestAuditMeta(req) });
      }

      console.error("결제 승인 실패:", error);
      return sendError(res, 400, "PAYMENT_CONFIRM_FAILED", error instanceof Error ? error.message : "결제 승인에 실패했습니다.");
    } finally {
      client.release();
    }
  });

  app.post("/api/payments/fail", async (req, res) => {
    const { orderId, code, message } = req.body ?? {};

    if (orderId) {
      const failurePayload = summarizeFailedPaymentPayload({ orderId, code, message });
      await pool.query(
        `UPDATE payment_orders
         SET status = CASE WHEN status = 'paid' THEN status WHEN $3 IN ('USER_CANCEL','PAY_PROCESS_CANCELED','PAY_CANCEL') THEN 'canceled' ELSE 'failed' END,
             failed_at = CASE WHEN status = 'paid' THEN failed_at ELSE NOW() END,
             updated_at = NOW(),
             raw_payload = $2::jsonb,
             raw_confirm_payload = $2::jsonb,
             failure_code = $3,
             failure_message = $4
         WHERE order_id = $1`,
        [orderId, JSON.stringify(failurePayload), code || null, message || null],
      );

      const orderResult = await pool.query(`SELECT user_id, content_id, status FROM payment_orders WHERE order_id = $1 LIMIT 1`, [orderId]);
      const order = orderResult.rows[0];
      await logPaymentAudit({
        userId: order?.user_id || null,
        orderId,
        contentId: order?.content_id || null,
        actionType: "fail_callback",
        status: order?.status === 'paid' ? 'paid_ignored' : 'failed',
        metadata: failurePayload,
      });
    }

    return res.json({ success: true });
  });

  app.post("/api/purchases", async (_req, res) => {
    return res.status(403).json({
      message: "직접 구매 확정은 허용되지 않습니다. 결제 승인 완료 후에만 구매 권한이 생성됩니다.",
    });
  });

  return httpServer;
}