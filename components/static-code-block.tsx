import hljs from "highlight.js/lib/common";
import { escapeHtml, formatLanguageLabel, resolveLanguage } from "@/lib/code-block";

interface StaticCodeBlockProps {
  code: string;
  language?: string;
}

function highlightCode(code: string, language?: string) {
  const resolvedLanguage = resolveLanguage(language);

  if (resolvedLanguage && hljs.getLanguage(resolvedLanguage)) {
    return hljs.highlight(code, { language: resolvedLanguage }).value;
  }

  return escapeHtml(code);
}

export function StaticCodeBlock({ code, language }: StaticCodeBlockProps) {
  const highlightedCode = highlightCode(code, language);
  const label = formatLanguageLabel(language);

  return (
    <div className="inkdown-code-block my-4 overflow-hidden rounded-xl border bg-card/80 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/60 px-3 py-2">
        <span className="truncate text-xs font-medium tracking-[0.08em] text-foreground/72">
          {label}
        </span>
      </div>
      <pre className="max-h-16 overflow-hidden p-4 text-xs leading-5 sm:max-h-40 sm:text-sm sm:leading-6">
        <code
          className="hljs block max-h-16 min-w-full overflow-hidden bg-transparent p-0 font-mono sm:max-h-40"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}
