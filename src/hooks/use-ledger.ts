"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Ledger {
  id: string;
  user1Id: string;
  user2Id: string | null;
  inviteCode: string;
}

const SELECTED_LEDGER_KEY = "lendlog-selected-ledger";

export function useLedger(userId: string | null) {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLedgers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("ledgers")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const mapped: Ledger[] = data.map((row) => ({
          id: row.id,
          user1Id: row.user1_id,
          user2Id: row.user2_id,
          inviteCode: row.invite_code,
        }));
        setLedgers(mapped);

        // Restore selected ledger from localStorage, or pick the first one
        const stored = localStorage.getItem(SELECTED_LEDGER_KEY);
        const valid = mapped.find((l) => l.id === stored);
        if (valid) {
          setSelectedLedgerId(valid.id);
        } else {
          setSelectedLedgerId(mapped[0].id);
          localStorage.setItem(SELECTED_LEDGER_KEY, mapped[0].id);
        }
      } else {
        setLedgers([]);
        setSelectedLedgerId(null);
      }
    } catch {
      // No ledgers found — that's fine
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadLedgers();

    // Listen for ledger changes (partner joining, new ledgers)
    const channel = supabase
      .channel("ledgers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ledgers" },
        () => {
          loadLedgers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLedgers]);

  const selectLedger = useCallback((id: string) => {
    setSelectedLedgerId(id);
    localStorage.setItem(SELECTED_LEDGER_KEY, id);
  }, []);

  const createLedger = useCallback(async (): Promise<Ledger | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("ledgers")
      .insert({ user1_id: userId })
      .select()
      .single();

    if (error) throw error;

    const newLedger: Ledger = {
      id: data.id,
      user1Id: data.user1_id,
      user2Id: data.user2_id,
      inviteCode: data.invite_code,
    };
    setLedgers((prev) => [...prev, newLedger]);
    setSelectedLedgerId(newLedger.id);
    localStorage.setItem(SELECTED_LEDGER_KEY, newLedger.id);
    return newLedger;
  }, [userId]);

  const joinLedger = useCallback(
    async (inviteCode: string): Promise<Ledger | null> => {
      if (!userId) return null;

      const { data: found, error } = await supabase.rpc("join_ledger_by_invite", {
        code: inviteCode.trim(),
      });

      if (error) throw error;
      if (!found || found.length === 0) {
        throw new Error("Invalid or expired invite code");
      }

      const row = found[0];
      const joined: Ledger = {
        id: row.id,
        user1Id: row.user1_id,
        user2Id: row.user2_id,
        inviteCode: row.invite_code,
      };
      setLedgers((prev) => [...prev, joined]);
      setSelectedLedgerId(joined.id);
      localStorage.setItem(SELECTED_LEDGER_KEY, joined.id);
      return joined;
    },
    [userId]
  );

  // Selected ledger object
  const selectedLedger = ledgers.find((l) => l.id === selectedLedgerId) ?? null;

  // Who is the other user in the selected ledger?
  const partnerId = selectedLedger
    ? selectedLedger.user1Id === userId
      ? selectedLedger.user2Id
      : selectedLedger.user1Id
    : null;

  return {
    ledgers,
    selectedLedger,
    selectedLedgerId,
    selectLedger,
    loading,
    createLedger,
    joinLedger,
    partnerId,
    refresh: loadLedgers,
  };
}
