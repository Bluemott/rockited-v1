// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";

const checkRateLimitMock = vi.fn();
const isShippoConfiguredMock = vi.fn();
const standardizeAddressMock = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getClientIP: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/shippo", () => ({
  standardizeAddress: (...args: unknown[]) => standardizeAddressMock(...args),
  isShippoConfigured: () => isShippoConfiguredMock(),
}));

import { POST } from "./route";

const validBody = {
  line1: "123 Main St",
  city: "Beverly Hills",
  state: "CA",
  postal_code: "90210",
};

describe("POST /api/address/validate", () => {
  beforeEach(() => {
    checkRateLimitMock.mockResolvedValue({ success: true, reset: Date.now() + 60000 });
    isShippoConfiguredMock.mockReturnValue(true);
    standardizeAddressMock.mockResolvedValue({
      ok: true,
      standardized: {
        line1: "123 MAIN ST",
        city: "BEVERLY HILLS",
        state: "CA",
        postal_code: "90210",
        zipPlus4: "1234",
      },
    });
  });

  it("returns 429 when rate limit exceeded", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 60000,
    });
    const req = createMockRequest("/api/address/validate", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/many requests|try again/i);
    expect(res.headers.get("Retry-After")).toBeDefined();
  });

  it("returns 400 when line1 is missing", async () => {
    const req = createMockRequest("/api/address/validate", {
      method: "POST",
      body: { city: "Beverly Hills", state: "CA", postal_code: "90210" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.message).toMatch(/street|line1|required|string|invalid/i);
  });

  it("returns 400 when postal_code is not 5-digit US ZIP", async () => {
    const req = createMockRequest("/api/address/validate", {
      method: "POST",
      body: { ...validBody, postal_code: "123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.message).toMatch(/postal|zip|5/i);
  });

  it("returns 200 with valid false when Shippo not configured", async () => {
    isShippoConfiguredMock.mockReturnValueOnce(false);
    const req = createMockRequest("/api/address/validate", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.message).toMatch(/not configured/i);
  });

  it("returns 200 with valid true and standardized address when valid", async () => {
    const req = createMockRequest("/api/address/validate", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.standardized).toBeDefined();
    expect(data.standardized.line1).toBe("123 MAIN ST");
    expect(data.standardized.state).toBe("CA");
  });

  it("returns 200 with valid false when address could not be verified", async () => {
    standardizeAddressMock.mockResolvedValueOnce({ ok: false });
    const req = createMockRequest("/api/address/validate", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.message).toMatch(/could not be verified|use as entered/i);
  });

  it("returns 500 when standardizeAddress throws", async () => {
    standardizeAddressMock.mockRejectedValueOnce(new Error("Network error"));
    const req = createMockRequest("/api/address/validate", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.message).toMatch(/failed|validation/i);
  });
});
