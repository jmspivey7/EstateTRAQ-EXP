import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { families } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/layout/sidebar";

interface FamilyLayoutProps {
  children: React.ReactNode;
  params: { familyId: string };
}

export default async function FamilyLayout({ children, params }: FamilyLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Verify user has access to this family
  const membership = session.user.families.find(
    (f) => f.familyId === params.familyId
  );

  if (!membership) {
    // Check if user has access to any family
    if (session.user.families.length > 0) {
      redirect(`/${session.user.families[0].familyId}/dashboard`);
    }
    redirect("/login");
  }

  // Get family details
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, params.familyId))
    .limit(1);

  if (!family) {
    redirect("/login");
  }

  const isAdvisor = membership.role === "advisor";
  const enabledModules = (family.modulesEnabled as string[]) || [];

  return (
    <div className="flex min-h-screen">
      <Sidebar
        familyId={params.familyId}
        familyName={family.name}
        enabledModules={enabledModules}
        families={session.user.families}
        isAdvisor={isAdvisor}
      />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
