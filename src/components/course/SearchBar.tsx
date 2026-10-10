import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { searchableTopics, courseData } from "@/data/courseData";

interface SearchBarProps {
  onNavigate: (ageStreamId: string, lessonId: string) => void;
}

export function SearchBar({ onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = query.trim().length >= 2
    ? searchableTopics
        .filter((t) => t.keyword.toLowerCase().includes(query.toLowerCase()))
        .flatMap((t) =>
          t.lessonIds.map((lessonId) => {
            for (const stream of courseData) {
              for (const mod of stream.modules) {
                const lesson = mod.lessons.find((l) => l.id === lessonId);
                if (lesson) return { stream, mod, lesson };
              }
            }
            return null;
          })
        )
        .filter(Boolean)
    : [];

  return (
    <div className="editorial-search relative w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2 focus-within:border-primary/50 transition-colors">
        <Search className="w-4 h-4 text-charcoal/70 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search topics..."
          className="w-full bg-transparent outline-none text-sm font-body text-charcoal placeholder:text-charcoal/70"
        />
        {query && (
          <Button variant="ghost" onClick={() => { setQuery(""); setOpen(false); }} className="p-1">
            <X className="w-4 h-4 text-charcoal/70" />
          </Button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card rounded-lg border border-primary/20 shadow-none z-50 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <Button variant="ghost"
              key={i}
              onClick={() => {
                onNavigate(r!.stream.id, r!.lesson.id);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b last:border-b-0 border-primary/15"
            >
              <p className="font-display font-medium text-sm text-charcoal uppercase tracking-wide">{r!.lesson.title}</p>
              <p className="text-xs text-charcoal/70 font-body">
                {r!.stream.label}, {r!.mod.title}
              </p>
            </Button>
          ))}
        </div>
      )}
      {open && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-card rounded-lg border border-primary/20 shadow-none z-50 p-4 text-center">
          <p className="text-sm text-charcoal/70 font-body">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}
