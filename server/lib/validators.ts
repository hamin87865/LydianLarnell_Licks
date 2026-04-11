const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeOptionalText(value: unknown) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseUuid(value: unknown) {
  const text = normalizeOptionalText(value);
  if (!text || !UUID_REGEX.test(text)) return null;
  return text;
}

export function parseEmail(value: unknown) {
  const text = normalizeOptionalText(value)?.toLowerCase() || null;
  if (!text || !EMAIL_REGEX.test(text)) return null;
  return text;
}

export function parseKrwAmount(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  if (!Number.isInteger(num)) return null;
  if (num < 0) return null;
  return num;
}

export function requireMinPaidPdfPrice(value: unknown) {
  const amount = parseKrwAmount(value);
  if (amount === null) return null;
  if (amount > 0 && amount < 1000) return null;
  return amount;
}
