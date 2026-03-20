import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ParentSurveyProps {
  userId: string;
  childId?: string;
  childName: string;
  streamId?: string;
  childSurveyId?: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface YesNoItem {
  key: string;
  label: string;
  emoji: string;
}

const parentQuestions: YesNoItem[] = [
  { key: "helped_child", label: "Do you feel this course helped your child?", emoji: "🛡️" },
  { key: "child_more_aware", label: "Is your child more aware of online safety now?", emoji: "👀" },
  { key: "easy_to_use", label: "Was the platform easy to use?", emoji: "✅" },
  { key: "would_recommend", label: "Would you recommend Kiki Warrior to other parents?", emoji: "💬" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="touch-target p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              n <= value ? "text-primary fill-primary" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ParentSurvey({ userId, childId, childName, streamId, childSurveyId, onComplete, onSkip }: ParentSurveyProps) {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleAnswer = (key: string, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from("parent_surveys")
      .insert({
        user_id: userId,
        child_id: childId || null,
        stream_id: streamId || null,
        helped_child: answers.helped_child ?? null,
        child_more_aware: answers.child_more_aware ?? null,
        easy_to_use: answers.easy_to_use ?? null,
        would_recommend: answers.would_recommend ?? null,
        overall_rating: rating || null,
        feedback: feedback.trim() || null,
        reviewed_child_survey_id: childSurveyId || null,
      });

    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card-kiki text-center space-y-5 py-6">
        <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          Thank you for your feedback!
        </h3>
        <p className="font-body text-sm text-muted-foreground max-w-sm mx-auto">
          Your feedback helps us continuously improve and keep children safer online.
        </p>
        <button
          onClick={onComplete}
          className="btn-copper px-6 py-3 text-sm uppercase tracking-widest"
        >
          Done
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-kiki space-y-5">
      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          Parent Feedback
        </h3>
        <p className="font-body text-sm text-muted-foreground">
          Help us keep improving — your input makes Kiki Warrior better for every family.
        </p>
      </div>

      {/* Yes/No questions */}
      <div className="space-y-3">
        {parentQuestions.map((q) => (
          <div key={q.key} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
            <span className="text-xl shrink-0">{q.emoji}</span>
            <p className="font-body text-sm text-foreground flex-1">{q.label}</p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => toggleAnswer(q.key, true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wide transition-all ${
                  answers[q.key] === true
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground hover:bg-success/20"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => toggleAnswer(q.key, false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wide transition-all ${
                  answers[q.key] === false
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground hover:bg-destructive/20"
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Star rating */}
      <div className="text-center space-y-2">
        <p className="font-body text-sm font-medium text-muted-foreground">
          Overall, how would you rate Kiki Warrior?
        </p>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {/* Free-text */}
      <div>
        <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
          Anything else you'd like to share?
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Your thoughts help us improve..."
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full touch-target btn-copper py-3 text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>

      <div className="text-center">
        <button onClick={onSkip} className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
          Skip survey
        </button>
      </div>
    </motion.div>
  );
}
