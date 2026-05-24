import Image from "next/image";
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
      <Image
        src="/favicon.png"
        alt="Inkdown"
        width={icon}
        height={icon}
        className="rounded-lg"
        priority
      />
      {showText && (
        <span className={cn("truncate font-semibold tracking-tight", text)}>Inkdown</span>
      )}
    </div>
  );
}
