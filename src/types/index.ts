export type Currency = "MAD" | "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";

export type EntryType = "lent" | "borrowed";

export type EntryStatus = "pending" | "approved" | "rejected";

export interface LendLogEntry {
  id: string;
  type: EntryType;
  amount: number;
  currency: Currency;
  note?: string;
  imageUrl?: string;
  timestamp: number;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
  createdBy?: string;
  ledgerId?: string;
  status: EntryStatus;
}

export interface AppSettings {
  friendName: string;
  preferredCurrency?: Currency;
}

// Kept for migration from IndexedDB
export interface ImageBlob {
  id: string;
  data: string; // base64 data URL
  mimeType: string;
  createdAt: number;
}

export interface NetBalance {
  currency: Currency;
  amount: number; // Positive = friend owes you, Negative = you owe friend
}

export type AuditAction = "created" | "updated" | "deleted" | "restored";

export interface AuditLogEntry {
  id: string;
  entryId: string;
  action: AuditAction;
  changes: Record<string, { from: unknown; to: unknown }> | { snapshot: LendLogEntry } | null;
  createdAt: number;
  userId?: string;
  entry?: LendLogEntry;
}

export interface DateRange {
  from: Date;
  to: Date;
}
