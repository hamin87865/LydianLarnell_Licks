import { randomUUID } from "crypto";
import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}

function getAdminAlertTarget() {
  return normalizeText(process.env.ADMIN_ALERT_EMAIL_TO || process.env.EMAIL_USER);
}

function getAdminAlertFrom() {
  return normalizeText(process.env.ADMIN_ALERT_EMAIL_FROM || process.env.EMAIL_USER);
}

function createMailTransporter() {
  const user = normalizeText(process.env.EMAIL_USER);
  const pass = normalizeText(process.env.EMAIL_PASS);
  if (!user || !pass) return null;

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return cachedTransporter;
}

function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const host = url.host;
    const projectId = url.pathname.split("/").filter(Boolean).pop();
    const protocol = url.protocol;

    if (!publicKey || !host || !projectId || !protocol) return null;
    return {
      publicKey,
      host,
      projectId,
      protocol,
      dsn: `${protocol}//${publicKey}@${host}/${projectId}`,
      endpoint: `${protocol}//${host}/api/${projectId}/envelope/`,
    };
  } catch {
    return null;
  }
}

function buildSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

function buildSafeStack(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  return error.stack?.split("\n").slice(0, 20).join("\n");
}

async function sendSentryEnvelope(params: {
  dsn: string;
  error: unknown;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}) {
  const parsed = parseSentryDsn(params.dsn);
  if (!parsed) return;

  const eventId = randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();
  const message = buildSafeErrorMessage(params.error);
  const stack = buildSafeStack(params.error);

  const envelopeHeader = {
    event_id: eventId,
    sent_at: now,
    dsn: parsed.dsn,
  };

  const eventPayload = {
    event_id: eventId,
    timestamp: now,
    platform: "node",
    level: "error",
    environment: process.env.NODE_ENV || "development",
    server_name: process.env.RENDER_EXTERNAL_HOSTNAME || process.env.RENDER_SERVICE_NAME || "lydian-larnell-licks",
    message,
    tags: params.tags || {},
    extra: params.extra || {},
    exception: {
      values: [
        {
          type: params.error instanceof Error ? params.error.name : "Error",
          value: message,
          stacktrace: stack ? { frames: stack.split("\n").map((line) => ({ filename: line.trim() })) } : undefined,
        },
      ],
    },
  };

  const envelope = `${JSON.stringify(envelopeHeader)}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(eventPayload)}`;

  await fetch(parsed.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body: envelope,
  }).catch(() => undefined);
}

async function sendAdminAlertEmail(params: {
  subject: string;
  lines: string[];
}) {
  const to = getAdminAlertTarget();
  const from = getAdminAlertFrom();
  const transporter = createMailTransporter();
  if (!to || !from || !transporter) return;

  const body = params.lines.filter(Boolean).join("\n");

  await transporter.sendMail({
    from,
    to,
    subject: params.subject,
    text: body,
  }).catch(() => undefined);
}

export async function reportServerError(params: {
  error: unknown;
  context: string;
  request?: {
    method?: string;
    path?: string;
    ip?: string;
    userId?: string | null;
  };
  extra?: Record<string, unknown>;
}) {
  const message = buildSafeErrorMessage(params.error);
  const sentryDsn = normalizeText(process.env.SENTRY_DSN);
  const requestSummary = params.request
    ? {
        method: params.request.method || "",
        path: params.request.path || "",
        ip: params.request.ip || "",
        userId: params.request.userId || "",
      }
    : undefined;

  await Promise.allSettled([
    sentryDsn
      ? sendSentryEnvelope({
          dsn: sentryDsn,
          error: params.error,
          tags: {
            context: params.context,
            node_env: process.env.NODE_ENV || "development",
          },
          extra: {
            ...(requestSummary || {}),
            ...(params.extra || {}),
          },
        })
      : Promise.resolve(),
    sendAdminAlertEmail({
      subject: `[Lydian] 서버 오류 알림 - ${params.context}`,
      lines: [
        `시간: ${new Date().toISOString()}`,
        `컨텍스트: ${params.context}`,
        requestSummary?.method ? `메서드: ${requestSummary.method}` : "",
        requestSummary?.path ? `경로: ${requestSummary.path}` : "",
        requestSummary?.ip ? `IP: ${requestSummary.ip}` : "",
        requestSummary?.userId ? `사용자: ${requestSummary.userId}` : "",
        `오류: ${message}`,
      ],
    }),
  ]);
}

export function registerProcessErrorHandlers() {
  process.on("unhandledRejection", (reason) => {
    console.error("[process] unhandledRejection", reason);
    void reportServerError({ error: reason, context: "unhandledRejection" });
  });

  process.on("uncaughtException", (error) => {
    console.error("[process] uncaughtException", error);
    void reportServerError({ error, context: "uncaughtException" });
  });
}
