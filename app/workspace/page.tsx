import { Metadata } from "next";
import { getEmailVerificationRedirectPath, requireVerifiedUser } from "@/lib/auth";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Your Inkdown markdown workspace - create, edit, and share documents.",
};

export default async function WorkspacePage() {
  const supabase = await createClient();
  const authState = await requireVerifiedUser(supabase);

  if (authState.kind === "unverified") {
    redirect(getEmailVerificationRedirectPath(authState.user.email));
  }

  if (authState.kind === "unauthenticated") {
    redirect("/auth/login");
  }

  return <DashboardWorkspace />;
}
