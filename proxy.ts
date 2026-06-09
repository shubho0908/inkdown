import { updateSession } from "@/lib/auth/middleware";
import { isDatabaseConfigured } from "@/lib/db/client";
import { acceptsMarkdown, countMarkdownTokens, htmlToMarkdown } from "@/lib/markdown-negotiation";
import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
  "https://localhost:3000",
].filter(Boolean) as string[];

const BLOCKED_PATHS = [
  "/.env",
  "/.git",
  "/.github",
  "/config",
  "/wp-admin",
  "/wp-login",
  "/admin",
  "/phpmyadmin",
  "/api/keys",
  "/api/secrets",
];

type ApiRateLimitRule = {
  prefix: string;
  methods?: ReadonlySet<string>;
  windowMs: number;
  max: number;
};

/** Edge burst protection — durable limits live in route handlers and Better Auth. */
const API_RATE_LIMIT_RULES: ApiRateLimitRule[] = [
  { prefix: "/api/export", windowMs: 60_000, max: 10 },
  { prefix: "/api/files/import", windowMs: 60_000, max: 20 },
  { prefix: "/api/files", windowMs: 60_000, max: 100 },
  { prefix: "/api/folders", windowMs: 60_000, max: 100 },
  {
    prefix: "/api/public",
    methods: new Set(["POST", "PATCH", "DELETE"]),
    windowMs: 60_000,
    max: 30,
  },
  {
    prefix: "/api/auth/check-email",
    methods: new Set(["POST"]),
    windowMs: 60_000,
    max: 10,
  },
];
const MARKDOWN_BYPASS_HEADER = "x-inkdown-markdown-bypass";
const HOMEPAGE_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/json"',
  '</openapi.json>; rel="service-desc"; type="application/openapi+json"',
  '</docs/api>; rel="service-doc"; type="text/markdown"',
  '</sitemap.xml>; rel="describedby"; type="application/xml"',
].join(", ");

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

function isBlockedPath(path: string): boolean {
  return BLOCKED_PATHS.some(
    (blocked) => path.toLowerCase().startsWith(blocked) || path.includes(blocked),
  );
}

function isApiPath(path: string): boolean {
  return path.startsWith("/api/");
}

function getApiRateLimitRule(path: string, method: string): ApiRateLimitRule | null {
  for (const rule of API_RATE_LIMIT_RULES) {
    if (!path.startsWith(rule.prefix)) {
      continue;
    }

    if (rule.methods && !rule.methods.has(method)) {
      continue;
    }

    return rule;
  }

  return null;
}

function shouldRefreshSession(path: string) {
  // API routes authenticate themselves — skip duplicate getSession in the proxy.
  if (path.startsWith("/api/")) {
    return false;
  }

  return (
    isDatabaseConfigured() &&
    (path.startsWith("/auth/") ||
      path === "/dashboard" ||
      path.startsWith("/dashboard/") ||
      path === "/workspace" ||
      path.startsWith("/workspace/"))
  );
}

function checkGlobalRateLimit(
  identifier: string,
  rule: ApiRateLimitRule,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const { windowMs, max: maxRequests } = rule;

  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}

function getSecurityHeaders(): Record<string, string> {
  return {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
    "X-XSS-Protection": "1; mode=block",
  };
}

function shouldNoindexPath(path: string): boolean {
  return (
    path.startsWith("/api/") ||
    path.startsWith("/auth/") ||
    path === "/dashboard" ||
    path === "/emails" ||
    path === "/workspace" ||
    path.startsWith("/workspace/")
  );
}

function shouldApplyHomepageLinkHeader(path: string): boolean {
  return path === "/";
}

function shouldCachePublicViewPath(path: string): boolean {
  return path === "/view" || path.startsWith("/view/");
}

function appendVary(response: Response, value: string) {
  const existing = response.headers.get("Vary");
  const values = new Set(
    existing?.split(",").flatMap((item) => {
      const trimmed = item.trim();
      return trimmed ? [trimmed] : [];
    }),
  );
  values.add(value);
  response.headers.set("Vary", Array.from(values).join(", "));
}

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function isAllowedOrigin(url: URL, request: NextRequest): boolean {
  if (url.origin === request.nextUrl.origin) {
    return true;
  }

  return ALLOWED_ORIGINS.includes(url.origin);
}

function validateMutationOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = origin || referer;

  if (!source) {
    return false;
  }

  try {
    return isAllowedOrigin(new URL(source), request);
  } catch {
    return false;
  }
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

  return `${ip}:${request.nextUrl.pathname}`;
}

function applySharedResponseHeaders(response: Response, request: NextRequest): Response {
  const { pathname } = request.nextUrl;
  const securityHeaders = getSecurityHeaders();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (shouldNoindexPath(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (shouldApplyHomepageLinkHeader(pathname)) {
    response.headers.set("Link", HOMEPAGE_LINK_HEADER);
  }

  if (shouldCachePublicViewPath(pathname)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    );
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (isAllowedOrigin(new URL(origin), request)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
        appendVary(response, "Origin");
      }
    } catch {
      // Ignore malformed origins.
    }
  }

  return response;
}

async function createMarkdownResponse(request: NextRequest) {
  const htmlRequestHeaders = new Headers(request.headers);
  htmlRequestHeaders.set("Accept", "text/html");
  htmlRequestHeaders.set(MARKDOWN_BYPASS_HEADER, "1");

  const htmlResponse = await fetch(request.nextUrl.toString(), {
    headers: htmlRequestHeaders,
    redirect: "follow",
  });
  const contentType = htmlResponse.headers.get("Content-Type") ?? "";

  if (!htmlResponse.ok || !contentType.includes("text/html")) {
    return new NextResponse(htmlResponse.body, {
      status: htmlResponse.status,
      statusText: htmlResponse.statusText,
      headers: htmlResponse.headers,
    });
  }

  const markdown = htmlToMarkdown(await htmlResponse.text());
  const response = new NextResponse(markdown ? `${markdown}\n` : "", {
    status: htmlResponse.status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Markdown-Tokens": String(countMarkdownTokens(markdown)),
    },
  });
  appendVary(response, "Accept");

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBlockedPath(pathname)) {
    console.warn(`[SECURITY] Blocked suspicious path: ${pathname}`);
    return applySharedResponseHeaders(new NextResponse("Not Found", { status: 404 }), request);
  }

  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    const allowOrigin = (() => {
      if (!origin) {
        return request.nextUrl.origin;
      }

      try {
        return isAllowedOrigin(new URL(origin), request) ? origin : "null";
      } catch {
        return "null";
      }
    })();

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, HEAD, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  }

  if (
    isSafeMethod(request.method) &&
    request.headers.get(MARKDOWN_BYPASS_HEADER) !== "1" &&
    acceptsMarkdown(request.headers.get("accept")) &&
    !isApiPath(pathname)
  ) {
    const markdownResponse = await createMarkdownResponse(request);
    return applySharedResponseHeaders(markdownResponse, request);
  }

  if (isApiPath(pathname)) {
    // Keep internal API contracts browser-native. Route handlers own auth/authorization,
    // while the proxy only applies lightweight edge checks that do not require custom headers.
    if (!isSafeMethod(request.method) && !validateMutationOrigin(request)) {
      console.warn(`[SECURITY] API mutation from invalid origin: ${pathname}`);
      return applySharedResponseHeaders(
        new NextResponse(JSON.stringify({ error: "Invalid origin" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
        request,
      );
    }

    const rateLimitRule = getApiRateLimitRule(pathname, request.method);
    if (rateLimitRule) {
      const clientId = `${getClientIdentifier(request)}:${rateLimitRule.prefix}`;
      const rateLimit = checkGlobalRateLimit(clientId, rateLimitRule);

      if (!rateLimit.allowed) {
        console.warn(`[SECURITY] Rate limit exceeded: ${clientId}`);
        return applySharedResponseHeaders(
          new NextResponse(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rateLimit.retryAfter),
              },
            },
          ),
          request,
        );
      }
    }
  }

  const response = shouldRefreshSession(pathname)
    ? await updateSession(request)
    : NextResponse.next({ request });

  return applySharedResponseHeaders(response, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
