import "dotenv/config";

async function runCheck(name: string, url: string, init?: RequestInit) {
  try {
    const response = await fetch(url, init);
    console.log(`[SMOKE] ${name} status=${response.status}`);
    return response.ok;
  } catch (error) {
    console.log(`[SMOKE] ${name} error=${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  const baseUrl = String(process.env.SMOKE_BASE_URL || process.env.VERIFY_BASE_URL || process.env.RENDER_EXTERNAL_URL || process.env.APP_BASE_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("SMOKE_BASE_URL 또는 APP_BASE_URL/RENDER_EXTERNAL_URL 이 필요합니다.");
  }

  const checks = await Promise.all([
    runCheck("healthz", `${baseUrl}/healthz`),
    runCheck("readyz", `${baseUrl}/readyz`),
    runCheck("contents", `${baseUrl}/api/contents`),
  ]);

  if (checks.some((ok) => !ok)) {
    process.exitCode = 1;
  }
}

void main();
