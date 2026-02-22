"use client";

import { useMemo, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { calculateNetBalances } from "@/lib/balance";
import { getExchangeRates, convertBalances, type ExchangeRates } from "@/lib/exchange-rates";
import type { LendLogEntry, NetBalance, Currency } from "@/types";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BalanceSummaryProps {
  entries: LendLogEntry[];
  friendName: string;
  t: Translations;
  preferredCurrency?: Currency;
}

type BalanceState = "positive" | "negative" | "settled";

function getOverallState(balances: NetBalance[], convertedTotal: number | null): BalanceState {
  if (balances.length === 0) return "settled";

  // Use converted total if available for accurate state
  if (convertedTotal !== null) {
    if (Math.abs(convertedTotal) < 0.01) return "settled";
    return convertedTotal > 0 ? "positive" : "negative";
  }

  // Single currency — use direct amount
  if (balances.length === 1) {
    if (Math.abs(balances[0].amount) < 0.01) return "settled";
    return balances[0].amount > 0 ? "positive" : "negative";
  }

  // Multi-currency without conversion — use majority direction
  const positiveCount = balances.filter((b) => b.amount > 0).length;
  const negativeCount = balances.filter((b) => b.amount < 0).length;
  if (positiveCount === 0 && negativeCount === 0) return "settled";
  return positiveCount >= negativeCount ? "positive" : "negative";
}

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

const gradientConfig: Record<
  BalanceState,
  { light: string; dark: string }
> = {
  positive: {
    light: "linear-gradient(135deg, #059669, #047857)",
    dark: "linear-gradient(135deg, #047857, #065f46)",
  },
  negative: {
    light: "linear-gradient(135deg, #dc2626, #b91c1c)",
    dark: "linear-gradient(135deg, #b91c1c, #991b1b)",
  },
  settled: {
    light: "linear-gradient(135deg, #475569, #334155)",
    dark: "linear-gradient(135deg, #334155, #1e293b)",
  },
};

export function BalanceSummary({
  entries,
  friendName,
  t,
  preferredCurrency,
}: BalanceSummaryProps) {
  const balances = useMemo(() => calculateNetBalances(entries), [entries]);
  const isDark = useIsDark();
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    if (preferredCurrency) {
      getExchangeRates().then(setRates);
    }
  }, [preferredCurrency]);

  const sortedBalances = useMemo(
    () =>
      [...balances].sort(
        (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
      ),
    [balances]
  );

  const hasMultipleCurrencies = balances.length > 1;
  const convertedTotal =
    preferredCurrency && rates && hasMultipleCurrencies
      ? convertBalances(balances, preferredCurrency, rates)
      : null;

  const state = getOverallState(balances, convertedTotal);
  const gradient = isDark
    ? gradientConfig[state].dark
    : gradientConfig[state].light;

  return (
    <div className="px-4 py-3">
      <div
        className="relative overflow-hidden rounded-2xl p-6 shadow-lg"
        style={{ backgroundImage: gradient }}
      >
        {/* Settled state */}
        {state === "settled" && (
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-lg font-semibold text-white">{t.allSettled}</p>
          </div>
        )}

        {/* Has balances */}
        {state !== "settled" && sortedBalances.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Row 1: Big converted total OR single-currency big amount */}
            {convertedTotal !== null && preferredCurrency ? (
              <div className="flex flex-col items-center text-center py-1">
                <p dir="ltr" className="text-4xl font-extrabold tracking-tight text-white">
                  {convertedTotal > 0 ? "+" : "\u2212"}
                  {getCurrencySymbol(preferredCurrency)}
                  {Math.abs(convertedTotal).toFixed(2)}
                </p>
                <p className="mt-1.5 text-sm font-medium text-white/60">
                  {t.approximateTotal}
                </p>
              </div>
            ) : sortedBalances.length === 1 ? (
              <div className="flex flex-col items-center text-center py-2">
                <p dir="ltr" className="text-4xl font-extrabold tracking-tight text-white">
                  {sortedBalances[0].amount > 0 ? "+" : "\u2212"}
                  {formatCurrency(Math.abs(sortedBalances[0].amount), sortedBalances[0].currency)}
                </p>
                <p className="mt-1.5 text-sm font-medium text-white/70">
                  {sortedBalances[0].amount > 0
                    ? t.owesYou(friendName)
                    : t.youOwe(friendName)}
                </p>
              </div>
            ) : (
              /* Multi-currency without preferred: show largest centered */
              <div className="flex flex-col items-center text-center py-1">
                <p dir="ltr" className="text-3xl font-extrabold tracking-tight text-white">
                  {sortedBalances[0].amount > 0 ? "+" : "\u2212"}
                  {formatCurrency(Math.abs(sortedBalances[0].amount), sortedBalances[0].currency)}
                </p>
                <p className="mt-1 text-sm font-medium text-white/70">
                  {sortedBalances[0].amount > 0
                    ? t.owesYou(friendName)
                    : t.youOwe(friendName)}
                </p>
              </div>
            )}

            {/* Row 2: All currencies in glass boxes (when multi-currency) */}
            {hasMultipleCurrencies && (
              <div className="flex flex-wrap gap-2 justify-center">
                {sortedBalances.map(({ currency, amount }) => (
                  <div
                    key={currency}
                    className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2.5"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <p
                      dir="ltr"
                      className="text-base font-bold tracking-tight text-white"
                    >
                      {amount > 0 ? "+" : "\u2212"}
                      {formatCurrency(Math.abs(amount), currency)}
                    </p>
                    <p className="text-[10px] font-medium text-white/60">
                      {amount > 0
                        ? t.owesYou(friendName)
                        : t.youOwe(friendName)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
