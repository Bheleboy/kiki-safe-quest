import { CheckCircle } from "lucide-react";
import { CourseIcon } from "./CourseIcons";
import type { AgeStream } from "@/data/courseData";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LessonSidebarProps {
  stream: AgeStream;
  currentLessonId: string;
  isLessonComplete: (id: string) => boolean;
  onSelectLesson: (moduleId: string, lessonIndex: number) => void;
}

export function LessonSidebar({
  stream,
  currentLessonId,
  isLessonComplete,
  onSelectLesson,
}: LessonSidebarProps) {
  let globalIndex = 0;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-border/40">
        <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">
          Lessons
        </h3>
        <p className="text-[11px] text-muted-foreground font-body mt-0.5">
          Click a lesson to navigate
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {stream.modules.map((mod) => (
            <div key={mod.id} className="space-y-1.5">
              {/* Module header */}
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
                  <CourseIcon name={mod.icon || "shield"} size={14} className="stroke-primary-foreground" />
                </div>
                <span className="font-display text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {mod.title}
                </span>
              </div>

              {/* Lessons in module */}
              {mod.lessons.map((lesson, lessonIdx) => {
                globalIndex++;
                const isCurrent = lesson.id === currentLessonId;
                const completed = isLessonComplete(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(mod.id, lessonIdx)}
                    className={`w-full text-left rounded-lg p-3 transition-all group ${
                      isCurrent
                        ? "bg-primary/15 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-display font-bold shrink-0 mt-0.5 ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : completed
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {completed ? <CheckCircle className="w-3.5 h-3.5" /> : globalIndex}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-display text-xs font-semibold uppercase tracking-wide truncate ${
                            isCurrent ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {lesson.title}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] text-primary font-display font-medium uppercase tracking-wider">
                            Now playing
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
