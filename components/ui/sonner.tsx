"use client";

import { useResolvedTheme } from "@/hooks/use-theme";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const resolvedTheme = useResolvedTheme();

  return <Sonner theme={resolvedTheme} position="bottom-right" richColors closeButton {...props} />;
}
