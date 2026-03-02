// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRequest, createMockParams } from "@/app/api/__tests__/helpers";

const getProductReviewsMock = vi.fn();
const createProductReviewMock = vi.fn();

vi.mock("@/lib/woocommerce", () => ({
  getProductReviews: (...args: unknown[]) => getProductReviewsMock(...args),
  createProductReview: (...args: unknown[]) => createProductReviewMock(...args),
}));

import { GET, POST } from "./route";

describe("GET /api/products/[id]/reviews", () => {
  beforeEach(() => {
    getProductReviewsMock.mockResolvedValue([]);
  });

  it("returns 400 when id is not a number", async () => {
    const req = createMockRequest("/api/products/abc/reviews");
    const res = await GET(req, createMockParams({ id: "abc" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid|product id/i);
  });

  it("returns 200 with reviews when id is valid", async () => {
    getProductReviewsMock.mockResolvedValue([{ id: 1, review: "Great!", rating: 5 }]);
    const req = createMockRequest("/api/products/42/reviews");
    const res = await GET(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].rating).toBe(5);
  });

  it("returns 500 when getProductReviews throws", async () => {
    getProductReviewsMock.mockRejectedValueOnce(new Error("WooCommerce error"));
    const req = createMockRequest("/api/products/42/reviews");
    const res = await GET(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});

describe("POST /api/products/[id]/reviews", () => {
  const validBody = {
    reviewer: "Jane Doe",
    reviewer_email: "jane@example.com",
    review: "Great product!",
    rating: 5,
  };

  beforeEach(() => {
    createProductReviewMock.mockResolvedValue({ id: 1, ...validBody });
  });

  it("returns 400 when product id is invalid", async () => {
    const req = createMockRequest("/api/products/abc/reviews", { method: "POST", body: validBody });
    const res = await POST(req, createMockParams({ id: "abc" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid|product id/i);
  });

  it("returns 400 when reviewer name is missing", async () => {
    const req = createMockRequest("/api/products/42/reviews", {
      method: "POST",
      body: { ...validBody, reviewer: "" },
    });
    const res = await POST(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/reviewer|name|required/i);
  });

  it("returns 400 when reviewer_email is missing", async () => {
    const req = createMockRequest("/api/products/42/reviews", {
      method: "POST",
      body: { ...validBody, reviewer_email: "" },
    });
    const res = await POST(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email|required/i);
  });

  it("returns 400 when email is invalid", async () => {
    const req = createMockRequest("/api/products/42/reviews", {
      method: "POST",
      body: { ...validBody, reviewer_email: "not-an-email" },
    });
    const res = await POST(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email|invalid/i);
  });

  it("returns 400 when rating is out of range", async () => {
    const req = createMockRequest("/api/products/42/reviews", {
      method: "POST",
      body: { ...validBody, rating: 0 },
    });
    const res = await POST(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/rating|1 and 5/i);
  });

  it("returns 201 with review when body is valid", async () => {
    const req = createMockRequest("/api/products/42/reviews", { method: "POST", body: validBody });
    const res = await POST(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.review).toBeDefined();
    expect(data.message).toMatch(/moderation|submitted/i);
  });

  it("returns 500 when createProductReview throws", async () => {
    createProductReviewMock.mockRejectedValueOnce(new Error("WooCommerce error"));
    const req = createMockRequest("/api/products/42/reviews", { method: "POST", body: validBody });
    const res = await POST(req, createMockParams({ id: "42" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
