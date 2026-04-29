import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(typeof price === "string" ? parseFloat(price) : price);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

/** Email regex aligned with API/sanitize validation. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return typeof value === "string" && EMAIL_REGEX.test(value.trim());
}

/**
 * Normalize image URLs using environment-driven host rewrites and base URL.
 */
export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return url;
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  const rewritePairs = (process.env.MEDIA_HOST_REWRITE_MAP || "")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [from, to] = pair.split("=");
      return { from: (from || "").trim(), to: (to || "").trim() };
    })
    .filter((pair) => pair.from && pair.to);

  if (trimmed.startsWith("/")) {
    if (mediaBaseUrl) {
      try {
        return new URL(trimmed, mediaBaseUrl).toString();
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.host.toLowerCase();
    const matched = rewritePairs.find((pair) => pair.from.toLowerCase() === host);
    if (!matched) {
      return trimmed;
    }

    const targetBase = new URL(matched.to);
    const rewritten = new URL(parsed.pathname + parsed.search + parsed.hash, targetBase);
    return rewritten.toString();
  } catch {
    return trimmed;
  }
}
