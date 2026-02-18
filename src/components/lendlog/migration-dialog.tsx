"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2 } from "lucide-react";

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryCount: number;
  onMigrate: () => Promise<void>;
  onSkip: () => void;
}

export function MigrationDialog({
  open,
  onOpenChange,
  entryCount,
  onMigrate,
  onSkip,
}: MigrationDialogProps) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleMigrate = async () => {
    setMigrating(true);
    setProgress({ current: 0, total: entryCount });
    try {
      await onMigrate();
      onOpenChange(false);
    } catch {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={migrating ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload className="size-5" />
            Migrate to Cloud
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {migrating ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Migrating entries...
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {progress.current} / {progress.total}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Found{" "}
              <span className="font-medium text-foreground">
                {entryCount}
              </span>{" "}
              local {entryCount === 1 ? "entry" : "entries"}. Upload to cloud?
            </p>
          )}
        </div>
        {!migrating && (
          <DialogFooter>
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleMigrate}>Migrate</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

