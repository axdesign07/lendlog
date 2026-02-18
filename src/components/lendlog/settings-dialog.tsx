"use client";

import { useState, useEffect } from "react";
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
import type { Translations } from "@/lib/i18n";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendName: string;
  t: Translations;
  onSave: (name: string) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  friendName,
  t,
  onSave,
}: SettingsDialogProps) {
  const [name, setName] = useState(friendName);

  useEffect(() => {
    if (open) {
      setName(friendName);
    }
  }, [open, friendName]);

  const handleSave = () => {
    onSave(name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.settings}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
