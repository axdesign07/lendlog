"use client";

import { useState, useEffect } from "react";
import { Copy, Check, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Translations } from "@/lib/i18n";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendName: string;
  t: Translations;
  onSave: (name: string) => void;
  onLogout: () => void;
  inviteCode?: string;
  partnerJoined?: boolean;
  userEmail?: string;
}

export function SettingsDialog({
  open,
  onOpenChange,
  friendName,
  t,
  onSave,
  onLogout,
  inviteCode,
  partnerJoined,
  userEmail,
}: SettingsDialogProps) {
  const [name, setName] = useState(friendName);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setName(friendName);
      setCopied(false);
    }
  }, [open, friendName]);

  const handleSave = () => {
    onSave(name);
    onOpenChange(false);
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success(t.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.settings}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Friend name */}
          <div className="space-y-2">
            <Label htmlFor="friendName">{t.friendName}</Label>
            <Input
              id="friendName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.friendNamePlaceholder}
              maxLength={50}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          {/* Invite code (if partner hasn't joined yet) */}
          {inviteCode && !partnerJoined && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>{t.yourInviteCode}</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-center font-mono text-sm tracking-widest select-all">
                    {inviteCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleCopyInvite}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t.inviteDesc}</p>
              </div>
            </>
          )}

          {/* Account info + logout */}
          <Separator />
          <div className="space-y-3">
            {userEmail && (
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            )}
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {t.logout}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
