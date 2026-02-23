"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { ChevronRight, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { FriendAvatar } from "./friend-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onDeleteFriend?: (ledgerId: string) => void;
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

const springAnim = { type: "spring" as const, stiffness: 300, damping: 30 };

export function PortfolioView({
  friendBalances,
  totalByCurrency,
  convertedTotal,
  preferredCurrency,
  t,
  onSelectFriend,
  onDeleteFriend,
}: PortfolioViewProps) {
  const netState = getNetState(totalByCurrency, convertedTotal);
  const isDark = useIsDark();
  const showConverted = convertedTotal !== null && preferredCurrency;

  const [deleteTarget, setDeleteTarget] = useState<{ ledgerId: string; name: string } | null>(null);

  const stateColor = {
    positive: { accent: isDark ? "#34d399" : "#059669", bg: isDark ? "rgba(52,211,153,0.08)" : "rgba(5,150,105,0.04)" },
    negative: { accent: isDark ? "#fb7185" : "#e11d48", bg: isDark ? "rgba(251,113,133,0.08)" : "rgba(225,29,72,0.04)" },
    mixed: { accent: isDark ? "#818cf8" : "#4f46e5", bg: isDark ? "rgba(129,140,248,0.08)" : "rgba(79,70,229,0.04)" },
    settled: { accent: isDark ? "#94a3b8" : "#64748b", bg: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.04)" },
  }[netState];

  const StateIcon = netState === "positive" ? TrendingUp : netState === "negative" ? TrendingDown : Minus;

  const handleConfirmDelete = () => {
    if (deleteTarget && onDeleteFriend) {
      onDeleteFriend(deleteTarget.ledgerId);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="px-4 pt-2 pb-4 space-y-6">
        {/* Net Worth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springAnim}
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
                  <motion.p
                    dir="ltr"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springAnim, delay: 0.1 }}
                    className="text-4xl font-extrabold tracking-tight leading-none"
                    style={{ color: stateColor.accent }}
                  >
                    {convertedTotal > 0 ? "+" : "\u2212"}
                    {getCurrencySymbol(preferredCurrency)}
                    {Math.abs(convertedTotal).toFixed(2)}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-2">{t.approximateTotal}</p>
                </div>
              ) : totalByCurrency.length === 1 ? (
                <motion.p
                  dir="ltr"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springAnim, delay: 0.1 }}
                  className="text-4xl font-extrabold tracking-tight leading-none"
                  style={{ color: stateColor.accent }}
                >
                  {totalByCurrency[0].amount > 0 ? "+" : "\u2212"}
                  {formatCurrency(Math.abs(totalByCurrency[0].amount), totalByCurrency[0].currency)}
                </motion.p>
              ) : null}

              {/* Currency breakdown pills */}
              <div className="flex flex-wrap gap-2">
                {totalByCurrency.map(({ currency, amount }, i) => (
                  <motion.div
                    key={currency}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springAnim, delay: 0.15 + i * 0.05 }}
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
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Friends List — iOS Grouped Inset */}
        <div>
          <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3 px-1">
            {t.allFriends} ({friendBalances.length})
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springAnim, delay: 0.1 }}
            className="rounded-2xl border bg-card overflow-hidden"
          >
            {friendBalances.map((friend, index) => (
              <FriendRow
                key={friend.ledgerId}
                friend={friend}
                preferredCurrency={preferredCurrency}
                t={t}
                onSelect={() => onSelectFriend(friend.ledgerId)}
                onDelete={onDeleteFriend ? () => setDeleteTarget({ ledgerId: friend.ledgerId, name: friend.friendName }) : undefined}
                isLast={index === friendBalances.length - 1}
                index={index}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteFriend}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? t.deleteFriendConfirm.replace("{name}", deleteTarget.name) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {t.deleteFriend}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const DELETE_THRESHOLD = -80;

function FriendRow({
  friend,
  preferredCurrency,
  t,
  onSelect,
  onDelete,
  isLast,
  index,
}: {
  friend: FriendBalance;
  preferredCurrency?: Currency;
  t: Translations;
  onSelect: () => void;
  onDelete?: () => void;
  isLast: boolean;
  index: number;
}) {
  const hasBalance = friend.balances.length > 0;
  const showConverted = friend.convertedTotal !== undefined && preferredCurrency;
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, DELETE_THRESHOLD], [0, 1]);
  const deleteScale = useTransform(x, [0, DELETE_THRESHOLD], [0.5, 1]);
  const isDragging = useRef(false);

  const handleDragEnd = () => {
    const current = x.get();
    if (current < DELETE_THRESHOLD && onDelete) {
      // Snap away then fire delete
      animate(x, -300, { type: "spring", stiffness: 500, damping: 30 });
      setTimeout(() => onDelete(), 200);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const handleClick = () => {
    // Don't navigate if we were dragging
    if (!isDragging.current) {
      onSelect();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 + index * 0.04 }}
    >
      <div className="relative overflow-hidden">
        {/* Delete action behind the row */}
        {onDelete && (
          <motion.div
            style={{ opacity: deleteOpacity, scale: deleteScale }}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-destructive"
          >
            <Trash2 className="h-5 w-5 text-white" />
          </motion.div>
        )}

        {/* Swipeable row */}
        <motion.div
          style={{ x }}
          drag={onDelete ? "x" : false}
          dragConstraints={{ left: -120, right: 0 }}
          dragElastic={{ left: 0.3, right: 0 }}
          onDragStart={() => { isDragging.current = true; }}
          onDragEnd={handleDragEnd}
          onDragTransitionEnd={() => { setTimeout(() => { isDragging.current = false; }, 50); }}
          className="relative bg-card"
        >
          <div
            className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors active:bg-accent/50"
            onClick={handleClick}
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

            {/* Chevron disclosure */}
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
          </div>
        </motion.div>
      </div>

      {/* iOS-style separator — inset from leading edge */}
      {!isLast && (
        <div className="ms-[4.25rem] border-b border-separator" />
      )}
    </motion.div>
  );
}
