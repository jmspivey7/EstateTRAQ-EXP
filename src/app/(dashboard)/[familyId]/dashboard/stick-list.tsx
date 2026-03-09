"use client";

import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Calendar, AlertTriangle, CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ComplianceItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: Date;
  amount: string | null;
  actionUrl: string | null;
}

interface StickListProps {
  items: ComplianceItem[];
  familyId: string;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyClass(days: number): string {
  if (days < 0) return "text-red-500 bg-red-500/10";
  if (days <= 7) return "text-amber-500 bg-amber-500/10";
  if (days <= 30) return "text-blue-500 bg-blue-500/10";
  return "text-muted-foreground bg-muted";
}

export function StickList({ items, familyId }: StickListProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Today&apos;s Stick List</h3>
        </div>
        <Link
          href={`/${familyId}/compliance`}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
            <p>All caught up. Nothing due today.</p>
          </div>
        ) : (
          items.map((item) => {
            const days = getDaysUntil(item.dueDate);
            const urgency = getUrgencyClass(days);
            const label =
              days < 0 ? `${Math.abs(days)}d overdue` :
              days === 0 ? "Due today" :
              days === 1 ? "Due tomorrow" :
              `${days}d`;

            return (
              <div key={item.id} className="px-5 py-3 flex items-center gap-4 hover:bg-accent/50 transition-colors">
                <div className={cn("shrink-0 px-2 py-0.5 rounded text-xs font-medium", urgency)}>
                  {label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.amount && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.amount)}</p>
                  )}
                </div>
                {item.actionUrl && (
                  <a
                    href={item.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1 transition-colors"
                  >
                    Pay <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
