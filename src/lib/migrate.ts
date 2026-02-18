import { keys } from "idb-keyval";
import { getAllEntries, getImage } from "@/lib/db";
import { bulkInsertEntries } from "@/lib/supabase-db";
import { supabase } from "./supabase";
import type { LendLogEntry, Currency } from "@/types";

const MIGRATION_FLAG = "lendlog-migrated";
const ENTRY_PREFIX = "entry:";

export async function checkMigrationNeeded(): Promise<{
  needed: boolean;
  entryCount: number;
}> {
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return { needed: false, entryCount: 0 };
  }

  try {
    const allKeys = await keys();
    const entryKeys = allKeys.filter(
      (key) => typeof key === "string" && key.startsWith(ENTRY_PREFIX)
    );
    return { needed: entryKeys.length > 0, entryCount: entryKeys.length };
  } catch {
    return { needed: false, entryCount: 0 };
  }
}

async function uploadBase64Image(
  base64DataUrl: string,
  mimeType: string
): Promise<string> {
  // Convert base64 data URL to a Blob
  const base64Data = base64DataUrl.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const ext = mimeType.split("/")[1] || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("images").upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

export async function migrateToSupabase(
  onProgress: (current: number, total: number) => void,
  userId?: string,
  ledgerId?: string
): Promise<void> {
  const entries = await getAllEntries();
  const total = entries.length;

  if (total === 0) {
    localStorage.setItem(MIGRATION_FLAG, "true");
    return;
  }

  const migratedEntries: LendLogEntry[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let imageUrl: string | undefined;

    if (entry.imageId) {
      const imageId = entry.imageId;
      try {
        const image = await getImage(imageId);
        if (image) {
          imageUrl = await uploadBase64Image(image.data, image.mimeType);
        }
      } catch {
        // Skip image if upload fails, continue with entry
      }
    }

    const migratedEntry: LendLogEntry = {
      id: entry.id,
      type: entry.type,
      amount: entry.amount,
      currency: entry.currency as Currency,
      note: entry.note,
      imageUrl,
      timestamp: entry.timestamp,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      status: "approved",
    };

    migratedEntries.push(migratedEntry);
    onProgress(i + 1, total);
  }

  await bulkInsertEntries(migratedEntries, userId ?? "", ledgerId ?? "");
  localStorage.setItem(MIGRATION_FLAG, "true");
}

export function skipMigration(): void {
  localStorage.setItem(MIGRATION_FLAG, "true");
}
