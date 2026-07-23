"use client";

import { useEffect, useRef } from "react";

const formatter = new Intl.NumberFormat("en-US", { notation: "compact" });

interface AnimatedNumberProps {
  value: number;
}

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

export function AnimatedNumber({ value }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const finalText = formatter.format(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = performance.now();
    const duration = 1500;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const current = value * easeOutQuart(progress);

      el.textContent = formatter.format(Math.round(current));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    el.textContent = formatter.format(0);
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {finalText}
      </span>
      <span className="sr-only">{finalText}</span>
    </>
  );
}
