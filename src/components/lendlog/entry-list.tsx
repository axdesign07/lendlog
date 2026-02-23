"use client";

import { motion } from "motion/react";
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
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onResend?: (id: string) => void;
  currentUserId?: string | null;
  onAdd?: () => void;
}

export function EntryList({ entries, friendName, t, locale, onEdit, onDelete, onApprove, onReject, onResend, currentUserId, onAdd }: EntryListProps) {
  if (entries.length === 0) {
    return <EmptyState t={t} onAdd={onAdd} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="rounded-2xl border bg-card overflow-hidden"
    >
      {entries.map((entry, index) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          friendName={friendName}
          t={t}
          locale={locale}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
          onReject={onReject}
          onResend={onResend}
          currentUserId={currentUserId}
          isLast={index === entries.length - 1}
        />
      ))}
    </motion.div>
  );
}
