import { Button } from '@/components/ui/button'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { 
  FileText, 
  FolderTree, 
  Share2, 
  Edit3, 
  Eye, 
  Lock,
  Sparkles,
  Zap,
  Globe,
  ArrowRight
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <InkdownLogo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-1/2 right-0 h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl" />
          </div>
          
          <div className="relative mx-auto max-w-6xl px-4 py-24 text-center md:py-32 lg:py-40">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Now with live collaboration</span>
            </div>
            
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Write beautiful markdown,
              <br />
              <span className="inkdown-gradient-text">share it instantly</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Inkdown is your creative space for markdown. Organize documents in folders, 
              preview in real-time, and share with a single link.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/auth/sign-up">
                  Start writing free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/auth/login">Sign in to your account</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 border-t pt-8">
              <div>
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Documents created</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50ms</div>
                <div className="text-sm text-muted-foreground">Avg. load time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Everything you need to write</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                A complete markdown solution for developers, writers, and teams who value simplicity and elegance.
              </p>
            </div>
            
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Edit3 className="h-5 w-5" />}
                title="Rich Editor"
                description="Full-featured toolbar with formatting shortcuts, syntax highlighting, and keyboard commands."
              />
              <FeatureCard
                icon={<Eye className="h-5 w-5" />}
                title="Live Preview"
                description="See your markdown rendered beautifully in real-time as you type."
              />
              <FeatureCard
                icon={<FolderTree className="h-5 w-5" />}
                title="Folder Organization"
                description="Create nested folders to organize your documents. Rename and manage with ease."
              />
              <FeatureCard
                icon={<Share2 className="h-5 w-5" />}
                title="Instant Sharing"
                description="Generate shareable links for any document with a single click."
              />
              <FeatureCard
                icon={<Lock className="h-5 w-5" />}
                title="Private by Default"
                description="Your documents are secure and only accessible to you unless shared."
              />
              <FeatureCard
                icon={<FileText className="h-5 w-5" />}
                title="GFM Support"
                description="Tables, task lists, code blocks, and all GitHub Flavored Markdown features."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Simple by design</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Get started in seconds. No complex setup required.
              </p>
            </div>
            
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <StepCard
                number="1"
                title="Create"
                description="Sign up and create your first markdown document in seconds."
              />
              <StepCard
                number="2"
                title="Write"
                description="Use our rich editor with live preview to craft your content."
              />
              <StepCard
                number="3"
                title="Share"
                description="Toggle a document public and share the link with anyone."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold md:text-4xl">Ready to start writing?</h2>
              <p className="mt-4 text-muted-foreground">
                Create your free account and start organizing your markdown today.
              </p>
              <Button size="lg" className="mt-8" asChild>
                <Link href="/auth/sign-up">
                  Create free account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <InkdownLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              Inkdown - Your markdown, beautifully organized.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <span className="text-border">•</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <span className="text-border">•</span>
              <a href="mailto:dev@shubhojeet.com" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
