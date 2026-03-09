import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { families, familyUsers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { formatDate, cn } from "@/lib/utils";
import { MODULES, type ModuleKey } from "@/lib/utils";
import { Settings, Users, Shield, Bell, Database, Check, X } from "lucide-react";

interface SettingsPageProps {
  params: { familyId: string };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const session = await getServerSession(authOptions);
  const familyId = params.familyId;

  const [family] = await db.select().from(families).where(eq(families.id, familyId)).limit(1);

  // Get team members
  const members = await db
    .select({
      id: familyUsers.id,
      role: familyUsers.role,
      isDefault: familyUsers.isDefault,
      createdAt: familyUsers.createdAt,
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      lastLoginAt: users.lastLoginAt,
    })
    .from(familyUsers)
    .innerJoin(users, eq(familyUsers.userId, users.id))
    .where(eq(familyUsers.familyId, familyId));

  const enabledModules = (family?.modulesEnabled as string[]) || [];

  const roleLabels: Record<string, string> = {
    family_manager: "Manager",
    family_viewer: "Viewer",
    advisor: "Advisor",
    cpa: "CPA",
    executor: "Executor",
    assistant: "Assistant",
  };

  const roleColors: Record<string, string> = {
    family_manager: "bg-primary/10 text-primary",
    family_viewer: "bg-muted text-muted-foreground",
    advisor: "bg-purple-500/10 text-purple-400",
    cpa: "bg-amber-500/10 text-amber-400",
    executor: "bg-red-500/10 text-red-400",
    assistant: "bg-cyan-500/10 text-cyan-400",
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage family settings, modules, and team access" />

      <div className="p-6 space-y-8 max-w-4xl">
        {/* Family Info */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Family Information
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Family Name</label>
                <p className="text-sm font-medium">{family?.name}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Mode</label>
                <p className="text-sm font-medium capitalize">{family?.mode} Management</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(family?.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <p className="text-sm">{family?.description || "No description"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enabled Modules */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Database className="w-4 h-4" />
            Enabled Modules
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {Object.entries(MODULES).map(([key, mod]) => {
                const isEnabled = mod.alwaysOn || enabledModules.includes(key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{mod.label}</span>
                      {mod.alwaysOn && (
                        <span className="text-xs text-muted-foreground">(Always on)</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        isEnabled ? "bg-green-500/10" : "bg-accent"
                      )}
                    >
                      {isEnabled ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Members */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team & Access ({members.length})
            </h2>
            <button className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Invite Member
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {member.firstName} {member.lastName}
                        {member.userId === session?.user?.id && (
                          <span className="text-xs text-muted-foreground ml-1.5">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        roleColors[member.role] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {roleLabels[member.role] || member.role}
                    </span>
                    {member.lastLoginAt && (
                      <span className="text-xs text-muted-foreground">
                        Last login {formatDate(member.lastLoginAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
