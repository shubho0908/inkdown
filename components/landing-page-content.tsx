'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingPageShowcase } from '@/components/landing-page-showcase'

export function LandingPageContent() {
  return (
    <>
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-multiply dark:mix-blend-screen opacity-40 dark:opacity-100">
          <motion.div
            animate={{ x: [0, 50, 0, -50, 0], y: [0, -50, -20, 40, 0], scale: [1, 1.2, 0.9, 1.1, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-[20%] left-[10%] size-[70vw] max-h-[800px] max-w-[800px] rounded-full bg-blue-500/15 blur-[100px] sm:blur-[140px]"
          />
          <motion.div
            animate={{ x: [0, -60, 30, 60, 0], y: [0, 60, -50, 20, 0], scale: [1, 0.8, 1.2, 0.9, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[20%] -right-[10%] size-[60vw] max-h-[700px] max-w-[700px] rounded-full bg-violet-600/15 blur-[100px] sm:blur-[140px]"
          />
          <motion.div
            animate={{ x: [0, 30, -40, -10, 0], y: [0, -30, 40, 10, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-[20%] left-[30%] size-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-emerald-500/10 blur-[100px] sm:blur-[130px]"
          />
        </div>
        <div className="inkdown-noise pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.015]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-[50rem] text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8 inline-flex items-center rounded-full border border-border/50 bg-background/50 py-1.5 px-4 text-xs font-medium text-foreground/70 backdrop-blur-md shadow-sm"
            >
              <span className="mr-2.5 flex size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
              Inkdown 1.0 is now live
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-5xl font-medium tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[1.05]"
            >
              Write beautiful markdown,{' '}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                share it instantly
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-6 sm:mt-8 max-w-2xl px-2 sm:px-0 text-pretty text-base text-muted-foreground sm:text-lg md:text-xl font-light tracking-wide leading-relaxed"
            >
              The premium, distraction-free environment for thinkers. Organize seamlessly, preview fluidly, and publish with uncompromising elegance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 sm:mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button size="lg" asChild className="group">
                <Link href="/auth/sign-up">
                  Start drafting
                  <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>

          <LandingPageShowcase />
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border bg-muted/10 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-foreground lg:text-5xl">
              Clarity awaits.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl px-2 sm:px-0 text-base sm:text-lg text-muted-foreground tracking-wide leading-relaxed">
              Experience a genuinely refined markdown environment. Write, organize, and share with a workspace that profoundly respects your focus.
            </p>
            <Button size="lg" className="group mt-8 sm:mt-10" asChild>
              <Link href="/auth/sign-up">
                Start writing seamlessly
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  )
}
