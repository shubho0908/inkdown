import { fetchJson, ApiError } from "@/lib/api";
import { normalizeAuthClientError } from "@/lib/auth/normalize-auth-client-error";
import { checkEmailResponseSchema } from "@/lib/validation/responses";

export type SignupError = {
  type: "email_exists" | "validation" | "network" | "server" | "unknown";
  message: string;
  action?: "login" | "retry" | "contact";
};

export type SignUpState = {
  email: string;
  password: string;
  repeatPassword: string;
  error: SignupError | null;
  emailChecked: boolean;
  showPasswordRequirements: boolean;
};

export type SignUpAction =
  | { type: "set_email"; email: string }
  | { type: "set_password"; password: string }
  | { type: "set_repeat_password"; repeatPassword: string }
  | { type: "set_error"; error: SignupError | null }
  | { type: "start_submit" }
  | { type: "set_email_checked" }
  | { type: "set_show_password_requirements"; show: boolean }
  | { type: "password_blur"; hasError: boolean };

export function signUpReducer(state: SignUpState, action: SignUpAction): SignUpState {
  switch (action.type) {
    case "set_email":
      return { ...state, email: action.email };
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
    case "start_submit":
      return { ...state, error: null, emailChecked: false };
    case "set_email_checked":
      return { ...state, emailChecked: true };
    case "set_show_password_requirements":
      return { ...state, showPasswordRequirements: action.show };
    case "password_blur":
      return {
        ...state,
        showPasswordRequirements: action.hasError ? state.showPasswordRequirements : false,
      };
    default:
      return state;
  }
}

export async function checkEmailExists(
  email: string,
): Promise<{ exists: boolean; error?: SignupError }> {
  try {
    const data = await fetchJson("/api/auth/check-email", checkEmailResponseSchema, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });

    return { exists: data.exists };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        return {
          exists: false,
          error: {
            type: "server",
            message: normalizeAuthClientError(error, "check-email"),
            action: "retry",
          },
        };
      }

      if (error.status >= 500) {
        return {
          exists: false,
          error: {
            type: "server",
            message: "Server error. Please try again in a few moments.",
            action: "retry",
          },
        };
      }

      return {
        exists: false,
        error: {
          type: "network",
          message: error.message || "Unable to verify email. Please try again.",
          action: "retry",
        },
      };
    }

    return {
      exists: false,
      error: {
        type: "network",
        message: "Connection error. Please check your internet and try again.",
        action: "retry",
      },
    };
  }
}
