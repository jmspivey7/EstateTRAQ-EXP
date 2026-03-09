"use client";

import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";

interface DashboardChartsProps {
  history: { date: string; value: number }[];
  allocation: { name: string; value: number; color: string }[];
  totalNetWorth: number;
}

const timeRanges = ["1M", "3M", "6M", "1Y", "ALL"] as const;

export function DashboardCharts({ history, allocation, totalNetWorth }: DashboardChartsProps) {
  const [range, setRange] = useState<typeof timeRanges[number]>("1Y");

  const filteredHistory = (() => {
    if (range === "ALL" || history.length === 0) return history;
    const now = new Date();
    const months = range === "1M" ? 1 : range === "3M" ? 3 : range === "6M" ? 6 : 12;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    return history.filter(h => new Date(h.date) >= cutoff);
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Net Worth Trend */}
      <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
            <p className="text-2xl font-semibold">{formatCurrency(totalNetWorth)}</p>
          </div>
          <div className="flex gap-1">
            {timeRanges.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          {filteredHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredHistory}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 71%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 71%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(215, 20%, 65%)" }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return d.toLocaleDateString("en-US", { month: "short" });
                  }}
                  minTickGap={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(215, 20%, 65%)" }}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 11%)",
                    border: "1px solid hsl(217, 33%, 20%)",
                    borderRadius: "8px",
                    fontSize: 13,
                  }}
                  formatter={(v: number) => [formatCurrency(v), "Net Worth"]}
                  labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(217, 71%, 55%)"
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <p>Connect accounts to see your net worth trend</p>
            </div>
          )}
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Asset Allocation</h3>
        <div className="h-64">
          {allocation.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 11%)",
                    border: "1px solid hsl(217, 33%, 20%)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatCurrency(v), ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry) => {
                    const item = allocation.find(a => a.name === value);
                    const pct = item ? ((item.value / totalNetWorth) * 100).toFixed(0) : "0";
                    return <span className="text-xs text-muted-foreground">{value} {pct}%</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <p>Add assets to see allocation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
