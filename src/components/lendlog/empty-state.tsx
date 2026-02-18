"use client";

import { Wallet } from "lucide-react";
import type { Translations } from "@/lib/i18n";

interface EmptyStateProps {
  t: Translations;
}

export function EmptyState({ t }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Wallet className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t.noEntries}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        {t.noEntriesDesc}
      </p>
    </div>
  );
}
