"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getActiveEntries,
  createEntry as dbCreateEntry,
  updateEntry as dbUpdateEntry,
  softDeleteEntry,
  restoreEntry as dbRestoreEntry,
  uploadImage,
} from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import type { LendLogEntry, Currency, EntryType } from "@/types";
import { toast } from "sonner";

export function useEntries() {
  const [entries, setEntries] = useState<LendLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      const data = await getActiveEntries();
      setEntries(data);
    } catch {
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();

    const channel = supabase
      .channel("entries-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entries" },
        () => {
          loadEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEntries]);

  const addEntry = useCallback(
    async (input: {
      type: EntryType;
      amount: number;
      currency: Currency;
      note?: string;
      image?: File;
      timestamp?: number;
    }) => {
      let imageUrl: string | undefined;

      if (input.image) {
        imageUrl = await uploadImage(input.image);
      }

      const entry = await dbCreateEntry({
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        note: input.note || undefined,
        imageUrl,
        timestamp: input.timestamp,
      });

      setEntries((prev) =>
        [entry, ...prev].sort((a, b) => b.timestamp - a.timestamp)
      );
      toast.success("Entry added");
    },
    []
  );

  const updateEntry = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<LendLogEntry, "type" | "amount" | "currency" | "note" | "timestamp">
      > & { image?: File }
    ) => {
      const existing = entries.find((e) => e.id === id);
      if (!existing) return;

      let imageUrl = existing.imageUrl;
      if (updates.image) {
        imageUrl = await uploadImage(updates.image);
      }

      const { image: _, ...rest } = updates;
      const updated = await dbUpdateEntry(
        id,
        { ...rest, imageUrl },
        existing
      );

      setEntries((prev) =>
        prev
          .map((e) => (e.id === id ? updated : e))
          .sort((a, b) => b.timestamp - a.timestamp)
      );
      toast.success("Entry updated");
    },
    [entries]
  );

  const removeEntry = useCallback(async (id: string) => {
    await softDeleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted");
  }, []);

  const restoreEntry = useCallback(async (id: string) => {
    await dbRestoreEntry(id);
    await loadEntries();
    toast.success("Entry restored");
  }, [loadEntries]);

  return { entries, loading, addEntry, updateEntry, removeEntry, restoreEntry, refresh: loadEntries };
}
