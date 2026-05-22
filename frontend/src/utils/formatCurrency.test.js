import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, getAmountColor } from "./formatCurrency";

describe("formatCurrency utilities", () => {
  it("formats INR values for the Indian locale", () => {
    expect(formatCurrency(125000)).toBe("₹1,25,000");
  });

  it("formats plain numbers safely", () => {
    expect(formatNumber(78650)).toBe("78,650");
    expect(formatNumber(undefined)).toBe("0");
  });

  it("returns semantic amount colors", () => {
    expect(getAmountColor(100)).toContain("emerald");
    expect(getAmountColor(-100)).toContain("red");
    expect(getAmountColor(0)).toContain("gray");
  });
});
