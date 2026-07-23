import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Create a new password for your Inkdown account.",
  robots: { index: false },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
