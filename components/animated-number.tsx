"use client";

import { useEffect } from "react";
import { domAnimation, LazyMotion, useMotionValue, useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";

const formatter = new Intl.NumberFormat("en-US", { notation: "compact" });

interface AnimatedNumberProps {
  value: number;
}

export function AnimatedNumber({ value }: AnimatedNumberProps) {
  const target = useMotionValue(0);
  const spring = useSpring(target, { stiffness: 50, damping: 20, restDelta: 0.5 });
  const display = useTransform(spring, (latest) => formatter.format(Math.round(latest)));

  useEffect(() => {
    target.set(value);
  }, [target, value]);

  return (
    <LazyMotion features={domAnimation}>
      <m.span aria-hidden="true">{display}</m.span>
      <span className="sr-only">{formatter.format(value)}</span>
    </LazyMotion>
  );
}
