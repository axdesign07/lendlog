"use client";

import { Plus, Check, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Ledger } from "@/hooks/use-ledger";
import type { Translations } from "@/lib/i18n";

interface LedgerSelectorProps {
  ledgers: Ledger[];
  selectedLedgerId: string | null;
  friendNames: Map<string, string>;
  t: Translations;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onJoinNew: () => void;
}

export function LedgerSelector({
  ledgers,
  selectedLedgerId,
  friendNames,
  t,
  onSelect,
  onCreateNew,
  onJoinNew,
}: LedgerSelectorProps) {
  const currentName = selectedLedgerId
    ? friendNames.get(selectedLedgerId) || "Friend"
    : "Friend";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-1 px-2.5 text-xl font-bold tracking-tight"
        >
          {currentName}
          {ledgers.length > 1 && <ChevronDown className="h-4 w-4 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {ledgers.map((ledger) => {
          const name = friendNames.get(ledger.id) || "Friend";
          const isWaiting = !ledger.user2Id;
          return (
            <DropdownMenuItem
              key={ledger.id}
              onClick={() => onSelect(ledger.id)}
              className="gap-2"
            >
              <span className="flex-1 truncate">
                {name}
                {isWaiting && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({t.waitingForFriend.replace("...", "")})
                  </span>
                )}
              </span>
              {ledger.id === selectedLedgerId && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          {t.addFriend}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onJoinNew} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t.joinLedger}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
