import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { MermaidDiagram } from "@/components/mermaid-diagram";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeStr = String(children).replace(/\n$/, "");

          if (match && match[1] === "mermaid") {
            return <MermaidDiagram chart={codeStr} />;
          }

          if (match) {
            return (
              <div className="relative my-4 group">
                <div className="flex items-center gap-2 justify-between px-4 py-2 bg-muted rounded-t-md border border-b-0 border-border">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {match[1]}
                  </span>
                </div>
                <pre className="!mt-0 !rounded-t-none border border-border">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          }

          return (
            <code
              className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        table({ children }) {
          return (
            <div className="my-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full">{children}</table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-muted/60">{children}</thead>;
        },
        th({ children }) {
          return (
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="px-4 py-2.5 text-sm border-b border-border last:border-b-0">
              {children}
            </td>
          );
        },
        tr({ children }) {
          return <tr className="hover-elevate">{children}</tr>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="my-4 pl-4 border-l-2 border-primary/40 text-muted-foreground italic">
              {children}
            </blockquote>
          );
        },
        h2({ children, id }) {
          return (
            <h2
              id={id}
              className="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-border text-foreground"
            >
              {children}
            </h2>
          );
        },
        h3({ children, id }) {
          return (
            <h3
              id={id}
              className="text-lg font-semibold mt-6 mb-3 text-foreground"
            >
              {children}
            </h3>
          );
        },
        h4({ children, id }) {
          return (
            <h4
              id={id}
              className="text-base font-semibold mt-4 mb-2 text-foreground"
            >
              {children}
            </h4>
          );
        },
        p({ children }) {
          return <p className="my-2 leading-relaxed">{children}</p>;
        },
        ul({ children }) {
          return <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return (
            <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>
          );
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },
        hr() {
          return <hr className="my-6 border-border" />;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              className="underline underline-offset-2 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
