import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none break-words text-sm sm:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 border-b pb-2 text-2xl font-bold tracking-tight sm:text-3xl">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 mb-4 border-b pb-2 text-xl font-semibold tracking-tight sm:text-2xl">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-3 text-lg font-semibold tracking-tight sm:text-xl">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 text-base font-semibold tracking-tight sm:text-lg">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="leading-7 [overflow-wrap:anywhere] [&:not(:first-child)]:mt-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-4 ml-5 list-disc [overflow-wrap:anywhere] sm:ml-6 [&>li]:mt-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 ml-5 list-decimal [overflow-wrap:anywhere] sm:ml-6 [&>li]:mt-2">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            return isInline ? (
              <code
                className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[0.9em] break-words"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm ${className}`}
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <span className="my-4 block overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || ''}
                className="h-auto max-w-full"
              />
            </span>
          ),
          hr: () => <hr className="my-6 border-border" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">{children}</td>
          ),
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 h-4 w-4"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
