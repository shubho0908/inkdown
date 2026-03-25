const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
};

export function resolveLanguage(language?: string) {
  if (!language) {
    return undefined;
  }

  const normalized = language.trim().toLowerCase();
  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

export function extractLanguageFromClassName(className?: string) {
  const languageMatch = /language-([^\s]+)/.exec(className || "");
  return resolveLanguage(languageMatch?.[1]);
}

export function formatLanguageLabel(language?: string) {
  const resolved = resolveLanguage(language);

  if (!resolved) {
    return "Plain text";
  }

  if (resolved === "javascript") {
    return "JavaScript";
  }

  if (resolved === "typescript") {
    return "TypeScript";
  }

  if (resolved === "bash") {
    return "Bash";
  }

  if (resolved === "yaml") {
    return "YAML";
  }

  if (resolved === "json") {
    return "JSON";
  }

  if (resolved === "markdown") {
    return "Markdown";
  }

  return resolved.charAt(0).toUpperCase() + resolved.slice(1);
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
