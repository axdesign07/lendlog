import type { LendLogEntry, DateRange, Currency } from "@/types";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function filterByDateRange(
  entries: LendLogEntry[],
  range: DateRange
): LendLogEntry[] {
  const fromTime = range.from.getTime();
  const toTime = range.to.getTime() + 86400000 - 1; // End of the "to" day

  return entries.filter(
    (entry) => entry.timestamp >= fromTime && entry.timestamp <= toTime
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeSummary(
  entries: LendLogEntry[]
): { currency: Currency; lent: number; borrowed: number; net: number }[] {
  const byCurrency = new Map<
    Currency,
    { lent: number; borrowed: number }
  >();

  for (const entry of entries) {
    const existing = byCurrency.get(entry.currency) || {
      lent: 0,
      borrowed: 0,
    };
    if (entry.type === "lent") {
      existing.lent += entry.amount;
    } else {
      existing.borrowed += entry.amount;
    }
    byCurrency.set(entry.currency, existing);
  }

  return Array.from(byCurrency.entries()).map(([currency, totals]) => ({
    currency,
    lent: totals.lent,
    borrowed: totals.borrowed,
    net: totals.lent - totals.borrowed,
  }));
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV(
  entries: LendLogEntry[],
  friendName: string
): void {
  const rows: string[] = [];

  // Header
  rows.push("Date,Time,Type,Amount,Currency,Note");

  // Data rows
  for (const entry of entries) {
    rows.push(
      [
        formatDate(entry.timestamp),
        formatTime(entry.timestamp),
        entry.type === "lent" ? "Lent" : "Borrowed",
        entry.amount.toFixed(2),
        entry.currency,
        escapeCsvField(entry.note || ""),
      ].join(",")
    );
  }

  // Summary
  rows.push("");
  rows.push(`Summary - ${friendName}`);

  const summary = computeSummary(entries);
  for (const s of summary) {
    const symbol = getCurrencySymbol(s.currency);
    rows.push(`${s.currency},Lent: ${symbol}${s.lent.toFixed(2)},Borrowed: ${symbol}${s.borrowed.toFixed(2)},Net: ${symbol}${s.net.toFixed(2)}`);
  }

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `lendlog-${friendName.toLowerCase().replace(/\s+/g, "-")}-${formatDate(Date.now()).replace(/\//g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  entries: LendLogEntry[],
  friendName: string
): void {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("LendLog Report", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Transactions with ${friendName}`, 14, 28);
  doc.text(`Generated: ${formatDate(Date.now())}`, 14, 34);

  // Table
  const tableData = entries.map((entry) => [
    formatDate(entry.timestamp),
    formatTime(entry.timestamp),
    entry.type === "lent" ? "Lent" : "Borrowed",
    formatCurrency(entry.amount, entry.currency),
    entry.note || "-",
  ]);

  autoTable(doc, {
    startY: 42,
    head: [["Date", "Time", "Type", "Amount", "Note"]],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 37, 36] },
    columnStyles: {
      3: { halign: "right" },
      4: { cellWidth: 50 },
    },
  });

  // Summary
  const summary = computeSummary(entries);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 60;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Summary", 14, finalY + 12);

  const summaryData = summary.map((s) => [
    s.currency,
    formatCurrency(s.lent, s.currency),
    formatCurrency(s.borrowed, s.currency),
    formatCurrency(s.net, s.currency),
  ]);

  autoTable(doc, {
    startY: finalY + 16,
    head: [["Currency", "Total Lent", "Total Borrowed", "Net Balance"]],
    body: summaryData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 37, 36] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  doc.save(
    `lendlog-${friendName.toLowerCase().replace(/\s+/g, "-")}-${formatDate(Date.now()).replace(/\//g, "-")}.pdf`
  );
}
