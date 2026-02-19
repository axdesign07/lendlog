"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";
import { CURRENCIES } from "@/lib/currency";
import { useImage } from "@/hooks/use-image";
import type { LendLogEntry, Currency, EntryType } from "@/types";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AddEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: LendLogEntry | null;
  t: Translations;
  onSubmit: (data: {
    type: EntryType;
    amount: number;
    currency: Currency;
    note?: string;
    image?: File;
    timestamp?: number;
    ledgerId?: string;
  }) => void;
  ledgers: { id: string; friendName: string }[];
  currentLedgerId: string | null;
}

export function AddEntrySheet({
  open,
  onOpenChange,
  editEntry,
  t,
  onSubmit,
  ledgers,
  currentLedgerId,
}: AddEntrySheetProps) {
  const [type, setType] = useState<EntryType>("lent");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("MAD");
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingImageSrc = useImage(editEntry?.imageUrl);

  useEffect(() => {
    if (open) {
      if (editEntry) {
        setType(editEntry.type);
        setAmount(editEntry.amount.toString());
        setCurrency(editEntry.currency);
        setNote(editEntry.note || "");
        setImageFile(null);
        setImagePreview(null);
      } else {
        setType("lent");
        setAmount("");
        setCurrency("MAD");
        setNote("");
        setImageFile(null);
        setImagePreview(null);
      }
      setSelectedLedgerId(currentLedgerId);
    }
  }, [open, editEntry, currentLedgerId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    onSubmit({
      type,
      amount: parsed,
      currency,
      note: note.trim() || undefined,
      image: imageFile || undefined,
      timestamp: editEntry?.timestamp,
      ledgerId: selectedLedgerId || undefined,
    });
    onOpenChange(false);
  };

  const displayPreview = imagePreview || (editEntry && !imageFile ? existingImageSrc : null);
  const showFriendPicker = !editEntry && ledgers.length > 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-6 pb-8 pt-2 gap-0">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">{editEntry ? t.editEntry : t.newEntry}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Friend picker */}
          {showFriendPicker && (
            <div className="space-y-2">
              <Label>{t.friends}</Label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {ledgers.map((l) => (
                  <Button
                    key={l.id}
                    type="button"
                    variant={selectedLedgerId === l.id ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 rounded-full px-4 h-9"
                    onClick={() => setSelectedLedgerId(l.id)}
                  >
                    {l.friendName}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Type toggle */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant={type === "lent" ? "default" : "outline"}
              className={cn(
                "flex-1 h-11",
                type === "lent" && "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={() => setType("lent")}
            >
              {t.iLent}
            </Button>
            <Button
              type="button"
              variant={type === "borrowed" ? "default" : "outline"}
              className={cn(
                "flex-1 h-11",
                type === "borrowed" && "bg-red-500 hover:bg-red-600"
              )}
              onClick={() => setType("borrowed")}
            >
              {t.iBorrowed}
            </Button>
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">{t.amount}</Label>
              <Input
                id="amount"
                type="number"
                dir="ltr"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-11"
                autoFocus
              />
            </div>
            <div className="w-[120px] space-y-2">
              <Label>{t.currency}</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.symbol} {c.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">{t.noteOptional}</Label>
            <Textarea
              id="note"
              placeholder={t.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Image attachment */}
          <div className="space-y-2">
            <Label>{t.attachmentOptional}</Label>
            {displayPreview ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border">
                <Image
                  src={displayPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
                {t.addPhoto}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 pt-6">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            className="flex-1 h-11"
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            {editEntry ? t.update : t.addEntry}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
