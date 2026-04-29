import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  route?: string;
  action?: string;
  [key: string]: unknown;
}

const REDACTED = "[REDACTED]";
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const DIGIT_REGEX = /\d/g;
const SENSITIVE_KEYWORDS = [
  "email",
  "phone",
  "address",
  "line1",
  "line2",
  "postal",
  "postcode",
  "zip",
  "secret",
  "signature",
  "token",
  "authorization",
  "cookie",
];

function maskEmail(value: string): string {
  return value.replace(EMAIL_REGEX, REDACTED);
}

function maskNumeric(value: string): string {
  const digits = value.match(DIGIT_REGEX);
  if (!digits || digits.length < 5) return value;
  return value.replace(DIGIT_REGEX, "*");
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYWORDS.some((token) => normalized.includes(token));
}

function redactValue(value: unknown, keyHint?: string): unknown {
  if (value == null) return value;

  if (typeof value === "string") {
    const withMaskedEmail = maskEmail(value);
    return keyHint && shouldRedactKey(keyHint) ? maskNumeric(withMaskedEmail) : withMaskedEmail;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, keyHint));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = shouldRedactKey(key) ? REDACTED : redactValue(nested, key);
    }
    return result;
  }

  return value;
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}) {
  const redactedContext = redactValue(context);
  const event = {
    timestamp: new Date().toISOString(),
    level,
    service: "rockited-storefront",
    env: process.env.NODE_ENV ?? "development",
    message,
    ...(typeof redactedContext === "object" && redactedContext !== null ? redactedContext : {}),
  };

  const payload = JSON.stringify(event);
  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.warn(payload);
}

export const logger = {
  debug: (message: string, context?: LogContext) => writeLog("debug", message, context),
  info: (message: string, context?: LogContext) => writeLog("info", message, context),
  warn: (message: string, context?: LogContext) => writeLog("warn", message, context),
  error: (message: string, context?: LogContext) => writeLog("error", message, context),
};

export function getRequestId(request: NextRequest): string {
  return (
    request.headers.get("x-request-id") ||
    request.headers.get("x-correlation-id") ||
    randomUUID()
  );
}
