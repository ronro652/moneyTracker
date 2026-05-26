import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  name: z.string().min(1, "Name is required").transform((v) => v.trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const createPortfolioSchema = z.object({
  name: z.string().min(1, "Name is required").transform((v) => v.trim()),
  description: z.string().optional().default("").transform((v) => v.trim()),
});

export const updatePortfolioSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const addHoldingSchema = z.object({
  ticker: z.string().min(1),
  name: z.string().optional().default(""),
  shares: z.number().positive("Shares must be positive"),
  avg_cost: z.number().positive("Cost must be positive"),
  portfolio_id: z.number().int().positive(),
  asset_type: z.enum(["stock", "crypto"]).optional().default("stock"),
});

export const createTransactionSchema = z.object({
  ticker: z.string().min(1),
  name: z.string().optional().default(""),
  shares: z.number().positive("Shares must be positive"),
  price_per_share: z.number().positive("Price must be positive"),
  portfolio_id: z.number().int().positive(),
  asset_type: z.enum(["stock", "crypto"]).optional().default("stock"),
  type: z.enum(["buy", "sell"]),
});

export const createDividendSchema = z.object({
  ticker: z.string().min(1),
  dividend_per_share: z.number().positive("Dividend per share must be positive"),
  shares: z.number().positive("Shares must be positive"),
  portfolio_id: z.number().int().positive(),
  ex_date: z.string().min(1, "Ex-dividend date is required"),
  pay_date: z.string().optional().default(""),
});
