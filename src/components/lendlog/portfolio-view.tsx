"use client";

import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import type { FriendBalance } from "@/hooks/use-portfolio";
import type { NetBalance } from "@/types";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface PortfolioViewProps {
  friendBalances: FriendBalance[];
  totalByCurrency: NetBalance[];
  t: Translations;
  onSelectFriend: (ledgerId: string) => void;
}

export function PortfolioView({
  friendBalances,
  totalByCurrency,
  t,
  onSelectFriend,
}: PortfolioViewProps) {
  const hasBalances = totalByCurrency.length > 0;

  return (
    <div className="px-4 pb-24 space-y-6">
      {/* Total Net Worth */}
      <div
        className="rounded-2xl p-5 text-white"
        style={{
          backgroundImage: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
        }}
      >
        <p className="text-sm font-medium opacity-80">{t.totalNetWorth}</p>
        {hasBalances ? (
          <div className="mt-2 space-y-1">
            {totalByCurrency.map(({ currency, amount }) => (
              <div key={currency} className="flex items-baseline gap-2">
                <span dir="ltr" className="text-2xl font-bold tracking-tight">
                  {amount > 0 ? "+" : ""}
                  {formatCurrency(Math.abs(amount), currency)}
                </span>
                <span className="text-xs opacity-70">
                  {amount > 0 ? t.owesYou("") : amount < 0 ? t.youOwe("") : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-lg font-semibold opacity-90">{t.allSettled}</p>
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
  t,
  onSelect,
}: {
  friend: FriendBalance;
  t: Translations;
  onSelect: () => void;
}) {
  const hasBalance = friend.balances.length > 0;

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
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {friend.balances.map(({ currency, amount }) => (
                <span
                  key={currency}
                  dir="ltr"
                  className={cn(
                    "text-sm font-medium",
                    amount > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  )}
                >
                  {amount > 0 ? "+" : ""}
                  {formatCurrency(Math.abs(amount), currency)}
                </span>
              ))}
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
