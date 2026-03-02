// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest, createMockParams } from "@/app/api/__tests__/helpers";

const checkInventoryMock = vi.fn();

vi.mock("@/lib/woocommerce", () => ({
  checkInventory: (...args: unknown[]) => checkInventoryMock(...args),
}));

import { GET } from "./route";

describe("GET /api/inventory/[id]", () => {
  beforeEach(() => {
    checkInventoryMock.mockResolvedValue({
      stock_status: "instock",
      stock_quantity: 10,
      on_sale: false,
      price: "19.99",
      regular_price: "19.99",
      sale_price: null,
    });
  });

  it("returns 400 when id is not a valid positive integer", async () => {
    const req = createMockRequest("/api/inventory/abc");
    const res = await GET(req, createMockParams({ id: "abc" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid|positive integer/i);
  });

  it("returns 400 when id is zero", async () => {
    const req = createMockRequest("/api/inventory/0");
    const res = await GET(req, createMockParams({ id: "0" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid|positive integer/i);
  });

  it("returns 200 with inventory data when id is valid", async () => {
    const req = createMockRequest("/api/inventory/42");
    const res = await GET(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.stock_status).toBe("instock");
    expect(data.stock_quantity).toBe(10);
    expect(data.price).toBe("19.99");
  });

  it("returns 500 when checkInventory throws", async () => {
    checkInventoryMock.mockRejectedValueOnce(new Error("WooCommerce error"));
    const req = createMockRequest("/api/inventory/42");
    const res = await GET(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/inventory|failed/i);
  });
});
