"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { calculateNetBalances } from "@/lib/balance";
import { getExchangeRates, convertBalances, type ExchangeRates } from "@/lib/exchange-rates";
import type { LendLogEntry, NetBalance, Currency } from "@/types";
import type { Translations } from "@/lib/i18n";

interface BalanceSummaryProps {
  entries: LendLogEntry[];
  friendName: string;
  t: Translations;
  preferredCurrency?: Currency;
}

type BalanceState = "positive" | "negative" | "settled";

function getOverallState(balances: NetBalance[], convertedTotal: number | null): BalanceState {
  if (balances.length === 0) return "settled";

  if (convertedTotal !== null) {
    if (Math.abs(convertedTotal) < 0.01) return "settled";
    return convertedTotal > 0 ? "positive" : "negative";
  }

  if (balances.length === 1) {
    if (Math.abs(balances[0].amount) < 0.01) return "settled";
    return balances[0].amount > 0 ? "positive" : "negative";
  }

  const positiveCount = balances.filter((b) => b.amount > 0).length;
  const negativeCount = balances.filter((b) => b.amount < 0).length;
  if (positiveCount === 0 && negativeCount === 0) return "settled";
  return positiveCount >= negativeCount ? "positive" : "negative";
}

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

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
    () => [...balances].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
    [balances]
  );

  const hasMultipleCurrencies = balances.length > 1;
  const convertedTotal =
    preferredCurrency && rates && hasMultipleCurrencies
      ? convertBalances(balances, preferredCurrency, rates)
      : null;

  const state = getOverallState(balances, convertedTotal);

  const stateColor = {
    positive: {
      accent: isDark ? "#34d399" : "#059669",
      bg: isDark ? "rgba(52,211,153,0.06)" : "rgba(5,150,105,0.04)",
    },
    negative: {
      accent: isDark ? "#fb7185" : "#e11d48",
      bg: isDark ? "rgba(251,113,133,0.06)" : "rgba(225,29,72,0.04)",
    },
    settled: {
      accent: isDark ? "#94a3b8" : "#64748b",
      bg: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.04)",
    },
  }[state];

  const StateIcon = state === "positive" ? TrendingUp : state === "negative" ? TrendingDown : Check;

  return (
    <div className="px-4 py-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="rounded-2xl border p-6"
        style={{ backgroundColor: stateColor.bg }}
      >
        {/* Settled */}
        {state === "settled" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.1 }}
            className="flex flex-col items-center justify-center gap-3 py-4"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: stateColor.accent + "18" }}
            >
              <Check className="h-5 w-5" style={{ color: stateColor.accent }} />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">{t.allSettled}</p>
          </motion.div>
        )}

        {/* Has balances */}
        {state !== "settled" && sortedBalances.length > 0 && (
          <div className="flex flex-col gap-5">
            {/* Direction icon + label */}
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: stateColor.accent + "18" }}
              >
                <StateIcon className="h-3.5 w-3.5" style={{ color: stateColor.accent }} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {state === "positive" ? t.owesYou(friendName) : t.youOwe(friendName)}
              </span>
            </div>

            {/* Big number */}
            {convertedTotal !== null && preferredCurrency ? (
              <div>
                <motion.p
                  dir="ltr"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.1 }}
                  className="text-4xl font-extrabold tracking-tight leading-none"
                  style={{ color: stateColor.accent }}
                >
                  {convertedTotal > 0 ? "+" : "\u2212"}
                  {getCurrencySymbol(preferredCurrency)}
                  {Math.abs(convertedTotal).toFixed(2)}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-2">{t.approximateTotal}</p>
              </div>
            ) : sortedBalances.length === 1 ? (
              <motion.p
                dir="ltr"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.1 }}
                className="text-4xl font-extrabold tracking-tight leading-none"
                style={{ color: stateColor.accent }}
              >
                {sortedBalances[0].amount > 0 ? "+" : "\u2212"}
                {formatCurrency(Math.abs(sortedBalances[0].amount), sortedBalances[0].currency)}
              </motion.p>
            ) : (
              <motion.p
                dir="ltr"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.1 }}
                className="text-3xl font-extrabold tracking-tight leading-none"
                style={{ color: stateColor.accent }}
              >
                {sortedBalances[0].amount > 0 ? "+" : "\u2212"}
                {formatCurrency(Math.abs(sortedBalances[0].amount), sortedBalances[0].currency)}
              </motion.p>
            )}

            {/* Currency breakdown pills */}
            {hasMultipleCurrencies && (
              <div className="flex flex-wrap gap-2">
                {sortedBalances.map(({ currency, amount }, i) => (
                  <motion.div
                    key={currency}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring, delay: 0.15 + i * 0.05 }}
                    className="flex items-center gap-2 rounded-xl border px-3.5 py-2"
                    style={{
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    <span
                      dir="ltr"
                      className="text-sm font-semibold tabular-nums"
                      style={{
                        color: amount > 0
                          ? (isDark ? "#34d399" : "#059669")
                          : (isDark ? "#fb7185" : "#e11d48"),
                      }}
                    >
                      {amount > 0 ? "+" : "\u2212"}
                      {formatCurrency(Math.abs(amount), currency)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {amount > 0 ? t.owesYou(friendName) : t.youOwe(friendName)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
