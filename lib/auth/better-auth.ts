import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { compare, hash } from "bcryptjs";
import { authEmailGuardPlugin } from "@/lib/auth/auth-email-guard-plugin";
import { buildResetPasswordEmail, buildVerificationEmail } from "@/lib/auth/email";
import { deliverAuthEmail } from "@/lib/auth/deliver-auth-email";
import { betterAuthDrizzleSchema } from "@/lib/db/better-auth-schema";
import { db } from "@/lib/db/client";
import { syncProfileForAuthUser } from "@/lib/auth/profile-sync";
import { recordUserCreated } from "@/lib/platform-metrics/increment";
import { getSiteUrl } from "@/lib/site-url";

export const auth = betterAuth({
  plugins: [authEmailGuardPlugin()],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: betterAuthDrizzleSchema,
  }),
  baseURL: getSiteUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [getSiteUrl(), "http://localhost:3000", "https://localhost:3000"].filter(Boolean),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    password: {
      hash: async (password) => hash(password, 10),
      verify: async ({ password, hash: passwordHash }) => compare(password, passwordHash),
    },
    sendResetPassword: async ({ user, url, token }) => {
      await deliverAuthEmail({
        to: user.email,
        payload: buildResetPasswordEmail(url),
        idempotencyKey: `password-reset/${token}`,
        tag: "password-reset",
      });
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/send-verification-email": { window: 60 * 60, max: 3 },
      "/request-password-reset": { window: 60 * 60, max: 3 },
      "/forget-password": { window: 60 * 60, max: 3 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
    },
  },
  emailVerification: {
    // Verification emails are sent from the server gate so delivery errors
    // are never swallowed by Better Auth background tasks.
    sendOnSignUp: false,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
      token,
    }: {
      user: { email: string };
      url: string;
      token: string;
    }) => {
      await deliverAuthEmail({
        to: user.email,
        payload: buildVerificationEmail(url),
        idempotencyKey: `verification/${token}`,
        tag: "verification",
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await syncProfileForAuthUser(user);
          recordUserCreated();
        },
      },
      update: {
        after: async (user) => {
          await syncProfileForAuthUser(user);
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
