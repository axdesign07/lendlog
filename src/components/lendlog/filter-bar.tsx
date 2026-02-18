"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currency";
import type { Currency, EntryType } from "@/types";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TypeFilter = EntryType | "all";

interface FilterBarProps {
  typeFilter: TypeFilter;
  currencyFilter: Currency | "all";
  t: Translations;
  onTypeFilterChange: (value: TypeFilter) => void;
  onCurrencyFilterChange: (value: Currency | "all") => void;
}

export function FilterBar({
  typeFilter,
  currencyFilter,
  t,
  onTypeFilterChange,
  onCurrencyFilterChange,
}: FilterBarProps) {
  const filterLabels: Record<TypeFilter, string> = {
    all: t.all,
    lent: t.youLent,
    borrowed: t.borrowed,
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
      <div className="flex gap-1">
        {(["all", "lent", "borrowed"] as const).map((value) => (
          <Button
            key={value}
            variant={typeFilter === value ? "default" : "outline"}
            size="sm"
            className={cn("h-8 text-xs", typeFilter === value && "pointer-events-none")}
            onClick={() => onTypeFilterChange(value)}
          >
            {filterLabels[value]}
          </Button>
        ))}
      </div>

      <Select
        value={currencyFilter}
        onValueChange={(v) => onCurrencyFilterChange(v as Currency | "all")}
      >
        <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
          <SelectValue placeholder={t.currency} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.allCurrencies}</SelectItem>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.symbol} {c.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
