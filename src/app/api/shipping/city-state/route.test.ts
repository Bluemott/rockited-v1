// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";

const checkRateLimitMock = vi.fn();
const getCityStateByZipMock = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getClientIP: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/zipcode/city-state", () => ({
  getCityStateByZip: (...args: unknown[]) => getCityStateByZipMock(...args),
}));

import { GET } from "./route";

describe("GET /api/shipping/city-state", () => {
  beforeEach(() => {
    checkRateLimitMock.mockResolvedValue({ success: true, reset: Date.now() + 60000 });
    getCityStateByZipMock.mockResolvedValue({ city: "Beverly Hills", state: "CA" });
  });

  it("returns 400 when zip is missing", async () => {
    const req = createMockRequest("/api/shipping/city-state");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/zip|5-digit|required/i);
  });

  it("returns 400 when zip is not 5 digits", async () => {
    const req = createMockRequest("/api/shipping/city-state?zip=123");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/5-digit|valid/i);
  });

  it("returns 400 when zip is invalid format", async () => {
    const req = createMockRequest("/api/shipping/city-state?zip=12abc");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/5-digit|valid/i);
  });

  it("returns 429 when rate limit exceeded", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 60000,
    });
    const req = createMockRequest("/api/shipping/city-state?zip=90210");
    const res = await GET(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/many requests|try again/i);
    expect(res.headers.get("Retry-After")).toBeDefined();
  });

  it("returns 200 with city and state when zip is valid", async () => {
    const req = createMockRequest("/api/shipping/city-state?zip=90210");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.city).toBe("Beverly Hills");
    expect(data.state).toBe("CA");
  });

  it("returns 200 with null city/state when zip not found", async () => {
    getCityStateByZipMock.mockResolvedValueOnce(null);
    const req = createMockRequest("/api/shipping/city-state?zip=99999");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.city).toBeNull();
    expect(data.state).toBeNull();
  });
});
