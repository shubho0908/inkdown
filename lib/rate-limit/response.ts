import { NextResponse } from "next/server";

export function rateLimitJsonResponse(message: string, retryAfterSec: number) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}
