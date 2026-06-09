"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkPasswordRequirements } from "@/lib/auth/password-validation";
import Link from "next/link";
import type { Dispatch } from "react";
import type { SignUpAction, SignupError } from "@/components/auth/sign-up-form-state";

type PasswordStrength = "weak" | "fair" | "good" | "strong" | null;

interface SignUpFormFieldsProps {
  email: string;
  password: string;
  repeatPassword: string;
  error: SignupError | null;
  emailChecked: boolean;
  showPasswordRequirements: boolean;
  isPending: boolean;
  passwordStrength: PasswordStrength;
  validationErrors: string[];
  requirements: ReturnType<typeof checkPasswordRequirements>;
  dispatch: Dispatch<SignUpAction>;
  onSubmit: (event: React.FormEvent) => void;
}

function getStrengthText(passwordStrength: PasswordStrength) {
  switch (passwordStrength) {
    case "weak":
      return "Weak";
    case "fair":
      return "Fair";
    case "good":
      return "Good";
    case "strong":
      return "Strong";
    default:
      return "";
  }
}

export function SignUpFormFields({
  email,
  password,
  repeatPassword,
  error,
  emailChecked,
  showPasswordRequirements,
  isPending,
  passwordStrength,
  validationErrors,
  requirements,
  dispatch,
  onSubmit,
}: SignUpFormFieldsProps) {
  const unmetRequirements: Array<{ label: string }> = [];
  let metCount = 0;

  for (const requirement of requirements) {
    if (requirement.met) {
      metCount += 1;
    } else {
      unmetRequirements.push(requirement);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => dispatch({ type: "set_email", email: e.target.value })}
            disabled={isPending}
            autoComplete="email"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => dispatch({ type: "set_password", password: e.target.value })}
            onFocus={() =>
              password.length > 0 &&
              dispatch({ type: "set_show_password_requirements", show: true })
            }
            onBlur={() => dispatch({ type: "password_blur", hasError: Boolean(error) })}
            disabled={isPending}
            autoComplete="new-password"
            minLength={12}
          />
          {password && (
            <div className="space-y-2">
              {passwordStrength && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
              )}
              {validationErrors.length > 0 && (
                <ul className="text-xs text-destructive space-y-1">
                  {validationErrors.map((err) => (
                    <li key={err}>• {err}</li>
                  ))}
                </ul>
              )}
              {password.length > 0 && password.length < 12 && (
                <p className="text-xs text-muted-foreground">Minimum 12 characters required</p>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat-password">Confirm Password</Label>
          <Input
            id="repeat-password"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) =>
              dispatch({ type: "set_repeat_password", repeatPassword: e.target.value })
            }
            disabled={isPending}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive font-medium">{error.message}</p>
            {error.action === "login" && (
              <Link
                href="/auth/login"
                className="mt-2 inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Sign in here
              </Link>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !passwordStrength || passwordStrength === "weak"}
        >
          {isPending ? (emailChecked ? "Creating account…" : "Checking…") : "Sign up"}
        </Button>
      </div>
      <div className="mt-4">
        {(showPasswordRequirements || error?.type === "validation") && password.length > 0 && (
          <div className="space-y-1">
            {unmetRequirements.map((req) => (
              <div
                key={req.label}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <svg className="size-3 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {req.label}
              </div>
            ))}
            {metCount > 0 && unmetRequirements.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {metCount} requirement{metCount > 1 ? "s" : ""} met
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
