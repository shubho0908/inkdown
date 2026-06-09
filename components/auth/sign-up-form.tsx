"use client";

import { SignUpFormFields } from "@/components/auth/sign-up-form-fields";
import { checkEmailExists, signUpReducer } from "@/components/auth/sign-up-form-state";
import { AuthShell } from "@/components/auth/auth-shell";
import { authClient } from "@/lib/auth/client";
import {
  getEmailVerificationRedirectPath,
  getPostVerificationCallbackUrl,
  VERIFICATION_RESEND_SOURCE,
} from "@/lib/auth/email-verification-flow";
import { validatePassword, checkPasswordRequirements } from "@/lib/auth/password-validation";
import { normalizeAuthClientError } from "@/lib/auth/normalize-auth-client-error";
import { parseValue } from "@/lib/validation/parse";
import { signUpBodySchema } from "@/lib/validation/requests";
import { useCallback, useMemo, useReducer, useTransition } from "react";

export function SignUpForm() {
  const [state, dispatch] = useReducer(signUpReducer, {
    email: "",
    password: "",
    repeatPassword: "",
    error: null,
    emailChecked: false,
    showPasswordRequirements: false,
  });
  const [isPending, startTransition] = useTransition();

  const { email, password, repeatPassword, error, emailChecked, showPasswordRequirements } = state;

  const passwordValidation = useMemo(() => {
    if (password.length === 0) {
      return {
        strength: null as "weak" | "fair" | "good" | "strong" | null,
        errors: [] as string[],
        requirements: [] as ReturnType<typeof checkPasswordRequirements>,
      };
    }

    const result = validatePassword(password, email);
    const requirements = checkPasswordRequirements(password, email);

    return {
      strength: result.valid ? result.strength : null,
      errors: result.valid ? [] : [result.error],
      requirements,
    };
  }, [password, email]);

  const handleSignUp = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      startTransition(async () => {
        dispatch({ type: "start_submit" });

        const signUpValidation = parseValue(signUpBodySchema, {
          email,
          password,
          repeatPassword,
        });
        if (!signUpValidation.success) {
          dispatch({
            type: "set_error",
            error: {
              type: "validation",
              message: signUpValidation.error,
            },
          });
          return;
        }

        const nextPasswordValidation = validatePassword(
          signUpValidation.data.password,
          signUpValidation.data.email,
        );
        if (!nextPasswordValidation.valid) {
          dispatch({
            type: "set_error",
            error: {
              type: "validation",
              message: nextPasswordValidation.error,
            },
          });
          return;
        }

        try {
          const { exists, error: checkError } = await checkEmailExists(signUpValidation.data.email);

          if (checkError) {
            dispatch({ type: "set_error", error: checkError });
            return;
          }

          dispatch({ type: "set_email_checked" });

          if (exists) {
            dispatch({
              type: "set_error",
              error: {
                type: "email_exists",
                message: "An account with this email already exists. Please sign in instead.",
                action: "login",
              },
            });
            return;
          }

          const { data, error: signUpError } = await authClient.signUp.email({
            email: signUpValidation.data.email,
            password: signUpValidation.data.password,
            name: signUpValidation.data.email.split("@")[0] || "Inkdown user",
            callbackURL: getPostVerificationCallbackUrl(),
          });

          if (signUpError) {
            const message = normalizeAuthClientError(signUpError, "sign-up");

            if (
              message.includes("already registered") ||
              message.includes("already exists") ||
              message.includes("already taken")
            ) {
              dispatch({
                type: "set_error",
                error: {
                  type: "email_exists",
                  message: "An account with this email already exists. Please sign in instead.",
                  action: "login",
                },
              });
            } else {
              dispatch({
                type: "set_error",
                error: {
                  type: "server",
                  message,
                  action: "retry",
                },
              });
            }
            return;
          }

          if (data?.user) {
            if (!data.user.emailVerified) {
              window.location.replace(
                getEmailVerificationRedirectPath(signUpValidation.data.email, {
                  resend: VERIFICATION_RESEND_SOURCE.GATE,
                }),
              );
            } else {
              window.location.replace("/workspace");
            }
          } else {
            dispatch({
              type: "set_error",
              error: {
                type: "unknown",
                message: "Something unexpected happened. Please try again.",
                action: "retry",
              },
            });
          }
        } catch (submitError: unknown) {
          dispatch({
            type: "set_error",
            error: {
              type: "unknown",
              message:
                submitError instanceof Error ? submitError.message : "An unexpected error occurred",
              action: "retry",
            },
          });
        }
      });
    },
    [email, password, repeatPassword],
  );

  return (
    <AuthShell title="Create an account" description="Join the ultimate markdown workspace">
      <SignUpFormFields
        email={email}
        password={password}
        repeatPassword={repeatPassword}
        error={error}
        emailChecked={emailChecked}
        showPasswordRequirements={showPasswordRequirements}
        isPending={isPending}
        passwordStrength={passwordValidation.strength}
        validationErrors={passwordValidation.errors}
        requirements={passwordValidation.requirements}
        dispatch={dispatch}
        onSubmit={handleSignUp}
      />
    </AuthShell>
  );
}
