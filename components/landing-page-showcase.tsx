'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Edit3,
  FileText,
  Folder,
  FolderTree,
  Lock,
  Share2,
} from 'lucide-react'

const scenarios = [
  {
    id: 'scenario-edit',
    icon: <Edit3 className="h-5 w-5" />,
    title: 'Precision Editing',
    description:
      'A deeply refined writing environment with side-by-side live rendering and instant GFM support.',
    visual: (
      <div className="flex h-full w-full flex-col backdrop-blur-3xl relative">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5 sm:py-3">
          <div className="flex gap-1.5 hidden sm:flex">
            <div className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <div className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <div className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
          </div>
          <div className="sm:ml-4 text-xs font-medium text-muted-foreground">brand_guidelines.md</div>
        </div>
        <div className="flex flex-col sm:flex-row flex-1 p-0 overflow-hidden">
          <div className="w-full sm:w-1/2 sm:border-r border-b sm:border-b-0 border-border bg-muted/10 p-4 sm:p-6 text-[12px] sm:text-[13px] font-mono text-muted-foreground overflow-y-auto hide-scrollbar">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="whitespace-pre-wrap">
              <span className="text-primary/70">#</span> Brand Guidelines
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 leading-relaxed whitespace-pre-wrap text-foreground/80">
              Overview of our core aesthetic.
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-muted-foreground/30 text-foreground/60 italic">
              &quot;Design is how it works.&quot;
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4 leading-relaxed whitespace-pre-wrap text-foreground/80">
              <span className="text-primary/70">##</span> Typography Primary
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-2 leading-relaxed whitespace-pre-wrap text-foreground/50">
              - **Heading:** Outfit, sans-serif
              <br />
              - **Body:** Inter, dynamic weight
            </motion.div>
          </div>
          <div className="w-full sm:w-1/2 p-4 sm:p-6 text-xs sm:text-[14px] font-sans text-foreground bg-background/40 overflow-y-auto hide-scrollbar">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg sm:text-2xl font-display font-semibold tracking-tight truncate">
              Brand Guidelines
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 sm:mt-4 leading-relaxed text-foreground/80 break-words">
              Overview of our core aesthetic.
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 pl-4 border-l-4 border-muted/50 py-1 text-muted-foreground italic tracking-wide">
              &quot;Design is how it works.&quot;
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-sm sm:text-lg font-display font-medium tracking-tight truncate border-b border-border/50 pb-1">
              Typography Primary
            </motion.div>
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 text-foreground/80 list-disc list-inside space-y-1.5 ml-1">
              <li><strong>Heading:</strong> Outfit, sans-serif</li>
              <li><strong>Body:</strong> Inter, dynamic weight</li>
            </motion.ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-organize',
    icon: <FolderTree className="h-5 w-5" />,
    title: 'Workspace Clarity',
    description:
      'Unclutter your mind with fluid folder nesting and lightning-fast full text search.',
    visual: (
      <div className="flex h-full w-full flex-col backdrop-blur-3xl relative">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Workspace</div>
        </div>
        <div className="flex flex-1 flex-col p-4 gap-1.5 overflow-y-auto hide-scrollbar">
          <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-between rounded-lg bg-muted/50 py-2.5 px-3 border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <Folder className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">Marketing Strategy</span>
            </div>
          </motion.div>
          <div className="pl-6 flex flex-col gap-1 border-l border-border/50 ml-3 py-1">
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center gap-3 rounded-md py-1.5 px-2 hover:bg-muted/50 transition-colors cursor-pointer">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground/70">Q3 Launch Plan</span>
            </motion.div>
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 rounded-md py-1.5 px-2 bg-background border border-border shadow-sm cursor-pointer">
              <FileText className="h-3.5 w-3.5 text-foreground" />
              <span className="text-sm text-foreground font-medium">Brand Guidelines</span>
            </motion.div>
          </div>

          <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mt-2 flex items-center justify-between rounded-lg hover:bg-muted/30 transition-colors py-2 px-3 border border-transparent">
            <div className="flex items-center gap-3">
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground/80">Engineering Discussions</span>
            </div>
            <div className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full border border-border bg-muted">2</div>
          </motion.div>
          <div className="pl-6 flex flex-col gap-1 border-l border-border/30 ml-3 py-1">
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center gap-3 rounded-md py-1.5 px-2 hover:bg-muted/50 transition-colors cursor-pointer">
              <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground">Weekly Sync</span>
            </motion.div>
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-3 rounded-md py-1.5 px-2 hover:bg-muted/50 transition-colors cursor-pointer">
              <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground">Architecture Planning</span>
            </motion.div>
          </div>

          <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.45 }} className="mt-1 flex items-center justify-between rounded-lg hover:bg-muted/30 transition-colors py-2 px-3 border border-transparent">
            <div className="flex items-center gap-3">
              <Lock className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span className="text-sm font-medium text-foreground/80">Personal Drafts</span>
            </div>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-share',
    icon: <Share2 className="h-5 w-5" />,
    title: 'Instant Publishing',
    description:
      'Publish flawlessly. One click transforms your markdown into a perfectly typeset web page.',
    visual: (
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-8 backdrop-blur-3xl relative">
        <div className="absolute inset-0 bg-muted/5" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4 sm:gap-5 rounded-2xl border border-border/80 bg-background/90 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-foreground text-background shadow-md">
            <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="text-center">
            <h3 className="font-display font-medium tracking-tight text-foreground text-lg sm:text-xl">Shared Successfully</h3>
            <p className="text-sm text-muted-foreground mt-1.5">Live securely on the internet.</p>
          </div>
          <div className="mt-1 sm:mt-2 flex w-full items-center gap-2 sm:gap-3 rounded-lg border border-border bg-muted/30 p-1.5 pl-3 sm:pl-4 transition-colors hover:bg-muted/50">
            <span className="truncate flex-1 text-xs text-muted-foreground font-mono">inkdown.app/d/xyz</span>
            <div className="flex items-center justify-center rounded-md bg-background border border-border text-foreground px-4 py-1.5 text-xs font-medium hover:bg-muted cursor-pointer transition-colors shadow-sm">
              Copy
            </div>
          </div>
        </motion.div>
      </div>
    ),
  },
]

export function LandingPageShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % scenarios.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative z-20 mx-auto mt-16 sm:mt-24 max-w-[1050px] px-4 sm:px-6">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="flex flex-col justify-center lg:col-span-5 gap-3 sm:gap-4" role="tablist">
          {scenarios.map((scenario, idx) => (
            <div
              key={scenario.id}
              onClick={() => setActiveIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveIndex(idx)
                }
              }}
              role="tab"
              aria-selected={activeIndex === idx}
              tabIndex={0}
              className={`cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 group relative flex flex-col items-start gap-3 rounded-[24px] p-5 sm:p-6 text-left transition-all duration-300 border ${
                activeIndex === idx
                  ? 'border-border/50 bg-muted/40 shadow-sm'
                  : 'border-transparent bg-transparent hover:bg-muted/20 hover:border-border/30'
              }`}
            >
              <div className="flex items-center gap-4 w-full">
                <div className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  activeIndex === idx ? 'border-transparent bg-foreground text-background shadow-inner' : 'border-border bg-background text-muted-foreground group-hover:border-foreground/20 group-hover:text-foreground/80'
                }`}>
                  {scenario.icon}
                </div>
                <h3 className={`font-display text-lg sm:text-xl font-medium tracking-tight transition-colors ${activeIndex === idx ? 'text-foreground' : 'text-foreground/60 group-hover:text-foreground/80'}`}>
                  {scenario.title}
                </h3>
              </div>

              <AnimatePresence initial={false}>
                {activeIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden w-full"
                  >
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed pl-[60px] sm:pl-[64px]">
                      {scenario.description}
                    </p>

                    <div className="mt-6 block lg:hidden w-full h-[340px] sm:h-[420px] relative rounded-2xl border border-border bg-background p-1.5 shadow-sm">
                      <div className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-foreground/[0.03] dark:from-white/5 via-transparent to-transparent blur-3xl opacity-50 dark:opacity-100" />
                      <div className="relative h-full w-full overflow-hidden rounded-[14px] border border-border bg-background/60">
                        {scenario.visual}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="hidden lg:block relative h-[480px] w-full rounded-[28px] border border-border bg-background p-2 shadow-sm lg:col-span-7">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-foreground/[0.03] dark:from-white/5 via-transparent to-transparent blur-3xl opacity-50 dark:opacity-100" />

          <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-border bg-background/60">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="h-full w-full"
              >
                {scenarios[activeIndex].visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
