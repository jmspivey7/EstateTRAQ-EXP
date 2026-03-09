import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { accounts, plaidItems, transactions } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { AccountsClient } from "./accounts-client";

interface AccountsPageProps {
  params: { familyId: string };
}

export default async function AccountsPage({ params }: AccountsPageProps) {
  const session = await getServerSession(authOptions);
  const familyId = params.familyId;
  const plaidEnabled = isPlaidConfigured();

  // Get user's role for this family
  const membership = session?.user?.families?.find(
    (f: any) => f.familyId === familyId
  );
  const canManage = membership?.role !== "family_viewer";

  // Get all Plaid items (connected institutions) for this family
  const connectedItems = await db
    .select()
    .from(plaidItems)
    .where(eq(plaidItems.familyId, familyId))
    .orderBy(desc(plaidItems.createdAt));

  // Get all accounts grouped by institution
  const allAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.familyId, familyId))
    .orderBy(accounts.institutionName, accounts.name);

  // Group accounts by institution
  const manualAccounts = allAccounts.filter((a) => a.isManual);
  const linkedAccounts = allAccounts.filter((a) => !a.isManual);

  // Group linked accounts by plaidItemId
  const institutionGroups: Record<
    string,
    {
      institutionName: string;
      lastSynced: Date | null;
      accounts: typeof allAccounts;
    }
  > = {};

  for (const acct of linkedAccounts) {
    const key = acct.plaidItemId || "manual";
    if (!institutionGroups[key]) {
      const item = connectedItems.find((i) => i.id === acct.plaidItemId);
      institutionGroups[key] = {
        institutionName: acct.institutionName || "Unknown Institution",
        lastSynced: item?.lastSyncedAt || null,
        accounts: [],
      };
    }
    institutionGroups[key].accounts.push(acct);
  }

  // Calculate totals
  const totalAssets = allAccounts
    .filter(
      (a) =>
        !["credit_card", "loan", "mortgage"].includes(a.type) &&
        parseFloat(a.currentBalance || "0") > 0
    )
    .reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);

  const totalLiabilities = allAccounts
    .filter((a) => ["credit_card", "loan", "mortgage"].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(parseFloat(a.currentBalance || "0")), 0);

  const netBalance = totalAssets - totalLiabilities;

  return (
    <div>
      <Header title="Connected Accounts" subtitle="Manage linked financial accounts" />

      <AccountsClient
        familyId={familyId}
        plaidEnabled={plaidEnabled}
        canManage={canManage}
        institutionGroups={JSON.parse(JSON.stringify(institutionGroups))}
        manualAccounts={JSON.parse(JSON.stringify(manualAccounts))}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        netBalance={netBalance}
        connectedInstitutions={connectedItems.length}
        totalAccountCount={allAccounts.length}
      />
    </div>
  );
}
