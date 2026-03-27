"use client";

import { useEffect, useMemo, useState } from "react";
import hljs from "highlight.js/lib/common";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  escapeHtml,
  formatLanguageLabel,
  resolveLanguage,
} from "@/lib/code-block";

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopyButton?: boolean;
}

function highlightCode(code: string, language?: string) {
  const resolvedLanguage = resolveLanguage(language);

  if (resolvedLanguage && hljs.getLanguage(resolvedLanguage)) {
    return hljs.highlight(code, { language: resolvedLanguage }).value;
  }

  return escapeHtml(code);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CodeBlock({
  code,
  language,
  showCopyButton = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const highlightedCode = useMemo(
    () => highlightCode(code, language),
    [code, language],
  );
  const label = formatLanguageLabel(language);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await copyText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="inkdown-code-block my-4 overflow-hidden rounded-xl border bg-card/80 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/60 px-3 py-2">
        <span className="truncate text-xs font-medium tracking-[0.08em] text-foreground/72">
          {label}
        </span>
        {showCopyButton ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            aria-label={copied ? "Code copied" : "Copy code"}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        ) : null}
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code
          className="hljs block min-w-full bg-transparent p-0 font-mono"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}
