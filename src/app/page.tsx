"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Settings, Sun, Moon, Globe, Check, Clock, Download } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLocale } from "@/hooks/use-locale";
import { useAuth } from "@/hooks/use-auth";
import { useLedger } from "@/hooks/use-ledger";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getAllSettings } from "@/lib/supabase-db";
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
import { LoginPage } from "@/components/lendlog/login-page";
import { OnboardingPage } from "@/components/lendlog/onboarding-page";
import { TabBar, type TabType } from "@/components/lendlog/tab-bar";
import { LedgerSelector } from "@/components/lendlog/ledger-selector";
import { PortfolioView } from "@/components/lendlog/portfolio-view";
import { checkMigrationNeeded, migrateToSupabase, skipMigration } from "@/lib/migrate";
import { LOCALES } from "@/lib/i18n";
import type { LendLogEntry, Currency, EntryType } from "@/types";

type TypeFilter = EntryType | "all";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const { theme, toggle: toggleTheme } = useTheme();

  const userId = user?.id ?? null;
  const {
    ledgers,
    selectedLedger,
    selectedLedgerId,
    selectLedger,
    loading: ledgerLoading,
    createLedger,
    joinLedger,
  } = useLedger(userId);
  const ledgerId = selectedLedgerId;

  const { entries, loading, addEntry, updateEntry, removeEntry, restoreEntry, approveEntry, rejectEntry, resendEntry } = useEntries(userId, ledgerId);
  const { settings, updateFriendName } = useSettings(userId, ledgerId);
  const { friendBalances, totalByCurrency, loading: portfolioLoading } = usePortfolio(userId, ledgers);

  // Friend names map for ledger selector
  const [friendNames, setFriendNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!userId) return;
    getAllSettings(userId).then((all) => {
      const map = new Map<string, string>();
      for (const s of all) {
        map.set(s.ledgerId, s.friendName);
      }
      setFriendNames(map);
    });
  }, [userId, settings]); // Reload when settings change

  const [activeTab, setActiveTab] = useState<TabType>("ledger");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LendLogEntry | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [currencyFilter, setCurrencyFilter] = useState<Currency | "all">("all");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  // Migration
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [migrationCount, setMigrationCount] = useState(0);

  useEffect(() => {
    if (!userId || !ledgerId) return;
    checkMigrationNeeded().then(({ needed, entryCount }) => {
      if (needed) {
        setMigrationCount(entryCount);
        setMigrationOpen(true);
      }
    });
  }, [userId, ledgerId]);

  const handleMigrate = useCallback(async () => {
    await migrateToSupabase(() => {}, userId ?? undefined, ledgerId ?? undefined);
    window.location.reload();
  }, [userId, ledgerId]);

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
      const resetStatus = editEntry.status === "rejected";
      await updateEntry(editEntry.id, data, resetStatus);
    } else {
      await addEntry(data);
    }
  };

  const handleSelectFriendFromPortfolio = (id: string) => {
    selectLedger(id);
    setActiveTab("ledger");
  };

  const handleCreateNewFromSelector = async () => {
    await createLedger();
    // After creating, user will be switched to the new ledger
    // They should go to settings to name their friend
    setSettingsOpen(true);
  };

  const handleJoinFromSelector = () => {
    setJoinDialogOpen(true);
  };

  // --- Auth gates ---

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground text-sm">{t.loading}</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage t={t} />;
  }

  if (ledgerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground text-sm">{t.loading}</div>
      </div>
    );
  }

  // No ledgers at all → onboarding
  if (ledgers.length === 0) {
    return (
      <OnboardingPage
        t={t}
        ledger={null}
        onCreateLedger={createLedger}
        onJoinLedger={joinLedger}
      />
    );
  }

  // Join dialog (when user clicks "Join" from ledger selector)
  if (joinDialogOpen) {
    return (
      <OnboardingPage
        t={t}
        ledger={null}
        onCreateLedger={async () => {
          const l = await createLedger();
          setJoinDialogOpen(false);
          return l;
        }}
        onJoinLedger={async (code) => {
          const l = await joinLedger(code);
          setJoinDialogOpen(false);
          return l;
        }}
      />
    );
  }

  // --- Main app ---

  if (loading && activeTab === "ledger") {
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
            {activeTab === "ledger" ? (
              <LedgerSelector
                ledgers={ledgers}
                selectedLedgerId={selectedLedgerId}
                friendNames={friendNames}
                t={t}
                onSelect={selectLedger}
                onCreateNew={handleCreateNewFromSelector}
                onJoinNew={handleJoinFromSelector}
              />
            ) : (
              <h1 className="text-xl font-bold tracking-tight">{t.portfolio}</h1>
            )}
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
              {activeTab === "ledger" && (
                <>
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
                </>
              )}
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

        {/* Tab Content */}
        {activeTab === "ledger" ? (
          <>
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
            <div className="px-4 pb-32">
              <EntryList
                entries={filteredEntries}
                friendName={settings.friendName}
                t={t}
                locale={locale}
                onEdit={handleEdit}
                onDelete={removeEntry}
                onApprove={approveEntry}
                onReject={rejectEntry}
                onResend={resendEntry}
                currentUserId={userId}
              />
            </div>

            {/* FAB */}
            <Button
              size="icon"
              className="fixed bottom-16 right-6 rtl:right-auto rtl:left-6 h-14 w-14 rounded-full shadow-lg z-30"
              onClick={handleAdd}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">{t.addEntryButton}</span>
            </Button>
          </>
        ) : (
          /* Portfolio Tab */
          <div className="pb-32">
            {portfolioLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-pulse text-muted-foreground text-sm">{t.loading}</div>
              </div>
            ) : (
              <PortfolioView
                friendBalances={friendBalances}
                totalByCurrency={totalByCurrency}
                t={t}
                onSelectFriend={handleSelectFriendFromPortfolio}
              />
            )}
          </div>
        )}

        {/* Bottom Tab Bar */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} t={t} />

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
          onLogout={signOut}
          inviteCode={selectedLedger?.inviteCode}
          partnerJoined={!!selectedLedger?.user2Id}
          userEmail={user.email}
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
