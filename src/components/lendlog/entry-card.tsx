"use client";

import { useState } from "react";
import { Pencil, Trash2, ImageIcon, CheckCircle2, XCircle, RotateCcw, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
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

  // Determine relationship to current user
  const isMyEntry = entry.createdBy === currentUserId;
  const isPending = entry.status === "pending";
  const isRejected = entry.status === "rejected";
  const isApproved = entry.status === "approved";

  // Other user's pending entry → I can approve/reject
  const canApprove = !isMyEntry && isPending;
  // My rejected entry → I can resend
  const canResend = isMyEntry && isRejected;

  return (
    <>
      <Card
        className={cn(
          "border-l-4 rtl:border-l-0 rtl:border-r-4 p-4 transition-colors hover:bg-muted/30",
          isLent
            ? "border-l-emerald-500 rtl:border-r-emerald-500"
            : "border-l-red-400 rtl:border-r-red-400",
          // Dim pending/rejected entries slightly
          !isApproved && "opacity-80"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p dir="ltr" className="text-xs text-muted-foreground">
                {formattedDate} {t.at} {formattedTime}
              </p>
              {/* Status badge */}
              {isPending && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock className="h-2.5 w-2.5" />
                  {t.pendingApproval}
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <XCircle className="h-2.5 w-2.5" />
                  {t.rejected}
                </span>
              )}
            </div>
            <p className="font-semibold text-[15px] leading-tight">
              {isLent ? t.youLentAmount : t.youBorrowedAmount}{" "}
              <span dir="ltr" className={cn("inline-block", isLent ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                {formatCurrency(entry.amount, entry.currency)}
              </span>
              {isLent ? t.to(friendName) : t.from(friendName)}
            </p>
            {entry.note && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {entry.note}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {imageSrc && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setImageOpen(true)}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            )}
            {isApproved && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(entry)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Approval action buttons */}
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
              className="flex-1 h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
              onClick={() => onReject?.(entry.id)}
            >
              <XCircle className="h-3.5 w-3.5" />
              {t.reject}
            </Button>
          </div>
        )}

        {/* Resend button for rejected entries */}
        {canResend && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 gap-1.5"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t.editAndResend}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => onResend?.(entry.id)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.resend}
            </Button>
          </div>
        )}

        {/* My pending entry — just show info, no actions except edit/delete */}
        {isMyEntry && isPending && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5"
              onClick={() => onEdit(entry)}
            >
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
      </Card>

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
