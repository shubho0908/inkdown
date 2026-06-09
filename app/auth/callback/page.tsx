import { AuthCallbackClient } from "@/app/auth/callback/callback-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finishing Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
