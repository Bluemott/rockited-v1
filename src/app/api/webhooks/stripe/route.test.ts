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

vi.mock("@/lib/orders", () => ({
  findOrderByStripeSessionId: vi.fn().mockResolvedValue(null),
  createWooCommerceOrder: vi.fn().mockResolvedValue({ id: 1 }),
}));

import { POST } from "./route";

function stripeEvent(overrides: { id?: string; type?: string; created?: number } = {}) {
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

  it("returns 400 when event is too old (replay)", async () => {
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
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/old|replay/i);
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
});
