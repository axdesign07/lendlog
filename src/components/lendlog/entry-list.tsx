"use client";

import type { LendLogEntry } from "@/types";
import type { Translations, Locale } from "@/lib/i18n";
import { EntryCard } from "./entry-card";
import { EmptyState } from "./empty-state";

interface EntryListProps {
  entries: LendLogEntry[];
  friendName: string;
  t: Translations;
  locale: Locale;
  onEdit: (entry: LendLogEntry) => void;
  onDelete: (id: string) => void;
}

export function EntryList({ entries, friendName, t, locale, onEdit, onDelete }: EntryListProps) {
  if (entries.length === 0) {
    return <EmptyState t={t} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          friendName={friendName}
          t={t}
          locale={locale}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
