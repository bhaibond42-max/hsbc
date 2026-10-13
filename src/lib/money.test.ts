import { describe, expect, it } from "vitest";
import { formatGBP, fromPence, normaliseAmount, toPence } from "./money";

describe("money", () => {
  it("converts pounds to pence without binary drift", () => {
    expect(toPence("5000.00")).toBe(500000n);
    expect(toPence("0.10")).toBe(10n);
    expect(toPence("42.5")).toBe(4250n);
  });

  it("adds values that floating point would smear", () => {
    const total = toPence("0.10") + toPence("0.20");
    expect(fromPence(total)).toBe("0.30");
  });

  it("rejects amounts that are not money", () => {
    expect(() => toPence("12.345")).toThrow();
    expect(() => toPence("abc")).toThrow();
  });

  it("formats sterling for display", () => {
    expect(formatGBP("5000")).toBe("£5,000.00");
    expect(normaliseAmount("10")).toBe("10.00");
  });
});
