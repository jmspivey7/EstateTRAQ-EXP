import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { exchangePublicToken, getAccounts, isPlaidConfigured } from "@/lib/plaid/client";
import { db } from "@/lib/db";
import { plaidItems, accounts } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid not configured" }, { status: 503 });
  }

  try {
    const { publicToken, familyId, institutionName, institutionId } = await req.json();

    if (!publicToken || !familyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user has access to this family
    const membership = session.user.families.find(f => f.familyId === familyId);
    if (!membership || membership.role === "family_viewer") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Exchange token
    const { accessToken, itemId } = await exchangePublicToken(publicToken);

    // Store Plaid item
    const [plaidItem] = await db.insert(plaidItems).values({
      familyId,
      accessToken,
      itemId,
      institutionId: institutionId || null,
      institutionName: institutionName || null,
      lastSyncedAt: new Date(),
    }).returning();

    // Fetch and store accounts
    const plaidAccounts = await getAccounts(accessToken);

    for (const acct of plaidAccounts) {
      const typeMap: Record<string, string> = {
        depository: acct.subtype === "savings" ? "savings" : acct.subtype === "money market" ? "money_market" : acct.subtype === "cd" ? "cd" : "checking",
        investment: acct.subtype === "401k" || acct.subtype === "ira" ? "retirement" : "brokerage",
        credit: "credit_card",
        loan: acct.subtype === "mortgage" ? "mortgage" : "loan",
      };

      await db.insert(accounts).values({
        familyId,
        plaidItemId: plaidItem.id,
        plaidAccountId: acct.account_id,
        name: acct.name,
        officialName: acct.official_name,
        type: (typeMap[acct.type] || "other") as any,
        subtype: acct.subtype,
        institutionName: institutionName || null,
        mask: acct.mask,
        currentBalance: String(acct.balances.current || 0),
        availableBalance: acct.balances.available ? String(acct.balances.available) : null,
        lastSyncedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, accountCount: plaidAccounts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
