"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllActiveEntries, getAllSettings } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import { calculateNetBalances } from "@/lib/balance";
import type { LendLogEntry, NetBalance } from "@/types";
import type { Ledger } from "./use-ledger";

export interface FriendBalance {
  ledgerId: string;
  friendName: string;
  balances: NetBalance[];
  hasPartner: boolean;
}

export function usePortfolio(userId: string | null, ledgers: Ledger[]) {
  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>([]);
  const [totalByCurrency, setTotalByCurrency] = useState<NetBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const flipPerspective = useCallback(
    (entry: LendLogEntry): LendLogEntry => {
      if (!userId || entry.createdBy === userId) return entry;
      return {
        ...entry,
        type: entry.type === "lent" ? "borrowed" : "lent",
      };
    },
    [userId]
  );

  const loadPortfolio = useCallback(async () => {
    if (!userId || ledgers.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Load all entries and settings in parallel
      const [allEntries, allSettings] = await Promise.all([
        getAllActiveEntries(),
        getAllSettings(userId),
      ]);

      // Build a map of ledger_id → friend_name
      const nameMap = new Map<string, string>();
      for (const s of allSettings) {
        nameMap.set(s.ledgerId, s.friendName);
      }

      // Group entries by ledger
      const byLedger = new Map<string, LendLogEntry[]>();
      for (const entry of allEntries) {
        const lid = entry.ledgerId;
        if (!lid) continue;
        const flipped = flipPerspective(entry);
        const arr = byLedger.get(lid) || [];
        arr.push(flipped);
        byLedger.set(lid, arr);
      }

      // Calculate per-friend balances
      const friends: FriendBalance[] = ledgers.map((ledger) => {
        const entries = byLedger.get(ledger.id) || [];
        const balances = calculateNetBalances(entries);
        return {
          ledgerId: ledger.id,
          friendName: nameMap.get(ledger.id) || "Friend",
          balances,
          hasPartner: !!ledger.user2Id,
        };
      });

      setFriendBalances(friends);

      // Calculate total across all friends
      const allFlipped = allEntries.map(flipPerspective);
      setTotalByCurrency(calculateNetBalances(allFlipped));
    } catch {
      // Failed to load portfolio
    } finally {
      setLoading(false);
    }
  }, [userId, ledgers, flipPerspective]);

  useEffect(() => {
    loadPortfolio();

    // Listen for entry changes across all ledgers
    const channel = supabase
      .channel("portfolio-entries-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entries" },
        () => {
          loadPortfolio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPortfolio]);

  return { friendBalances, totalByCurrency, loading, refresh: loadPortfolio };
}
