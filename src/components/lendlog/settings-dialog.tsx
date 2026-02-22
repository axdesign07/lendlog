"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, LogOut, Plus, UserPlus, Trash2, Camera, X, Loader2 } from "lucide-react";
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
      // Delete old photo if exists
      if (friendPhoto) {
        await deleteImage(friendPhoto);
      }
      const url = await uploadImage(file);
      await onFriendPhotoChange(url);
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      // Reset file input
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.settings}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Friend photo + name */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <button
                  type="button"
                  className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <FriendAvatar name={friendName} photoUrl={friendPhoto} size="lg" />
                  {/* Camera overlay */}
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
                {/* Remove button */}
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
                {friendPhoto ? t.changePhoto : t.changePhoto}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

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

            {/* Preferred currency */}
            <div className="space-y-2">
              <Label>{t.preferredCurrency}</Label>
              <Select
                value={preferredCurrency || "none"}
                onValueChange={(v) =>
                  onPreferredCurrencyChange(v === "none" ? undefined : (v as Currency))
                }
              >
                <SelectTrigger>
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

            {/* Add friend / Join ledger */}
            <Separator />
            <div className="space-y-2">
              <Label>{t.friends}</Label>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onAddFriend();
                }}
              >
                <Plus className="h-4 w-4" />
                {t.addFriend}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onJoinLedger();
                }}
              >
                <UserPlus className="h-4 w-4" />
                {t.joinLedger}
              </Button>
            </div>

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

              {/* Delete friend */}
              {showDeleteFriend && onDeleteFriend && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t.deleteFriend}
                </Button>
              )}
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
