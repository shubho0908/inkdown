import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { CodeBlock } from "@/components/code-block";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { extractLanguageFromClassName } from "@/lib/code-block";
import { normalizeMarkdownContent } from "@/lib/markdown-normalization";

interface MarkdownPreviewProps {
  content: string;
  mode?: "interactive" | "print";
}

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

  if (!trimmed) {
    return null;
  }

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

    if (
      ["http:", "https:", "mailto:", "tel:", "data:", "blob:"].includes(
        url.protocol,
      )
    ) {
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
    ? codeNode.properties?.className.join(" ")
    : codeNode.properties?.className;

  const code = (codeNode.children || [])
    .filter((child) => child.type === "text")
    .map((child) => child.value || "")
    .join("")
    .replace(/\n$/, "");

  return {
    code,
    language: extractLanguageFromClassName(className),
  };
}

export const MarkdownPreview = memo(function MarkdownPreview({
  content,
  mode = "interactive",
}: MarkdownPreviewProps) {
  const normalizedContent = normalizeMarkdownContent(content);
  const isPrintMode = mode === "print";

  return (
    <article
      className={
        isPrintMode
          ? "prose prose-neutral min-w-0 w-full max-w-none overflow-x-visible break-words text-[13px] leading-7 sm:text-[15px]"
          : "prose prose-neutral dark:prose-invert min-w-0 w-full max-w-full overflow-x-hidden break-words text-sm sm:text-base"
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeKatex,
        ]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 border-b pb-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 mb-4 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-3 text-lg font-semibold tracking-tight sm:text-xl">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 text-base font-semibold tracking-tight sm:text-lg">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="leading-7 [overflow-wrap:anywhere] [&:not(:first-child)]:mt-4">
              {children}
            </p>
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
            <blockquote className="mt-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ node: _node, className, children, ...props }) => (
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
            const codeBlock = getCodeBlockDataFromNode(node);

            if (!codeBlock) {
              return (
                <pre className="overflow-x-auto rounded-lg bg-muted p-4">
                  {children}
                </pre>
              );
            }

            if (codeBlock.language === "mermaid") {
              return (
                <MermaidDiagram
                  chart={codeBlock.code}
                  theme={isPrintMode ? "light" : undefined}
                />
              );
            }

            return (
              <CodeBlock
                code={codeBlock.code}
                language={codeBlock.language}
                showCopyButton={!isPrintMode}
              />
            );
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
            const safeSrc = normalizeImageSrc(
              typeof src === "string" ? src : undefined,
            );

            if (!safeSrc) {
              return (
                <span className="my-4 block rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  {alt?.trim()
                    ? `Add an image URL for "${alt.trim()}" to preview it.`
                    : "Add an image URL to preview it."}
                </span>
              );
            }

            return (
              <span className="my-4 block overflow-hidden rounded-lg border">
                <img
                  src={safeSrc}
                  alt={alt || ""}
                  className="h-auto max-w-full"
                />
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
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold sm:px-4">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 align-top sm:px-4">{children}</td>
          ),
          input: ({ node: _node, type, checked, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 h-4 w-4"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </article>
  );
});
