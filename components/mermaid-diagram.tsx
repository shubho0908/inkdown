"use client";

import { useEffect, useId, useReducer, useRef } from "react";
import { useResolvedTheme } from "@/hooks/use-theme";

interface MermaidDiagramProps {
  chart: string;
  theme?: "light" | "dark";
}

type DiagramState = {
  svg: string | null;
  error: string | null;
  renderKey: number;
};

type DiagramAction =
  | { type: "reset" }
  | { type: "success"; svg: string }
  | { type: "error"; error: string };

function diagramReducer(state: DiagramState, action: DiagramAction): DiagramState {
  switch (action.type) {
    case "reset":
      return { svg: null, error: null, renderKey: state.renderKey };
    case "success":
      return { svg: action.svg, error: null, renderKey: state.renderKey };
    case "error":
      return { svg: null, error: action.error, renderKey: state.renderKey };
    default:
      return state;
  }
}

export function MermaidDiagram({ chart, theme }: MermaidDiagramProps) {
  const diagramId = useId().replace(/:/g, "");
  const diagramRef = useRef<HTMLDivElement>(null);
  const resolvedTheme = useResolvedTheme();
  const [diagramState, dispatch] = useReducer(diagramReducer, {
    svg: null,
    error: null,
    renderKey: 0,
  });
  const mermaidTheme = theme ?? resolvedTheme;

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      if (isCancelled) {
        return;
      }

      dispatch({ type: "reset" });

      try {
        if (isCancelled) {
          return;
        }

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

        if (isCancelled) {
          return;
        }

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${diagramId}`, chart);

        dispatch({ type: "success", svg: renderedSvg });
      } catch (cause) {
        if (isCancelled) {
          return;
        }

        const message =
          cause instanceof Error ? cause.message : "Unable to render this Mermaid diagram.";

        dispatch({ type: "error", error: message });
      }
    }

    void renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [chart, diagramId, mermaidTheme, diagramState.renderKey]);

  const { svg, error } = diagramState;

  useEffect(() => {
    if (!diagramRef.current) {
      return;
    }

    if (svg) {
      diagramRef.current.innerHTML = svg;
      return;
    }

    diagramRef.current.innerHTML = "";
  }, [svg]);

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
      {svg ? (
        <div ref={diagramRef} className="mermaid-diagram min-h-24 overflow-x-auto p-4 sm:p-5" />
      ) : (
        <div className="mermaid-diagram flex min-h-24 items-center justify-center overflow-x-auto p-4 text-sm text-muted-foreground sm:p-5">
          Rendering diagram…
        </div>
      )}
    </div>
  );
}
