import type { LendLogEntry, NetBalance, Currency } from "@/types";

export function calculateNetBalances(entries: LendLogEntry[]): NetBalance[] {
  const balanceMap = new Map<Currency, number>();

  for (const entry of entries) {
    const current = balanceMap.get(entry.currency) || 0;

    if (entry.type === "lent") {
      balanceMap.set(entry.currency, current + entry.amount);
    } else {
      balanceMap.set(entry.currency, current - entry.amount);
    }
  }

  return Array.from(balanceMap.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .filter(({ amount }) => Math.abs(amount) > 0.01);
}
