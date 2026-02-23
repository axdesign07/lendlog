import { supabase } from "./supabase";
import type { LendLogEntry, AppSettings, AuditLogEntry, AuditAction, Currency, EntryType, EntryStatus } from "@/types";

// --- Snake/Camel case helpers ---

interface EntryRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  note: string | null;
  image_url: string | null;
  timestamp: number;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
  created_by: string | null;
  ledger_id: string | null;
  status: string;
}

interface AuditRow {
  id: string;
  entry_id: string;
  action: string;
  changes: unknown;
  created_at: number;
  user_id: string | null;
}

function rowToEntry(row: EntryRow): LendLogEntry {
  return {
    id: row.id,
    type: row.type as EntryType,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    note: row.note ?? undefined,
    imageUrl: row.image_url ?? undefined,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    ledgerId: row.ledger_id ?? undefined,
    status: (row.status as EntryStatus) || "pending",
  };
}

function entryToRow(entry: LendLogEntry): EntryRow {
  return {
    id: entry.id,
    type: entry.type,
    amount: entry.amount,
    currency: entry.currency,
    note: entry.note ?? null,
    image_url: entry.imageUrl ?? null,
    timestamp: entry.timestamp,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt ?? null,
    deleted_at: entry.deletedAt ?? null,
    created_by: entry.createdBy ?? null,
    ledger_id: entry.ledgerId ?? null,
    status: entry.status || "pending",
  };
}

function rowToAudit(row: AuditRow & { entries?: EntryRow }): AuditLogEntry {
  return {
    id: row.id,
    entryId: row.entry_id,
    action: row.action as AuditAction,
    changes: row.changes as AuditLogEntry["changes"],
    createdAt: row.created_at,
    userId: row.user_id ?? undefined,
    entry: row.entries ? rowToEntry(row.entries as unknown as EntryRow) : undefined,
  };
}

// --- Entry operations ---

export async function getActiveEntries(ledgerId?: string): Promise<LendLogEntry[]> {
  let query = supabase
    .from("entries")
    .select("*")
    .is("deleted_at", null)
    .order("timestamp", { ascending: false });

  if (ledgerId) {
    query = query.eq("ledger_id", ledgerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

export async function getDeletedEntries(ledgerId?: string): Promise<LendLogEntry[]> {
  let query = supabase
    .from("entries")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (ledgerId) {
    query = query.eq("ledger_id", ledgerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

export async function getAllActiveEntries(): Promise<LendLogEntry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .is("deleted_at", null)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

export async function getEntryById(id: string): Promise<LendLogEntry | null> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return rowToEntry(data as EntryRow);
}

export async function createEntry(
  input: {
    type: EntryType;
    amount: number;
    currency: Currency;
    note?: string;
    imageUrl?: string;
    timestamp?: number;
  },
  userId: string,
  ledgerId: string
): Promise<LendLogEntry> {
  const entry: LendLogEntry = {
    id: crypto.randomUUID(),
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    note: input.note,
    imageUrl: input.imageUrl,
    timestamp: input.timestamp ?? Date.now(),
    createdAt: Date.now(),
    createdBy: userId,
    ledgerId,
    status: "pending",
  };

  const { error } = await supabase.from("entries").insert(entryToRow(entry));
  if (error) throw error;

  await createAuditLog(entry.id, "created", null, userId);
  return entry;
}

export async function updateEntry(
  id: string,
  updates: Partial<Pick<LendLogEntry, "type" | "amount" | "currency" | "note" | "imageUrl" | "timestamp" | "status">>,
  oldEntry: LendLogEntry,
  userId: string
): Promise<LendLogEntry> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
    const newVal = updates[key];
    const oldVal = oldEntry[key];
    if (newVal !== oldVal) {
      changes[key] = { from: oldVal, to: newVal };
    }
  }

  const updated: LendLogEntry = {
    ...oldEntry,
    ...updates,
    updatedAt: Date.now(),
  };

  const row = entryToRow(updated);
  const { error } = await supabase.from("entries").update(row).eq("id", id);
  if (error) throw error;

  if (Object.keys(changes).length > 0) {
    await createAuditLog(id, "updated", changes, userId);
  }

  return updated;
}

export async function approveEntry(id: string, userId: string): Promise<void> {
  const now = Date.now();
  const { error } = await supabase
    .from("entries")
    .update({ status: "approved", updated_at: now })
    .eq("id", id);

  if (error) throw error;

  await createAuditLog(id, "updated", { status: { from: "pending", to: "approved" } }, userId);
}

export async function rejectEntry(id: string, userId: string): Promise<void> {
  const now = Date.now();
  const { error } = await supabase
    .from("entries")
    .update({ status: "rejected", updated_at: now })
    .eq("id", id);

  if (error) throw error;

  await createAuditLog(id, "updated", { status: { from: "pending", to: "rejected" } }, userId);
}

export async function resendEntry(id: string, userId: string): Promise<void> {
  const now = Date.now();
  const { error } = await supabase
    .from("entries")
    .update({ status: "pending", updated_at: now })
    .eq("id", id);

  if (error) throw error;

  await createAuditLog(id, "updated", { status: { from: "rejected", to: "pending" } }, userId);
}

export async function softDeleteEntry(id: string, userId: string): Promise<void> {
  const entry = await getEntryById(id);
  if (!entry) return;

  const now = Date.now();
  const { error } = await supabase
    .from("entries")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id);

  if (error) throw error;

  await createAuditLog(id, "deleted", { snapshot: entry } as unknown as Record<string, { from: unknown; to: unknown }>, userId);
}

export async function restoreEntry(id: string, userId: string): Promise<void> {
  const now = Date.now();
  const { error } = await supabase
    .from("entries")
    .update({ deleted_at: null, updated_at: now })
    .eq("id", id);

  if (error) throw error;

  await createAuditLog(id, "restored", null, userId);
}

// --- Image operations ---

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const path = url.split("/images/").pop();
  if (!path) return;

  await supabase.storage.from("images").remove([path]);
}

// --- Settings operations (per-user, per-ledger) ---

export async function getSettings(userId: string, ledgerId?: string): Promise<AppSettings> {
  if (!ledgerId) return { friendName: "Friend" };

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .eq("ledger_id", ledgerId)
    .single();

  if (error || !data) return { friendName: "Friend" };
  return {
    friendName: data.friend_name,
    preferredCurrency: data.preferred_currency || undefined,
    friendPhoto: data.friend_photo || undefined,
  };
}

export async function saveSettings(settings: AppSettings, userId: string, ledgerId?: string): Promise<void> {
  if (!ledgerId) return;

  const row: Record<string, unknown> = {
    user_id: userId,
    ledger_id: ledgerId,
    friend_name: settings.friendName,
    updated_at: Date.now(),
  };
  if (settings.preferredCurrency !== undefined) {
    row.preferred_currency = settings.preferredCurrency || null;
  }
  if (settings.friendPhoto !== undefined) {
    row.friend_photo = settings.friendPhoto || null;
  }

  const { error } = await supabase.from("settings").upsert(row);
  if (error) throw error;
}

export async function getAllSettings(userId: string): Promise<{ ledgerId: string; friendName: string; preferredCurrency?: string; friendPhoto?: string }[]> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId);

  if (error || !data) return [];
  return data.map((row: { ledger_id: string; friend_name: string; preferred_currency?: string; friend_photo?: string }) => ({
    ledgerId: row.ledger_id,
    friendName: row.friend_name,
    preferredCurrency: row.preferred_currency || undefined,
    friendPhoto: row.friend_photo || undefined,
  }));
}

// --- Ledger soft delete/restore ---

export async function softDeleteLedger(ledgerId: string): Promise<void> {
  const { error, data } = await supabase
    .from("ledgers")
    .update({ deleted_at: Date.now() })
    .eq("id", ledgerId)
    .select("id");

  console.log("[LendLog] softDeleteLedger", { ledgerId, error, rowsUpdated: data?.length ?? 0 });
  if (error) throw error;
}

export async function restoreLedgerDb(ledgerId: string): Promise<void> {
  const { error } = await supabase
    .from("ledgers")
    .update({ deleted_at: null })
    .eq("id", ledgerId);

  if (error) throw error;
}

export async function getDeletedLedgers(userId: string): Promise<{ id: string; user1Id: string; user2Id: string | null; inviteCode: string }[]> {
  const { data, error } = await supabase
    .from("ledgers")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row: { id: string; user1_id: string; user2_id: string | null; invite_code: string }) => ({
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    inviteCode: row.invite_code,
  }));
}

// --- Audit log operations ---

async function createAuditLog(
  entryId: string,
  action: AuditAction,
  changes: Record<string, { from: unknown; to: unknown }> | null,
  userId: string
): Promise<void> {
  await supabase.from("audit_log").insert({
    id: crypto.randomUUID(),
    entry_id: entryId,
    action,
    changes,
    created_at: Date.now(),
    user_id: userId,
  });
}

export async function getAuditLog(limit = 50, offset = 0): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*, entries(*)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data as (AuditRow & { entries: EntryRow })[]).map(rowToAudit);
}

// --- Bulk insert for migration ---

export async function bulkInsertEntries(
  entries: LendLogEntry[],
  userId: string,
  ledgerId: string
): Promise<void> {
  if (entries.length === 0) return;

  // Stamp each entry with the user and ledger
  const stamped = entries.map((e) => ({
    ...e,
    createdBy: e.createdBy ?? userId,
    ledgerId: e.ledgerId ?? ledgerId,
    status: e.status || "approved" as EntryStatus,
  }));

  const rows = stamped.map(entryToRow);
  const { error } = await supabase.from("entries").upsert(rows, { onConflict: "id" });
  if (error) throw error;

  const auditRows = stamped.map((e) => ({
    id: crypto.randomUUID(),
    entry_id: e.id,
    action: "created" as const,
    changes: null,
    created_at: e.createdAt,
    user_id: userId,
  }));

  await supabase.from("audit_log").insert(auditRows);
}
