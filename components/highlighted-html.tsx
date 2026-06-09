"use client";

import { useCallback, type ReactElement } from "react";

interface HighlightedHtmlProps {
  html: string;
  className?: string;
  as?: "code" | "div";
}

export function HighlightedHtml({
  html,
  className,
  as: Tag = "code",
}: HighlightedHtmlProps): ReactElement {
  const setHighlightedHtml = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        node.innerHTML = html;
      }
    },
    [html],
  );

  return <Tag ref={setHighlightedHtml} className={className} />;
}
