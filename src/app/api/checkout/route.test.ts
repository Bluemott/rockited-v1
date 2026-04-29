// @vitest-environment node
import type Stripe from "stripe";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";
import { createEmbeddedCheckoutSession } from "@/lib/stripe";
import { getProduct } from "@/lib/woocommerce/products";

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

vi.mock("@/lib/woocommerce/products", () => ({
  getProduct: vi.fn(),
}));

import { POST } from "./route";

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProduct).mockResolvedValue({
      id: 1,
      name: "Product A",
      slug: "product-a",
      price: "10.99",
      regular_price: "10.99",
      sale_price: "",
      stock_status: "instock",
      stock_quantity: 10,
      images: [],
      categories: [],
    } as unknown as Awaited<ReturnType<typeof getProduct>>);
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

  it("returns 500 when body is not valid JSON", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
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

  it("returns 400 when live product price differs from cart price", async () => {
    vi.mocked(getProduct).mockResolvedValueOnce({
      id: 1,
      name: "Product A",
      slug: "product-a",
      price: "12.99",
      regular_price: "12.99",
      sale_price: "",
      stock_status: "instock",
      stock_quantity: 10,
      images: [],
      categories: [],
    } as unknown as Awaited<ReturnType<typeof getProduct>>);
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: validItems },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/stale/i);
  });

  it("returns 400 when live product is out of stock", async () => {
    vi.mocked(getProduct).mockResolvedValueOnce({
      id: 1,
      name: "Product A",
      slug: "product-a",
      price: "10.99",
      regular_price: "10.99",
      sale_price: "",
      stock_status: "outofstock",
      stock_quantity: 0,
      images: [],
      categories: [],
    } as unknown as Awaited<ReturnType<typeof getProduct>>);
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: validItems },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/out of stock/i);
  });

  it("sends an idempotency key for checkout session creation", async () => {
    const payload = { items: validItems, customerEmail: "buyer@example.com" };
    const req1 = createMockRequest("/api/checkout", { method: "POST", body: payload });
    const req2 = createMockRequest("/api/checkout", { method: "POST", body: payload });

    await POST(req1);
    await POST(req2);

    const firstCall = vi.mocked(createEmbeddedCheckoutSession).mock.calls[0];
    const secondCall = vi.mocked(createEmbeddedCheckoutSession).mock.calls[1];
    const firstOptions = firstCall?.[2] as { idempotencyKey?: string } | undefined;
    const secondOptions = secondCall?.[2] as { idempotencyKey?: string } | undefined;

    expect(firstOptions?.idempotencyKey).toMatch(/^[a-f0-9]{64}$/);
    expect(secondOptions?.idempotencyKey).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects item quantity above live stock quantity", async () => {
    vi.mocked(getProduct).mockResolvedValueOnce({
      id: 1,
      name: "Product A",
      slug: "product-a",
      price: "10.99",
      regular_price: "10.99",
      sale_price: "",
      stock_status: "instock",
      stock_quantity: 1,
      images: [],
      categories: [],
    } as unknown as Awaited<ReturnType<typeof getProduct>>);

    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: {
        items: [{ id: 1, name: "Product A", price: 10.99, quantity: 2 }],
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/no longer available/i);
  });

  it("uses caller-provided idempotency key header when present", async () => {
    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: validItems },
      headers: { "idempotency-key": "checkout-key-123" },
    });

    await POST(req);

    const [, , options] = vi.mocked(createEmbeddedCheckoutSession).mock.calls[0] || [];
    const sessionOptions = options as { idempotencyKey?: string };
    expect(sessionOptions.idempotencyKey).toBe("checkout-key-123");
  });

  it("retries without tax when Stripe tax calculation fails", async () => {
    vi.mocked(createEmbeddedCheckoutSession)
      .mockRejectedValueOnce({ message: "tax calculation failed", type: "StripeInvalidRequestError" })
      .mockResolvedValueOnce({
        id: "cs_retry_1",
        client_secret: "pi_secret_retry",
        metadata: {},
        automatic_tax: { enabled: false, status: "failed" },
      } as Stripe.Checkout.Session);

    const req = createMockRequest("/api/checkout", {
      method: "POST",
      body: { items: validItems },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(createEmbeddedCheckoutSession)).toHaveBeenCalledTimes(2);
    const retryCall = vi.mocked(createEmbeddedCheckoutSession).mock.calls[1];
    expect((retryCall?.[2] as { taxEnabled?: boolean }).taxEnabled).toBe(false);
  });
});
