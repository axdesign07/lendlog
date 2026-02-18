"use client";

import { useMemo, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { calculateNetBalances } from "@/lib/balance";
import type { LendLogEntry, NetBalance } from "@/types";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BalanceSummaryProps {
  entries: LendLogEntry[];
  friendName: string;
  t: Translations;
}

type BalanceState = "positive" | "negative" | "settled";

function getOverallState(balances: NetBalance[]): BalanceState {
  if (balances.length === 0) return "settled";

  const total = balances.reduce((sum, b) => sum + b.amount, 0);
  if (Math.abs(total) < 0.01) return "settled";
  return total > 0 ? "positive" : "negative";
}

const gradientConfig: Record<
  BalanceState,
  { light: string; dark: string }
> = {
  positive: {
    light: "linear-gradient(135deg, #10b981, #059669, #0f766e)",
    dark: "linear-gradient(135deg, #059669, #047857, #115e59)",
  },
  negative: {
    light: "linear-gradient(135deg, #f43f5e, #ef4444, #b91c1c)",
    dark: "linear-gradient(135deg, #e11d48, #dc2626, #991b1b)",
  },
  settled: {
    light: "linear-gradient(135deg, #64748b, #475569, #334155)",
    dark: "linear-gradient(135deg, #475569, #334155, #1e293b)",
  },
};

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

export function BalanceSummary({
  entries,
  friendName,
  t,
}: BalanceSummaryProps) {
  const balances = useMemo(() => calculateNetBalances(entries), [entries]);
  const isDark = useIsDark();

  const sortedBalances = useMemo(
    () =>
      [...balances].sort(
        (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
      ),
    [balances]
  );

  const state = getOverallState(balances);
  const gradient = isDark
    ? gradientConfig[state].dark
    : gradientConfig[state].light;

  const primary = sortedBalances[0] ?? null;
  const secondary = sortedBalances.slice(1);

  return (
    <div className="px-4 py-3">
      <div
        className="relative overflow-hidden rounded-2xl p-6 shadow-lg"
        style={{
          backgroundImage: `${gradient}, radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 20px 20px",
        }}
      >
        {/* Settled state */}
        {state === "settled" && (
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-lg font-semibold text-white">{t.allSettled}</p>
          </div>
        )}

        {/* Has balances */}
        {primary && (
          <div className="flex flex-col gap-4">
            {/* Primary balance */}
            <div
              className={cn(
                "flex flex-col",
                secondary.length === 0 && "items-center py-2"
              )}
            >
              <p
                dir="ltr"
                className={cn(
                  "font-bold tracking-tight text-white",
                  secondary.length === 0 ? "text-4xl" : "text-3xl"
                )}
              >
                {primary.amount > 0 ? "+" : "\u2212"}
                {formatCurrency(Math.abs(primary.amount), primary.currency)}
              </p>
              <p
                className="mt-1 text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {primary.amount > 0
                  ? t.owesYou(friendName)
                  : t.youOwe(friendName)}
              </p>
            </div>

            {/* Secondary balances as glass sub-cards */}
            {secondary.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {secondary.map(({ currency, amount }) => (
                  <div
                    key={currency}
                    className="flex flex-col gap-0.5 rounded-xl px-4 py-3 backdrop-blur-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    <p
                      dir="ltr"
                      className="text-lg font-bold tracking-tight text-white"
                    >
                      {amount > 0 ? "+" : "\u2212"}
                      {formatCurrency(Math.abs(amount), currency)}
                    </p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
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
