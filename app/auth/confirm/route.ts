import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";
import {
  getSafeNextPath,
  isSupportedEmailOtpType,
  handleAuthenticatedRedirect,
  createErrorRedirect,
} from "@/lib/auth/route-utils";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (tokenHash && isSupportedEmailOtpType(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return handleAuthenticatedRedirect(requestUrl, next);
    }

    return createErrorRedirect(requestUrl, error.message);
  }

  return createErrorRedirect(requestUrl, "Missing or invalid email confirmation token");
}
