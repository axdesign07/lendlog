"use client";

import { useCallback, useEffect, useState } from "react";
import { getSettings, saveSettings } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import type { AppSettings } from "@/types";

export function useSettings(userId: string | null, ledgerId?: string | null) {
  const [settings, setSettings] = useState<AppSettings>({ friendName: "Friend" });
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getSettings(userId, ledgerId ?? undefined);
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, [userId, ledgerId]);

  useEffect(() => {
    loadSettings();

    const channel = supabase
      .channel(`settings-realtime-${ledgerId ?? "global"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSettings, ledgerId]);

  const updateFriendName = useCallback(
    async (name: string) => {
      if (!userId) return;
      const updated = { friendName: name.trim() || "Friend" };
      await saveSettings(updated, userId, ledgerId ?? undefined);
      setSettings(updated);
    },
    [userId, ledgerId]
  );

  return { settings, loading, updateFriendName };
}
