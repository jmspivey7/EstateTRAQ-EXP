import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { families, accounts, complianceItems, familyUsers } from "@/lib/db/schema";
import { eq, and, gte, inArray } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
import { Users, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function AdvisorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const advisorFamilies = session.user.families.filter(f => f.role === "advisor");
  if (advisorFamilies.length === 0) {
    // Not an advisor — redirect to default family
    if (session.user.families.length > 0) {
      redirect(`/${session.user.families[0].familyId}/dashboard`);
    }
    redirect("/login");
  }

  const familyIds = advisorFamilies.map(f => f.familyId);

  // Get all accounts across families
  const allAccounts = familyIds.length > 0
    ? await db.select().from(accounts).where(inArray(accounts.familyId, familyIds))
    : [];

  const totalAUA = allAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);

  // Get upcoming compliance across all families
  const upcomingDeadlines = familyIds.length > 0
    ? await db.select().from(complianceItems)
        .where(and(
          inArray(complianceItems.familyId, familyIds),
          gte(complianceItems.dueDate, new Date()),
        ))
        .orderBy(complianceItems.dueDate)
        .limit(10)
    : [];

  const overdueCount = upcomingDeadlines.filter(
    d => d.dueDate < new Date()
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <Header
          title={`Welcome back, ${session.user.firstName}`}
          subtitle="Advisor Dashboard"
        />

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Client Families"
              value={String(advisorFamilies.length)}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label="Total Assets Under Advisory"
              value={formatCurrency(totalAUA)}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <StatCard
              label="Upcoming Deadlines"
              value={String(upcomingDeadlines.length)}
              icon={<Calendar className="w-5 h-5" />}
            />
            <StatCard
              label="Overdue Items"
              value={String(overdueCount)}
              changeType={overdueCount > 0 ? "negative" : "neutral"}
              change={overdueCount > 0 ? "Needs attention" : "All clear"}
              icon={<AlertTriangle className="w-5 h-5" />}
            />
          </div>

          {/* Client Families */}
          <div className="rounded-xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-medium">Client Families</h3>
            </div>
            <div className="divide-y divide-border">
              {advisorFamilies.map((fam) => {
                const famAccounts = allAccounts.filter(a => a.familyId === fam.familyId);
                const famTotal = famAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
                const famDeadlines = upcomingDeadlines.filter(d => d.familyId === fam.familyId);

                return (
                  <Link
                    key={fam.familyId}
                    href={`/${fam.familyId}/dashboard`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {fam.familyName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{fam.familyName}</p>
                        <p className="text-sm text-muted-foreground">
                          {famAccounts.length} accounts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(famTotal)}</p>
                      <p className="text-sm text-muted-foreground">
                        {famDeadlines.length} upcoming items
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
