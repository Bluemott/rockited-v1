// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";

const getShippingRatesMock = vi.fn();
vi.mock("@/lib/shipping", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/shipping")>();
  return {
    ...actual,
    getShippingRates: (...args: unknown[]) => getShippingRatesMock(...args),
  };
});

import { POST } from "./route";
import { SHIPPO_RATES_UNAVAILABLE_MESSAGE } from "@/lib/shipping";

describe("POST /api/shipping/calculate", () => {
  beforeEach(() => {
    getShippingRatesMock.mockResolvedValue({
      rates: [{ method_id: "flat", method_title: "Standard", cost: "5.00", estimated_delivery: "3-5 days" }],
    });
  });

  it("returns 400 when country is missing", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { products: [{ id: 1, quantity: 1 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/country|required/i);
  });

  it("returns 400 when country is not a string", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: 123, products: [{ id: 1, quantity: 1 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/country|string/i);
  });

  it("returns 400 when country code is invalid (not 2-letter)", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "USA", products: [{ id: 1, quantity: 1 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid|2-letter|ISO/i);
  });

  it("returns 400 when non-US country (domestic US only)", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "CA", products: [{ id: 1, quantity: 1 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/domestic|United States|only ship/i);
  });

  it("returns 400 when products is missing", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/products|required|empty/i);
  });

  it("returns 400 when products is empty array", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", products: [] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/products|required|empty/i);
  });

  it("returns 400 when products is not an array", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", products: "not-array" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/products|required|empty/i);
  });

  it("returns 400 when product missing id or quantity", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", products: [{ name: "Widget" }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/id|quantity|required|invalid/i);
  });

  it("returns 400 when products exceed 100 items", async () => {
    const products = Array.from({ length: 101 }).map((_, idx) => ({ id: idx + 1, quantity: 1 }));
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", products },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/maximum 100/i);
  });

  it("returns 400 when product entry is not an object", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", products: [1] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid product/i);
  });

  it("returns 200 with rates when valid US and products", async () => {
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", state: "CA", postcode: "90210", city: "Beverly Hills", products: [{ id: 1, quantity: 2 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rates).toBeDefined();
    expect(Array.isArray(data.rates)).toBe(true);
    expect(data.rates[0].cost).toBe("5.00");
  });

  it("returns 500 when getShippingRates throws", async () => {
    getShippingRatesMock.mockRejectedValueOnce(new Error("Shippo error"));
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", products: [{ id: 1, quantity: 1 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/shipping|try again|failed/i);
  });

  it("returns 400 for explicit upstream shipping outage messages", async () => {
    getShippingRatesMock.mockRejectedValueOnce(new Error(SHIPPO_RATES_UNAVAILABLE_MESSAGE));
    const req = createMockRequest("/api/shipping/calculate", {
      method: "POST",
      body: { country: "US", products: [{ id: 1, quantity: 1 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/unable to get shipping rates/i);
  });
});
