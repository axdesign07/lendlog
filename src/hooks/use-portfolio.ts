"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllActiveEntries, getAllSettings } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import { calculateNetBalances } from "@/lib/balance";
import { getExchangeRates, convertBalances, type ExchangeRates } from "@/lib/exchange-rates";
import type { LendLogEntry, NetBalance, Currency } from "@/types";
import type { Ledger } from "./use-ledger";

export interface FriendBalance {
  ledgerId: string;
  friendName: string;
  friendPhoto?: string;
  balances: NetBalance[];
  hasPartner: boolean;
  convertedTotal?: number;
}

export function usePortfolio(
  userId: string | null,
  ledgers: Ledger[],
  preferredCurrency?: Currency
) {
  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>([]);
  const [totalByCurrency, setTotalByCurrency] = useState<NetBalance[]>([]);
  const [convertedTotal, setConvertedTotal] = useState<number | null>(null);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);

  // Load exchange rates on mount
  useEffect(() => {
    getExchangeRates().then(setRates);
  }, []);

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
      const [allEntries, allSettings] = await Promise.all([
        getAllActiveEntries(),
        getAllSettings(userId),
      ]);

      const nameMap = new Map<string, string>();
      const photoMap = new Map<string, string>();
      for (const s of allSettings) {
        nameMap.set(s.ledgerId, s.friendName);
        if (s.friendPhoto) photoMap.set(s.ledgerId, s.friendPhoto);
      }

      const byLedger = new Map<string, LendLogEntry[]>();
      for (const entry of allEntries) {
        const lid = entry.ledgerId;
        if (!lid) continue;
        const flipped = flipPerspective(entry);
        const arr = byLedger.get(lid) || [];
        arr.push(flipped);
        byLedger.set(lid, arr);
      }

      const friends: FriendBalance[] = ledgers.map((ledger) => {
        const entries = byLedger.get(ledger.id) || [];
        const balances = calculateNetBalances(entries);
        const friendData: FriendBalance = {
          ledgerId: ledger.id,
          friendName: nameMap.get(ledger.id) || "Friend",
          friendPhoto: photoMap.get(ledger.id),
          balances,
          hasPartner: !!ledger.user2Id,
        };

        // Convert per-friend total if we have rates + preferred currency
        if (preferredCurrency && rates && balances.length > 0) {
          friendData.convertedTotal = convertBalances(balances, preferredCurrency, rates);
        }

        return friendData;
      });

      setFriendBalances(friends);

      const allFlipped = allEntries.map(flipPerspective);
      const totals = calculateNetBalances(allFlipped);
      setTotalByCurrency(totals);

      // Convert grand total
      if (preferredCurrency && rates && totals.length > 0) {
        setConvertedTotal(convertBalances(totals, preferredCurrency, rates));
      } else {
        setConvertedTotal(null);
      }
    } catch {
      // Failed to load portfolio
    } finally {
      setLoading(false);
    }
  }, [userId, ledgers, flipPerspective, preferredCurrency, rates]);

  useEffect(() => {
    loadPortfolio();

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

  return { friendBalances, totalByCurrency, convertedTotal, loading, refresh: loadPortfolio };
}
