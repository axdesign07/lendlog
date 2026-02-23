"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuditLog } from "@/hooks/use-audit-log";
import { formatCurrency } from "@/lib/currency";
import type { Translations, Locale } from "@/lib/i18n";
import { getDateLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, RotateCcw, Loader2 } from "lucide-react";
import type { AuditAction } from "@/types";

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: Translations;
  locale: Locale;
  onRestore: (id: string) => void;
}

const actionConfig: Record<
  AuditAction,
  { icon: typeof Plus; label: string; color: string }
> = {
  created: { icon: Plus, label: "Created", color: "text-green-500" },
  updated: { icon: Pencil, label: "Updated", color: "text-blue-500" },
  deleted: { icon: Trash2, label: "Deleted", color: "text-red-500" },
  restored: { icon: RotateCcw, label: "Restored", color: "text-emerald-500" },
};

function formatTimestamp(timestamp: number, locale: Locale): string {
  const dateLocale = getDateLocale(locale);
  const date = new Date(timestamp);
  return date.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistorySheet({
  open,
  onOpenChange,
  t,
  locale,
  onRestore,
}: HistorySheetProps) {
  const { logs, loading, refresh } = useAuditLog();

  const handleOpenChange = (value: boolean) => {
    if (value) refresh();
    onOpenChange(value);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] px-0 gap-0">
        <SheetHeader className="px-6">
          <SheetTitle className="text-lg font-bold">History</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                {t.loading}
              </span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No history yet</p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden mt-2">
              {logs.map((log, index) => {
                const config = actionConfig[log.action];
                const Icon = config.icon;
                const entry = log.entry;
                const isLast = index === logs.length - 1;

                return (
                  <div key={log.id}>
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <div
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted",
                          config.color
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {config.label}
                          </span>
                          {entry && (
                            <span className="text-sm text-muted-foreground tabular-nums">
                              {formatCurrency(entry.amount, entry.currency)}
                            </span>
                          )}
                        </div>
                        {entry?.note && (
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.note}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                          {formatTimestamp(log.createdAt, locale)}
                        </p>
                      </div>
                      {log.action === "deleted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 rounded-full h-8 px-3"
                          onClick={() => onRestore(log.entryId)}
                        >
                          <RotateCcw className="size-3 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                    {!isLast && (
                      <div className="ms-[3.75rem] border-b border-separator" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
