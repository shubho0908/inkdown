import Link from 'next/link'
import type { ReactNode } from 'react'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type AuthShellProps = {
  children: ReactNode
  description: string
  title: string
}

export function AuthShell({
  children,
  description,
  title,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8 bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center opacity-50 dark:opacity-100">
        <div className="size-[300px] rounded-full bg-primary/5 blur-[80px]" />
      </div>
      <div className="inkdown-noise pointer-events-none absolute inset-0 opacity-[0.02]" />

      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center">
            <Link href="/">
              <InkdownLogo size="lg" />
            </Link>
          </div>

          <Card className="rounded-[20px] border-border/60 bg-background/95 py-6 shadow-sm backdrop-blur-xl sm:py-8">
            <CardHeader className="space-y-1.5 pb-8">
              <CardTitle className="font-display text-2xl font-medium tracking-tight text-center">
                {title}
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground/80">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
