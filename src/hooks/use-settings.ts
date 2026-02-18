"use client";

import { useCallback, useEffect, useState } from "react";
import { getSettings, saveSettings } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import type { AppSettings } from "@/types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({ friendName: "Friend" });
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    const channel = supabase
      .channel("settings-realtime")
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
  }, [loadSettings]);

  const updateFriendName = useCallback(async (name: string) => {
    const updated = { friendName: name.trim() || "Friend" };
    await saveSettings(updated);
    setSettings(updated);
  }, []);

  return { settings, loading, updateFriendName };
}
