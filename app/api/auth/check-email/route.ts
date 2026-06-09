import { NextResponse } from "next/server";
import { emailExists } from "@/lib/db/profiles";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { consumeRateLimit, rateLimitedMessage } from "@/lib/rate-limit/consume";
import { checkEmailIpKey } from "@/lib/rate-limit/keys";
import { CHECK_EMAIL_IP } from "@/lib/rate-limit/policies";
import { rateLimitJsonResponse } from "@/lib/rate-limit/response";
import { parseJsonBody } from "@/lib/validation/parse";
import { checkEmailBodySchema } from "@/lib/validation/requests";

export async function POST(request: Request) {
  try {
    const ipLimit = await consumeRateLimit(
      checkEmailIpKey(getClientIp(request.headers)),
      CHECK_EMAIL_IP,
    );

    if (!ipLimit.allowed) {
      return rateLimitJsonResponse(
        rateLimitedMessage(ipLimit.retryAfterSec),
        ipLimit.retryAfterSec,
      );
    }

    const parsed = await parseJsonBody(request, checkEmailBodySchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const exists = await emailExists(parsed.data.email);
    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
