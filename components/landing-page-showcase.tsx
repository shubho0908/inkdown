import { FileText } from "lucide-react";
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
    <section aria-label="Features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to write, organize, and share.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A focused editor, flexible folders, and instant public links in one calm workspace.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:grid-rows-2">
          <figure className="flex flex-col gap-6 rounded-2xl border bg-muted/20 p-2 lg:row-span-2">
            <LandingPageSplitViewDemo />
            <figcaption className="px-4 pb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
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
              className="flex flex-col justify-start rounded-2xl border bg-muted/20 p-6 sm:p-8"
            >
              <Demo />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
