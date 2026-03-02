import { describe, it, expect } from "vitest";

import { isPoBoxLine, isPoBoxAddress } from "./poBox";

describe("isPoBoxLine", () => {
  it("returns true for PO Box variants", () => {
    expect(isPoBoxLine("PO Box 123")).toBe(true);
    expect(isPoBoxLine("P.O. Box 456")).toBe(true);
    expect(isPoBoxLine("P O BOX 789")).toBe(true);
    expect(isPoBoxLine("POST OFFICE BOX 100")).toBe(true);
    expect(isPoBoxLine("POBOX 999")).toBe(true);
  });

  it("returns true when PO Box appears in line", () => {
    expect(isPoBoxLine("Suite 1, PO Box 123")).toBe(true);
    expect(isPoBoxLine("123 Main St PO BOX 456")).toBe(true);
  });

  it("returns false for street addresses", () => {
    expect(isPoBoxLine("123 Main Street")).toBe(false);
    expect(isPoBoxLine("456 Oak Ave")).toBe(false);
    expect(isPoBoxLine("")).toBe(false);
  });

  it("normalizes spaces and case", () => {
    expect(isPoBoxLine("  po   box   100  ")).toBe(true);
    expect(isPoBoxLine("p.o. box 200")).toBe(true);
  });
});

describe("isPoBoxAddress", () => {
  it("returns true when line1 is PO Box", () => {
    expect(isPoBoxAddress("PO Box 123")).toBe(true);
  });

  it("returns true when line2 is PO Box", () => {
    expect(isPoBoxAddress("Suite 1", "PO Box 456")).toBe(true);
  });

  it("returns false when neither line is PO Box", () => {
    expect(isPoBoxAddress("123 Main St")).toBe(false);
    expect(isPoBoxAddress("123 Main St", "Apt 4")).toBe(false);
  });

  it("handles missing line2", () => {
    expect(isPoBoxAddress("123 Main St")).toBe(false);
    expect(isPoBoxAddress("PO Box 100")).toBe(true);
  });
});
