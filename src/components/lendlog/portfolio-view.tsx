"use client";

import { ArrowRight, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
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

const stateConfig: Record<
  NetState,
  { gradient: string; icon: typeof TrendingUp; label: string }
> = {
  positive: {
    gradient: "linear-gradient(135deg, #059669, #047857)",
    icon: TrendingUp,
    label: "net positive",
  },
  negative: {
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
    icon: TrendingDown,
    label: "net negative",
  },
  mixed: {
    gradient: "linear-gradient(135deg, #2563eb, #4f46e5)",
    icon: Scale,
    label: "mixed",
  },
  settled: {
    gradient: "linear-gradient(135deg, #475569, #334155)",
    icon: Scale,
    label: "settled",
  },
};

export function PortfolioView({
  friendBalances,
  totalByCurrency,
  convertedTotal,
  preferredCurrency,
  t,
  onSelectFriend,
}: PortfolioViewProps) {
  const netState = getNetState(totalByCurrency, convertedTotal);
  const config = stateConfig[netState];
  const Icon = config.icon;
  const showConverted = convertedTotal !== null && preferredCurrency;

  return (
    <div className="px-4 pb-24 space-y-6">
      {/* Total Net Worth Card */}
      <div
        className="rounded-2xl p-6 text-white shadow-lg"
        style={{ backgroundImage: config.gradient }}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-semibold text-white/80">{t.totalNetWorth}</p>
        </div>

        {netState === "settled" ? (
          <p className="text-2xl font-bold">{t.allSettled}</p>
        ) : (
          <div className="space-y-4">
            {/* Big converted total */}
            {showConverted && (
              <div>
                <p dir="ltr" className="text-4xl font-extrabold tracking-tight">
                  {convertedTotal > 0 ? "+" : convertedTotal < 0 ? "\u2212" : ""}
                  {getCurrencySymbol(preferredCurrency)}
                  {Math.abs(convertedTotal).toFixed(2)}
                </p>
                <p className="text-xs font-medium text-white/50 mt-1">
                  {t.approximateTotal}
                </p>
              </div>
            )}

            {/* Per-currency breakdown — always in glass boxes */}
            <div className="flex flex-wrap gap-2">
              {totalByCurrency.map(({ currency, amount }) => (
                <div
                  key={currency}
                  className="flex flex-col rounded-xl px-4 py-2.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <span
                    dir="ltr"
                    className={cn(
                      "font-bold tracking-tight text-white",
                      showConverted ? "text-base" : "text-xl"
                    )}
                  >
                    {amount > 0 ? "+" : amount < 0 ? "\u2212" : ""}
                    {formatCurrency(Math.abs(amount), currency)}
                  </span>
                  {!showConverted && (
                    <span className="text-[10px] font-medium text-white/60">
                      {amount > 0 ? t.owesYou("") : amount < 0 ? t.youOwe("") : ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-Friend Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
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
    <Card
      className="p-4 transition-colors hover:bg-muted/30 cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{friend.friendName}</p>
            {!friend.hasPartner && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {t.pendingApproval}
              </span>
            )}
          </div>
          {hasBalance ? (
            <div className="mt-1">
              {/* Converted total for this friend */}
              {showConverted && (
                <p
                  dir="ltr"
                  className={cn(
                    "text-sm font-semibold",
                    friend.convertedTotal! > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  )}
                >
                  {friend.convertedTotal! > 0 ? "+" : "\u2212"}
                  {formatCurrency(Math.abs(friend.convertedTotal!), preferredCurrency)}
                </p>
              )}
              {/* Per-currency breakdown */}
              <div className={cn("flex flex-wrap gap-x-3 gap-y-0.5", showConverted && "opacity-60")}>
                {friend.balances.map(({ currency, amount }) => (
                  <span
                    key={currency}
                    dir="ltr"
                    className={cn(
                      "text-sm font-medium",
                      !showConverted && (amount > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"),
                      showConverted && "text-muted-foreground text-xs"
                    )}
                  >
                    {amount > 0 ? "+" : "\u2212"}
                    {formatCurrency(Math.abs(amount), currency)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">{t.allSettled}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
