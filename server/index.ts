import "dotenv/config";

import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { pool } from "./db";
import { ensureUploadDirs, PROFILE_IMAGES_DIR, THUMBNAILS_DIR, VIDEOS_DIR } from "./lib/storagePaths";
import { buildDevelopmentHelmetConfig, buildProductionHelmetConfig } from "./lib/csp";
import { assertRuntimeEnv } from "./lib/env";
import { registerProcessErrorHandlers, reportServerError } from "./lib/monitoring";

const app = express();
registerProcessErrorHandlers();
app.disable("x-powered-by");
const httpServer = createServer(app);

function maskDatabaseUrl(connectionString?: string) {
  if (!connectionString) return "not-configured";

  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname || "unknown";
    const maskedHost = host.length <= 4 ? `${host.slice(0, 1)}***` : `${host.slice(0, 2)}***${host.slice(-2)}`;
    return `${parsed.protocol}//${maskedHost}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "invalid-database-url";
  }
}

function getAllowedOrigins() {
  const baseOrigins = process.env.NODE_ENV === "production"
    ? [
        process.env.CLIENT_URL,
        process.env.CLIENT_URL_WWW,
        process.env.RENDER_EXTERNAL_URL,
      ]
    : [
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

  return baseOrigins.filter((origin): origin is string => Boolean(origin));
}

console.info(`[boot] NODE_ENV=${process.env.NODE_ENV || "development"}`);
console.info(`[boot] DATABASE_URL=${maskDatabaseUrl(process.env.DATABASE_URL)}`);

try {
  const validation = assertRuntimeEnv();
  for (const warning of validation.warnings) {
    console.warn(`[boot] env warning: ${warning}`);
  }
} catch (error) {
  console.error(`[boot] env validation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  app.use(helmet(buildProductionHelmetConfig()));
} else {
  app.use(helmet(buildDevelopmentHelmetConfig()));
}

const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("허용되지 않은 CORS origin 입니다."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const isSecure = req.secure || forwardedProto === "https";

    if (isSecure) {
      next();
      return;
    }

    if (!req.headers.host) {
      next();
      return;
    }

    res.redirect(`https://${req.headers.host}${req.url}`);
  });
}

function createJsonLimiter(windowMs: number, max: number, code: string, message: string, statusCode = 429) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode,
    message: { code, message },
  });
}

const authLimiter = createJsonLimiter(15 * 60 * 1000, 15, "RATE_LIMITED", "인증 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
const emailSendLimiter = createJsonLimiter(10 * 60 * 1000, 5, "RATE_LIMITED", "이메일 인증코드 발송 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
const emailVerifyLimiter = createJsonLimiter(10 * 60 * 1000, 10, "RATE_LIMITED", "이메일 인증코드 확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
const passwordResetSendLimiter = createJsonLimiter(30 * 60 * 1000, 3, "RATE_LIMITED", "비밀번호 재설정 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
const passwordResetVerifyLimiter = createJsonLimiter(10 * 60 * 1000, 10, "RATE_LIMITED", "비밀번호 재설정 인증 확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
const passwordResetConfirmLimiter = createJsonLimiter(10 * 60 * 1000, 5, "RATE_LIMITED", "비밀번호 재설정 완료 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");

const paymentPrepareLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "결제 준비 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
});

const paymentConfirmLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "결제 승인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
});

const adminActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "관리자 민감 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
});

declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/email/send-code", emailSendLimiter);
app.use("/api/auth/email/verify-code", emailVerifyLimiter);
app.use("/api/auth/password-reset/send-code", passwordResetSendLimiter);
app.use("/api/auth/password-reset/verify-code", passwordResetVerifyLimiter);
app.use("/api/auth/password-reset/confirm", passwordResetConfirmLimiter);
app.use("/api/payments/prepare", paymentPrepareLimiter);
app.use("/api/payments/confirm", paymentConfirmLimiter);
app.use("/api/admin", adminActionLimiter);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

ensureUploadDirs();

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/readyz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  } catch (error) {
    console.error("[readyz] database ping failed", error);
    res.status(503).json({ ok: false, db: "down" });
  }
});

const publicStaticOptions = {
  fallthrough: false,
  maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  immutable: process.env.NODE_ENV === "production",
};

app.use("/uploads/thumbnails", express.static(THUMBNAILS_DIR, publicStaticOptions));
app.use("/uploads/profile-images", express.static(PROFILE_IMAGES_DIR, publicStaticOptions));
app.use("/uploads/videos", express.static(VIDEOS_DIR, {
  ...publicStaticOptions,
  immutable: false,
  maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: unknown;

  const originalResJson = res.json.bind(res);
  res.json = function patchedJson(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    if (!pathName.startsWith("/api")) {
      return;
    }

    const duration = Date.now() - start;
    const requestIp = String(req.ip || req.headers["x-forwarded-for"] || "");
    const userId = (req.session as any)?.user?.id ? ` user=${(req.session as any).user.id}` : "";
    const statusInfo = ` status=${res.statusCode}`;
    const durationInfo = ` duration=${duration}ms`;
    const ipInfo = requestIp ? ` ip=${requestIp}` : "";
    const errorCode = res.statusCode >= 400 && capturedJsonResponse && typeof capturedJsonResponse === "object" && capturedJsonResponse && "code" in (capturedJsonResponse as Record<string, unknown>)
      ? ` code=${String((capturedJsonResponse as Record<string, unknown>).code || "")}`
      : "";
    log(`${req.method} ${pathName}${statusInfo}${durationInfo}${ipInfo}${userId}${errorCode}`);
  });

  next();
});

async function bootstrap() {
  try {
    await registerRoutes(httpServer, app);

    app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
      const status = typeof err === "object" && err && "status" in err ? Number((err as { status?: unknown }).status) || 500 : 500;
      const message = err instanceof Error ? err.message : "Internal Server Error";

      console.error("[server] request error", err);
      void reportServerError({
        error: err,
        context: "express_request",
        request: {
          method: _req.method,
          path: _req.path,
          ip: String(_req.ip || _req.headers["x-forwarded-for"] || ""),
          userId: (_req.session as any)?.user?.id || null,
        },
        extra: { status },
      });

      if (res.headersSent) {
        next(err);
        return;
      }

      const code = typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code ?? "INTERNAL_ERROR") : "INTERNAL_ERROR";
      res.status(status).json({ code, message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(port, () => {
      log(`serving on port ${port}`, "boot");
    });
  } catch (error) {
    console.error("[boot] 서버 시작 실패", error);
    process.exit(1);
  }
}

void bootstrap();
