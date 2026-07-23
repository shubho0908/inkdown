import { FileText } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { LandingPageOrganizeDemo } from "@/components/landing-page-organize-demo";
import { LandingPageShareDemo } from "@/components/landing-page-share-demo";
import { LandingPageSplitViewDemo } from "@/components/landing-page-split-view-demo";

const features = [
  {
    demo: LandingPageOrganizeDemo,
    title: "Organize your ideas",
    description:
      "Nest documents in folders so drafts, reference notes, and published pages stay easy to find.",
  },
  {
    demo: LandingPageShareDemo,
    title: "Publish with a link",
    description:
      "Make any document or folder public and share it instantly. No exports, no attachments.",
  },
] as const;

export function LandingPageShowcase() {
  return (
    <AnimatedSection aria-label="Features" className="mt-24 pt-24 pb-24 sm:mt-28 sm:pt-28 sm:pb-28 lg:mt-28 lg:pt-28 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Everything you need to write, organize, and share.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A focused editor, flexible folders, and instant public links in one calm workspace.
          </p>
        </div>

        <div className="mt-8 grid min-w-0 grid-cols-1 gap-4 sm:mt-10 sm:gap-6 lg:mt-10 lg:grid-cols-12 lg:auto-rows-[minmax(19rem,auto)]">
          <figure className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-2xl border bg-muted/20 p-2 sm:gap-5 lg:col-span-7 lg:row-span-2">
            <LandingPageSplitViewDemo />
            <figcaption className="min-w-0 px-3 pb-3 sm:px-4 sm:pb-4">
              <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                Write in split view
              </h3>
              <p className="mt-2 text-muted-foreground">
                Edit markdown on the left, see the live preview on the right. No tab switching, no
                distractions.
              </p>
            </figcaption>
          </figure>

          {features.map(({ demo: Demo, title, description }) => (
            <div
              key={title}
              className="flex min-w-0 max-w-full flex-col justify-start overflow-hidden rounded-2xl border bg-muted/20 p-4 sm:p-6 lg:col-span-5"
            >
              <Demo />
              <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
