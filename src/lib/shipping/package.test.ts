import { describe, it, expect } from "vitest";

import { derivePackageFromProducts, type ProductWithQuantity } from "./package";

/** Minimal product-like object with only fields used by derivePackageFromProducts. */
function p(
  weight: string,
  quantity: number,
  dimensions: { length: string; width: string; height: string } = { length: "9", width: "6", height: "1" }
): ProductWithQuantity {
  return { weight, quantity, dimensions } as ProductWithQuantity;
}

describe("derivePackageFromProducts", () => {
  it("uses default dimensions when product has no dimensions", () => {
    const result = derivePackageFromProducts([
      p("2", 1, { length: "", width: "", height: "" }),
    ]);
    expect(result.weightLbs).toBe(2);
    expect(result.totalWeight).toBe(2);
    expect(result.length).toBe(9);
    expect(result.width).toBe(6);
    expect(result.height).toBe(1);
  });

  it("uses small-package defaults when no dimensions and total weight under 1 lb", () => {
    const result = derivePackageFromProducts([
      p("0.2", 1, { length: "", width: "", height: "" }),
    ]);
    expect(result.weightLbs).toBe(0.2);
    expect(result.totalWeight).toBe(0.2);
    expect(result.length).toBe(6);
    expect(result.width).toBe(4);
    expect(result.height).toBe(0.5);
  });

  it("uses standard defaults when no dimensions and total weight >= 1 lb", () => {
    const result = derivePackageFromProducts([
      p("1", 1, { length: "", width: "", height: "" }),
    ]);
    expect(result.weightLbs).toBe(1);
    expect(result.length).toBe(9);
    expect(result.width).toBe(6);
    expect(result.height).toBe(1);
  });

  it("uses product weight and dimensions when set", () => {
    const result = derivePackageFromProducts([
      p("0.5", 1, { length: "12", width: "8", height: "4" }),
    ]);
    expect(result.weightLbs).toBe(0.5);
    expect(result.totalWeight).toBe(0.5);
    expect(result.length).toBe(12);
    expect(result.width).toBe(8);
    expect(result.height).toBe(4);
  });

  it("enforces minimum weight 0.1 lb", () => {
    const result = derivePackageFromProducts([
      p("0", 1, { length: "9", width: "6", height: "1" }),
    ]);
    expect(result.weightLbs).toBe(0.1);
    expect(result.totalWeight).toBe(0);
  });

  it("sums weight across multiple products with quantity", () => {
    const result = derivePackageFromProducts([
      p("1", 2),
      p("0.5", 2),
    ]);
    expect(result.totalWeight).toBe(3);
    expect(result.weightLbs).toBe(3);
  });

  it("uses first product with valid dimensions for package dimensions", () => {
    const result = derivePackageFromProducts([
      p("1", 1, { length: "", width: "", height: "" }),
      p("1", 1, { length: "10", width: "5", height: "3" }),
    ]);
    expect(result.length).toBe(10);
    expect(result.width).toBe(5);
    expect(result.height).toBe(3);
  });

  it("scales down dimensions when length + girth exceeds 108", () => {
    const result = derivePackageFromProducts([
      p("1", 1, { length: "60", width: "30", height: "30" }),
    ]);
    // girth = 2*(30+30) = 120, length = 60, total = 180 > 108
    expect(result.length + 2 * (result.width + result.height)).toBeLessThanOrEqual(108.1);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(0.25);
  });
});
