"use client";

import { useState } from "react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Search } from "lucide-react";

interface HoldingData {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  currentPrice: number;
  previousClose: number;
  costBasis: number;
  dayChange: number;
  dayChangePercent: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  lastUpdated: string | null;
}

interface HoldingsTableProps {
  holdings: HoldingData[];
}

type SortKey = "symbol" | "marketValue" | "dayChange" | "gainLoss" | "gainLossPercent";

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("marketValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const filtered = holdings.filter(
    (h) =>
      h.symbol.toLowerCase().includes(search.toLowerCase()) ||
      h.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortBy === "symbol") return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ label, sortKey, align = "right" }: { label: string; sortKey: SortKey; align?: "left" | "right" }) => (
    <th
      className={cn(
        "px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none",
        align === "right" ? "text-right" : "text-left"
      )}
      onClick={() => toggleSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === sortKey && (
          sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        )}
      </span>
    </th>
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Search Bar */}
      <div className="px-5 py-3 border-b border-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search holdings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-accent/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <SortHeader label="Symbol" sortKey="symbol" align="left" />
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-left">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Shares</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Price</th>
              <SortHeader label="Market Value" sortKey="marketValue" />
              <SortHeader label="Day Change" sortKey="dayChange" />
              <SortHeader label="Gain/Loss" sortKey="gainLoss" />
              <SortHeader label="Return %" sortKey="gainLossPercent" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((h) => (
              <tr
                key={h.id}
                className="hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-primary">{h.symbol}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                    {h.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm tabular-nums">{h.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm tabular-nums">{formatCurrency(h.currentPrice)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(h.marketValue)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      h.dayChange >= 0 ? "text-green-500" : "text-red-400"
                    )}
                  >
                    {h.dayChange >= 0 ? "+" : ""}
                    {formatCurrency(h.dayChange * h.shares)}
                  </span>
                  <span
                    className={cn(
                      "text-xs block tabular-nums",
                      h.dayChangePercent >= 0 ? "text-green-500/70" : "text-red-400/70"
                    )}
                  >
                    {formatPercent(h.dayChangePercent)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      h.gainLoss >= 0 ? "text-green-500" : "text-red-400"
                    )}
                  >
                    {h.gainLoss >= 0 ? "+" : ""}
                    {formatCurrency(h.gainLoss)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-sm font-medium tabular-nums",
                      h.gainLossPercent >= 0 ? "text-green-500" : "text-red-400"
                    )}
                  >
                    {h.gainLossPercent >= 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {Math.abs(h.gainLossPercent).toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {sorted.length} holding{sorted.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-6">
          <span className="text-muted-foreground">
            Total: <span className="text-foreground font-medium">{formatCurrency(sorted.reduce((s, h) => s + h.marketValue, 0))}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
