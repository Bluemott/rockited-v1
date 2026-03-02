// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";

const getCheckoutSessionMock = vi.fn();
const getShippingRatesMock = vi.fn();
const stripeUpdateMock = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        update: (...args: unknown[]) => stripeUpdateMock(...args),
      },
    },
  },
  getCheckoutSession: (...args: unknown[]) => getCheckoutSessionMock(...args),
}));

vi.mock("@/lib/shipping", () => ({
  getShippingRates: (...args: unknown[]) => getShippingRatesMock(...args),
}));

vi.mock("@/lib/shippo", () => ({
  standardizeAddress: vi.fn().mockResolvedValue({ ok: true, standardized: {} }),
  isShippoConfigured: vi.fn().mockReturnValue(false),
}));

import { POST } from "./route";

const validBody = {
  checkoutSessionId: "cs_test_1234567890",
  shippingDetails: {
    address: { country: "US", postal_code: "90210", city: "Beverly Hills", state: "CA", line1: "123 Main St" },
  },
};

const sessionWithLineItems = {
  id: "cs_test_1234567890",
  line_items: {
    data: [
      {
        id: "li_1",
        quantity: 1,
        price: {
          product: { metadata: { product_id: "42" } },
          metadata: {},
        },
        description: null,
      },
    ],
  },
};

describe("POST /api/checkout/shipping", () => {
  beforeEach(() => {
    getCheckoutSessionMock.mockResolvedValue(sessionWithLineItems);
    getShippingRatesMock.mockResolvedValue({
      rates: [{ method_id: "flat", method_title: "Standard", cost: "5.00", estimated_delivery: "3-5 days" }],
    });
    stripeUpdateMock.mockResolvedValue({});
  });

  it("returns 400 when checkoutSessionId is missing", async () => {
    const req = createMockRequest("/api/checkout/shipping", {
      method: "POST",
      body: { shippingDetails: { address: { country: "US", postal_code: "90210" } } },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/checkoutSessionId|required|invalid/i);
  });

  it("returns 400 when checkoutSessionId has invalid format (not cs_)", async () => {
    const req = createMockRequest("/api/checkout/shipping", {
      method: "POST",
      body: {
        checkoutSessionId: "invalid",
        shippingDetails: { address: { country: "US", postal_code: "90210" } },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 when shippingDetails.address is missing", async () => {
    const req = createMockRequest("/api/checkout/shipping", {
      method: "POST",
      body: { checkoutSessionId: "cs_test_1234567890", shippingDetails: {} },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/address|shippingDetails|required/i);
  });

  it("returns 400 when country is missing", async () => {
    const req = createMockRequest("/api/checkout/shipping", {
      method: "POST",
      body: {
        checkoutSessionId: "cs_test_1234567890",
        shippingDetails: { address: { postal_code: "90210" } },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/country|required/i);
  });

  it("returns 400 when country code is invalid (not 2-letter)", async () => {
    const req = createMockRequest("/api/checkout/shipping", {
      method: "POST",
      body: {
        checkoutSessionId: "cs_test_1234567890",
        shippingDetails: { address: { country: "USA", postal_code: "90210" } },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/country|2-letter|invalid/i);
  });

  it("returns 200 with success when valid body and session has line items", async () => {
    const req = createMockRequest("/api/checkout/shipping", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 500 when getCheckoutSession throws", async () => {
    getCheckoutSessionMock.mockRejectedValueOnce(new Error("Stripe error"));
    const req = createMockRequest("/api/checkout/shipping", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/shipping|try again|failed/i);
  });
});
