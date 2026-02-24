"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, useMotionValue, animate, AnimatePresence } from "motion/react";
import { ChevronRight, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { FriendAvatar } from "./friend-avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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

  const primaryBalance = useMemo(
    () =>
      totalByCurrency.length > 0
        ? [...totalByCurrency].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]
        : null,
    [totalByCurrency]
  );

  const handleConfirmDelete = () => {
    if (!deleteTarget || !onDeleteFriend) return;
    const { ledgerId } = deleteTarget;
    setDeleteTarget(null);
    onDeleteFriend(ledgerId);
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
              ) : primaryBalance && netState !== "mixed" ? (
                <motion.p
                  dir="ltr"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springAnim, delay: 0.1 }}
                  className={cn(
                    "font-extrabold tracking-tight leading-none",
                    totalByCurrency.length === 1 ? "text-4xl" : "text-3xl"
                  )}
                  style={{ color: stateColor.accent }}
                >
                  {primaryBalance.amount > 0 ? "+" : "\u2212"}
                  {formatCurrency(Math.abs(primaryBalance.amount), primaryBalance.currency)}
                </motion.p>
              ) : null}

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

        {/* Friends List */}
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
            <AnimatePresence initial={false}>
              {friendBalances.map((friend, index) => (
                <FriendRow
                  key={friend.ledgerId}
                  friend={friend}
                  preferredCurrency={preferredCurrency}
                  t={t}
                  onSelect={() => onSelectFriend(friend.ledgerId)}
                  onRequestDelete={onDeleteFriend ? () => setDeleteTarget({ ledgerId: friend.ledgerId, name: friend.friendName }) : undefined}
                  isLast={index === friendBalances.length - 1}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteFriend}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? t.deleteFriendConfirm.replace("{name}", deleteTarget.name) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              {t.deleteFriend}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── Swipeable Friend Row ──────────────────────────────── */

const SNAP_OPEN = -76; // width of the delete button area

function FriendRow({
  friend,
  preferredCurrency,
  t,
  onSelect,
  onRequestDelete,
  isLast,
  index,
}: {
  friend: FriendBalance;
  preferredCurrency?: Currency;
  t: Translations;
  onSelect: () => void;
  onRequestDelete?: () => void;
  isLast: boolean;
  index: number;
}) {
  const hasBalance = friend.balances.length > 0;
  const showConverted = friend.convertedTotal !== undefined && preferredCurrency;

  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState(false);
  const wasDragging = useRef(false);
  const dragStartX = useRef(0);

  // Snap to open or closed
  const snapTo = useCallback((target: number) => {
    animate(x, target, { type: "spring", stiffness: 400, damping: 30 });
    setIsOpen(target !== 0);
  }, [x]);

  const handleDragStart = () => {
    dragStartX.current = x.get();
    wasDragging.current = false;
  };

  const handleDrag = () => {
    // If we moved more than 4px, consider it a drag
    if (Math.abs(x.get() - dragStartX.current) > 4) {
      wasDragging.current = true;
    }
  };

  const handleDragEnd = () => {
    const current = x.get();
    // If dragged past halfway of the snap zone → open, else close
    if (current < SNAP_OPEN / 2) {
      snapTo(SNAP_OPEN);
    } else {
      snapTo(0);
    }
  };

  const handleRowClick = () => {
    if (wasDragging.current) return;
    if (isOpen) {
      snapTo(0);
    } else {
      onSelect();
    }
  };

  const handleDeleteClick = () => {
    snapTo(0);
    // Small delay so the row slides back first
    setTimeout(() => {
      onRequestDelete?.();
    }, 150);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.04 }}
    >
      <div className="relative overflow-hidden">
        {/* Delete button behind — fixed on the right */}
        {onRequestDelete && (
          <div
            className="absolute inset-y-0 right-0 z-0 flex items-center justify-center w-[76px] bg-destructive"
          >
            <button
              type="button"
              onClick={handleDeleteClick}
              className="flex items-center justify-center w-full h-full active:bg-destructive/80 transition-colors"
            >
              <Trash2 className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        {/* Draggable row */}
        <motion.div
          style={{ x }}
          drag={onRequestDelete ? "x" : false}
          dragDirectionLock
          dragConstraints={{ left: SNAP_OPEN, right: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="relative z-[1] bg-card touch-pan-y"
        >
          <div
            className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors active:bg-accent/50"
            onClick={handleRowClick}
          >
            <FriendAvatar name={friend.friendName} photoUrl={friend.friendPhoto} size="md" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{friend.friendName}</p>
                {!friend.hasPartner && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {t.pendingApproval}
                  </span>
                )}
              </div>
              {friend.partnerEmail && (
                <p className="text-[11px] text-muted-foreground truncate">{friend.partnerEmail}</p>
              )}
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

            <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
          </div>
        </motion.div>
      </div>

      {!isLast && (
        <div className="ms-[4.25rem] border-b border-separator" />
      )}
    </motion.div>
  );
}
