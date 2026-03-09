import { db } from "@/lib/db";
import { heirs, distributions, families } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Users,
  User,
  Heart,
  Baby,
  UserPlus,
  DollarSign,
  CheckCircle2,
  Clock,
  Scale,
} from "lucide-react";

interface HeirsPageProps {
  params: { familyId: string };
}

const heirTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  original: User,
  spouse: Heart,
  child: Users,
  grandchild: Baby,
  other: UserPlus,
};

const distributionStatusColors: Record<string, string> = {
  planned: "bg-blue-500/10 text-blue-400",
  approved: "bg-amber-500/10 text-amber-400",
  distributed: "bg-green-500/10 text-green-400",
  cancelled: "bg-gray-500/10 text-gray-400",
};

export default async function HeirsPage({ params }: HeirsPageProps) {
  const familyId = params.familyId;

  // Get family info for mode check
  const [family] = await db.select().from(families).where(eq(families.id, familyId)).limit(1);

  const allHeirs = await db
    .select()
    .from(heirs)
    .where(eq(heirs.familyId, familyId))
    .orderBy(heirs.heirType, heirs.lastName);

  const allDistributions = await db
    .select()
    .from(distributions)
    .where(eq(distributions.familyId, familyId))
    .orderBy(desc(distributions.createdAt));

  // Calculate total share percentages
  const totalSharePercent = allHeirs.reduce(
    (sum, h) => sum + parseFloat(h.sharePercent || "0"),
    0
  );

  const totalDistributed = allDistributions
    .filter((d) => d.status === "distributed")
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const totalPlanned = allDistributions
    .filter((d) => d.status === "planned" || d.status === "approved")
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  return (
    <div>
      <Header
        title="Estate Administration"
        subtitle={
          family?.mode === "estate"
            ? "Manage heirs, distributions, and estate proceedings"
            : "Plan beneficiary designations and future distributions"
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Beneficiaries"
            value={String(allHeirs.length)}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Share Allocated"
            value={`${totalSharePercent.toFixed(1)}%`}
            change={
              totalSharePercent < 100
                ? `${(100 - totalSharePercent).toFixed(1)}% unallocated`
                : "Fully allocated"
            }
            changeType={Math.abs(totalSharePercent - 100) < 0.1 ? "positive" : "neutral"}
            icon={<Scale className="w-5 h-5" />}
          />
          <StatCard
            label="Distributed"
            value={formatCurrency(totalDistributed)}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="Planned/Pending"
            value={formatCurrency(totalPlanned)}
            icon={<Clock className="w-5 h-5" />}
          />
        </div>

        {/* Heirs List */}
        {allHeirs.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Beneficiaries</h2>
              <button className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <UserPlus className="w-4 h-4" />
                Add Beneficiary
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allHeirs.map((heir) => {
                const Icon = heirTypeIcons[heir.heirType] || User;
                const heirDistributions = allDistributions.filter(
                  (d) => d.heirId === heir.id
                );
                const heirDistributed = heirDistributions
                  .filter((d) => d.status === "distributed")
                  .reduce((sum, d) => sum + parseFloat(d.amount), 0);

                return (
                  <div
                    key={heir.id}
                    className={cn(
                      "rounded-xl border border-border bg-card p-5 space-y-3",
                      heir.isDisclaimed && "opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {heir.firstName} {heir.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {heir.relationship}
                          </p>
                        </div>
                      </div>
                      {heir.isDisclaimed && (
                        <span className="text-xs text-red-400 font-medium">Disclaimed</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Share</p>
                        <p className="text-sm font-semibold">
                          {heir.sharePercent
                            ? `${parseFloat(heir.sharePercent).toFixed(1)}%`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Distributed</p>
                        <p className="text-sm font-medium">
                          {heirDistributed > 0
                            ? formatCurrency(heirDistributed)
                            : "None yet"}
                        </p>
                      </div>
                    </div>

                    {heir.email && (
                      <p className="text-xs text-muted-foreground truncate">{heir.email}</p>
                    )}

                    {heir.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2">
                        {heir.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-1">No beneficiaries added yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add heirs and beneficiaries to track share allocations and manage estate
              distributions.
            </p>
          </div>
        )}

        {/* Recent Distributions */}
        {allDistributions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Distribution History</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {allDistributions.slice(0, 10).map((dist) => {
                  const heir = allHeirs.find((h) => h.id === dist.heirId);
                  const statusColor =
                    distributionStatusColors[dist.status] || "bg-gray-500/10 text-gray-400";

                  return (
                    <div
                      key={dist.id}
                      className="flex items-center justify-between px-5 py-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {dist.description || "Distribution"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            To {heir ? `${heir.firstName} ${heir.lastName}` : "Unknown"}
                            {dist.distributionDate && ` · ${formatDate(dist.distributionDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            statusColor
                          )}
                        >
                          {dist.status}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(dist.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
