"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  href?: string;
}

export function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {change && (
          <div className={cn(
            "flex items-center gap-1 mt-1 text-sm",
            changeType === "positive" && "text-green-500",
            changeType === "negative" && "text-red-500",
            changeType === "neutral" && "text-muted-foreground",
          )}>
            {changeType === "positive" && <ArrowUp className="w-3.5 h-3.5" />}
            {changeType === "negative" && <ArrowDown className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
