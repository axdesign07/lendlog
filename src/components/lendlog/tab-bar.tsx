"use client";

import { Users, PieChart } from "lucide-react";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type TabType = "ledger" | "portfolio";

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  t: Translations;
}

export function TabBar({ activeTab, onTabChange, t }: TabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="mx-auto max-w-xl flex">
        <button
          className={cn(
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
            activeTab === "ledger"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("ledger")}
        >
          <Users className="h-5 w-5" />
          {t.friends}
        </button>
        <button
          className={cn(
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
            activeTab === "portfolio"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("portfolio")}
        >
          <PieChart className="h-5 w-5" />
          {t.portfolio}
        </button>
      </div>
    </div>
  );
}
