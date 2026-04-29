import { describe, it, expect, vi, beforeEach } from "vitest";

import { logger } from "./logger";

describe("logger redaction", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    errorSpy.mockClear();
  });

  it("redacts sensitive keys and masks emails", () => {
    logger.error("checkout_failed", {
      customerEmail: "buyer@example.com",
      shippingAddress: {
        line1: "123 Main St",
        postal_code: "94102",
      },
      message: "could not process buyer@example.com",
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = String(errorSpy.mock.calls[0]?.[0] ?? "");
    expect(payload).toContain("[REDACTED]");
    expect(payload).not.toContain("buyer@example.com");
    expect(payload).not.toContain("123 Main St");
  });
});
