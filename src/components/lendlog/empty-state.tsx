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
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Wallet className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t.noEntries}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        {t.noEntriesDesc}
      </p>
      {onAdd && (
        <Button onClick={onAdd} className="mt-4 gap-2">
          <Plus className="h-4 w-4" />
          {t.addEntryButton}
        </Button>
      )}
    </div>
  );
}
