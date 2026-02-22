"use client";

import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { FriendAvatar } from "./friend-avatar";
import type { FriendBalance } from "@/hooks/use-portfolio";
import type { NetBalance, Currency } from "@/types";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface PortfolioViewProps {
  friendBalances: FriendBalance[];
  totalByCurrency: NetBalance[];
  convertedTotal: number | null;
  preferredCurrency?: Currency;
  t: Translations;
  onSelectFriend: (ledgerId: string) => void;
}

type NetState = "positive" | "negative" | "mixed" | "settled";

function getNetState(
  totalByCurrency: NetBalance[],
  convertedTotal: number | null
): NetState {
  if (totalByCurrency.length === 0) return "settled";

  if (convertedTotal !== null) {
    if (Math.abs(convertedTotal) < 0.01) return "settled";
    return convertedTotal > 0 ? "positive" : "negative";
  }

  const hasPositive = totalByCurrency.some((b) => b.amount > 0.01);
  const hasNegative = totalByCurrency.some((b) => b.amount < -0.01);

  if (hasPositive && hasNegative) return "mixed";
  if (hasPositive) return "positive";
  if (hasNegative) return "negative";
  return "settled";
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

export function PortfolioView({
  friendBalances,
  totalByCurrency,
  convertedTotal,
  preferredCurrency,
  t,
  onSelectFriend,
}: PortfolioViewProps) {
  const netState = getNetState(totalByCurrency, convertedTotal);
  const isDark = useIsDark();
  const showConverted = convertedTotal !== null && preferredCurrency;

  // Subtle, professional color mapping
  const stateColor = {
    positive: { accent: isDark ? "#34d399" : "#059669", bg: isDark ? "rgba(52,211,153,0.08)" : "rgba(5,150,105,0.04)" },
    negative: { accent: isDark ? "#fb7185" : "#e11d48", bg: isDark ? "rgba(251,113,133,0.08)" : "rgba(225,29,72,0.04)" },
    mixed: { accent: isDark ? "#818cf8" : "#4f46e5", bg: isDark ? "rgba(129,140,248,0.08)" : "rgba(79,70,229,0.04)" },
    settled: { accent: isDark ? "#94a3b8" : "#64748b", bg: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.04)" },
  }[netState];

  const StateIcon = netState === "positive" ? TrendingUp : netState === "negative" ? TrendingDown : Minus;

  return (
    <div className="px-4 pt-2 pb-24 space-y-5">
      {/* Net Worth Card */}
      <div
        className="rounded-2xl border p-6"
        style={{ backgroundColor: stateColor.bg }}
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: stateColor.accent + "18" }}
          >
            <StateIcon className="h-3.5 w-3.5" style={{ color: stateColor.accent }} />
          </div>
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            {t.totalNetWorth}
          </span>
        </div>

        {netState === "settled" ? (
          <p className="text-2xl font-semibold text-muted-foreground">{t.allSettled}</p>
        ) : (
          <div className="space-y-5">
            {/* Primary amount */}
            {showConverted ? (
              <div>
                <p
                  dir="ltr"
                  className="text-4xl font-extrabold tracking-tight leading-none"
                  style={{ color: stateColor.accent }}
                >
                  {convertedTotal > 0 ? "+" : "\u2212"}
                  {getCurrencySymbol(preferredCurrency)}
                  {Math.abs(convertedTotal).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{t.approximateTotal}</p>
              </div>
            ) : totalByCurrency.length === 1 ? (
              <p
                dir="ltr"
                className="text-4xl font-extrabold tracking-tight leading-none"
                style={{ color: stateColor.accent }}
              >
                {totalByCurrency[0].amount > 0 ? "+" : "\u2212"}
                {formatCurrency(Math.abs(totalByCurrency[0].amount), totalByCurrency[0].currency)}
              </p>
            ) : null}

            {/* Currency breakdown pills */}
            <div className="flex flex-wrap gap-2">
              {totalByCurrency.map(({ currency, amount }) => (
                <div
                  key={currency}
                  className="flex items-center gap-2 rounded-xl border px-3.5 py-2"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)" }}
                >
                  <span
                    dir="ltr"
                    className={cn(
                      "font-semibold tabular-nums",
                      showConverted ? "text-sm" : "text-base"
                    )}
                    style={{ color: amount > 0 ? stateColor.accent : (isDark ? "#fb7185" : "#e11d48") }}
                  >
                    {amount > 0 ? "+" : "\u2212"}
                    {formatCurrency(Math.abs(amount), currency)}
                  </span>
                  {!showConverted && (
                    <span className="text-[10px] text-muted-foreground">
                      {amount > 0 ? t.owesYou("") : amount < 0 ? t.youOwe("") : ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Friends List */}
      <div>
        <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3 px-1">
          {t.allFriends} ({friendBalances.length})
        </h2>
        <div className="space-y-2">
          {friendBalances.map((friend) => (
            <FriendCard
              key={friend.ledgerId}
              friend={friend}
              preferredCurrency={preferredCurrency}
              t={t}
              onSelect={() => onSelectFriend(friend.ledgerId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FriendCard({
  friend,
  preferredCurrency,
  t,
  onSelect,
}: {
  friend: FriendBalance;
  preferredCurrency?: Currency;
  t: Translations;
  onSelect: () => void;
}) {
  const hasBalance = friend.balances.length > 0;
  const showConverted = friend.convertedTotal !== undefined && preferredCurrency;

  return (
    <div
      className="group flex items-center gap-3.5 rounded-xl border bg-card p-3.5 transition-all hover:shadow-sm cursor-pointer active:scale-[0.99]"
      onClick={onSelect}
    >
      {/* Avatar */}
      <FriendAvatar name={friend.friendName} photoUrl={friend.friendPhoto} size="md" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{friend.friendName}</p>
          {!friend.hasPartner && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {t.pendingApproval}
            </span>
          )}
        </div>
        {hasBalance ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {showConverted && (
              <span
                dir="ltr"
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  friend.convertedTotal! > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {friend.convertedTotal! > 0 ? "+" : "\u2212"}
                {formatCurrency(Math.abs(friend.convertedTotal!), preferredCurrency)}
              </span>
            )}
            {friend.balances.map(({ currency, amount }) => (
              <span
                key={currency}
                dir="ltr"
                className={cn(
                  "tabular-nums",
                  showConverted
                    ? "text-xs text-muted-foreground"
                    : cn(
                        "text-sm font-semibold",
                        amount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )
                )}
              >
                {amount > 0 ? "+" : "\u2212"}
                {formatCurrency(Math.abs(amount), currency)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">{t.allSettled}</p>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </div>
  );
}
