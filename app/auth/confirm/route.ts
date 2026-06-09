import { type NextRequest } from "next/server";
import {
  getSafeNextPath,
  handleAuthenticatedRedirect,
  createErrorRedirect,
} from "@/lib/auth/route-utils";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  // Better Auth handles email verification via /api/auth/* routes.
  // Legacy Supabase confirm links are redirected to the workspace after sign-in.
  return handleAuthenticatedRedirect(requestUrl, next).catch(() =>
    createErrorRedirect(requestUrl, "Missing or invalid email confirmation token"),
  );
}
