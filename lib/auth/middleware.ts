import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import {
  EMAIL_VERIFICATION_GATE_PATH,
  LEGACY_SIGN_UP_SUCCESS_PATH,
} from "@/lib/auth/email-verification-flow";

const AUTH_ENTRY_PATHS = [
  "/",
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
  EMAIL_VERIFICATION_GATE_PATH,
  LEGACY_SIGN_UP_SUCCESS_PATH,
];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session?.user?.emailVerified && AUTH_ENTRY_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
