import { z } from "zod";

export const currencySchema = z.enum(["MAD", "USD", "EUR", "GBP", "JPY", "CAD", "AUD"]);

export const entryTypeSchema = z.enum(["lent", "borrowed"]);

export const createEntrySchema = z.object({
  type: entryTypeSchema,
  amount: z.number().positive("Amount must be positive"),
  currency: currencySchema,
  note: z.string().max(500).optional(),
  timestamp: z.number().int().positive(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
