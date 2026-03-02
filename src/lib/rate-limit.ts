import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting configuration for different endpoint types
 */
export const rateLimitConfig = {
  checkout: {
    limit: 5,
    window: "1 m", // 1 minute
  },
  products: {
    limit: 60,
    window: "1 m", // 1 minute
  },
  shipping: {
    limit: 20,
    window: "1 m", // 1 minute
  },
  /** Address validation (one call per address attempt). */
  addressValidate: {
    limit: 10,
    window: "1 m",
  },
  /** City/state by ZIP (autofill; one per ZIP change). */
  cityState: {
    limit: 15,
    window: "1 m",
  },
  default: {
    limit: 30,
    window: "1 m", // 1 minute
  },
} as const;

/**
 * Get rate limiter instance
 * Uses Upstash Redis if configured, otherwise falls back to in-memory
 */
function getRateLimiter(limit: number, window: string) {
  // Check if Upstash Redis is configured
  const upstashRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashRedisUrl && upstashRedisToken) {
    // Use Upstash Redis for production
    const redis = new Redis({
      url: upstashRedisUrl,
      token: upstashRedisToken,
    });

    // Parse window string to seconds for Ratelimit
    const windowMatch = window.match(/^(\d+)\s*(s|m|h|d)$/);
    if (!windowMatch) {
      throw new Error(`Invalid window format: ${window}`);
    }
    const windowValue = parseInt(windowMatch[1] || "1", 10);
    const windowUnit = windowMatch[2];
    if (!windowUnit) {
      throw new Error(`Invalid window format: ${window}`);
    }
    const windowMultipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    const windowSeconds = windowValue * (windowMultipliers[windowUnit] || 1);

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: "@rockited/ratelimit",
    });
  }

  // Fallback to in-memory for development
  // Note: This won't work across multiple instances, but is fine for development
  const memory = new Map<string, { count: number; resetTime: number }>();

  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      const key = identifier;
      const windowMs = parseWindow(window);

      const record = memory.get(key);

      if (!record || now > record.resetTime) {
        memory.set(key, { count: 1, resetTime: now + windowMs });
        return { success: true, limit: limit, remaining: limit - 1, reset: now + windowMs };
      }

      if (record.count >= limit) {
        return { success: false, limit: limit, remaining: 0, reset: record.resetTime };
      }

      record.count++;
      memory.set(key, record);
      return {
        success: true,
        limit: limit,
        remaining: limit - record.count,
        reset: record.resetTime,
      };
    },
  };
}

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match || !match[2]) {
    throw new Error(`Invalid window format: ${window}`);
  }

  const value = parseInt(match[1] || "1", 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 1000);
}

/**
 * Get rate limiter for a specific endpoint type
 */
export function getRateLimiterForEndpoint(endpointType: keyof typeof rateLimitConfig) {
  const config = rateLimitConfig[endpointType] || rateLimitConfig.default;
  return getRateLimiter(config.limit, config.window);
}

/**
 * Check rate limit for a request
 * @param identifier - Unique identifier (usually IP address)
 * @param endpointType - Type of endpoint being accessed
 * @returns Rate limit result with success status and remaining requests
 */
export async function checkRateLimit(
  identifier: string,
  endpointType: keyof typeof rateLimitConfig = "default"
) {
  const limiter = getRateLimiterForEndpoint(endpointType);
  const result = await limiter.limit(identifier);

  if (!result) {
    return {
      success: false,
      remaining: 0,
      limit: 0,
      reset: Date.now(),
    };
  }

  return {
    success: result.success,
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIP = forwarded.split(",")[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default identifier if IP cannot be determined
  return "unknown";
}
