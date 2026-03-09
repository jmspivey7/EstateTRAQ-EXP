import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is an advisor with multiple families
  const advisorFamilies = session.user.families.filter(f => f.role === "advisor");
  if (advisorFamilies.length > 1) {
    redirect("/advisor");
  }

  // Redirect to default family or first family
  const defaultFamily = session.user.families.find(f => f.isDefault);
  const targetFamily = defaultFamily || session.user.families[0];

  if (targetFamily) {
    redirect(`/${targetFamily.familyId}/dashboard`);
  }

  redirect("/login");
}
