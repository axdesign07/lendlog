"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Settings, Sun, Moon, Globe, Check, Clock, Download, Receipt, UserPlus, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
import { PortfolioView } from "@/components/lendlog/portfolio-view";
import { FriendAvatar } from "@/components/lendlog/friend-avatar";
import { checkMigrationNeeded, migrateToSupabase, skipMigration } from "@/lib/migrate";
import { LOCALES } from "@/lib/i18n";
import type { LendLogEntry, Currency, EntryType } from "@/types";

type TypeFilter = EntryType | "all";
type View = "dashboard" | "friend";

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
    deleteLedger,
  } = useLedger(userId);
  const ledgerId = selectedLedgerId;

  const { entries, loading, addEntry, updateEntry, removeEntry, restoreEntry, approveEntry, rejectEntry, resendEntry } = useEntries(userId, ledgerId);
  const { settings, updateFriendName, updatePreferredCurrency, updateFriendPhoto } = useSettings(userId, ledgerId);
  const preferredCurrency = settings.preferredCurrency;
  const { friendBalances, totalByCurrency, convertedTotal, loading: portfolioLoading } = usePortfolio(userId, ledgers, preferredCurrency);

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
  }, [userId, settings]);

  const [view, setView] = useState<View>("dashboard");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LendLogEntry | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [currencyFilter, setCurrencyFilter] = useState<Currency | "all">("all");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

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
    ledgerId?: string;
  }) => {
    if (editEntry) {
      const resetStatus = editEntry.status === "rejected";
      await updateEntry(editEntry.id, data, resetStatus);
    } else {
      await addEntry(data);
    }
  };

  const handleSelectFriend = (id: string) => {
    selectLedger(id);
    setView("friend");
    setTypeFilter("all");
    setCurrencyFilter("all");
  };

  const handleBack = () => {
    setView("dashboard");
  };

  const handleDeleteFriend = async () => {
    if (!selectedLedgerId) return;
    await deleteLedger(selectedLedgerId);
    setView("dashboard");
  };

  const handleCreateNew = async () => {
    await createLedger();
    setSettingsOpen(true);
  };

  const handleJoinNew = () => {
    setJoinDialogOpen(true);
  };

  // --- Auth gates ---
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-sm">
          {t.loading}
        </motion.div>
      </div>
    );
  }

  if (!user) return <LoginPage t={t} />;

  if (ledgerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-sm">
          {t.loading}
        </motion.div>
      </div>
    );
  }

  if (ledgers.length === 0) {
    return <OnboardingPage t={t} ledger={null} onCreateLedger={createLedger} onJoinLedger={joinLedger} />;
  }

  if (joinDialogOpen) {
    return (
      <OnboardingPage
        t={t}
        ledger={null}
        onCreateLedger={async () => { const l = await createLedger(); setJoinDialogOpen(false); return l; }}
        onJoinLedger={async (code) => { const l = await joinLedger(code); setJoinDialogOpen(false); return l; }}
      />
    );
  }

  const headerRight = (
    <div className="flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 text-xs font-medium rounded-full">
            <Globe className="h-[15px] w-[15px]" />
            {LOCALES.find((l) => l.value === locale)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LOCALES.map((l) => (
            <DropdownMenuItem key={l.value} onClick={() => setLocale(l.value)} className="gap-2">
              {l.label}
              {locale === l.value && <Check className="h-4 w-4 ms-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {view === "friend" && (
        <>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setHistoryOpen(true)}>
            <Clock className="h-[18px] w-[18px]" />
            <span className="sr-only">{t.history}</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setExportOpen(true)}>
            <Download className="h-[18px] w-[18px]" />
            <span className="sr-only">{t.export}</span>
          </Button>
        </>
      )}

      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={toggleTheme}>
        {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        <span className="sr-only">{t.toggleTheme}</span>
      </Button>

      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setSettingsOpen(true)}>
        <Settings className="h-[18px] w-[18px]" />
        <span className="sr-only">{t.settings}</span>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl">
        {/* Apple-style frosted glass header */}
        <header className="sticky top-0 z-20 border-b border-separator bg-glass backdrop-blur-2xl backdrop-saturate-150">
          <div className="flex items-center justify-between px-4 h-[60px]">
            {view === "dashboard" ? (
              <h1 className="text-xl font-bold tracking-tight">{t.appName}</h1>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 -ms-1 rounded-full" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">{t.back}</span>
                </Button>
                <FriendAvatar name={settings.friendName} photoUrl={settings.friendPhoto} size="sm" />
                <h1 className="text-base font-bold tracking-tight">{settings.friendName}</h1>
              </div>
            )}
            {headerRight}
          </div>
        </header>

        {/* Animated view transitions */}
        <AnimatePresence mode="wait">
          {view === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="pb-28">
                {portfolioLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-pulse text-muted-foreground text-sm">{t.loading}</div>
                  </div>
                ) : (
                  <PortfolioView
                    friendBalances={friendBalances}
                    totalByCurrency={totalByCurrency}
                    convertedTotal={convertedTotal}
                    preferredCurrency={preferredCurrency}
                    t={t}
                    onSelectFriend={handleSelectFriend}
                  />
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] rtl:right-auto rtl:left-[calc(1.5rem+env(safe-area-inset-left))] z-30"
                  >
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                      <Plus className="h-6 w-6" />
                      <span className="sr-only">{t.addEntryButton}</span>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-52">
                  <DropdownMenuItem onClick={handleAdd} className="gap-3 py-3">
                    <Receipt className="h-5 w-5" />
                    {t.addTransaction}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateNew} className="gap-3 py-3">
                    <UserPlus className="h-5 w-5" />
                    {t.addFriend}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ) : (
            <motion.div
              key="friend"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-pulse text-muted-foreground text-sm">{t.loading}</div>
                </div>
              ) : (
                <>
                  <BalanceSummary entries={entries} friendName={settings.friendName} t={t} preferredCurrency={preferredCurrency} />

                  {entries.length > 0 && (
                    <FilterBar
                      typeFilter={typeFilter}
                      currencyFilter={currencyFilter}
                      t={t}
                      onTypeFilterChange={setTypeFilter}
                      onCurrencyFilterChange={setCurrencyFilter}
                    />
                  )}

                  <div className="px-4 pb-28">
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
                      onAdd={handleAdd}
                    />
                  </div>
                </>
              )}

              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] rtl:right-auto rtl:left-[calc(1.5rem+env(safe-area-inset-left))] z-30"
              >
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={handleAdd}>
                  <Plus className="h-6 w-6" />
                  <span className="sr-only">{t.addEntryButton}</span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sheets & Dialogs */}
        <AddEntrySheet open={sheetOpen} onOpenChange={setSheetOpen} editEntry={editEntry} t={t} onSubmit={handleSubmit} ledgers={ledgers.map((l) => ({ id: l.id, friendName: friendNames.get(l.id) || "Friend" }))} currentLedgerId={selectedLedgerId} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} friendName={settings.friendName} friendPhoto={settings.friendPhoto} onFriendPhotoChange={updateFriendPhoto} t={t} onSave={updateFriendName} onLogout={signOut} inviteCode={selectedLedger?.inviteCode} partnerJoined={!!selectedLedger?.user2Id} userEmail={user.email} onAddFriend={handleCreateNew} onJoinLedger={handleJoinNew} preferredCurrency={preferredCurrency} onPreferredCurrencyChange={updatePreferredCurrency} onDeleteFriend={handleDeleteFriend} showDeleteFriend={view === "friend"} />
        <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} t={t} locale={locale} onRestore={restoreEntry} />
        <ExportSheet open={exportOpen} onOpenChange={setExportOpen} entries={entries} friendName={settings.friendName} t={t} />
        <MigrationDialog open={migrationOpen} onOpenChange={setMigrationOpen} entryCount={migrationCount} onMigrate={handleMigrate} onSkip={handleSkip} />
      </div>
    </div>
  );
}
