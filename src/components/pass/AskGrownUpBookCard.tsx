import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOK_COVER, BOOK_TITLE } from "@/data/bookStores";

/** What a learner sees instead of store links while the paywall is on: the cover and "Ask a grown-up". */
export function AskGrownUpBookCard({ onAsk }: { onAsk: () => void }) {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold text-charcoal uppercase tracking-wide">My Books</h2>
      </div>
      <div className="card-kiki flex items-center gap-4">
        <img src={BOOK_COVER} alt={`${BOOK_TITLE} workbook cover`} loading="lazy" className="w-16 sm:w-20 rounded-lg shrink-0 -rotate-2" />
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-display text-sm font-bold text-charcoal uppercase tracking-wide break-words">{BOOK_TITLE}</h3>
          <Button variant="ghost" onClick={onAsk} className="touch-target btn-copper adventure-button px-4 py-2 text-xs uppercase tracking-widest">
            Ask a grown-up
          </Button>
        </div>
      </div>
    </div>
  );
}
