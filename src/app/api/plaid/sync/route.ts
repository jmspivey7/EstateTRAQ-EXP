import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { plaidItems, accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getBalances, isPlaidConfigured } from "@/lib/plaid/client";

/**
 * POST /api/plaid/sync
 * Re-syncs account balances from Plaid for a given plaidItemId.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid not configured" }, { status: 503 });
  }

  try {
    const { familyId, plaidItemId } = await req.json();

    if (!familyId || !plaidItemId) {
      return NextResponse.json({ error: "Missing familyId or plaidItemId" }, { status: 400 });
    }

    // Verify user has manage access
    const membership = session.user.families.find((f: any) => f.familyId === familyId);
    if (!membership || membership.role === "family_viewer") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get the Plaid item
    const [item] = await db
      .select()
      .from(plaidItems)
      .where(and(eq(plaidItems.id, plaidItemId), eq(plaidItems.familyId, familyId)))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Plaid item not found" }, { status: 404 });
    }

    // Fetch fresh balances from Plaid
    const freshAccounts = await getBalances(item.accessToken);

    // Update each account's balance
    let updatedCount = 0;
    for (const plaidAcct of freshAccounts) {
      const result = await db
        .update(accounts)
        .set({
          currentBalance: String(plaidAcct.balances.current || 0),
          availableBalance: plaidAcct.balances.available
            ? String(plaidAcct.balances.available)
            : null,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accounts.plaidAccountId, plaidAcct.account_id),
            eq(accounts.familyId, familyId)
          )
        );
      updatedCount++;
    }

    // Update the plaid item's last synced timestamp
    await db
      .update(plaidItems)
      .set({ lastSyncedAt: new Date() })
      .where(eq(plaidItems.id, plaidItemId));

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
