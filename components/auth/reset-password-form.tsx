"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { authClient } from "@/lib/auth/client";
import { getResetPasswordLinkError, RESET_PASSWORD_QUERY } from "@/lib/auth/reset-password";
import { validatePassword, checkPasswordRequirements } from "@/lib/auth/password-validation";
import { parseValue } from "@/lib/validation/parse";
import { resetPasswordBodySchema } from "@/lib/validation/requests";
import { useClientSearchParams } from "@/hooks/use-client-search-params";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useReducer, useTransition } from "react";

type PasswordStrength = "weak" | "fair" | "good" | "strong" | null;

type FormState = {
  password: string;
  repeatPassword: string;
  error: string | null;
  passwordStrength: PasswordStrength;
  validationErrors: string[];
  passwordRequirements: ReturnType<typeof checkPasswordRequirements>;
  showPasswordRequirements: boolean;
};

type FormAction =
  | { type: "set_password"; password: string }
  | { type: "set_repeat_password"; repeatPassword: string }
  | { type: "set_error"; error: string | null }
  | { type: "clear_submit_errors" }
  | { type: "sync_password_validation"; password: string }
  | { type: "set_show_password_requirements"; show: boolean }
  | { type: "password_blur"; hasError: boolean };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set_password":
      return {
        ...state,
        password: action.password,
        showPasswordRequirements:
          action.password.length > 0 ? true : state.showPasswordRequirements,
      };
    case "set_repeat_password":
      return { ...state, repeatPassword: action.repeatPassword };
    case "set_error":
      return { ...state, error: action.error };
    case "clear_submit_errors":
      return { ...state, error: null, validationErrors: [] };
    case "set_show_password_requirements":
      return { ...state, showPasswordRequirements: action.show };
    case "password_blur":
      return {
        ...state,
        showPasswordRequirements: action.hasError ? state.showPasswordRequirements : false,
      };
    case "sync_password_validation": {
      if (action.password.length === 0) {
        return {
          ...state,
          passwordStrength: null,
          validationErrors: [],
          passwordRequirements: [],
        };
      }

      const result = validatePassword(action.password);
      const requirements = checkPasswordRequirements(action.password);

      if (result.valid) {
        return {
          ...state,
          passwordStrength: result.strength,
          validationErrors: [],
          passwordRequirements: requirements,
        };
      }

      return {
        ...state,
        passwordStrength: null,
        validationErrors: [result.error],
        passwordRequirements: requirements,
      };
    }
    default:
      return state;
  }
}

function ResetPasswordFormInner() {
  const searchParams = useClientSearchParams();
  const token = searchParams.get(RESET_PASSWORD_QUERY.TOKEN);
  const resetError = searchParams.get(RESET_PASSWORD_QUERY.ERROR);
  const [state, dispatch] = useReducer(formReducer, {
    password: "",
    repeatPassword: "",
    error: getResetPasswordLinkError(token, resetError),
    passwordStrength: null,
    validationErrors: [],
    passwordRequirements: [],
    showPasswordRequirements: false,
  });
  const [isPending, startTransition] = useTransition();

  const {
    password,
    repeatPassword,
    error,
    passwordStrength,
    validationErrors,
    passwordRequirements,
    showPasswordRequirements,
  } = state;

  useEffect(() => {
    dispatch({ type: "sync_password_validation", password });
  }, [password]);

  const unmetRequirementLabels = useMemo(() => {
    const labels: string[] = [];

    for (const requirement of passwordRequirements) {
      if (!requirement.met) {
        labels.push(requirement.label);
      }
    }

    return labels;
  }, [passwordRequirements]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      dispatch({
        type: "set_error",
        error: "Invalid reset link. Please request a new password reset.",
      });
      return;
    }

    dispatch({ type: "clear_submit_errors" });

    const parsed = parseValue(resetPasswordBodySchema, {
      password,
      repeatPassword,
      token,
    });
    if (!parsed.success) {
      dispatch({ type: "set_error", error: parsed.error });
      return;
    }

    const passwordValidation = validatePassword(parsed.data.password);
    if (!passwordValidation.valid) {
      dispatch({ type: "set_error", error: passwordValidation.error });
      return;
    }

    startTransition(async () => {
      try {
        const { error: resetError } = await authClient.resetPassword({
          newPassword: parsed.data.password,
          token: parsed.data.token,
        });

        if (resetError) {
          throw new Error(resetError.message || "Failed to reset password");
        }

        window.location.replace("/workspace");
      } catch (submitError: unknown) {
        dispatch({
          type: "set_error",
          error: submitError instanceof Error ? submitError.message : "An error occurred",
        });
      }
    });
  };

  const getStrengthText = () => {
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
  };

  if (!token) {
    return (
      <AuthShell title="Invalid Link" description="This password reset link cannot be used">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">{error}</p>
          <Link href="/auth/forgot-password" className="w-full">
            <Button variant="outline" className="w-full">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set new password" description="Enter your new password below">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
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
                      {getStrengthText()}
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
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repeat-password">Confirm New Password</Label>
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
            {repeatPassword && password !== repeatPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !passwordStrength || passwordStrength === "weak"}
          >
            {isPending ? "Updating…" : "Update password"}
          </Button>
        </div>
        {showPasswordRequirements && password.length > 0 && (
          <div className="mt-4 space-y-1">
            {unmetRequirementLabels.map((label) => (
              <div key={label} className="text-xs text-muted-foreground">
                • {label}
              </div>
            ))}
          </div>
        )}
      </form>
    </AuthShell>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Set new password" description="Loading reset form...">
          <div className="flex justify-center py-8">
            <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        </AuthShell>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
