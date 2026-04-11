import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { Pool } from "pg";

type CheckStatus = "SUCCESS" | "FAIL" | "NOT_RUN";

type CheckResult = {
  title: string;
  status: CheckStatus;
  date: string;
  detail?: string;
};

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getClientKey() {
  return String(process.env.VITE_TOSS_PAYMENTS_CLIENT_KEY || process.env.TOSS_CLIENT_KEY || "").trim();
}

async function verifyPostgres(): Promise<CheckResult> {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    return { title: "Render PostgreSQL", status: "NOT_RUN", date: isoDate(), detail: "DATABASE_URL missing" };
  }

  const sslMode = String(process.env.DB_SSL_MODE || "auto").toLowerCase();
  const ssl = sslMode === "disable" || sslMode === "false"
    ? false
    : sslMode === "require" || sslMode === "true"
      ? { rejectUnauthorized: false }
      : /localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\./i.test(connectionString)
        ? false
        : { rejectUnauthorized: false };

  const pool = new Pool({ connectionString, ssl });
  try {
    await pool.query("SELECT 1");
    return { title: "Render PostgreSQL", status: "SUCCESS", date: isoDate(), detail: "SELECT 1 succeeded" };
  } catch (error) {
    return { title: "Render PostgreSQL", status: "FAIL", date: isoDate(), detail: error instanceof Error ? error.message : String(error) };
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function verifySmtp(): Promise<CheckResult> {
  const user = String(process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.EMAIL_PASS || "").trim();
  if (!user || !pass) {
    return { title: "Gmail SMTP", status: "NOT_RUN", date: isoDate(), detail: "EMAIL_USER or EMAIL_PASS missing" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: String(process.env.EMAIL_HOST || "smtp.gmail.com").trim(),
      port: Number(process.env.EMAIL_PORT || 465),
      secure: String(process.env.EMAIL_SECURE || "true") !== "false",
      auth: { user, pass },
    });
    await transporter.verify();
    return { title: "Gmail SMTP", status: "SUCCESS", date: isoDate(), detail: "transporter.verify() succeeded" };
  } catch (error) {
    return { title: "Gmail SMTP", status: "FAIL", date: isoDate(), detail: error instanceof Error ? error.message : String(error) };
  }
}

async function verifyTossSandbox(): Promise<CheckResult> {
  const secretKey = String(process.env.TOSS_SECRET_KEY || process.env.TOSS_PAYMENTS_SECRET_KEY || "").trim();
  const clientKey = getClientKey();
  const paymentKey = String(process.env.TOSS_TEST_PAYMENT_KEY || "").trim();
  const orderId = String(process.env.TOSS_TEST_ORDER_ID || "").trim();
  const amount = Number(process.env.TOSS_TEST_AMOUNT || 0);

  if (!secretKey || !clientKey) {
    return { title: "Toss Payments Sandbox", status: "NOT_RUN", date: isoDate(), detail: "client/server key pair missing" };
  }

  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
    return { title: "Toss Payments Sandbox", status: "NOT_RUN", date: isoDate(), detail: "set TOSS_TEST_PAYMENT_KEY, TOSS_TEST_ORDER_ID, TOSS_TEST_AMOUNT for live confirm verification" };
  }

  try {
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const payload = await response.text();
    if (!response.ok) {
      return { title: "Toss Payments Sandbox", status: "FAIL", date: isoDate(), detail: `status=${response.status} ${payload.slice(0, 300)}` };
    }

    return { title: "Toss Payments Sandbox", status: "SUCCESS", date: isoDate(), detail: "payment confirm succeeded" };
  } catch (error) {
    return { title: "Toss Payments Sandbox", status: "FAIL", date: isoDate(), detail: error instanceof Error ? error.message : String(error) };
  }
}

async function verifyRenderDisk(): Promise<CheckResult> {
  const uploadRoot = String(process.env.UPLOAD_ROOT || "").trim();
  if (!uploadRoot) {
    return { title: "Render Disk Persistence", status: "NOT_RUN", date: isoDate(), detail: "UPLOAD_ROOT missing" };
  }

  const diagnosticsDir = path.join(uploadRoot, ".diagnostics");
  const filePath = path.join(diagnosticsDir, "render-disk-check.txt");
  const payload = `disk-check:${new Date().toISOString()}\n`;

  try {
    await fs.mkdir(diagnosticsDir, { recursive: true });
    await fs.writeFile(filePath, payload, "utf8");
    const reloaded = await fs.readFile(filePath, "utf8");
    return {
      title: "Render Disk Persistence",
      status: reloaded === payload ? "SUCCESS" : "FAIL",
      date: isoDate(),
      detail: reloaded === payload ? filePath : "read/write mismatch",
    };
  } catch (error) {
    return { title: "Render Disk Persistence", status: "FAIL", date: isoDate(), detail: error instanceof Error ? error.message : String(error) };
  }
}

async function verifyHealthEndpoints(): Promise<CheckResult[]> {
  const baseUrl = String(process.env.VERIFY_BASE_URL || process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL || "").trim().replace(/\/$/, "");
  if (!baseUrl) {
    return [
      { title: "GET /healthz", status: "NOT_RUN", date: isoDate(), detail: "VERIFY_BASE_URL or APP_BASE_URL missing" },
      { title: "GET /readyz", status: "NOT_RUN", date: isoDate(), detail: "VERIFY_BASE_URL or APP_BASE_URL missing" },
    ];
  }

  const endpoints = ["/healthz", "/readyz"];
  const results: CheckResult[] = [];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      const body = await response.text();
      results.push({
        title: `GET ${endpoint}`,
        status: response.ok ? "SUCCESS" : "FAIL",
        date: isoDate(),
        detail: `status=${response.status}${body ? ` body=${body.slice(0, 200)}` : ""}`,
      });
    } catch (error) {
      results.push({ title: `GET ${endpoint}`, status: "FAIL", date: isoDate(), detail: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}

function toMarkdown(results: CheckResult[]) {
  const lines = ["# Service Readiness Verification", ""];
  for (const result of results) {
    lines.push(`## ${result.title}`);
    lines.push(`- Status: ${result.status}`);
    lines.push(`- Date: ${result.date}`);
    if (result.detail) lines.push(`- Detail: ${result.detail}`);
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

async function main() {
  const results = [
    await verifyPostgres(),
    await verifySmtp(),
    await verifyTossSandbox(),
    await verifyRenderDisk(),
    ...(await verifyHealthEndpoints()),
  ];

  const docsDir = path.join(process.cwd(), "docs");
  await fs.mkdir(docsDir, { recursive: true });
  const reportPath = path.join(docsDir, "SERVICE_READINESS_VERIFICATION.md");
  await fs.writeFile(reportPath, toMarkdown(results), "utf8");

  for (const result of results) {
    const tag = result.status === "SUCCESS" ? "[PASS]" : result.status === "FAIL" ? "[FAIL]" : "[SKIP]";
    console.log(`${tag} ${result.title} - ${result.detail || result.status}`);
  }
  console.log(`[INFO] verification report written to ${reportPath}`);

  if (results.some((result) => result.status === "FAIL")) {
    process.exitCode = 1;
  }
}

void main();
