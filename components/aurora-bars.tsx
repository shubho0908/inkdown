"use client";

import { useRef } from "react";
import { useAnimationFrame } from "motion/react";

import { cn } from "@/lib/utils";

export interface AuroraBarsProps {
  /** @default 24 */
  barCount?: number;
  /** gradient color stops, bottom to top — @default ["#ffd6eb", "#ff9acb", "#ff5aa6", "#ff2d78", "#00000000"] */
  colors?: string[];
  /** max bar height as fraction of container height — @default 0.92 */
  maxHeightRatio?: number;
  /** min bar height as fraction of container height — @default 0.18 */
  minHeightRatio?: number;
  /** undulation speed — @default 0.5 */
  speed?: number;
  /** @default 3 */
  gap?: number;
  /** px blur per bar, creates soft glow — @default 0 */
  blur?: number;
  /** @default "#000000" */
  background?: string;
  className?: string;
}

/** two sine waves per bar for organic movement */
function barHeight(index: number, total: number, time: number, minH: number, maxH: number): number {
  // Arch envelope: tallest in the centre, shorter on edges
  const norm = index / (total - 1);
  const arch = Math.sin(norm * Math.PI);

  const phase1 = (index / total) * Math.PI * 2;
  const phase2 = (index / total) * Math.PI * 5.3;

  const wave = 0.5 + 0.25 * Math.sin(time * 1.1 + phase1) + 0.25 * Math.sin(time * 0.7 + phase2);

  const blended = arch * 0.65 + wave * 0.35;

  return minH + blended * (maxH - minH);
}

export function AuroraBars({
  barCount = 24,
  colors = ["#ffd6eb", "#ff9acb", "#ff5aa6", "#ff2d78", "#00000000"],
  maxHeightRatio = 0.92,
  minHeightRatio = 0.18,
  speed = 0.5,
  gap = 3,
  blur = 0,
  background = "#000000",
  className,
}: AuroraBarsProps) {
  const timeRef = useRef(0);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  const gradientStop = colors
    .map((c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`)
    .join(", ");
  const gradient = `linear-gradient(to top, ${gradientStop})`;

  useAnimationFrame((_, delta) => {
    timeRef.current += (delta / 1000) * speed;
    const t = timeRef.current;

    for (let i = 0; i < barCount; i += 1) {
      const bar = barRefs.current[i];
      if (!bar) continue;

      const height = barHeight(i, barCount, t, minHeightRatio, maxHeightRatio);
      bar.style.height = `${height * 100}%`;
    }
  });

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} style={{ background }}>
      <div className="absolute inset-0 flex items-end">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
              padding: `0 ${gap / 2}px`,
            }}
          >
            <div
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              style={{
                width: "100%",
                height: `${barHeight(i, barCount, 0, minHeightRatio, maxHeightRatio) * 100}%`,
                background: gradient,
                borderRadius: "9999px 9999px 0 0",
                filter: `blur(${blur}px)`,
                opacity: 0.85,
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 100%, transparent 40%, #000000cc 100%)",
        }}
      />
    </div>
  );
}
