import type { Currency } from "@/types";

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "MAD", label: "Moroccan Dirham", symbol: "DH" },
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "\u20AC" },
  { value: "GBP", label: "British Pound", symbol: "\u00A3" },
  { value: "JPY", label: "Japanese Yen", symbol: "\u00A5" },
  { value: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
];

export function formatCurrency(amount: number, currency: Currency): string {
  // MAD doesn't have great Intl support, handle manually
  if (currency === "MAD") {
    return `${amount.toFixed(2)} DH`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency;
}
