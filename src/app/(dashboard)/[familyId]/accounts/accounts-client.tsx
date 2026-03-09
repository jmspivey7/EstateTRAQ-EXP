"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaidLinkButton } from "@/components/plaid/plaid-link-button";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Landmark,
  Building2,
  CreditCard,
  TrendingUp,
  Wallet,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  ArrowUpDown,
  DollarSign,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";

interface AccountData {
  id: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  institutionName: string | null;
  mask: string | null;
  currentBalance: string | null;
  availableBalance: string | null;
  isManual: boolean;
  isHidden: boolean;
  lastSyncedAt: string | null;
}

interface InstitutionGroup {
  institutionName: string;
  lastSynced: string | null;
  accounts: AccountData[];
}

interface AccountsClientProps {
  familyId: string;
  plaidEnabled: boolean;
  canManage: boolean;
  institutionGroups: Record<string, InstitutionGroup>;
  manualAccounts: AccountData[];
  totalAssets: number;
  totalLiabilities: number;
  netBalance: number;
  connectedInstitutions: number;
  totalAccountCount: number;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Wallet,
  savings: Landmark,
  money_market: Landmark,
  cd: Landmark,
  brokerage: TrendingUp,
  retirement: TrendingUp,
  credit_card: CreditCard,
  loan: Building2,
  mortgage: Building2,
  other: DollarSign,
};

const typeLabels: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  money_market: "Money Market",
  cd: "Certificate of Deposit",
  brokerage: "Brokerage",
  retirement: "Retirement",
  credit_card: "Credit Card",
  loan: "Loan",
  mortgage: "Mortgage",
  other: "Other",
};

export function AccountsClient({
  familyId,
  plaidEnabled,
  canManage,
  institutionGroups,
  manualAccounts,
  totalAssets,
  totalLiabilities,
  netBalance,
  connectedInstitutions,
  totalAccountCount,
}: AccountsClientProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (plaidItemId: string) => {
    setSyncing(plaidItemId);
    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, plaidItemId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      // Handle error
    } finally {
      setSyncing(null);
    }
  };

  const handlePlaidSuccess = () => {
    router.refresh();
  };

  const hasAccounts = totalAccountCount > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Assets"
          value={formatCurrency(totalAssets)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="Total Liabilities"
          value={formatCurrency(totalLiabilities)}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(netBalance)}
          changeType={netBalance >= 0 ? "positive" : "negative"}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          label="Connected Institutions"
          value={String(connectedInstitutions)}
          change={`${totalAccountCount} accounts`}
          icon={<Landmark className="w-5 h-5" />}
        />
      </div>

      {/* Connect Account CTA */}
      {canManage && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {hasAccounts ? "Link Another Institution" : "Connect Your First Account"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg">
                {plaidEnabled
                  ? "Securely connect bank accounts, brokerage accounts, and credit cards using Plaid. Your credentials are never stored by EstateTRAQ."
                  : "Plaid integration is not yet configured. Contact your administrator to enable live account connections. In the meantime, seed data accounts are shown below."}
              </p>
            </div>
            {plaidEnabled && (
              <PlaidLinkButton
                familyId={familyId}
                onSuccess={handlePlaidSuccess}
                variant="compact"
              />
            )}
          </div>
        </div>
      )}

      {/* Connected Institutions */}
      {Object.entries(institutionGroups).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Linked Accounts</h2>

          {Object.entries(institutionGroups).map(([itemId, group]) => (
            <div
              key={itemId}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Institution Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{group.institutionName}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.accounts.length} account{group.accounts.length !== 1 ? "s" : ""}
                      {group.lastSynced && (
                        <span className="ml-2">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          Last synced {formatDate(group.lastSynced)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleSync(itemId)}
                    disabled={syncing === itemId}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {syncing === itemId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Sync
                  </button>
                )}
              </div>

              {/* Account Rows */}
              <div className="divide-y divide-border">
                {group.accounts.map((account) => {
                  const Icon = typeIcons[account.type] || DollarSign;
                  const balance = parseFloat(account.currentBalance || "0");
                  const isDebt = ["credit_card", "loan", "mortgage"].includes(account.type);

                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {account.name}
                            {account.mask && (
                              <span className="text-muted-foreground ml-1.5">
                                ····{account.mask}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {typeLabels[account.type] || account.type}
                            {account.subtype &&
                              account.subtype !== account.type &&
                              ` · ${account.subtype}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            isDebt && balance > 0 ? "text-red-400" : "text-foreground"
                          )}
                        >
                          {isDebt && balance > 0 && "-"}
                          {formatCurrency(Math.abs(balance))}
                        </p>
                        {account.availableBalance && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(account.availableBalance)} available
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual / Seed Data Accounts */}
      {manualAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Manual Accounts</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {manualAccounts.map((account) => {
                const Icon = typeIcons[account.type] || DollarSign;
                const balance = parseFloat(account.currentBalance || "0");
                const isDebt = ["credit_card", "loan", "mortgage"].includes(account.type);

                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {account.name}
                          {account.mask && (
                            <span className="text-muted-foreground ml-1.5">····{account.mask}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.institutionName && `${account.institutionName} · `}
                          {typeLabels[account.type] || account.type}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          isDebt && balance > 0 ? "text-red-400" : "text-foreground"
                        )}
                      >
                        {isDebt && balance > 0 && "-"}
                        {formatCurrency(Math.abs(balance))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasAccounts && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Landmark className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-base font-semibold mb-1">No accounts connected yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Connect your bank accounts to see live balances, transactions, and a real-time view
            of your family&apos;s financial position.
          </p>
          {canManage && plaidEnabled && (
            <PlaidLinkButton familyId={familyId} onSuccess={handlePlaidSuccess} />
          )}
        </div>
      )}
    </div>
  );
}
