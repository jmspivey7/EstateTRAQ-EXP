"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { MODULES, type ModuleKey } from "@/lib/utils";
import {
  LayoutDashboard,
  Landmark,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  Home,
  Droplets,
  Shield,
  Building2,
  Gem,
  DollarSign,
  Scale,
  Sheet,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Landmark,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  Home,
  Droplets,
  Shield,
  Building2,
  Gem,
  DollarSign,
  Scale,
  Sheet,
};

interface SidebarProps {
  familyId: string;
  familyName: string;
  enabledModules: string[];
  families?: { familyId: string; familyName: string; role: string }[];
  isAdvisor?: boolean;
}

export function Sidebar({
  familyId,
  familyName,
  enabledModules,
  families = [],
  isAdvisor = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [familySelectorOpen, setFamilySelectorOpen] = useState(false);

  const navItems = Object.entries(MODULES)
    .filter(([key, mod]) => mod.alwaysOn || enabledModules.includes(key))
    .map(([key, mod]) => ({
      key,
      label: mod.label,
      icon: iconMap[mod.icon] || LayoutDashboard,
      href: key === "dashboard" ? `/${familyId}/dashboard` : `/${familyId}/${key.replace("_", "-")}`,
    }));

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-border/10 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <Link href={isAdvisor ? "/advisor" : `/${familyId}/dashboard`} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">EstateTRAQ</span>
        </Link>
      </div>

      {/* Family Selector */}
      <div className="px-3 py-3 border-b border-white/10">
        <button
          onClick={() => families.length > 1 && setFamilySelectorOpen(!familySelectorOpen)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm",
            families.length > 1 ? "hover:bg-sidebar-accent/50 cursor-pointer" : "cursor-default"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-medium">
              {familyName.charAt(0)}
            </div>
            <span className="truncate font-medium">{familyName}</span>
          </div>
          {families.length > 1 && <ChevronDown className="w-4 h-4 opacity-50" />}
        </button>

        {familySelectorOpen && families.length > 1 && (
          <div className="mt-1 space-y-0.5 px-1">
            {families
              .filter((f) => f.familyId !== familyId)
              .map((f) => (
                <Link
                  key={f.familyId}
                  href={`/${f.familyId}/dashboard`}
                  onClick={() => setFamilySelectorOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                  <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-xs">
                    {f.familyName.charAt(0)}
                  </div>
                  <span className="truncate">{f.familyName}</span>
                </Link>
              ))}
            {isAdvisor && (
              <Link
                href="/advisor"
                onClick={() => setFamilySelectorOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-primary hover:bg-sidebar-accent/50 font-medium"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>All Clients</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/10">
          <Link
            href={`/${familyId}/settings`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.includes("/settings")
                ? "bg-sidebar-accent text-white font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-medium">
              {session?.user?.firstName?.charAt(0)}{session?.user?.lastName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
