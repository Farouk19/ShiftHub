import { useCallback, useEffect } from "react";
import { sections } from "@/content/blueprint";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Clock,
} from "lucide-react";

interface BlueprintPageProps {
  activeSectionId: string;
  onSectionChange: (id: string) => void;
}

export default function BlueprintPage({
  activeSectionId,
  onSectionChange,
}: BlueprintPageProps) {
  const activeSection = sections.find((s) => s.id === activeSectionId)!;
  const activeIndex = sections.findIndex((s) => s.id === activeSectionId);

  const goToSection = useCallback(
    (id: string) => {
      onSectionChange(id);
    },
    [onSectionChange]
  );

  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      goToSection(sections[activeIndex - 1].id);
    }
  }, [activeIndex, goToSection]);

  const goNext = useCallback(() => {
    if (activeIndex < sections.length - 1) {
      goToSection(sections[activeIndex + 1].id);
    }
  }, [activeIndex, goToSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/50 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="shrink-0">
            <FileText className="w-3 h-3 mr-1" />
            Blueprint
          </Badge>
          <Badge variant="secondary" className="shrink-0">
            <Layers className="w-3 h-3 mr-1" />
            {activeIndex + 1} / {sections.length}
          </Badge>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={goPrev}
            disabled={activeIndex === 0}
            data-testid="button-prev-section"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={goNext}
            disabled={activeIndex === sections.length - 1}
            data-testid="button-next-section"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <MarkdownRenderer content={activeSection.content} />

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="gap-2"
              data-testid="button-footer-prev"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeIndex > 0
                  ? sections[activeIndex - 1].title
                  : "Previous"}
              </span>
            </Button>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{Math.ceil(activeSection.content.split(/\s+/).length / 200)} min
              read
            </span>
            <Button
              variant="outline"
              onClick={goNext}
              disabled={activeIndex === sections.length - 1}
              className="gap-2"
              data-testid="button-footer-next"
            >
              <span className="hidden sm:inline">
                {activeIndex < sections.length - 1
                  ? sections[activeIndex + 1].title
                  : "Next"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
