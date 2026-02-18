"use client";

import { useState } from "react";
import { Plus, ArrowRight, Copy, Check, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Translations } from "@/lib/i18n";
import type { Ledger } from "@/hooks/use-ledger";
import { toast } from "sonner";

interface OnboardingPageProps {
  t: Translations;
  ledger: Ledger | null;
  onCreateLedger: () => Promise<Ledger | null>;
  onJoinLedger: (code: string) => Promise<Ledger | null>;
}

export function OnboardingPage({
  t,
  ledger,
  onCreateLedger,
  onJoinLedger,
}: OnboardingPageProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

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
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">{t.appName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.inviteDesc}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="space-y-2">
              <Label>{t.yourInviteCode}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3 text-center font-mono text-lg tracking-widest select-all">
                  {ledger.inviteCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t.waitingForFriend}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No ledger yet — show create / join options
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
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t.appName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.getStartedDesc}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-5">
          {/* Create new ledger */}
          <Button
            className="w-full h-12 gap-2 text-base"
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
              <Label htmlFor="inviteCode">{t.inviteCode}</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="abc123def456"
                  className="h-11 pl-10 font-mono tracking-wider"
                  maxLength={20}
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full h-11 gap-2"
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
        </div>
      </div>
    </div>
  );
}
