export const SUPPORTED_VIDEO_URL_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[^\s&]+/i,
  /^https?:\/\/youtu\.be\/[^\s?&]+/i,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[^\s?&]+/i,
] as const;

export function isSupportedVideoUrl(url: string) {
  const normalized = String(url || "").trim();
  if (!normalized) return false;

  return SUPPORTED_VIDEO_URL_PATTERNS.some((pattern) => pattern.test(normalized));
}
