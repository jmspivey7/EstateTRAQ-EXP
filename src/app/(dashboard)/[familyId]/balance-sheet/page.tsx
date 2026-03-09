import { db } from "@/lib/db";
import {
  families,
  accounts,
  holdings,
  realEstate,
  oilGasMinerals,
  insurancePolicies,
  businessInterests,
  personalAssets,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Landmark,
  TrendingUp,
  Home,
  Droplets,
  Shield,
  Building2,
  Gem,
  CreditCard,
  DollarSign,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

interface BalanceSheetPageProps {
  params: { familyId: string };
}

export default async function BalanceSheetPage({ params }: BalanceSheetPageProps) {
  const familyId = params.familyId;

  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  // === FETCH ALL DATA ===
  const allAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.familyId, familyId));

  const allHoldings = await db
    .select()
    .from(holdings)
    .where(eq(holdings.familyId, familyId));

  const allRealEstate = await db
    .select()
    .from(realEstate)
    .where(and(eq(realEstate.familyId, familyId), eq(realEstate.isSold, false)));

  const allMinerals = await db
    .select()
    .from(oilGasMinerals)
    .where(eq(oilGasMinerals.familyId, familyId));

  const allInsurance = await db
    .select()
    .from(insurancePolicies)
    .where(eq(insurancePolicies.familyId, familyId));

  const allBusiness = await db
    .select()
    .from(businessInterests)
    .where(eq(businessInterests.familyId, familyId));

  const allPersonal = await db
    .select()
    .from(personalAssets)
    .where(eq(personalAssets.familyId, familyId));

  // === COMPUTE ASSETS ===
  const cashAccounts = allAccounts.filter((a) =>
    ["checking", "savings", "money_market", "cd"].includes(a.type)
  );
  const cashTotal = cashAccounts.reduce(
    (sum, a) => sum + parseFloat(a.currentBalance || "0"),
    0
  );

  const investmentAccounts = allAccounts.filter((a) =>
    ["brokerage", "retirement"].includes(a.type)
  );
  const investmentAccountTotal = investmentAccounts.reduce(
    (sum, a) => sum + parseFloat(a.currentBalance || "0"),
    0
  );

  // Holdings market value (individual stock positions)
  const holdingsMarketValue = allHoldings.reduce(
    (sum, h) => sum + parseFloat(h.shares) * parseFloat(h.currentPrice || "0"),
    0
  );

  const realEstateTotal = allRealEstate.reduce(
    (sum, p) => sum + parseFloat(p.currentValue || "0"),
    0
  );

  const mineralsTotal = allMinerals.reduce(
    (sum, m) => sum + parseFloat(m.estimatedValue || "0"),
    0
  );

  const insuranceCashValue = allInsurance.reduce(
    (sum, p) => sum + parseFloat(p.cashValue || "0"),
    0
  );

  const businessTotal = allBusiness.reduce(
    (sum, b) => sum + parseFloat(b.estimatedValue || "0"),
    0
  );

  const personalTotal = allPersonal.reduce(
    (sum, a) => sum + parseFloat(a.estimatedValue || "0"),
    0
  );

  const totalAssets =
    cashTotal +
    investmentAccountTotal +
    realEstateTotal +
    mineralsTotal +
    insuranceCashValue +
    businessTotal +
    personalTotal;

  // === COMPUTE LIABILITIES ===
  const creditCards = allAccounts.filter((a) => a.type === "credit_card");
  const creditCardTotal = creditCards.reduce(
    (sum, a) => sum + Math.abs(parseFloat(a.currentBalance || "0")),
    0
  );

  const loans = allAccounts.filter((a) => a.type === "loan");
  const loanTotal = loans.reduce(
    (sum, a) => sum + Math.abs(parseFloat(a.currentBalance || "0")),
    0
  );

  const mortgages = allAccounts.filter((a) => a.type === "mortgage");
  const mortgageTotal = mortgages.reduce(
    (sum, a) => sum + Math.abs(parseFloat(a.currentBalance || "0")),
    0
  );

  const totalLiabilities = creditCardTotal + loanTotal + mortgageTotal;
  const netWorth = totalAssets - totalLiabilities;

  // Get today's date formatted
  const asOfDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <Header
        title="Balance Sheet"
        subtitle={`${family?.name || "Family"} — As of ${asOfDate}`}
      />

      <div className="p-6 max-w-4xl">
        {/* Net Worth Banner */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Total Net Worth
              </p>
              <p className="text-4xl font-bold tracking-tight mt-1">
                {formatCurrency(netWorth)}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Assets</p>
                  <p className="text-lg font-semibold text-green-500">
                    {formatCurrency(totalAssets)}
                  </p>
                </div>
                <div className="text-2xl text-muted-foreground/30">−</div>
                <div>
                  <p className="text-xs text-muted-foreground">Liabilities</p>
                  <p className="text-lg font-semibold text-red-400">
                    {formatCurrency(totalLiabilities)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="space-y-8">
          {/* ====== ASSETS ====== */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ArrowUp className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-bold">Assets</h2>
              <span className="ml-auto text-lg font-bold text-green-500">
                {formatCurrency(totalAssets)}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {/* Cash & Banking */}
              <BalanceSheetSection
                icon={<Landmark className="w-4 h-4" />}
                title="Cash & Banking"
                total={cashTotal}
                items={cashAccounts.map((a) => ({
                  name: a.name,
                  detail: a.institutionName || "",
                  value: parseFloat(a.currentBalance || "0"),
                }))}
              />

              {/* Investment Accounts */}
              <BalanceSheetSection
                icon={<TrendingUp className="w-4 h-4" />}
                title="Investment Accounts"
                total={investmentAccountTotal}
                items={investmentAccounts.map((a) => ({
                  name: a.name,
                  detail: a.institutionName || "",
                  value: parseFloat(a.currentBalance || "0"),
                }))}
              />

              {/* Real Estate */}
              {allRealEstate.length > 0 && (
                <BalanceSheetSection
                  icon={<Home className="w-4 h-4" />}
                  title="Real Estate"
                  total={realEstateTotal}
                  items={allRealEstate.map((p) => ({
                    name: p.name,
                    detail: [p.city, p.state].filter(Boolean).join(", "),
                    value: parseFloat(p.currentValue || "0"),
                  }))}
                />
              )}

              {/* Oil, Gas & Minerals */}
              {allMinerals.length > 0 && (
                <BalanceSheetSection
                  icon={<Droplets className="w-4 h-4" />}
                  title="Oil, Gas & Minerals"
                  total={mineralsTotal}
                  items={allMinerals.map((m) => ({
                    name: m.name,
                    detail: m.location || "",
                    value: parseFloat(m.estimatedValue || "0"),
                  }))}
                />
              )}

              {/* Business Interests */}
              {allBusiness.length > 0 && (
                <BalanceSheetSection
                  icon={<Building2 className="w-4 h-4" />}
                  title="Business Interests"
                  total={businessTotal}
                  items={allBusiness.map((b) => ({
                    name: b.entityName,
                    detail: `${b.entityType} · ${parseFloat(b.ownershipPercent || "0")}% ownership`,
                    value: parseFloat(b.estimatedValue || "0"),
                  }))}
                />
              )}

              {/* Insurance (Cash Value) */}
              {insuranceCashValue > 0 && (
                <BalanceSheetSection
                  icon={<Shield className="w-4 h-4" />}
                  title="Insurance (Cash Value)"
                  total={insuranceCashValue}
                  items={allInsurance
                    .filter((p) => parseFloat(p.cashValue || "0") > 0)
                    .map((p) => ({
                      name: `${p.carrier} - ${p.type.replace("_", " ")}`,
                      detail: p.insured || "",
                      value: parseFloat(p.cashValue || "0"),
                    }))}
                />
              )}

              {/* Personal Assets */}
              {allPersonal.length > 0 && (
                <BalanceSheetSection
                  icon={<Gem className="w-4 h-4" />}
                  title="Personal Assets"
                  total={personalTotal}
                  items={allPersonal.map((a) => ({
                    name: a.name,
                    detail: a.category,
                    value: parseFloat(a.estimatedValue || "0"),
                  }))}
                />
              )}
            </div>
          </div>

          {/* ====== LIABILITIES ====== */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ArrowDown className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-bold">Liabilities</h2>
              <span className="ml-auto text-lg font-bold text-red-400">
                {totalLiabilities > 0
                  ? `(${formatCurrency(totalLiabilities)})`
                  : formatCurrency(0)}
              </span>
            </div>

            {totalLiabilities > 0 ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                {mortgageTotal > 0 && (
                  <BalanceSheetSection
                    icon={<Home className="w-4 h-4" />}
                    title="Mortgages"
                    total={mortgageTotal}
                    isLiability
                    items={mortgages.map((a) => ({
                      name: a.name,
                      detail: a.institutionName || "",
                      value: Math.abs(parseFloat(a.currentBalance || "0")),
                    }))}
                  />
                )}

                {loanTotal > 0 && (
                  <BalanceSheetSection
                    icon={<Building2 className="w-4 h-4" />}
                    title="Loans"
                    total={loanTotal}
                    isLiability
                    items={loans.map((a) => ({
                      name: a.name,
                      detail: a.institutionName || "",
                      value: Math.abs(parseFloat(a.currentBalance || "0")),
                    }))}
                  />
                )}

                {creditCardTotal > 0 && (
                  <BalanceSheetSection
                    icon={<CreditCard className="w-4 h-4" />}
                    title="Credit Cards"
                    total={creditCardTotal}
                    isLiability
                    items={creditCards.map((a) => ({
                      name: a.name,
                      detail: a.institutionName || "",
                      value: Math.abs(parseFloat(a.currentBalance || "0")),
                    }))}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  No outstanding liabilities recorded.
                </p>
              </div>
            )}
          </div>

          {/* ====== NET WORTH SUMMARY ====== */}
          <div className="rounded-xl border-2 border-primary/40 bg-card overflow-hidden">
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-muted-foreground">Total Assets</span>
                <span className="text-sm font-semibold tabular-nums text-green-500">
                  {formatCurrency(totalAssets)}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-3">
                <span className="text-sm text-muted-foreground">Total Liabilities</span>
                <span className="text-sm font-semibold tabular-nums text-red-400">
                  ({formatCurrency(totalLiabilities)})
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-primary/5">
                <span className="text-base font-bold">Net Worth</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatCurrency(netWorth)}
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center pb-4">
            Values are based on last available data. Investment account balances reflect aggregate
            account values. Real estate and business valuations are based on most recent appraisals
            or estimates. Insurance values reflect cash surrender value only, not death benefit.
          </p>
        </div>
      </div>
    </div>
  );
}

// === Section Component ===

interface BalanceSheetSectionProps {
  icon: React.ReactNode;
  title: string;
  total: number;
  items: { name: string; detail: string; value: number }[];
  isLiability?: boolean;
}

function BalanceSheetSection({
  icon,
  title,
  total,
  items,
  isLiability = false,
}: BalanceSheetSectionProps) {
  return (
    <div>
      {/* Category Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            isLiability ? "text-red-400" : "text-foreground"
          )}
        >
          {formatCurrency(total)}
        </span>
      </div>

      {/* Line Items */}
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-5 py-2.5 pl-12"
        >
          <div className="min-w-0">
            <p className="text-sm truncate">{item.name}</p>
            {item.detail && (
              <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
            )}
          </div>
          <span className="text-sm tabular-nums text-muted-foreground shrink-0 ml-4">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
