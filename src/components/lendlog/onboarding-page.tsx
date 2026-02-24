"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, ArrowRight, Copy, Check, Users, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CURRENCIES } from "@/lib/currency";
import type { Currency } from "@/types";
import type { Translations } from "@/lib/i18n";
import type { Ledger } from "@/hooks/use-ledger";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OnboardingPageProps {
  t: Translations;
  ledger: Ledger | null;
  onCreateLedger: () => Promise<Ledger | null>;
  onJoinLedger: (code: string) => Promise<Ledger | null>;
  onCurrencySelected?: (currency: Currency) => void;
  skipCurrencyStep?: boolean;
}

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export function OnboardingPage({
  t,
  ledger,
  onCreateLedger,
  onJoinLedger,
  onCurrencySelected,
  skipCurrencyStep,
}: OnboardingPageProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("MAD");
  const [currencyChosen, setCurrencyChosen] = useState(!!skipCurrencyStep);

  // If ledger exists but partner hasn't joined — show waiting + invite code
  if (ledger && !ledger.user2Id) {
    const handleCopy = async () => {
      await navigator.clipboard.writeText(ledger.inviteCode);
      setCopied(true);
      toast.success(t.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">{t.appName}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {t.inviteDesc}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.yourInviteCode}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border bg-muted/50 px-4 py-3.5 text-center font-mono text-lg tracking-widest select-all">
                  {ledger.inviteCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-xl"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t.waitingForFriend}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 1: Choose preferred currency
  if (!currencyChosen) {
    const handleContinue = () => {
      onCurrencySelected?.(selectedCurrency);
      setCurrencyChosen(true);
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.05 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Coins className="h-7 w-7 text-primary" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.1 }}
              className="text-2xl font-bold tracking-tight"
            >
              {t.chooseCurrency}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...spring, delay: 0.2 }}
              className="mt-2 text-sm text-muted-foreground leading-relaxed"
            >
              {t.chooseCurrencyDesc}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 }}
            className="rounded-2xl border bg-card overflow-hidden"
          >
            {CURRENCIES.map((currency, index) => (
              <div key={currency.value}>
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-accent/50",
                    selectedCurrency === currency.value && "bg-primary/5"
                  )}
                  onClick={() => setSelectedCurrency(currency.value)}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                      selectedCurrency === currency.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currency.symbol}
                  </div>
                  <div className="flex-1 text-start">
                    <p className="text-[15px] font-medium">{currency.label}</p>
                    <p className="text-xs text-muted-foreground">{currency.value}</p>
                  </div>
                  {selectedCurrency === currency.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring}
                    >
                      <Check className="h-5 w-5 text-primary" />
                    </motion.div>
                  )}
                </button>
                {index < CURRENCIES.length - 1 && (
                  <div className="ms-[3.75rem] border-b border-separator" />
                )}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.25 }}
          >
            <Button
              className="w-full h-12 gap-2 text-base rounded-2xl font-semibold"
              onClick={handleContinue}
            >
              {t.continue}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Step 2: Create or join ledger (existing flow)
  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateLedger();
    } catch {
      toast.error("Failed to create ledger");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setJoining(true);
    try {
      await onJoinLedger(inviteCode.trim());
      toast.success("Joined!");
    } catch {
      toast.error(t.invalidInvite);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight"
          >
            {t.appName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...spring, delay: 0.2 }}
            className="mt-3 text-sm text-muted-foreground"
          >
            {t.getStartedDesc}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
          className="rounded-2xl border bg-card p-6 space-y-5"
        >
          {/* Create new ledger */}
          <Button
            className="w-full h-12 gap-2 text-base rounded-2xl font-semibold"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            {t.createLedger}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {t.orJoinExisting}
            </span>
            <Separator className="flex-1" />
          </div>

          {/* Join with invite code */}
          <form onSubmit={handleJoin} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="inviteCode" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.inviteCode}
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="abc123def456"
                  className="h-12 pl-10 font-mono tracking-wider"
                  maxLength={20}
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 gap-2 rounded-2xl text-[15px]"
              disabled={joining || !inviteCode.trim()}
            >
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {t.join}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
