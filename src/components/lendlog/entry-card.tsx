"use client";

import { useState } from "react";
import { Pencil, Trash2, ImageIcon, CheckCircle2, XCircle, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { useImage } from "@/hooks/use-image";
import type { LendLogEntry } from "@/types";
import type { Translations, Locale } from "@/lib/i18n";
import { getDateLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ImageViewerDialog } from "./image-viewer-dialog";

interface EntryCardProps {
  entry: LendLogEntry;
  friendName: string;
  t: Translations;
  locale: Locale;
  onEdit: (entry: LendLogEntry) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onResend?: (id: string) => void;
  currentUserId?: string | null;
}

export function EntryCard({ entry, friendName, t, locale, onEdit, onDelete, onApprove, onReject, onResend, currentUserId }: EntryCardProps) {
  const [imageOpen, setImageOpen] = useState(false);
  const imageSrc = useImage(entry.imageUrl);
  const isLent = entry.type === "lent";

  const dateLocale = getDateLocale(locale);
  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString(dateLocale, {
    hour: "numeric",
    minute: "2-digit",
  });

  const isMyEntry = entry.createdBy === currentUserId;
  const isPending = entry.status === "pending";
  const isRejected = entry.status === "rejected";
  const isApproved = entry.status === "approved";
  const canApprove = !isMyEntry && isPending;
  const canResend = isMyEntry && isRejected;

  return (
    <>
      <div
        className={cn(
          "rounded-xl border bg-card p-4 transition-all",
          "border-l-[3px] rtl:border-l rtl:border-r-[3px]",
          isLent
            ? "border-l-emerald-500 dark:border-l-emerald-400 rtl:border-r-emerald-500 dark:rtl:border-r-emerald-400"
            : "border-l-rose-500 dark:border-l-rose-400 rtl:border-r-rose-500 dark:rtl:border-r-rose-400",
          !isApproved && "opacity-75"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p dir="ltr" className="text-[11px] text-muted-foreground tabular-nums">
                {formattedDate} {t.at} {formattedTime}
              </p>
              {isPending && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="h-2.5 w-2.5" />
                  {t.pendingApproval}
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <XCircle className="h-2.5 w-2.5" />
                  {t.rejected}
                </span>
              )}
            </div>
            <p className="font-semibold text-[15px] leading-snug">
              {isLent ? t.youLentAmount : t.youBorrowedAmount}{" "}
              <span
                dir="ltr"
                className={cn(
                  "inline-block font-bold tabular-nums",
                  isLent ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {formatCurrency(entry.amount, entry.currency)}
              </span>
              {isLent ? t.to(friendName) : t.from(friendName)}
            </p>
            {entry.note && (
              <p className="text-[13px] text-muted-foreground mt-1 truncate">
                {entry.note}
              </p>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {imageSrc && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setImageOpen(true)}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            )}
            {isApproved && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(entry)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Approval actions */}
        {canApprove && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              className="flex-1 h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onApprove?.(entry.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t.approve}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950"
              onClick={() => onReject?.(entry.id)}
            >
              <XCircle className="h-3.5 w-3.5" />
              {t.reject}
            </Button>
          </div>
        )}

        {/* Resend */}
        {canResend && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button size="sm" variant="outline" className="flex-1 h-8 gap-1.5" onClick={() => onEdit(entry)}>
              <Pencil className="h-3.5 w-3.5" />
              {t.editAndResend}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => onResend?.(entry.id)}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t.resend}
            </Button>
          </div>
        )}

        {/* My pending */}
        {isMyEntry && isPending && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => onEdit(entry)}>
              <Pencil className="h-3.5 w-3.5" />
              {t.editEntry}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-destructive hover:text-destructive"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {imageSrc && (
        <ImageViewerDialog
          src={imageSrc}
          open={imageOpen}
          onOpenChange={setImageOpen}
          t={t}
        />
      )}
    </>
  );
}
