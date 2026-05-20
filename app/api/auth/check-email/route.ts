import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function getRateLimitKey(identifier: string): string {
  return `check-email:${identifier}`;
}

function checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
  const key = getRateLimitKey(identifier);
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true };
}

function getClientIdentifier(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const cfConnectingIp = headers.get("cf-connecting-ip");

  if (cfConnectingIp) return cfConnectingIp;
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  if (realIp) return realIp;

  return "unknown";
}

export async function POST(request: Request) {
  try {
    const clientIdentifier = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientIdentifier);

    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetTime!;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
          },
        },
      );
    }

    let email: string;
    try {
      const body = await request.json();
      email = body.email?.toLowerCase()?.trim();

      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { error: "Email is required and must be a string" },
          { status: 400 },
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: users, error: queryError } = await adminClient
      .from("auth_users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (queryError) {
      try {
        const { data: rpcResult, error: rpcError } = await adminClient.rpc("check_email_exists", {
          email_to_check: email,
        });

        if (rpcError) throw rpcError;

        return NextResponse.json({ exists: rpcResult });
      } catch {
        return NextResponse.json({ error: "Failed to check email availability" }, { status: 500 });
      }
    }

    const exists = Array.isArray(users) && users.length > 0;

    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
