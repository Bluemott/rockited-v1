import { describe, it, expect } from "vitest";

import { formatPrice } from "../utils";

describe("formatPrice", () => {
  it("should format number as USD currency", () => {
    expect(formatPrice(10.99)).toBe("$10.99");
    expect(formatPrice(100)).toBe("$100.00");
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("should format string as USD currency", () => {
    expect(formatPrice("10.99")).toBe("$10.99");
    expect(formatPrice("100")).toBe("$100.00");
    expect(formatPrice("0")).toBe("$0.00");
  });

  it("should format zero correctly", () => {
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice("0")).toBe("$0.00");
  });

  it("should format large numbers correctly", () => {
    expect(formatPrice(1000)).toBe("$1,000.00");
    expect(formatPrice(10000)).toBe("$10,000.00");
    expect(formatPrice(1000000)).toBe("$1,000,000.00");
    expect(formatPrice("1000000")).toBe("$1,000,000.00");
  });

  it("should format decimal numbers correctly", () => {
    expect(formatPrice(10.5)).toBe("$10.50");
    expect(formatPrice(10.99)).toBe("$10.99");
    expect(formatPrice(0.99)).toBe("$0.99");
    expect(formatPrice("10.5")).toBe("$10.50");
    expect(formatPrice("10.99")).toBe("$10.99");
  });

  it("should handle numbers with many decimal places", () => {
    expect(formatPrice(10.999)).toBe("$11.00"); // Rounds to 2 decimal places
    expect(formatPrice(10.995)).toBe("$11.00");
    expect(formatPrice(10.994)).toBe("$10.99");
  });

  it("should handle negative numbers", () => {
    expect(formatPrice(-10.99)).toBe("-$10.99");
    expect(formatPrice("-10.99")).toBe("-$10.99");
    expect(formatPrice(-1000)).toBe("-$1,000.00");
  });

  it("should handle very small numbers", () => {
    expect(formatPrice(0.01)).toBe("$0.01");
    expect(formatPrice(0.1)).toBe("$0.10");
    expect(formatPrice("0.01")).toBe("$0.01");
  });

  it("should handle string numbers with whitespace", () => {
    // Note: parseFloat handles leading/trailing whitespace
    expect(formatPrice(" 10.99 ")).toBe("$10.99");
    expect(formatPrice("  100  ")).toBe("$100.00");
  });

  it("should handle scientific notation strings", () => {
    expect(formatPrice("1e2")).toBe("$100.00");
    expect(formatPrice("1.5e2")).toBe("$150.00");
  });

  it("should handle invalid string input gracefully", () => {
    // parseFloat returns NaN for invalid strings, which formats as "$NaN"
    // This is expected behavior - in production, you'd want to validate input
    expect(formatPrice("invalid")).toBe("$NaN");
    expect(formatPrice("abc123")).toBe("$NaN");
    expect(formatPrice("")).toBe("$NaN");
  });

  it("should format common e-commerce price values", () => {
    expect(formatPrice(9.99)).toBe("$9.99");
    expect(formatPrice(19.99)).toBe("$19.99");
    expect(formatPrice(29.99)).toBe("$29.99");
    expect(formatPrice(99.99)).toBe("$99.99");
    expect(formatPrice(199.99)).toBe("$199.99");
  });

  it("should handle prices with trailing zeros", () => {
    expect(formatPrice(10.0)).toBe("$10.00");
    expect(formatPrice(10.1)).toBe("$10.10");
    expect(formatPrice("10.0")).toBe("$10.00");
  });
});
