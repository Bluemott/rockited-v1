import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkRateLimit, getClientIP } from "./lib/rate-limit";

/**
 * Security headers and rate limiting proxy (Next.js 16 proxy convention).
 * Applies security headers to all routes and rate limiting to API routes.
 */
async function proxyHandler(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip proxy for static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Handle rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    // Skip rate limiting for webhook endpoints (they use signature verification)
    if (pathname.startsWith("/api/webhooks/")) {
      return NextResponse.next();
    }

    // Determine endpoint type for rate limiting (shipping/address routes get stricter presets)
    let endpointType: "checkout" | "products" | "shipping" | "addressValidate" | "cityState" | "default" = "default";
    if (pathname === "/api/address/validate") {
      endpointType = "addressValidate";
    } else if (pathname === "/api/shipping/city-state") {
      endpointType = "cityState";
    } else if (pathname.startsWith("/api/checkout") || pathname.startsWith("/api/shipping")) {
      endpointType = pathname.startsWith("/api/checkout") ? "checkout" : "shipping";
    } else if (pathname.startsWith("/api/products") || pathname.startsWith("/api/inventory")) {
      endpointType = "products";
    }

    // Get client IP
    const clientIP = getClientIP(request);
    const identifier = `${clientIP}:${endpointType}`;

    // Check rate limit
    const rateLimitResult = await checkRateLimit(identifier, endpointType);

    if (!rateLimitResult.success) {
      // Rate limit exceeded
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      response.headers.set("X-RateLimit-Reset", new Date(rateLimitResult.reset).toISOString());
      response.headers.set(
        "Retry-After",
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
      );

      return response;
    }

    // Create response with rate limit headers
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", new Date(rateLimitResult.reset).toISOString());

    return response;
  }

  // Apply security headers to non-API routes
  const response = NextResponse.next();

  // Content Security Policy: allow Stripe, Google Maps/Places, and inline scripts used by Next.js.
  // Note: Do NOT add sha256/nonce hashes—when present, browsers ignore 'unsafe-inline' and block
  // Next.js inline bootstrap/hydration scripts, causing InvariantError (self.__next_r undefined).
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://js.stripe.com https://*.stripe.com https://m.stripe.network",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://maps.googleapis.com https://*.googleapis.com https://api.stripe.com https://*.stripe.com https://m.stripe.network https://api.rockited4d.com https://rockited4d.com https://www.rockited4d.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network",
    "worker-src 'self' blob:",
    "form-action 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  // Apply security headers
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export default proxyHandler;

/**
 * Configure which routes should run the proxy
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
