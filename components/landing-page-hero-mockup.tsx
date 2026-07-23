import { LandingPageEditorMockup } from "@/components/landing-page-editor-mockup";

export function LandingPageHeroMockup() {
  return (
    <figure>
      <LandingPageEditorMockup
        sample="welcome"
        url="inkdown.shubhojeet.com"
        className="w-full aspect-[4/3] min-h-[20rem] sm:min-h-[24rem]"
      />
      <figcaption className="sr-only">
        Inkdown editor with a live preview, folder sidebar, and split source view.
      </figcaption>
    </figure>
  );
}
