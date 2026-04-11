import type { Response } from "express";

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendError(res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) {
  return res.status(status).json({ code, message, details } satisfies ApiErrorPayload);
}
