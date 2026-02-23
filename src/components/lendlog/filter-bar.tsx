"use client";

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
    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
      {/* iOS-style segmented control */}
      <div className="inline-flex rounded-xl bg-muted/60 p-1 gap-0.5">
        {(["all", "lent", "borrowed"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={cn(
              "relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all select-none",
              typeFilter === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground active:bg-card/50"
            )}
            onClick={() => onTypeFilterChange(value)}
          >
            {filterLabels[value]}
          </button>
        ))}
      </div>

      <Select
        value={currencyFilter}
        onValueChange={(v) => onCurrencyFilterChange(v as Currency | "all")}
      >
        <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs rounded-xl">
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
