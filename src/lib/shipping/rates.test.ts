import { beforeEach, describe, expect, it, vi } from "vitest";

const isShippoConfiguredMock = vi.fn();
const getShippoRatesMock = vi.fn();
const getProductMock = vi.fn();

vi.mock("@/lib/shippo", () => ({
  isShippoConfigured: (...args: unknown[]) => isShippoConfiguredMock(...args),
  getShippoRates: (...args: unknown[]) => getShippoRatesMock(...args),
}));

vi.mock("@/lib/woocommerce/products", () => ({
  getProduct: (...args: unknown[]) => getProductMock(...args),
}));

import { getShippingRates, SHIPPO_RATES_UNAVAILABLE_MESSAGE } from "./rates";

describe("getShippingRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isShippoConfiguredMock.mockReturnValue(true);
    getProductMock.mockResolvedValue({
      id: 1,
      weight: "1",
      dimensions: { length: "10", width: "5", height: "2" },
      shipping_required: true,
    });
  });

  it("returns rates from shippo for valid US ZIP", async () => {
    getShippoRatesMock.mockResolvedValueOnce([
      { method_id: "usps_priority", method_title: "USPS Priority", cost: "9.99" },
    ]);

    const result = await getShippingRates({
      country: "US",
      postcode: "94102",
      products: [{ id: 1, quantity: 1 }],
    });

    expect(result.rates).toHaveLength(1);
    expect(result.rates[0]?.method_id).toBe("usps_priority");
  });

  it("throws when shippo returns no rates", async () => {
    getShippoRatesMock.mockResolvedValueOnce([]);
    await expect(
      getShippingRates({
        country: "US",
        postcode: "94102",
        products: [{ id: 1, quantity: 1 }],
      })
    ).rejects.toThrow(SHIPPO_RATES_UNAVAILABLE_MESSAGE);
  });

  it("throws for invalid US ZIP", async () => {
    await expect(
      getShippingRates({
        country: "US",
        postcode: "94",
        products: [{ id: 1, quantity: 1 }],
      })
    ).rejects.toThrow(/valid 5-digit/i);
  });

  it("throws for non-US destination", async () => {
    await expect(
      getShippingRates({
        country: "CA",
        postcode: "M5V",
        products: [{ id: 1, quantity: 1 }],
      })
    ).rejects.toThrow(/only ship domestically/i);
  });
});
