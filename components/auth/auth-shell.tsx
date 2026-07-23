import Link from "next/link";
import type { ReactNode } from "react";
import { InkdownLogo } from "@/components/inkdown-logo";
import { ThemeToggle } from "@/components/theme-toggle";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/[0.04] blur-3xl dark:bg-primary/[0.05]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-primary/[0.03] blur-3xl dark:bg-primary/[0.04]" />

      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col gap-8">
          <Link href="/" aria-label="Inkdown home" className="mx-auto shrink-0">
            <InkdownLogo size="lg" />
          </Link>

          <article className="rounded-2xl border bg-card/95 p-5 shadow-xl backdrop-blur-xl sm:p-10">
            <header className="space-y-2 text-center">
              <h1 className="font-sans text-2xl font-medium tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </header>
            <div className="mt-8">{children}</div>
          </article>
        </div>
      </div>
    </main>
  );
}
