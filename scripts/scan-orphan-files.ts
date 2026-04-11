import fs from "node:fs";
import path from "node:path";
import { pool } from "../server/db";
import { CONTRACTS_DIR, PDFS_DIR, PROFILE_IMAGES_DIR, THUMBNAILS_DIR, UPLOAD_ROOT, VIDEOS_DIR } from "../server/lib/storagePaths";

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(target));
      continue;
    }
    files.push(target);
  }
  return files;
}

function normalizeStoredPath(value: string | null | undefined) {
  return String(value || "").trim().replace(/^\/+/, "");
}

async function main() {
  const referenced = new Set<string>();

  const contentResult = await pool.query(`
    SELECT thumbnail, video_file, pdf_file
    FROM contents
  `);

  for (const row of contentResult.rows) {
    const thumbnail = normalizeStoredPath(row.thumbnail);
    const videoFile = normalizeStoredPath(row.video_file);
    const pdfFile = normalizeStoredPath(row.pdf_file);
    if (thumbnail) referenced.add(thumbnail.replace(/^uploads\//, "thumbnails/"));
    if (videoFile) referenced.add(videoFile.replace(/^uploads\//, "videos/"));
    if (pdfFile) referenced.add(pdfFile);
  }

  const appResult = await pool.query(`
    SELECT video_path, signed_contract_path
    FROM musician_applications
  `);

  for (const row of appResult.rows) {
    const videoPath = normalizeStoredPath(row.video_path);
    const signedContractPath = normalizeStoredPath(row.signed_contract_path);
    if (videoPath) referenced.add(videoPath.replace(/^uploads\//, "videos/"));
    if (signedContractPath) referenced.add(signedContractPath);
  }

  const settingsResult = await pool.query(`
    SELECT profile_image
    FROM user_settings
    WHERE profile_image IS NOT NULL
  `);

  for (const row of settingsResult.rows) {
    const profileImage = normalizeStoredPath(row.profile_image);
    if (profileImage) referenced.add(profileImage.replace(/^uploads\//, "profile-images/"));
  }

  const roots = [THUMBNAILS_DIR, VIDEOS_DIR, PDFS_DIR, CONTRACTS_DIR, PROFILE_IMAGES_DIR];
  const files = roots.flatMap((root) => walkFiles(root));

  const orphanFiles = files
    .map((absolutePath) => ({
      absolutePath,
      relativePath: path.relative(UPLOAD_ROOT, absolutePath).replace(/\\/g, "/"),
      size: fs.statSync(absolutePath).size,
    }))
    .filter((file) => !referenced.has(file.relativePath));

  const totalBytes = orphanFiles.reduce((sum, file) => sum + file.size, 0);

  console.log(JSON.stringify({
    orphanCount: orphanFiles.length,
    totalBytes,
    orphanFiles,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
