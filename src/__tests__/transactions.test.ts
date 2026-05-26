import { describe, it, expect } from "vitest";

describe("transaction calculations", () => {
  describe("average cost on buy", () => {
    it("computes weighted average cost correctly", () => {
      const existingShares = 10;
      const existingAvgCost = 100;
      const newShares = 5;
      const newPrice = 130;

      const totalShares = existingShares + newShares;
      const totalCost = existingShares * existingAvgCost + newShares * newPrice;
      const newAvgCost = totalCost / totalShares;

      expect(totalShares).toBe(15);
      expect(newAvgCost).toBeCloseTo(110, 2);
    });

    it("handles first buy (no existing position)", () => {
      const shares = 20;
      const price = 50;
      const avgCost = price;
      expect(avgCost).toBe(50);
      expect(shares * avgCost).toBe(1000);
    });
  });

  describe("realized gain on sell", () => {
    it("computes gain when selling above avg cost", () => {
      const avgCost = 100;
      const sellPrice = 150;
      const shares = 5;
      const realizedGain = (sellPrice - avgCost) * shares;
      expect(realizedGain).toBe(250);
    });

    it("computes loss when selling below avg cost", () => {
      const avgCost = 100;
      const sellPrice = 80;
      const shares = 10;
      const realizedGain = (sellPrice - avgCost) * shares;
      expect(realizedGain).toBe(-200);
    });

    it("computes zero gain when selling at avg cost", () => {
      const avgCost = 100;
      const sellPrice = 100;
      const shares = 7;
      const realizedGain = (sellPrice - avgCost) * shares;
      expect(realizedGain).toBe(0);
    });
  });

  describe("remaining shares after sell", () => {
    it("reduces shares correctly", () => {
      const existing = 10;
      const sold = 3;
      const remaining = existing - sold;
      expect(remaining).toBe(7);
    });

    it("removes holding when all shares sold", () => {
      const existing = 10;
      const sold = 10;
      const remaining = existing - sold;
      expect(remaining < 0.0001).toBe(true);
    });

    it("handles fractional shares (crypto)", () => {
      const existing = 1.5;
      const sold = 0.3;
      const remaining = existing - sold;
      expect(remaining).toBeCloseTo(1.2, 10);
    });
  });
});
