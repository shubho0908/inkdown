const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return HTML_ENTITY_MAP[normalized] ?? match;
  });
}

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHref(href: string) {
  if (href.startsWith("#") || href.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return href;
  }

  return `/${href.replace(/^\/+/, "")}`;
}

function extractMainHtml(html: string) {
  const mainMatches = Array.from(html.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main>/gi));
  if (mainMatches.length > 0) {
    return mainMatches
      .map((match) => match[1] ?? "")
      .sort((a, b) => stripTags(b).length - stripTags(a).length)[0];
  }

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? html;
}

export function acceptsMarkdown(acceptHeader: string | null) {
  if (!acceptHeader) {
    return false;
  }

  return acceptHeader
    .split(",")
    .map((part) => part.trim())
    .some((part) => {
      const [mediaRange, ...parameters] = part.split(";").map((item) => item.trim());
      const q = parameters.find((parameter) => parameter.startsWith("q="));
      const qValue = q ? Number.parseFloat(q.slice(2)) : 1;

      return mediaRange.toLowerCase() === "text/markdown" && qValue > 0;
    });
}

export function htmlToMarkdown(html: string) {
  let content = extractMainHtml(html);

  content = content
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  content = content.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, label: string) => {
      const text = stripTags(label);
      return text ? `[${text}](${normalizeHref(decodeHtmlEntities(href))})` : "";
    },
  );

  for (let level = 6; level >= 1; level -= 1) {
    const marker = "#".repeat(level);
    content = content.replace(
      new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi"),
      (_match, heading: string) => `\n\n${marker} ${stripTags(heading)}\n\n`,
    );
  }

  content = content
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match, item: string) => {
      const text = stripTags(item);
      return text ? `\n- ${text}` : "";
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|ul|ol|blockquote)>/gi, "\n\n")
    .replace(/<(p|div|section|article|header|footer|ul|ol|blockquote)\b[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(content)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countMarkdownTokens(markdown: string) {
  const words = markdown.trim().match(/\S+/g);
  return words ? words.length : 0;
}
