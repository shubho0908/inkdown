import { Metadata } from "next";
import {
  getEmailVerificationRedirectPath,
  VERIFICATION_RESEND_SOURCE,
} from "@/lib/auth/email-verification-flow";
import { requireVerifiedUser } from "@/lib/auth/session";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { WorkspaceHydrationBoundary } from "@/components/workspace-hydration-boundary";
import { getWorkspaceBootstrapData } from "@/lib/workspace/server-bootstrap";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Your Inkdown markdown workspace - create, edit, and share documents.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WorkspacePage() {
  const authState = await requireVerifiedUser();

  if (authState.kind === "unverified") {
    redirect(
      getEmailVerificationRedirectPath(authState.user.email, {
        resend: VERIFICATION_RESEND_SOURCE.GATE,
      }),
    );
  }

  if (authState.kind === "unauthenticated") {
    redirect("/auth/login");
  }

  const { files, folders } = await getWorkspaceBootstrapData(authState.user.id);

  return (
    <WorkspaceHydrationBoundary files={files} folders={folders}>
      <DashboardWorkspace />
    </WorkspaceHydrationBoundary>
  );
}
