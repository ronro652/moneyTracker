import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  createPortfolioSchema,
  addHoldingSchema,
  createTransactionSchema,
  createDividendSchema,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ email: "Test@Example.com", password: "abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      email: "user@test.com",
      name: "Ron",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      email: "user@test.com",
      name: "Ron",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      email: "user@test.com",
      name: "",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("lowercases email", () => {
    const result = registerSchema.safeParse({
      email: "User@TEST.com",
      name: "Ron",
      password: "123456",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@test.com");
    }
  });
});

describe("createPortfolioSchema", () => {
  it("accepts valid input", () => {
    const result = createPortfolioSchema.safeParse({ name: "Tech Stocks" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("rejects empty name", () => {
    const result = createPortfolioSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("addHoldingSchema", () => {
  it("accepts valid stock holding", () => {
    const result = addHoldingSchema.safeParse({
      ticker: "AAPL",
      shares: 10,
      avg_cost: 150.5,
      portfolio_id: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.asset_type).toBe("stock");
    }
  });

  it("accepts crypto holding", () => {
    const result = addHoldingSchema.safeParse({
      ticker: "BTC",
      shares: 0.5,
      avg_cost: 60000,
      portfolio_id: 1,
      asset_type: "crypto",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative shares", () => {
    const result = addHoldingSchema.safeParse({
      ticker: "AAPL",
      shares: -5,
      avg_cost: 150,
      portfolio_id: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero cost", () => {
    const result = addHoldingSchema.safeParse({
      ticker: "AAPL",
      shares: 10,
      avg_cost: 0,
      portfolio_id: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  it("accepts valid buy transaction", () => {
    const result = createTransactionSchema.safeParse({
      ticker: "MSFT",
      shares: 5,
      price_per_share: 400,
      portfolio_id: 1,
      type: "buy",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid sell transaction", () => {
    const result = createTransactionSchema.safeParse({
      ticker: "MSFT",
      shares: 3,
      price_per_share: 420,
      portfolio_id: 1,
      type: "sell",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid transaction type", () => {
    const result = createTransactionSchema.safeParse({
      ticker: "MSFT",
      shares: 5,
      price_per_share: 400,
      portfolio_id: 1,
      type: "transfer",
    });
    expect(result.success).toBe(false);
  });
});

describe("createDividendSchema", () => {
  it("accepts valid dividend", () => {
    const result = createDividendSchema.safeParse({
      ticker: "AAPL",
      dividend_per_share: 0.24,
      shares: 100,
      portfolio_id: 1,
      ex_date: "2025-05-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing ex_date", () => {
    const result = createDividendSchema.safeParse({
      ticker: "AAPL",
      dividend_per_share: 0.24,
      shares: 100,
      portfolio_id: 1,
      ex_date: "",
    });
    expect(result.success).toBe(false);
  });
});
