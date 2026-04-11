import fs from "fs";
import path from "path";

const configuredRoot = String(process.env.UPLOAD_ROOT || "").trim();
const fallbackRoot = path.join(process.cwd(), "uploads");

export const UPLOAD_ROOT = path.resolve(configuredRoot || fallbackRoot);
export const VIDEOS_DIR = path.join(UPLOAD_ROOT, "videos");
export const PDFS_DIR = path.join(UPLOAD_ROOT, "pdfs");
export const THUMBNAILS_DIR = path.join(UPLOAD_ROOT, "thumbnails");
export const CONTRACTS_DIR = path.join(UPLOAD_ROOT, "contracts");
export const PROFILE_IMAGES_DIR = path.join(UPLOAD_ROOT, "profile-images");

const PUBLIC_DIRS = [
  { abs: VIDEOS_DIR, urlPrefix: "/uploads/videos" },
  { abs: THUMBNAILS_DIR, urlPrefix: "/uploads/thumbnails" },
  { abs: PROFILE_IMAGES_DIR, urlPrefix: "/uploads/profile-images" },
] as const;

const ALL_DIRS = [UPLOAD_ROOT, VIDEOS_DIR, PDFS_DIR, THUMBNAILS_DIR, CONTRACTS_DIR, PROFILE_IMAGES_DIR] as const;

export function ensureUploadDirs() {
  for (const dir of ALL_DIRS) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function assertPathInsideRoot(targetPath: string, baseRoot = UPLOAD_ROOT) {
  const resolvedBase = path.resolve(baseRoot);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedBase, resolvedTarget);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return resolvedTarget;
  }

  throw new Error("허용되지 않은 파일 경로입니다.");
}

export function toPublicUrlFromAbsolutePath(filePath: string) {
  const safePath = assertPathInsideRoot(filePath);
  for (const dir of PUBLIC_DIRS) {
    const rel = path.relative(dir.abs, safePath);
    if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
      return `${dir.urlPrefix}/${rel.replace(/\\/g, "/")}`.replace(/\/$/, "");
    }
  }
  throw new Error("공개 URL로 변환할 수 없는 파일 경로입니다.");
}

export function toStoredRelativePath(filePath: string) {
  const safePath = assertPathInsideRoot(filePath);
  const relative = path.relative(UPLOAD_ROOT, safePath).replace(/\\/g, "/");
  return `/${relative}`;
}

export function resolveStoredPath(storedPath: string) {
  const normalized = String(storedPath || "").replace(/^\/+/, "");
  return assertPathInsideRoot(path.join(UPLOAD_ROOT, normalized));
}

export function isInsideDirectory(targetPath: string, directory: string) {
  const safePath = path.resolve(targetPath);
  const safeDir = path.resolve(directory);
  const relative = path.relative(safeDir, safePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
