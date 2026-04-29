import { describe, it, expect, vi, beforeEach } from "vitest";

const createSessionMock = vi.fn();
const retrieveSessionMock = vi.fn();

vi.mock("./client", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => createSessionMock(...args),
        retrieve: (...args: unknown[]) => retrieveSessionMock(...args),
      },
    },
  },
}));

import {
  createEmbeddedCheckoutSession,
  getCheckoutSession,
  getTaxCodeForProduct,
} from "./sessions";

describe("stripe sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSessionMock.mockResolvedValue({
      id: "cs_test_1",
      client_secret: "secret",
      metadata: {},
    });
    retrieveSessionMock.mockResolvedValue({ id: "cs_test_1" });
  });

  it("maps virtual products to digital tax code", () => {
    expect(getTaxCodeForProduct({ virtual: true })).toBe("txcd_10101002");
    expect(getTaxCodeForProduct({ virtual: false })).toBe("txcd_99999999");
  });

  it("builds embedded session with preselected shipping and idempotency key", async () => {
    await createEmbeddedCheckoutSession(
      [{ id: 1, name: "A", price: 10, quantity: 1 }],
      "https://example.com/checkout?session_id={CHECKOUT_SESSION_ID}",
      {
        preselectedShipping: {
          address: { country: "US", postal_code: "94102" },
          shippingOption: { method_id: "flat", method_title: "Flat", cost: "5.00" },
        },
        idempotencyKey: "idem-key-1",
      }
    );

    const [params, requestOptions] = createSessionMock.mock.calls[0] || [];
    expect(params.shipping_options?.[0]?.shipping_rate_data?.fixed_amount?.amount).toBe(500);
    expect(requestOptions?.idempotencyKey).toBe("idem-key-1");
  });

  it("throws friendly error for invalid session ID retrieval", async () => {
    retrieveSessionMock.mockRejectedValueOnce({ type: "StripeInvalidRequestError", message: "No such checkout.session" });
    await expect(getCheckoutSession("bad_session")).rejects.toThrow(/invalid session id/i);
  });
});
