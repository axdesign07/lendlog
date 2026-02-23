"use client";

import { motion } from "motion/react";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Translations } from "@/lib/i18n";

interface EmptyStateProps {
  t: Translations;
  onAdd?: () => void;
}

export function EmptyState({ t, onAdd }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5"
      >
        <Wallet className="h-7 w-7 text-muted-foreground" />
      </motion.div>
      <h3 className="text-base font-bold mb-1">{t.noEntries}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
        {t.noEntriesDesc}
      </p>
      {onAdd && (
        <Button onClick={onAdd} size="sm" className="mt-6 gap-2 rounded-full px-5 h-10">
          <Plus className="h-4 w-4" />
          {t.addEntryButton}
        </Button>
      )}
    </motion.div>
  );
}
