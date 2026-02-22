"use client";

import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Translations } from "@/lib/i18n";

interface EmptyStateProps {
  t: Translations;
  onAdd?: () => void;
}

export function EmptyState({ t, onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Wallet className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">{t.noEntries}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        {t.noEntriesDesc}
      </p>
      {onAdd && (
        <Button onClick={onAdd} size="sm" className="mt-5 gap-2 rounded-lg">
          <Plus className="h-4 w-4" />
          {t.addEntryButton}
        </Button>
      )}
    </div>
  );
}
