const truthy = new Set(["1", "true", "yes", "on"]);

function isEnabled(value: string | undefined | null) {
  return truthy.has(String(value || "").trim().toLowerCase());
}

export const FEATURE_FLAGS = {
  allowVideoFileUpload: isEnabled(process.env.FEATURE_ALLOW_VIDEO_FILE_UPLOAD),
  allowProductionDefaultAdmin: isEnabled(process.env.ALLOW_PRODUCTION_DEFAULT_ADMIN_CREATE),
} as const;
