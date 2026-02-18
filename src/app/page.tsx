"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Settings, Sun, Moon, Globe, Check, Clock, Download } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEntries } from "@/hooks/use-entries";
import { useSettings } from "@/hooks/use-settings";
import { BalanceSummary } from "@/components/lendlog/balance-summary";
import { EntryList } from "@/components/lendlog/entry-list";
import { FilterBar } from "@/components/lendlog/filter-bar";
import { AddEntrySheet } from "@/components/lendlog/add-entry-sheet";
import { SettingsDialog } from "@/components/lendlog/settings-dialog";
import { HistorySheet } from "@/components/lendlog/history-sheet";
import { ExportSheet } from "@/components/lendlog/export-sheet";
import { MigrationDialog } from "@/components/lendlog/migration-dialog";
import { checkMigrationNeeded, migrateToSupabase, skipMigration } from "@/lib/migrate";
import { LOCALES, type Locale } from "@/lib/i18n";
import type { LendLogEntry, Currency, EntryType } from "@/types";

type TypeFilter = EntryType | "all";

export default function Home() {
  const { entries, loading, addEntry, updateEntry, removeEntry, restoreEntry } = useEntries();
  const { settings, updateFriendName } = useSettings();
  const { theme, toggle: toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LendLogEntry | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [currencyFilter, setCurrencyFilter] = useState<Currency | "all">("all");

  // Migration
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [migrationCount, setMigrationCount] = useState(0);

  useEffect(() => {
    checkMigrationNeeded().then(({ needed, entryCount }) => {
      if (needed) {
        setMigrationCount(entryCount);
        setMigrationOpen(true);
      }
    });
  }, []);

  const handleMigrate = useCallback(async () => {
    await migrateToSupabase(() => {});
    // Refresh entries after migration
    window.location.reload();
  }, []);

  const handleSkip = useCallback(() => {
    skipMigration();
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (currencyFilter !== "all" && e.currency !== currencyFilter) return false;
      return true;
    });
  }, [entries, typeFilter, currencyFilter]);

  const handleEdit = (entry: LendLogEntry) => {
    setEditEntry(entry);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditEntry(null);
    setSheetOpen(true);
  };

  const handleSubmit = async (data: {
    type: EntryType;
    amount: number;
    currency: Currency;
    note?: string;
    image?: File;
    timestamp?: number;
  }) => {
    if (editEntry) {
      await updateEntry(editEntry.id, data);
    } else {
      await addEntry(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground text-sm">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 h-14">
            <h1 className="text-xl font-bold tracking-tight">{t.appName}</h1>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 px-2.5 text-xs font-medium"
                  >
                    <Globe className="h-[15px] w-[15px]" />
                    {LOCALES.find((l) => l.value === locale)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {LOCALES.map((l) => (
                    <DropdownMenuItem
                      key={l.value}
                      onClick={() => setLocale(l.value)}
                      className="gap-2"
                    >
                      {l.label}
                      {locale === l.value && <Check className="h-4 w-4 ms-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setHistoryOpen(true)}
              >
                <Clock className="h-[18px] w-[18px]" />
                <span className="sr-only">{t.history}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setExportOpen(true)}
              >
                <Download className="h-[18px] w-[18px]" />
                <span className="sr-only">{t.export}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="h-[18px] w-[18px]" />
                ) : (
                  <Sun className="h-[18px] w-[18px]" />
                )}
                <span className="sr-only">{t.toggleTheme}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-[18px] w-[18px]" />
                <span className="sr-only">{t.settings}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Balance Summary */}
        <BalanceSummary entries={entries} friendName={settings.friendName} t={t} />

        {/* Filter Bar */}
        {entries.length > 0 && (
          <FilterBar
            typeFilter={typeFilter}
            currencyFilter={currencyFilter}
            t={t}
            onTypeFilterChange={setTypeFilter}
            onCurrencyFilterChange={setCurrencyFilter}
          />
        )}

        {/* Entry List */}
        <div className="px-4 pb-24">
          <EntryList
            entries={filteredEntries}
            friendName={settings.friendName}
            t={t}
            locale={locale}
            onEdit={handleEdit}
            onDelete={removeEntry}
          />
        </div>

        {/* FAB */}
        <Button
          size="icon"
          className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 h-14 w-14 rounded-full shadow-lg z-30"
          onClick={handleAdd}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">{t.addEntryButton}</span>
        </Button>

        {/* Sheets & Dialogs */}
        <AddEntrySheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          editEntry={editEntry}
          t={t}
          onSubmit={handleSubmit}
        />

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          friendName={settings.friendName}
          t={t}
          onSave={updateFriendName}
        />

        <HistorySheet
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          t={t}
          locale={locale}
          onRestore={restoreEntry}
        />

        <ExportSheet
          open={exportOpen}
          onOpenChange={setExportOpen}
          entries={entries}
          friendName={settings.friendName}
          t={t}
        />

        <MigrationDialog
          open={migrationOpen}
          onOpenChange={setMigrationOpen}
          entryCount={migrationCount}
          onMigrate={handleMigrate}
          onSkip={handleSkip}
        />
      </div>
    </div>
  );
}
