import { cn } from "@/lib/utils";

interface InkdownLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 28, text: "text-base" },
  md: { icon: 36, text: "text-lg" },
  lg: { icon: 48, text: "text-2xl" },
};

export function InkdownLogo({ size = "md", showText = true, className }: InkdownLogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={showText ? undefined : "img"}
        aria-label={showText ? undefined : "Inkdown"}
        aria-hidden={showText ? true : undefined}
        className="rounded-lg"
      >
        <rect width="180" height="180" rx="37" className="fill-foreground" />
        <g transform="translate(4.5 4.5) scale(0.95)">
          <path
            className="fill-background"
            d="M101.14 53H136.63C151.02 53 162.69 64.67 162.69 79.06V112.9H148.11V79.06C148.11 78.71 148.1 78.37 148.07 78.03L112.58 112.9C112.7 112.9 112.82 112.9 112.94 112.9H148.11V126.67H112.94C98.55 126.67 86.56 114.89 86.56 100.5V66.74H101.14V100.5C101.14 101.15 101.19 101.79 101.29 102.42L137.56 66.78C137.26 66.76 136.95 66.74 136.63 66.74H101.14V53Z"
          />
          <path
            className="fill-background"
            d="M65.29 124.14L14 66.74H34.64L64.75 100.44V66.74H80.14V118.47C80.14 126.28 70.5 129.96 65.29 124.14Z"
          />
        </g>
      </svg>
      {showText && (
        <span className={cn("truncate font-semibold tracking-tight", text)}>Inkdown</span>
      )}
    </div>
  );
}
