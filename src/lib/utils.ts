import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: num >= 1000 ? 0 : 2,
  }).format(num);
}

export function formatCompactCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const MODULES = {
  dashboard: { label: "Dashboard", icon: "LayoutDashboard", alwaysOn: true },
  accounts: { label: "Accounts", icon: "Landmark", alwaysOn: true },
  documents: { label: "Document Vault", icon: "FileText", alwaysOn: true },
  compliance: { label: "Compliance Calendar", icon: "Calendar", alwaysOn: true },
  users: { label: "Team & Access", icon: "Users", alwaysOn: true },
  holdings: { label: "Market Investments", icon: "TrendingUp", alwaysOn: false },
  real_estate: { label: "Real Estate", icon: "Home", alwaysOn: false },
  minerals: { label: "Oil, Gas & Minerals", icon: "Droplets", alwaysOn: false },
  insurance: { label: "Insurance", icon: "Shield", alwaysOn: false },
  business: { label: "Business Interests", icon: "Building2", alwaysOn: false },
  personal_assets: { label: "Personal Assets", icon: "Gem", alwaysOn: false },
  income_expenses: { label: "Income & Expenses", icon: "DollarSign", alwaysOn: false },
  estate: { label: "Estate Administration", icon: "Scale", alwaysOn: false },
} as const;

export type ModuleKey = keyof typeof MODULES;
