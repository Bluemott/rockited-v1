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
 * Normalize image URLs by replacing IP addresses with the configured domain
 * This ensures images use the domain (api.rockited4d.com) instead of IP addresses
 */
export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return url;
  }

  // Replace IP address with domain (both HTTP and HTTPS)
  const normalizedUrl = url
    .replace(/http:\/\/52\.23\.226\.128/g, "https://api.rockited4d.com")
    .replace(/https:\/\/52\.23\.226\.128/g, "https://api.rockited4d.com");

  return normalizedUrl;
}
