import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  clearSupabaseAuthCookies,
  getRecoverableSessionErrorCode,
  hasSupabaseAuthCookies,
} from "@/lib/supabase/session-recovery";
import { supabaseCookieOptions } from "@/lib/supabase/config";

type SessionSnapshot = Awaited<
  ReturnType<ReturnType<typeof createServerClient>["auth"]["getSession"]>
>;

async function getSessionSnapshot(
  supabase: ReturnType<typeof createServerClient>,
): Promise<SessionSnapshot> {
  return supabase.auth.getSession();
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({
    request,
  });
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof supabaseResponse.cookies.set>[2];
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // The workspace now lives at "/workspace", so keep legacy dashboard URLs canonical.
  if (pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  let authError: unknown = null;
  let hasSession = false;

  try {
    const {
      data: { session },
      error: sessionError,
    } = await getSessionSnapshot(supabase);

    hasSession = Boolean(session);

    if (sessionError) {
      authError = sessionError;
    } else if (session) {
      const { error } = await supabase.auth.getUser();
      authError = error;
    }
  } catch (error) {
    authError = error;
  }

  // Redirect authenticated users away from auth entry pages.
  const AUTH_ENTRY_PATHS = [
    "/",
    "/auth/login",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/auth/sign-up-success",
  ];

  if (hasSession && AUTH_ENTRY_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  const recoverableSessionErrorCode = getRecoverableSessionErrorCode(authError);

  if (recoverableSessionErrorCode && !hasSession && hasSupabaseAuthCookies(request)) {
    console.warn(
      `[AUTH] Clearing stale Supabase auth cookies after ${recoverableSessionErrorCode}`,
    );
    clearSupabaseAuthCookies(request, supabaseResponse);
  }

  return supabaseResponse;
}
