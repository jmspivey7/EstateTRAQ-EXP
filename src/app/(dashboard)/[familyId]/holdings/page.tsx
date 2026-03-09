import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { holdings, accounts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, PieChart, ArrowUpDown } from "lucide-react";
import { HoldingsTable } from "./holdings-table";

interface HoldingsPageProps {
  params: { familyId: string };
}

export default async function HoldingsPage({ params }: HoldingsPageProps) {
  const familyId = params.familyId;

  // Get all holdings
  const allHoldings = await db
    .select()
    .from(holdings)
    .where(eq(holdings.familyId, familyId))
    .orderBy(desc(holdings.updatedAt));

  // Get brokerage/retirement accounts for context
  const investmentAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.familyId, familyId));

  const brokerageAccounts = investmentAccounts.filter(
    (a) => a.type === "brokerage" || a.type === "retirement"
  );

  // Compute portfolio metrics
  const totalMarketValue = allHoldings.reduce((sum, h) => {
    const shares = parseFloat(h.shares);
    const price = parseFloat(h.currentPrice || "0");
    return sum + shares * price;
  }, 0);

  const totalCostBasis = allHoldings.reduce((sum, h) => {
    return sum + parseFloat(h.costBasis || "0");
  }, 0);

  const totalGainLoss = totalMarketValue - totalCostBasis;
  const totalGainLossPercent =
    totalCostBasis > 0 ? ((totalGainLoss / totalCostBasis) * 100) : 0;

  const totalDayChange = allHoldings.reduce((sum, h) => {
    const shares = parseFloat(h.shares);
    const dayChg = parseFloat(h.dayChange || "0");
    return sum + shares * dayChg;
  }, 0);

  // Serialize for client component
  const holdingsData = allHoldings.map((h) => ({
    id: h.id,
    symbol: h.symbol,
    name: h.name,
    shares: parseFloat(h.shares),
    currentPrice: parseFloat(h.currentPrice || "0"),
    previousClose: parseFloat(h.previousClose || "0"),
    costBasis: parseFloat(h.costBasis || "0"),
    dayChange: parseFloat(h.dayChange || "0"),
    dayChangePercent: parseFloat(h.dayChangePercent || "0"),
    marketValue: parseFloat(h.shares) * parseFloat(h.currentPrice || "0"),
    gainLoss:
      parseFloat(h.shares) * parseFloat(h.currentPrice || "0") -
      parseFloat(h.costBasis || "0"),
    gainLossPercent:
      parseFloat(h.costBasis || "0") > 0
        ? ((parseFloat(h.shares) * parseFloat(h.currentPrice || "0") -
            parseFloat(h.costBasis || "0")) /
            parseFloat(h.costBasis || "0")) *
          100
        : 0,
    lastUpdated: h.lastUpdated?.toISOString() || null,
  }));

  return (
    <div>
      <Header title="Market Investments" subtitle="Portfolio holdings and performance" />

      <div className="p-6 space-y-6">
        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Market Value"
            value={formatCurrency(totalMarketValue)}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <StatCard
            label="Total Cost Basis"
            value={formatCurrency(totalCostBasis)}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            label="Total Gain/Loss"
            value={formatCurrency(totalGainLoss)}
            change={formatPercent(totalGainLossPercent)}
            changeType={totalGainLoss >= 0 ? "positive" : "negative"}
            icon={
              totalGainLoss >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )
            }
          />
          <StatCard
            label="Day Change"
            value={formatCurrency(totalDayChange)}
            changeType={totalDayChange >= 0 ? "positive" : "negative"}
            icon={<ArrowUpDown className="w-5 h-5" />}
          />
        </div>

        {/* Holdings Table */}
        {holdingsData.length > 0 ? (
          <HoldingsTable holdings={holdingsData} />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <PieChart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-1">No investment holdings yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect a brokerage or retirement account through Plaid, or add holdings manually
              to track your investment portfolio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
