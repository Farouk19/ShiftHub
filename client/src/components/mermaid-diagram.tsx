import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme-provider";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  fontFamily: "var(--font-sans)",
});

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { theme } = useTheme();

  useEffect(() => {
    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          fontFamily: "var(--font-sans)",
          theme: theme === "dark" ? "dark" : "default",
        });

        const id = `mermaid-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError("");
      } catch (e) {
        setError("Failed to render diagram");
        console.error("Mermaid render error:", e);
      }
    };

    render();
  }, [chart, theme]);

  if (error) {
    return (
      <div className="border border-border rounded-md p-4 bg-muted/50">
        <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
