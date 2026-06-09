const HEADING_REGEXES: Record<number, RegExp> = {
  1: /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi,
  2: /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi,
  3: /<h3\b[^>]*>([\s\S]*?)<\/h3>/gi,
  4: /<h4\b[^>]*>([\s\S]*?)<\/h4>/gi,
  5: /<h5\b[^>]*>([\s\S]*?)<\/h5>/gi,
  6: /<h6\b[^>]*>([\s\S]*?)<\/h6>/gi,
};

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
    const contents = mainMatches.map((match) => match[1] ?? "");
    const maxLength = Math.max(...contents.map((content) => stripTags(content).length));
    return contents.find((content) => stripTags(content).length === maxLength) ?? "";
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
      HEADING_REGEXES[level],
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
