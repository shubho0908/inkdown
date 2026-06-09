"use client";

import { createAuthClient } from "better-auth/react";
import { getSiteUrl } from "@/lib/site-url";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : getSiteUrl(),
});
