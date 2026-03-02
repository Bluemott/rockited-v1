// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest } from "@/app/api/__tests__/helpers";

const getFeaturedProductsMock = vi.fn();

vi.mock("@/lib/woocommerce", () => ({
  getFeaturedProducts: (...args: unknown[]) => getFeaturedProductsMock(...args),
}));

import { GET } from "./route";

describe("GET /api/products/featured", () => {
  beforeEach(() => {
    getFeaturedProductsMock.mockResolvedValue([
      { id: 1, name: "Product A", price: "10.00" },
      { id: 2, name: "Product B", price: "20.00" },
    ]);
  });

  it("returns 200 with featured products array", async () => {
    const req = createMockRequest("/api/products/featured");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(getFeaturedProductsMock).toHaveBeenCalledWith(3);
  });

  it("returns 500 when getFeaturedProducts throws", async () => {
    getFeaturedProductsMock.mockRejectedValueOnce(new Error("WooCommerce error"));
    const req = createMockRequest("/api/products/featured");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/featured|failed/i);
  });
});
