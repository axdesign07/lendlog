"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Ledger {
  id: string;
  user1Id: string;
  user2Id: string | null;
  inviteCode: string;
}

export function useLedger(userId: string | null) {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLedger = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("ledgers")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .limit(1)
        .single();

      if (data) {
        setLedger({
          id: data.id,
          user1Id: data.user1_id,
          user2Id: data.user2_id,
          inviteCode: data.invite_code,
        });
      }
    } catch {
      // No ledger found — that's fine
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadLedger();

    // Listen for ledger changes (partner joining)
    const channel = supabase
      .channel("ledgers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ledgers" },
        () => {
          loadLedger();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLedger]);

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
    setLedger(newLedger);
    return newLedger;
  }, [userId]);

  const joinLedger = useCallback(
    async (inviteCode: string): Promise<Ledger | null> => {
      if (!userId) return null;

      // Look up ledger by invite code
      const { data: found } = await supabase.rpc("get_ledger_by_invite", {
        code: inviteCode.trim(),
      });

      if (!found || found.length === 0) {
        throw new Error("Invalid or expired invite code");
      }

      const ledgerId = found[0].id;

      const { data, error } = await supabase
        .from("ledgers")
        .update({ user2_id: userId })
        .eq("id", ledgerId)
        .select()
        .single();

      if (error) throw error;

      const joined: Ledger = {
        id: data.id,
        user1Id: data.user1_id,
        user2Id: data.user2_id,
        inviteCode: data.invite_code,
      };
      setLedger(joined);
      return joined;
    },
    [userId]
  );

  // Who is the other user?
  const partnerId = ledger
    ? ledger.user1Id === userId
      ? ledger.user2Id
      : ledger.user1Id
    : null;

  return {
    ledger,
    loading,
    createLedger,
    joinLedger,
    partnerId,
    refresh: loadLedger,
  };
}
