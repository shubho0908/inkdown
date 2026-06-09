import { account, rateLimit, session, user, verification } from "@/lib/db/schema";

export const betterAuthDrizzleSchema = {
  user,
  session,
  account,
  verification,
  rateLimit,
} as const;
