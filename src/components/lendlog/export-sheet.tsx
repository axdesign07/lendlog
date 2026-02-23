"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { filterByDateRange, exportToCSV, exportToPDF } from "@/lib/export";
import type { LendLogEntry } from "@/types";
import type { Translations } from "@/lib/i18n";

interface ExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: LendLogEntry[];
  friendName: string;
  t: Translations;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function ExportSheet({
  open,
  onOpenChange,
  entries,
  friendName,
  t,
}: ExportSheetProps) {
  const defaultFrom = useMemo(() => {
    if (entries.length === 0) return new Date();
    const oldest = entries.reduce((min, e) =>
      e.timestamp < min.timestamp ? e : min
    );
    return new Date(oldest.timestamp);
  }, [entries]);

  const [from, setFrom] = useState(() => toDateInputValue(defaultFrom));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));

  const filteredEntries = useMemo(() => {
    if (!from || !to) return entries;
    return filterByDateRange(entries, {
      from: new Date(from),
      to: new Date(to),
    });
  }, [entries, from, to]);

  const handleCSV = () => {
    exportToCSV(filteredEntries, friendName);
  };

  const handlePDF = () => {
    exportToPDF(filteredEntries, friendName);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-6 pb-8 pt-2 gap-0">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg font-bold">Export</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"} in range
          </p>
        </div>

        <SheetFooter className="flex-row gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1 h-12 gap-2 rounded-2xl text-[15px]"
            onClick={handleCSV}
            disabled={filteredEntries.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
          <Button
            className="flex-1 h-12 gap-2 rounded-2xl text-[15px] font-semibold"
            onClick={handlePDF}
            disabled={filteredEntries.length === 0}
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
