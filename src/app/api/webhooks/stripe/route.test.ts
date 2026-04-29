// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";

const constructEventMock = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => constructEventMock(...args),
    },
  },
}));

const mockWebhookSecret = { current: "whsec_test" };
vi.mock("@/lib/env", () => ({
  env: {
    get STRIPE_WEBHOOK_SECRET() {
      return mockWebhookSecret.current;
    },
  },
}));

const findOrderByStripeSessionIdMock = vi.fn();
const findOrderByStripeEventIdMock = vi.fn();
const createWooCommerceOrderMock = vi.fn();
vi.mock("@/lib/orders", () => ({
  findOrderByStripeSessionId: (...args: unknown[]) => findOrderByStripeSessionIdMock(...args),
  findOrderByStripeEventId: (...args: unknown[]) => findOrderByStripeEventIdMock(...args),
  createWooCommerceOrder: (...args: unknown[]) => createWooCommerceOrderMock(...args),
}));

import { POST } from "./route";

function stripeEvent(
  overrides: {
    id?: string;
    type?: string;
    created?: number;
    data?: { object: { id: string; payment_status: string } };
  } = {}
) {
  return {
    id: "evt_test_123",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000) - 60,
    data: {
      object: {
        id: "cs_test_123",
        payment_status: "paid",
      },
    },
    ...overrides,
  };
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    mockWebhookSecret.current = "whsec_test";
    findOrderByStripeSessionIdMock.mockReset();
    findOrderByStripeEventIdMock.mockReset();
    createWooCommerceOrderMock.mockReset();
    constructEventMock.mockReset();
    findOrderByStripeSessionIdMock.mockResolvedValue(null);
    findOrderByStripeEventIdMock.mockResolvedValue(null);
    createWooCommerceOrderMock.mockResolvedValue({ id: 1 });
    constructEventMock.mockImplementation((_payload: Buffer, _sig: string, secret: string) => {
      if (!secret) throw new Error("Secret required");
      return stripeEvent();
    });
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    mockWebhookSecret.current = "";
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "v1,xxx" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/secret|configured/i);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/signature|invalid/i);
  });

  it("returns 400 when signature verification fails", async () => {
    constructEventMock.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "v1,badsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/signature|invalid/i);
  });

  it("accepts valid signed events even when delayed", async () => {
    const oldEvent = stripeEvent({
      created: Math.floor(Date.now() / 1000) - 400,
    });
    constructEventMock.mockReturnValueOnce(oldEvent);
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 200 with received: true when signature is valid and event is recent", async () => {
    constructEventMock.mockReturnValueOnce(stripeEvent());
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 503 so Stripe retries when processing fails", async () => {
    createWooCommerceOrderMock.mockRejectedValueOnce(new Error("Woo down"));
    constructEventMock.mockReturnValueOnce(stripeEvent());
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toMatch(/webhook processing failed/i);
  });

  it("returns 200 and skips order creation when session already has an order", async () => {
    findOrderByStripeSessionIdMock.mockResolvedValueOnce({ id: 99 });
    constructEventMock.mockReturnValueOnce(stripeEvent());
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createWooCommerceOrderMock).not.toHaveBeenCalled();
  });

  it("returns 200 and skips processing when event id was already processed", async () => {
    findOrderByStripeEventIdMock.mockResolvedValueOnce({ id: 33 });
    constructEventMock.mockReturnValueOnce(stripeEvent({ id: "evt_already_done" }));
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(findOrderByStripeEventIdMock).toHaveBeenCalledWith("evt_already_done");
    expect(createWooCommerceOrderMock).not.toHaveBeenCalled();
  });

  it("handles out-of-order async success then completed without duplicate order creation", async () => {
    constructEventMock
      .mockReturnValueOnce(stripeEvent({ type: "checkout.session.async_payment_succeeded" }))
      .mockReturnValueOnce(stripeEvent({ type: "checkout.session.completed" }));
    findOrderByStripeSessionIdMock
      .mockResolvedValueOnce(null) // async success path: order not found
      .mockResolvedValueOnce({ id: 101 }); // completed path: already exists now

    const req1 = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.async_payment_succeeded" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const req2 = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "v1,validsig" },
    });

    const res1 = await POST(req1);
    const res2 = await POST(req2);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(createWooCommerceOrderMock).toHaveBeenCalledTimes(1);
  });

  it("ignores unhandled event types safely", async () => {
    constructEventMock.mockReturnValueOnce(
      stripeEvent({
        type: "payment_method.attached",
      })
    );
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "payment_method.attached" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createWooCommerceOrderMock).not.toHaveBeenCalled();
  });

  it("does not create order for unpaid checkout.session.completed", async () => {
    constructEventMock.mockReturnValueOnce(
      stripeEvent({
        data: {
          object: {
            id: "cs_unpaid_1",
            payment_status: "unpaid",
          },
        },
      })
    );
    const req = createMockRequest("/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "v1,validsig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createWooCommerceOrderMock).not.toHaveBeenCalled();
  });
});
