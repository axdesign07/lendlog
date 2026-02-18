"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuditLog } from "@/lib/supabase-db";
import type { AuditLogEntry } from "@/types";
import { toast } from "sonner";

export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAuditLog();
      setLogs(data);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return { logs, loading, refresh: loadLogs };
}
