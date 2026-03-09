"use client";

import { formatCurrency, cn } from "@/lib/utils";
import { Landmark, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  type: string;
  institutionName: string | null;
  currentBalance: string | null;
  mask: string | null;
}

interface AccountsListProps {
  accounts: Account[];
  familyId: string;
}

const typeLabels: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  money_market: "Money Market",
  cd: "CD",
  brokerage: "Brokerage",
  retirement: "Retirement",
  credit_card: "Credit Card",
  loan: "Loan",
  mortgage: "Mortgage",
  other: "Other",
};

export function AccountsList({ accounts, familyId }: AccountsListProps) {
  const totalBalance = accounts
    .filter(a => !["credit_card", "loan", "mortgage"].includes(a.type))
    .reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);

  const totalLiabilities = accounts
    .filter(a => ["credit_card", "loan", "mortgage"].includes(a.type))
    .reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Connected Accounts</h3>
        </div>
        <Link
          href={`/${familyId}/accounts`}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {accounts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            <Landmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No accounts connected yet.</p>
            <Link
              href={`/${familyId}/accounts`}
              className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-xs"
            >
              <Plus className="w-3 h-3" /> Connect an account
            </Link>
          </div>
        ) : (
          <>
            {accounts.slice(0, 6).map((account) => {
              const isLiability = ["credit_card", "loan", "mortgage"].includes(account.type);
              return (
                <div key={account.id} className="px-5 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                      {(account.institutionName || account.name).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.institutionName || typeLabels[account.type] || account.type}
                        {account.mask && ` \u2022\u2022\u2022\u2022${account.mask}`}
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-medium tabular-nums", isLiability && "text-red-400")}>
                    {isLiability ? "-" : ""}{formatCurrency(account.currentBalance)}
                  </span>
                </div>
              );
            })}
            {accounts.length > 6 && (
              <div className="px-5 py-2 text-center">
                <Link href={`/${familyId}/accounts`} className="text-xs text-primary hover:underline">
                  +{accounts.length - 6} more accounts
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
