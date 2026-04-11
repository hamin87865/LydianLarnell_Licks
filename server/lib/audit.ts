import type { Request } from "express";

export function getRequestAuditMeta(req: Request) {
  return {
    requestIp: String(req.ip || req.headers["x-forwarded-for"] || ""),
    userAgent: String(req.get("user-agent") || ""),
  };
}
