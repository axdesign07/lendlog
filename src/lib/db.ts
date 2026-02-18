// Legacy IndexedDB storage layer — kept only for migration to Supabase.
// Do not use for new code. Use supabase-db.ts instead.

import { get, keys } from "idb-keyval";
import type { AppSettings, ImageBlob } from "@/types";

const ENTRY_PREFIX = "entry:";
const IMAGE_PREFIX = "image:";

// Old entry format (before Supabase migration)
export interface LegacyEntry {
  id: string;
  type: "lent" | "borrowed";
  amount: number;
  currency: string;
  note?: string;
  imageId?: string;
  timestamp: number;
  createdAt: number;
  updatedAt?: number;
}

export async function getAllEntries(): Promise<LegacyEntry[]> {
  const allKeys = await keys();
  const entryKeys = allKeys.filter(
    (key) => typeof key === "string" && key.startsWith(ENTRY_PREFIX)
  );

  const entries = await Promise.all(
    entryKeys.map((key) => get<LegacyEntry>(key as string))
  );

  return entries
    .filter((entry): entry is LegacyEntry => entry !== undefined)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function getImage(id: string): Promise<ImageBlob | undefined> {
  return await get<ImageBlob>(`${IMAGE_PREFIX}${id}`);
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await get<AppSettings>("settings");
  return settings || { friendName: "Friend" };
}
