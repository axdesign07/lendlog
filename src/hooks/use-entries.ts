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

/**
 * Flip entry perspective: if the current user didn't create this entry,
 * swap "lent" <-> "borrowed" so each user sees their own point of view.
 */
function flipPerspective(entry: LendLogEntry, currentUserId: string): LendLogEntry {
  if (entry.createdBy === currentUserId) return entry;
  return {
    ...entry,
    type: entry.type === "lent" ? "borrowed" : "lent",
  };
}

export function useEntries(userId: string | null, ledgerId: string | null) {
  const [entries, setEntries] = useState<LendLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getActiveEntries();
      // Apply perspective flip for current user
      setEntries(data.map((e) => flipPerspective(e, userId)));
    } catch {
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
      if (!userId || !ledgerId) return;

      let imageUrl: string | undefined;
      if (input.image) {
        imageUrl = await uploadImage(input.image);
      }

      const entry = await dbCreateEntry(
        {
          type: input.type,
          amount: input.amount,
          currency: input.currency,
          note: input.note || undefined,
          imageUrl,
          timestamp: input.timestamp,
        },
        userId,
        ledgerId
      );

      // Created by current user — no flip needed
      setEntries((prev) =>
        [entry, ...prev].sort((a, b) => b.timestamp - a.timestamp)
      );
      toast.success("Entry added");
    },
    [userId, ledgerId]
  );

  const updateEntry = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<LendLogEntry, "type" | "amount" | "currency" | "note" | "timestamp">
      > & { image?: File }
    ) => {
      if (!userId) return;

      const existing = entries.find((e) => e.id === id);
      if (!existing) return;

      let imageUrl = existing.imageUrl;
      if (updates.image) {
        imageUrl = await uploadImage(updates.image);
      }

      const { image: _, ...rest } = updates;

      // If editing another user's entry, un-flip the type before writing to DB
      const isOtherUsersEntry = existing.createdBy !== userId;
      const dbType =
        rest.type !== undefined && isOtherUsersEntry
          ? rest.type === "lent"
            ? "borrowed"
            : "lent"
          : rest.type;

      // Reconstruct the raw (un-flipped) existing entry for the DB diff
      const rawExisting: LendLogEntry = isOtherUsersEntry
        ? { ...existing, type: existing.type === "lent" ? "borrowed" : "lent" }
        : existing;

      const updated = await dbUpdateEntry(
        id,
        { ...rest, type: dbType, imageUrl },
        rawExisting,
        userId
      );

      // Flip the returned entry for display
      const flipped = flipPerspective(updated, userId);
      setEntries((prev) =>
        prev
          .map((e) => (e.id === id ? flipped : e))
          .sort((a, b) => b.timestamp - a.timestamp)
      );
      toast.success("Entry updated");
    },
    [entries, userId]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!userId) return;
      await softDeleteEntry(id, userId);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry deleted");
    },
    [userId]
  );

  const restoreEntry = useCallback(
    async (id: string) => {
      if (!userId) return;
      await dbRestoreEntry(id, userId);
      await loadEntries();
      toast.success("Entry restored");
    },
    [loadEntries, userId]
  );

  return { entries, loading, addEntry, updateEntry, removeEntry, restoreEntry, refresh: loadEntries };
}
