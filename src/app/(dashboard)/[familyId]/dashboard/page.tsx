import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { families, accounts, holdings, realEstate, oilGasMinerals, insurancePolicies, businessInterests, personalAssets, complianceItems, portfolioSnapshots } from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatCompactCurrency, formatPercent } from "@/lib/utils";
import { Landmark, TrendingUp, Home, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import { StickList } from "./stick-list";
import { AccountsList } from "./accounts-list";

interface DashboardPageProps {
  params: { familyId: string };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions);
  const familyId = params.familyId;

  // Get family info
  const [family] = await db.select().from(families).where(eq(families.id, familyId)).limit(1);

  // Get all accounts for balance aggregation
  const allAccounts = await db.select().from(accounts).where(eq(accounts.familyId, familyId));

  // Calculate total balances by category
  const cashBalance = allAccounts
    .filter(a => ["checking", "savings", "money_market", "cd"].includes(a.type))
    .reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);

  const investmentBalance = allAccounts
    .filter(a => ["brokerage", "retirement"].includes(a.type))
    .reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);

  // Get additional asset values
  const realEstateAssets = await db.select().from(realEstate).where(and(eq(realEstate.familyId, familyId), eq(realEstate.isSold, false)));
  const realEstateValue = realEstateAssets.reduce((sum, a) => sum + parseFloat(a.currentValue || "0"), 0);

  const mineralAssets = await db.select().from(oilGasMinerals).where(eq(oilGasMinerals.familyId, familyId));
  const mineralsValue = mineralAssets.reduce((sum, a) => sum + parseFloat(a.estimatedValue || "0"), 0);

  const insuranceAssets = await db.select().from(insurancePolicies).where(eq(insurancePolicies.familyId, familyId));
  const insuranceValue = insuranceAssets.reduce((sum, a) => sum + parseFloat(a.cashValue || a.coverageAmount || "0"), 0);

  const businessAssets = await db.select().from(businessInterests).where(eq(businessInterests.familyId, familyId));
  const businessValue = businessAssets.reduce((sum, a) => sum + parseFloat(a.estimatedValue || "0"), 0);

  const personalAssetsList = await db.select().from(personalAssets).where(eq(personalAssets.familyId, familyId));
  const personalValue = personalAssetsList.reduce((sum, a) => sum + parseFloat(a.estimatedValue || "0"), 0);

  const totalNetWorth = cashBalance + investmentBalance + realEstateValue + mineralsValue + insuranceValue + businessValue + personalValue;

  // Get upcoming compliance items
  const upcomingCompliance = await db
    .select()
    .from(complianceItems)
    .where(
      and(
        eq(complianceItems.familyId, familyId),
        gte(complianceItems.dueDate, new Date()),
      )
    )
    .orderBy(complianceItems.dueDate)
    .limit(5);

  // Get portfolio history for chart
  const history = await db
    .select()
    .from(portfolioSnapshots)
    .where(eq(portfolioSnapshots.familyId, familyId))
    .orderBy(portfolioSnapshots.date)
    .limit(365);

  // Allocation data for donut chart
  const allocation = [
    { name: "Cash", value: cashBalance, color: "#3b82f6" },
    { name: "Investments", value: investmentBalance, color: "#8b5cf6" },
    { name: "Real Estate", value: realEstateValue, color: "#10b981" },
    { name: "Business", value: businessValue, color: "#f59e0b" },
    { name: "Minerals", value: mineralsValue, color: "#ef4444" },
    { name: "Insurance", value: insuranceValue, color: "#06b6d4" },
    { name: "Personal", value: personalValue, color: "#ec4899" },
  ].filter(a => a.value > 0);

  const greeting = session?.user?.firstName
    ? `Welcome back, ${session.user.firstName}`
    : "Dashboard";

  return (
    <div>
      <Header
        title={greeting}
        subtitle={`${family?.name || "Family"} \u2014 ${family?.mode === "estate" ? "Estate Administration" : "Lifetime Management"}`}
      />

      <div className="p-6 space-y-6">
        {/* Net Worth and Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Net Worth"
            value={formatCurrency(totalNetWorth)}
            change="+2.3% vs last month"
            changeType="positive"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            label="Cash & Banking"
            value={formatCurrency(cashBalance)}
            icon={<Landmark className="w-5 h-5" />}
          />
          <StatCard
            label="Investments"
            value={formatCurrency(investmentBalance)}
            change="+1.8% today"
            changeType="positive"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            label="Real Estate"
            value={formatCurrency(realEstateValue)}
            icon={<Home className="w-5 h-5" />}
          />
        </div>

        {/* Charts Row */}
        <DashboardCharts
          history={history.map(h => ({
            date: h.date.toISOString().split("T")[0],
            value: parseFloat(h.totalValue),
          }))}
          allocation={allocation}
          totalNetWorth={totalNetWorth}
        />

        {/* Stick List + Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StickList items={upcomingCompliance} familyId={familyId} />
          <AccountsList accounts={allAccounts} familyId={familyId} />
        </div>
      </div>
    </div>
  );
}
