import { SignUpForm } from "@/components/auth/sign-up-form";
import { signUpMetadata } from "./metadata";

export const metadata = signUpMetadata;

export default function SignUpPage() {
  return <SignUpForm />;
}
