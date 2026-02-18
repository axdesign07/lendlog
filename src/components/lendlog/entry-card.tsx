"use client";

import { useState } from "react";
import { Pencil, Trash2, ImageIcon } from "lucide-react";
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
}

export function EntryCard({ entry, friendName, t, locale, onEdit, onDelete }: EntryCardProps) {
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

  return (
    <>
      <Card
        className={cn(
          "border-l-4 rtl:border-l-0 rtl:border-r-4 p-4 transition-colors hover:bg-muted/30",
          isLent
            ? "border-l-emerald-500 rtl:border-r-emerald-500"
            : "border-l-red-400 rtl:border-r-red-400"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p dir="ltr" className="text-xs text-muted-foreground mb-1">
              {formattedDate} {t.at} {formattedTime}
            </p>
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
          </div>
        </div>
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
