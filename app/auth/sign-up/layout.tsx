import { signUpMetadata } from "./metadata";

export const metadata = signUpMetadata;

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
