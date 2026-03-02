// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";
import { getCheckoutSession } from "@/lib/stripe";

vi.mock("@/lib/stripe", () => ({
  getCheckoutSession: vi.fn(),
}));

import { GET } from "./route";

describe("GET /api/checkout/session", () => {
  beforeEach(() => {
    vi.mocked(getCheckoutSession).mockResolvedValue({
      id: "cs_test_123",
      payment_status: "paid",
      status: "complete",
      amount_total: 1099,
      amount_subtotal: 999,
      currency: "usd",
      customer_email: "test@example.com",
      line_items: { data: [], object: "list", has_more: false, url: "/v1/checkout/sessions/cs_test_123/line_items" },
      metadata: {},
      total_details: null,
      payment_intent: "pi_123",
      customer_details: null,
    } as unknown as Awaited<ReturnType<typeof getCheckoutSession>>);
  });

  it("returns 400 when session_id is missing", async () => {
    const req = createMockRequest("/api/checkout/session");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/session|required/i);
  });

  it("returns 400 when session_id has invalid format (no cs_ prefix)", async () => {
    const req = createMockRequest("/api/checkout/session?session_id=invalid");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/session|invalid|format/i);
  });

  it("returns 400 when session_id is too short", async () => {
    const req = createMockRequest("/api/checkout/session?session_id=cs_ab");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid|format/i);
  });

  it("returns 200 with session data when session_id is valid", async () => {
    const req = createMockRequest("/api/checkout/session?session_id=cs_test_1234567890");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("cs_test_123");
    expect(data.payment_status).toBe("paid");
    expect(data.amount_total).toBe(1099);
  });

  it("returns 400 or 500 when getCheckoutSession throws No such checkout session", async () => {
    vi.mocked(getCheckoutSession).mockRejectedValueOnce(new Error("No such checkout session: cs_bad"));
    const req = createMockRequest("/api/checkout/session?session_id=cs_test_1234567890");
    const res = await GET(req);
    expect([400, 500]).toContain(res.status);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error).not.toMatch(/stack|secret/i);
  });

  it("returns 500 when getCheckoutSession throws generic error", async () => {
    vi.mocked(getCheckoutSession).mockRejectedValueOnce(new Error("Network error"));
    const req = createMockRequest("/api/checkout/session?session_id=cs_test_1234567890");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/retrieve|failed/i);
  });
});
