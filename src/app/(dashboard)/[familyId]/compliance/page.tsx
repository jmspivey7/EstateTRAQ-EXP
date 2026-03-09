import { db } from "@/lib/db";
import { complianceItems } from "@/lib/db/schema";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface CompliancePageProps {
  params: { familyId: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  overdue: { label: "Overdue", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle },
  due_soon: { label: "Due Soon", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  upcoming: { label: "Upcoming", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Calendar },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: XCircle },
};

const typeLabels: Record<string, string> = {
  property_tax: "Property Tax",
  estimated_tax: "Estimated Tax",
  insurance_premium: "Insurance Premium",
  rmd: "Required Minimum Distribution",
  trust_reporting: "Trust Reporting",
  legal_filing: "Legal Filing",
  license_renewal: "License/Renewal",
  other: "Other",
};

export default async function CompliancePage({ params }: CompliancePageProps) {
  const familyId = params.familyId;

  const allItems = await db
    .select()
    .from(complianceItems)
    .where(eq(complianceItems.familyId, familyId))
    .orderBy(complianceItems.dueDate);

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const overdueItems = allItems.filter(
    (i) => i.status === "overdue" || (i.dueDate < now && i.status !== "completed" && i.status !== "dismissed")
  );
  const dueSoonItems = allItems.filter(
    (i) =>
      (i.status === "due_soon" || (i.dueDate >= now && i.dueDate <= thirtyDaysFromNow)) &&
      i.status !== "completed" &&
      i.status !== "dismissed"
  );
  const upcomingItems = allItems.filter(
    (i) => i.dueDate > thirtyDaysFromNow && i.status !== "completed" && i.status !== "dismissed"
  );
  const completedItems = allItems.filter((i) => i.status === "completed");

  const totalDueAmount = [...overdueItems, ...dueSoonItems].reduce(
    (sum, i) => sum + parseFloat(i.amount || "0"),
    0
  );

  const renderItems = (items: typeof allItems, emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground px-5 py-4">{emptyMessage}</p>
      );
    }

    return (
      <div className="divide-y divide-border">
        {items.map((item) => {
          const daysUntil = Math.ceil(
            (item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isOverdue = daysUntil < 0;
          const config = statusConfig[item.status] || statusConfig.upcoming;
          const StatusIcon = config.icon;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isOverdue
                      ? "bg-red-500/10"
                      : daysUntil <= 30
                      ? "bg-amber-500/10"
                      : "bg-accent"
                  )}
                >
                  <StatusIcon
                    className={cn(
                      "w-4 h-4",
                      isOverdue
                        ? "text-red-400"
                        : daysUntil <= 30
                        ? "text-amber-400"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{typeLabels[item.type] || item.type}</span>
                    <span>·</span>
                    <span
                      className={cn(
                        isOverdue && "text-red-400 font-medium",
                        !isOverdue && daysUntil <= 7 && "text-amber-400 font-medium"
                      )}
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntil)} days overdue`
                        : daysUntil === 0
                        ? "Due today"
                        : daysUntil === 1
                        ? "Due tomorrow"
                        : `Due in ${daysUntil} days`}
                    </span>
                    {item.recurrence !== "once" && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{item.recurrence}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 ml-4">
                {item.amount && parseFloat(item.amount) > 0 && (
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(item.dueDate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <Header title="Compliance Calendar" subtitle="Deadlines, obligations, and required actions" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Overdue"
            value={String(overdueItems.length)}
            changeType={overdueItems.length > 0 ? "negative" : "neutral"}
            change={overdueItems.length > 0 ? "Requires attention" : "All clear"}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <StatCard
            label="Due Within 30 Days"
            value={String(dueSoonItems.length)}
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            label="Upcoming Amount Due"
            value={formatCurrency(totalDueAmount)}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            label="Completed This Year"
            value={String(completedItems.length)}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
        </div>

        {/* Overdue */}
        {overdueItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Overdue ({overdueItems.length})
            </h2>
            <div className="rounded-xl border border-red-500/20 bg-card overflow-hidden">
              {renderItems(overdueItems, "")}
            </div>
          </div>
        )}

        {/* Due Soon */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Due Within 30 Days ({dueSoonItems.length})
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {renderItems(dueSoonItems, "No items due in the next 30 days.")}
          </div>
        </div>

        {/* Upcoming */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Upcoming ({upcomingItems.length})
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {renderItems(upcomingItems, "No upcoming items scheduled.")}
          </div>
        </div>

        {/* Completed */}
        {completedItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Completed ({completedItems.length})
            </h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden opacity-75">
              {renderItems(completedItems, "")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
