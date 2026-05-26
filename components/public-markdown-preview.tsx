import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Components } from "react-markdown";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { StaticCodeBlock } from "@/components/static-code-block";
import { extractLanguageFromClassName } from "@/lib/code-block";
import { normalizeMarkdownContent } from "@/lib/markdown-normalization";

interface PublicMarkdownPreviewProps {
  content: string;
  headingBaseLevel: 2 | 3;
}

const OPTIMIZED_IMAGE_HOSTS = new Set(["cdn.designfast.io", "pbs.twimg.com"]);
const defaultSchemaAttributes = defaultSchema.attributes ?? {};

const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchemaAttributes,
    code: [...(defaultSchemaAttributes.code || []), "className"],
    pre: [...(defaultSchemaAttributes.pre || []), "className"],
    div: [...(defaultSchemaAttributes.div || []), "className"],
    span: [...(defaultSchemaAttributes.span || []), "className"],
    p: [...(defaultSchemaAttributes.p || []), "className"],
    section: [...(defaultSchemaAttributes.section || []), "className"],
    article: [...(defaultSchemaAttributes.article || []), "className"],
    table: [...(defaultSchemaAttributes.table || []), "className"],
    thead: [...(defaultSchemaAttributes.thead || []), "className"],
    tbody: [...(defaultSchemaAttributes.tbody || []), "className"],
    tr: [...(defaultSchemaAttributes.tr || []), "className"],
    th: [...(defaultSchemaAttributes.th || []), "className"],
    td: [...(defaultSchemaAttributes.td || []), "className"],
  },
};

function normalizeUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) return null;

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    if (["http:", "https:", "mailto:", "tel:", "data:", "blob:"].includes(url.protocol)) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeImageSrc(value?: string) {
  const normalized = normalizeUrl(value);

  if (
    !normalized ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:") ||
    normalized.startsWith("#")
  ) {
    return null;
  }

  return normalized;
}

function getOptimizedImageDimensions(src: string) {
  try {
    const { hostname } = new URL(src);

    if (hostname === "cdn.designfast.io") {
      return { width: 1200, height: 1200 };
    }

    if (hostname === "pbs.twimg.com") {
      return { width: 1200, height: 480 };
    }
  } catch {
    return null;
  }

  return null;
}

function canOptimizeImage(src: string) {
  try {
    return OPTIMIZED_IMAGE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

function getFenceOpener(line: string) {
  const match = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(line);

  if (!match) return null;

  return {
    markerChar: match[1][0],
    markerLength: match[1].length,
  };
}

function isFenceCloser(line: string, markerChar: string, markerLength: number) {
  const escapedChar = markerChar === "`" ? "\\`" : markerChar;
  return new RegExp(`^[ \\t]{0,3}${escapedChar}{${markerLength},}[ \\t]*$`).test(line);
}

function getMinimumHeadingLevel(content: string) {
  let activeFence: { markerChar: string; markerLength: number } | null = null;
  let minHeadingLevel: number | null = null;

  for (const line of content.split("\n")) {
    if (activeFence) {
      if (isFenceCloser(line, activeFence.markerChar, activeFence.markerLength)) {
        activeFence = null;
      }
      continue;
    }

    const opener = getFenceOpener(line);
    if (opener) {
      activeFence = opener;
      continue;
    }

    const match = /^[ \t]{0,3}(#{1,6})(?:[ \t]+|$)/.exec(line);
    if (match) {
      const level = match[1].length;
      minHeadingLevel = minHeadingLevel ? Math.min(minHeadingLevel, level) : level;
    }
  }

  return minHeadingLevel;
}

function normalizeHeadingLevel(level: number, minHeadingLevel: number | null, baseLevel: number) {
  if (!minHeadingLevel) return level;
  return Math.min(6, Math.max(baseLevel, level + baseLevel - minHeadingLevel));
}

function normalizeMarkdownHeadings(
  content: string,
  baseLevel: PublicMarkdownPreviewProps["headingBaseLevel"],
) {
  const minHeadingLevel = getMinimumHeadingLevel(content);

  if (!minHeadingLevel || minHeadingLevel === baseLevel) {
    return content;
  }

  let activeFence: { markerChar: string; markerLength: number } | null = null;
  let previousHeadingLevel = baseLevel - 1;

  return content
    .split("\n")
    .map((line) => {
      if (activeFence) {
        if (isFenceCloser(line, activeFence.markerChar, activeFence.markerLength)) {
          activeFence = null;
        }
        return line;
      }

      const opener = getFenceOpener(line);
      if (opener) {
        activeFence = opener;
        return line;
      }

      return line.replace(/^([ \t]{0,3})(#{1,6})([ \t]+.*)$/u, (match, indent, marks, rest) => {
        const normalizedLevel = normalizeHeadingLevel(marks.length, minHeadingLevel, baseLevel);
        const level = Math.min(normalizedLevel, previousHeadingLevel + 1);
        previousHeadingLevel = level;
        return `${indent}${"#".repeat(level)}${rest}`;
      });
    })
    .join("\n");
}

function findFirstImageSrc(content: string) {
  const markdownImage = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/u.exec(content);

  if (markdownImage) {
    return normalizeImageSrc(markdownImage[1]) ?? null;
  }

  const htmlImage = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/iu.exec(content);
  return htmlImage ? normalizeImageSrc(htmlImage[1]) : null;
}

function getCodeBlockDataFromNode(node?: {
  children?: Array<{
    type?: string;
    tagName?: string;
    properties?: { className?: string | string[] };
    children?: Array<{ type?: string; value?: string }>;
  }>;
}) {
  const codeNode = node?.children?.[0];

  if (!codeNode || codeNode.type !== "element" || codeNode.tagName !== "code") {
    return null;
  }

  const className = Array.isArray(codeNode.properties?.className)
    ? codeNode.properties.className.join(" ")
    : codeNode.properties?.className;

  const code = (codeNode.children || [])
    .reduce((acc, child) => (child.type === "text" ? acc + (child.value || "") : acc), "")
    .replace(/\n$/, "");

  return {
    code,
    language: extractLanguageFromClassName(className),
  };
}

export function PublicMarkdownPreview({ content, headingBaseLevel }: PublicMarkdownPreviewProps) {
  const normalizedContent = normalizeMarkdownHeadings(
    normalizeMarkdownContent(content),
    headingBaseLevel,
  );
  const firstImageSrc = findFirstImageSrc(normalizedContent);

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-4 border-b pb-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-8 mb-4 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-3 text-lg font-semibold tracking-tight sm:text-xl">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-4 mb-2 text-base font-semibold tracking-tight sm:text-lg">{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 className="mt-4 mb-2 text-sm font-semibold tracking-tight sm:text-base">{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 className="mt-3 mb-2 text-sm font-semibold tracking-tight">{children}</h6>
    ),
    p: ({ children }) => (
      <p className="leading-7 [overflow-wrap:anywhere] [&:not(:first-child)]:mt-4">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="my-4 ml-5 list-disc [overflow-wrap:anywhere] sm:ml-6 [&>li]:mt-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 ml-5 list-decimal [overflow-wrap:anywhere] sm:ml-6 [&>li]:mt-2">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-primary/30 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...props }) => (
      <code
        className={
          className
            ? `relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[0.9em] break-words ${className}`
            : "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[0.9em] break-words"
        }
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ node, children }) => {
      const codeBlock = getCodeBlockDataFromNode(
        node as Parameters<typeof getCodeBlockDataFromNode>[0],
      );

      if (!codeBlock) {
        return <pre className="overflow-x-auto rounded-lg bg-muted p-4">{children}</pre>;
      }

      if (codeBlock.language === "mermaid") {
        return <MermaidDiagram chart={codeBlock.code} />;
      }

      return <StaticCodeBlock code={codeBlock.code} language={codeBlock.language} />;
    },
    a: ({ href, children }) => {
      const safeHref = normalizeUrl(href);

      if (!safeHref) {
        return (
          <span className="font-medium text-muted-foreground underline underline-offset-4">
            {children}
          </span>
        );
      }

      const isExternal =
        !safeHref.startsWith("/") &&
        !safeHref.startsWith("./") &&
        !safeHref.startsWith("../") &&
        !safeHref.startsWith("#");

      return (
        <a
          href={safeHref}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => {
      const safeSrc = normalizeImageSrc(typeof src === "string" ? src : undefined);

      if (!safeSrc) {
        return (
          <span className="my-4 block rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            {alt?.trim()
              ? `Add an image URL for "${alt.trim()}" to preview it.`
              : "Add an image URL to preview it."}
          </span>
        );
      }

      const dimensions = getOptimizedImageDimensions(safeSrc);
      const isPriorityImage = safeSrc === firstImageSrc;

      return (
        <span className="my-4 block overflow-hidden rounded-lg border bg-muted/20">
          {dimensions && canOptimizeImage(safeSrc) ? (
            <Image
              src={safeSrc}
              alt={alt || ""}
              width={dimensions.width}
              height={dimensions.height}
              sizes="(max-width: 768px) calc(100vw - 2rem), 768px"
              quality={60}
              loading={isPriorityImage ? "eager" : "lazy"}
              fetchPriority={isPriorityImage ? "high" : "auto"}
              className="mx-auto h-auto max-h-20 w-auto max-w-full object-contain sm:max-h-64"
            />
          ) : (
            <Image
              src={safeSrc}
              alt={alt || ""}
              width={1200}
              height={675}
              unoptimized
              loading={isPriorityImage ? "eager" : "lazy"}
              fetchPriority={isPriorityImage ? "high" : "auto"}
              className="mx-auto h-auto max-h-20 w-auto max-w-full object-contain sm:max-h-64"
            />
          )}
        </span>
      );
    },
    hr: () => <hr className="my-6 border-border" />,
    table: ({ children }) => (
      <div className="my-4 max-w-full overflow-x-auto">
        <table className="min-w-[640px] border-collapse border border-border text-xs sm:w-full sm:min-w-0 sm:text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
    th: ({ children }) => (
      <th scope="col" className="border border-border px-3 py-2 text-left font-semibold sm:px-4">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-3 py-2 align-top sm:px-4">{children}</td>
    ),
    input: ({ type, checked, node: _node, ...props }) => {
      if (type === "checkbox") {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            aria-label={checked ? "Completed task" : "Incomplete task"}
            className="mr-2 size-4"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
  };

  return (
    <article className="prose prose-neutral dark:prose-invert min-w-0 w-full max-w-full overflow-x-hidden break-words text-sm sm:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], rehypeKatex]}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </article>
  );
}
