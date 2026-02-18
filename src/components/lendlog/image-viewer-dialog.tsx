"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translations } from "@/lib/i18n";

interface ImageViewerDialogProps {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: Translations;
}

export function ImageViewerDialog({ src, open, onOpenChange, t }: ImageViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-2">
        <DialogTitle className="sr-only">{t.attachedImage}</DialogTitle>
        <div className="relative w-full aspect-square">
          <Image
            src={src}
            alt={t.attachedImage}
            fill
            className="object-contain rounded"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
