/**
 * Plaid Integration Module
 *
 * This module handles all Plaid API interactions.
 * Set these environment variables to activate:
 *   PLAID_CLIENT_ID
 *   PLAID_SECRET
 *   PLAID_ENV (sandbox | development | production)
 *
 * In sandbox mode, Plaid provides test credentials:
 *   Username: user_good
 *   Password: pass_good
 *
 * See: https://plaid.com/docs/sandbox/
 */

export interface PlaidConfig {
  clientId: string;
  secret: string;
  env: "sandbox" | "development" | "production";
  baseUrl: string;
}

function getPlaidConfig(): PlaidConfig | null {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = (process.env.PLAID_ENV || "sandbox") as PlaidConfig["env"];

  if (!clientId || !secret) {
    return null;
  }

  const baseUrls = {
    sandbox: "https://sandbox.plaid.com",
    development: "https://development.plaid.com",
    production: "https://production.plaid.com",
  };

  return { clientId, secret, env, baseUrl: baseUrls[env] };
}

async function plaidRequest(endpoint: string, body: Record<string, unknown>) {
  const config = getPlaidConfig();
  if (!config) throw new Error("Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET.");

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      secret: config.secret,
      ...body,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Plaid error: ${error.error_message || response.statusText}`);
  }

  return response.json();
}

export function isPlaidConfigured(): boolean {
  return getPlaidConfig() !== null;
}

export async function createLinkToken(userId: string): Promise<string> {
  const data = await plaidRequest("/link/token/create", {
    user: { client_user_id: userId },
    client_name: "EstateTRAQ",
    products: ["transactions", "investments"],
    country_codes: ["US"],
    language: "en",
  });
  return data.link_token;
}

export async function exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
  const data = await plaidRequest("/item/public_token/exchange", {
    public_token: publicToken,
  });
  return { accessToken: data.access_token, itemId: data.item_id };
}

export async function getAccounts(accessToken: string) {
  const data = await plaidRequest("/accounts/get", {
    access_token: accessToken,
  });
  return data.accounts;
}

export async function getBalances(accessToken: string) {
  const data = await plaidRequest("/accounts/balance/get", {
    access_token: accessToken,
  });
  return data.accounts;
}

export async function getTransactions(accessToken: string, startDate: string, endDate: string) {
  const data = await plaidRequest("/transactions/get", {
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: { count: 500, offset: 0 },
  });
  return data.transactions;
}

export async function getInstitution(institutionId: string) {
  const data = await plaidRequest("/institutions/get_by_id", {
    institution_id: institutionId,
    country_codes: ["US"],
  });
  return data.institution;
}

export async function getInvestmentHoldings(accessToken: string) {
  const data = await plaidRequest("/investments/holdings/get", {
    access_token: accessToken,
  });
  return { accounts: data.accounts, holdings: data.holdings, securities: data.securities };
}
