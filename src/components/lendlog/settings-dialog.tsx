"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, LogOut, Plus, UserPlus, Trash2, Camera, X, Loader2, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FriendAvatar } from "./friend-avatar";
import { uploadImage, deleteImage } from "@/lib/supabase-db";
import { CURRENCIES } from "@/lib/currency";
import type { Currency } from "@/types";
import type { Translations } from "@/lib/i18n";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendName: string;
  friendPhoto?: string;
  onFriendPhotoChange: (url: string | undefined) => void;
  t: Translations;
  onSave: (name: string) => void;
  onLogout: () => void;
  inviteCode?: string;
  partnerJoined?: boolean;
  partnerEmail?: string;
  userEmail?: string;
  onAddFriend: () => void;
  onJoinLedger: () => void;
  preferredCurrency?: Currency;
  onPreferredCurrencyChange: (currency: Currency | undefined) => void;
  onDeleteFriend?: () => void;
  showDeleteFriend?: boolean;
}

export function SettingsDialog({
  open,
  onOpenChange,
  friendName,
  friendPhoto,
  onFriendPhotoChange,
  t,
  onSave,
  onLogout,
  inviteCode,
  partnerJoined,
  partnerEmail,
  userEmail,
  onAddFriend,
  onJoinLedger,
  preferredCurrency,
  onPreferredCurrencyChange,
  onDeleteFriend,
  showDeleteFriend,
}: SettingsDialogProps) {
  const [name, setName] = useState(friendName);
  const [copied, setCopied] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    onOpenChange(false);
    onDeleteFriend?.();
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (friendPhoto) {
        await deleteImage(friendPhoto);
      }
      const url = await uploadImage(file);
      await onFriendPhotoChange(url);
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!friendPhoto) return;
    setUploading(true);
    try {
      await deleteImage(friendPhoto);
      await onFriendPhotoChange(undefined);
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto px-0 pb-8 pt-2 gap-0">
          <SheetHeader className="px-6 pb-4">
            <SheetTitle className="text-lg font-bold">{t.settings}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Friend photo + name — centered header */}
            <div className="flex flex-col items-center gap-3 px-6">
              <div className="relative group">
                <button
                  type="button"
                  className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <FriendAvatar name={friendName} photoUrl={friendPhoto} size="lg" />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </button>
                {friendPhoto && !uploading && (
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90 transition-colors"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.changePhoto}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* iOS grouped settings — Friend section */}
            <div className="px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
                {t.friendName}
              </p>
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="px-4 py-3">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.friendNamePlaceholder}
                    maxLength={50}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="border-0 p-0 h-auto text-[15px] shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Partner email — shown when partner has joined */}
            {partnerJoined && partnerEmail && (
              <div className="px-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
                  {t.connectedWith}
                </p>
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="px-4 py-3">
                    <p className="text-[15px] text-muted-foreground select-all">{partnerEmail}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preferred currency section */}
            <div className="px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
                {t.preferredCurrency}
              </p>
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="px-4 py-1.5">
                  <Select
                    value={preferredCurrency || "none"}
                    onValueChange={(v) =>
                      onPreferredCurrencyChange(v === "none" ? undefined : (v as Currency))
                    }
                  >
                    <SelectTrigger className="border-0 p-0 h-auto py-2 shadow-none focus:ring-0 text-[15px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t.noCurrencyConversion}</SelectItem>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.symbol} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Invite code (if partner hasn't joined yet) */}
            {inviteCode && !partnerJoined && (
              <div className="px-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
                  {t.yourInviteCode}
                </p>
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <div className="flex-1 font-mono text-sm tracking-widest select-all">
                      {inviteCode}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full"
                      onClick={handleCopyInvite}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 px-2">{t.inviteDesc}</p>
              </div>
            )}

            {/* Friends section — iOS grouped rows */}
            <div className="px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
                {t.friends}
              </p>
              <div className="rounded-2xl border bg-card overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-accent/50"
                  onClick={() => {
                    onOpenChange(false);
                    onAddFriend();
                  }}
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-[15px] text-start text-primary">{t.addFriend}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </button>
                <div className="ms-[2.75rem] border-b border-separator" />
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-accent/50"
                  onClick={() => {
                    onOpenChange(false);
                    onJoinLedger();
                  }}
                >
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-[15px] text-start text-primary">{t.joinLedger}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </button>
              </div>
            </div>

            {/* Account section */}
            <div className="px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
                {userEmail || "Account"}
              </p>
              <div className="rounded-2xl border bg-card overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-accent/50"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                  <span className="flex-1 text-[15px] text-start text-destructive">{t.logout}</span>
                </button>

                {showDeleteFriend && onDeleteFriend && (
                  <>
                    <div className="ms-[2.75rem] border-b border-separator" />
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-accent/50"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="flex-1 text-[15px] text-start text-destructive">{t.deleteFriend}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Save button */}
            <div className="px-4 pt-2">
              <Button
                className="w-full h-12 rounded-2xl text-[15px] font-semibold"
                onClick={handleSave}
              >
                {t.save}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteFriend}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteFriendConfirm.replace("{name}", friendName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              {t.deleteFriend}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
