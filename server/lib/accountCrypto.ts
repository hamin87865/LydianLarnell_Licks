import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function normalizeKey(raw = process.env.ACCOUNT_ENCRYPTION_KEY || "") {
  const value = String(raw).trim();
  if (!value) return null;

  if (/^[A-Za-z0-9+/=]+$/.test(value)) {
    try {
      const decoded = Buffer.from(value, "base64");
      if (decoded.length >= 32) {
        return decoded.subarray(0, 32);
      }
    } catch {
      // fall through
    }
  }

  return createHash("sha256").update(value).digest();
}

export function isAccountEncryptionConfigured() {
  return Boolean(normalizeKey());
}

export function encryptAccountNumber(accountNumber: string) {
  const normalized = String(accountNumber || "").trim();
  const key = normalizeKey();
  if (!normalized) {
    return { encrypted: null, last4: null };
  }

  const digits = normalized.replace(/\D/g, "");
  if (!key) {
    return { encrypted: normalized, last4: digits.slice(-4) || null, isPlaintextFallback: true } as const;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([iv, tag, encrypted]).toString("base64"),
    last4: digits.slice(-4) || null,
    isPlaintextFallback: false,
  } as const;
}

export function decryptAccountNumber(encryptedValue?: string | null, legacyPlaintext?: string | null) {
  const encrypted = String(encryptedValue || "").trim();
  if (!encrypted) {
    const fallback = String(legacyPlaintext || "").trim();
    return fallback || null;
  }

  const key = normalizeKey();
  if (!key) {
    return legacyPlaintext ? String(legacyPlaintext).trim() || null : encrypted;
  }

  try {
    const payload = Buffer.from(encrypted, "base64");
    const iv = payload.subarray(0, IV_LENGTH);
    const tag = payload.subarray(IV_LENGTH, IV_LENGTH + 16);
    const ciphertext = payload.subarray(IV_LENGTH + 16);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    const fallback = String(legacyPlaintext || "").trim();
    return fallback || null;
  }
}

export function getAccountLast4(accountNumber?: string | null) {
  const digits = String(accountNumber || "").replace(/\D/g, "");
  return digits.slice(-4) || null;
}

export function maskAccountNumber(accountNumber?: string | null, last4?: string | null) {
  const digits = String(accountNumber || "").replace(/\D/g, "");
  const suffix = String(last4 || "").replace(/\D/g, "") || digits.slice(-4);
  if (!suffix) return undefined;
  const maskLength = Math.max((digits || suffix).length - suffix.length, 4);
  return `${"*".repeat(maskLength)}${suffix}`;
}
