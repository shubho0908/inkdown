"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "@/components/theme-provider";

interface MermaidDiagramProps {
  chart: string;
  theme?: "light" | "dark";
}

export function MermaidDiagram({ chart, theme }: MermaidDiagramProps) {
  const { resolvedTheme } = useTheme();
  const diagramId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mermaidTheme = theme ?? (resolvedTheme === "dark" ? "dark" : "light");

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: mermaidTheme === "dark" ? "dark" : "default",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
        });

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${diagramId}`, chart);

        if (isCancelled) {
          return;
        }

        setSvg(renderedSvg);
        setError(null);
      } catch (cause) {
        if (isCancelled) {
          return;
        }

        const message =
          cause instanceof Error ? cause.message : "Unable to render this Mermaid diagram.";

        setError(message);
        setSvg(null);
      }
    }

    setSvg(null);
    setError(null);
    void renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [chart, diagramId, mermaidTheme]);

  if (error) {
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-dashed border-border bg-muted/20">
        <div className="border-b px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Mermaid Error
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground">{error}</div>
        <pre className="overflow-x-auto border-t bg-muted/40 p-4 text-xs leading-6">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border bg-card">
      <div
        className="mermaid-diagram min-h-24 overflow-x-auto p-4 sm:p-5"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      >
        {!svg ? (
          <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
            Rendering diagram…
          </div>
        ) : null}
      </div>
    </div>
  );
}
