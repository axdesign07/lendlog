import type { Currency, NetBalance } from "@/types";

const CACHE_KEY = "lendlog-exchange-rates";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const API_URL = "https://open.er-api.com/v6/latest/USD";

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

// Hardcoded fallback rates (approximate, USD-based)
const FALLBACK_RATES: ExchangeRates = {
  base: "USD",
  rates: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    MAD: 10.0,
    JPY: 149.5,
    CAD: 1.36,
    AUD: 1.53,
  },
  timestamp: 0,
};

function getCachedRates(): ExchangeRates | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: ExchangeRates = JSON.parse(cached);
    // Check if cache is still valid
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedRates(rates: ExchangeRates): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
  } catch {
    // localStorage full or unavailable
  }
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  // Check cache first
  const cached = getCachedRates();
  if (cached) return cached;

  // Fetch from API
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    const rates: ExchangeRates = {
      base: "USD",
      rates: data.rates,
      timestamp: Date.now(),
    };

    setCachedRates(rates);
    return rates;
  } catch {
    // API failed — use fallback
    return FALLBACK_RATES;
  }
}

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): number {
  if (from === to) return amount;

  const fromRate = rates.rates[from];
  const toRate = rates.rates[to];

  if (!fromRate || !toRate) return amount;

  // Convert: amount in "from" → USD → "to"
  const inUsd = amount / fromRate;
  return inUsd * toRate;
}

export function convertBalances(
  balances: NetBalance[],
  toCurrency: Currency,
  rates: ExchangeRates
): number {
  let total = 0;
  for (const { currency, amount } of balances) {
    total += convert(amount, currency, toCurrency, rates);
  }
  return total;
}
