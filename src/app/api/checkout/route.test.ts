// @vitest-environment node
import type Stripe from "stripe";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";
import { createEmbeddedCheckoutSession } from "@/lib/stripe";

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        update: vi.fn().mockResolvedValue({}),
      },
    },
  },
  createEmbeddedCheckoutSession: vi.fn(),
}));

import { POST } from "./route";

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.mocked(createEmbeddedCheckoutSession).mockResolvedValue({
      id: "cs_test_123",
      client_secret: "pi_secret_123",
      metadata: {},
      automatic_tax: { enabled: true, status: "complete" },
    } as Stripe.Checkout.Session);
  });

  const validItems = [
    { id: 1, name: "Product A", price: 10.99, quantity: 1 },
  ];

  it("returns 400 or 500 when body is not JSON", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect([400, 500]).toContain(res.status);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 when items is missing", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/item|required|array/i);
  });

  it("returns 400 when items is empty array", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: [] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/at least one|required/i);
  });

  it("returns 400 when item missing id or name", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: [{ name: "Only name", price: 1, quantity: 1 }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/id|required/i);
  });

  it("returns 400 when item has invalid quantity (over 100)", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: [{ id: 1, name: "Product", price: 1, quantity: 101 }],
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 when email is invalid", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: validItems,
        customerEmail: "not-an-email",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 when shippingAddress without selectedShippingRate", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: validItems,
        shippingAddress: { country: "US", postal_code: "90210" },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/shippingAddress|selectedShippingRate|together/i);
  });

  it("returns 400 when selectedShippingRate without shippingAddress", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: validItems,
        selectedShippingRate: { method_id: "flat", method_title: "Flat", cost: "5" },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/shippingAddress|selectedShippingRate|together/i);
  });

  it("returns 400 when shipping country is invalid (non 2-letter)", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: validItems,
        shippingAddress: { country: "USA", postal_code: "90210" },
        selectedShippingRate: { method_id: "flat", method_title: "Flat", cost: "5" },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/country|2-letter/i);
  });

  it("returns 400 when shipping postal_code is missing", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: validItems,
        shippingAddress: { country: "US" },
        selectedShippingRate: { method_id: "flat", method_title: "Flat", cost: "5" },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/postal|required|string|invalid/i);
  });

  it("returns 200 with clientSecret when valid minimal body", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: validItems },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.clientSecret).toBe("pi_secret_123");
    expect(data.sessionId).toBe("cs_test_123");
  });

  it("returns 200 when valid body with shipping and preselected rate", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: validItems,
        shippingAddress: { country: "US", postal_code: "90210", city: "Beverly Hills", state: "CA" },
        selectedShippingRate: { method_id: "flat", method_title: "Flat", cost: "5.00" },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.clientSecret).toBeDefined();
  });

  it("returns 500 with user-friendly message when Stripe throws", async () => {
    vi.mocked(createEmbeddedCheckoutSession).mockRejectedValueOnce(new Error("STRIPE_SECRET_KEY invalid"));
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: validItems },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error).not.toMatch(/STRIPE_SECRET_KEY/);
  });

  it("returns 500 when createEmbeddedCheckoutSession throws generic error", async () => {
    vi.mocked(createEmbeddedCheckoutSession).mockRejectedValueOnce(new Error("Network error"));
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: validItems },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/try again|failed/i);
  });
});
