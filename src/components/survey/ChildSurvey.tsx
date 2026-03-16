import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChildSurveyProps {
  userId: string;
  childId: string;
  childName: string;
  streamId: string;
  ageBand: string;
  onComplete: (surveyId: string) => void;
  onSkip: () => void;
}

interface YesNoQuestion {
  key: string;
  younger: string;
  older: string;
  emoji: string;
}

const questions: YesNoQuestion[] = [
  { key: "was_fun", younger: "Was it fun?", older: "Did you enjoy the course?", emoji: "🎉" },
  { key: "was_easy", younger: "Was it easy to understand?", older: "Was the content easy to follow?", emoji: "👍" },
  { key: "videos_helpful", younger: "Did you like the videos?", older: "Were the videos helpful and relatable?", emoji: "🎬" },
  { key: "learned_something", younger: "Did you learn something new?", older: "Did you learn something useful for staying safe?", emoji: "🧠" },
  { key: "would_recommend", younger: "Would you tell a friend about it?", older: "Would you recommend this to a friend?", emoji: "🤝" },
];

export function ChildSurvey({ userId, childId, childName, streamId, ageBand, onComplete, onSkip }: ChildSurveyProps) {
  const isYounger = ageBand === "6-9";
  const [step, setStep] = useState(0); // 0-4 = yes/no questions, 5 = text, 6 = submitting
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [favoritePart, setFavoritePart] = useState("");
  const [improvement, setImprovement] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentQ = questions[step];
  const totalSteps = questions.length + 1; // +1 for text step

  const handleAnswer = (value: boolean) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: value }));
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(questions.length); // go to text step
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data, error } = await supabase
      .from("child_surveys")
      .insert({
        user_id: userId,
        child_id: childId,
        stream_id: streamId,
        age_band: ageBand,
        was_fun: answers.was_fun ?? null,
        was_easy: answers.was_easy ?? null,
        videos_helpful: answers.videos_helpful ?? null,
        learned_something: answers.learned_something ?? null,
        would_recommend: answers.would_recommend ?? null,
        favorite_part: favoritePart.trim() || null,
        what_to_improve: improvement.trim() || null,
      } as any)
      .select("id")
      .single();

    setSubmitting(false);
    if (!error && data) {
      setSubmitted(true);
      setTimeout(() => onComplete((data as any).id), 1500);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card-kiki text-center space-y-4 py-8">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          {isYounger ? "Thank you, warrior! 🌟" : "Thanks for your feedback!"}
        </h3>
        <p className="font-body text-muted-foreground text-sm">
          {isYounger ? "Your answers help us make things even better!" : "Your feedback helps us improve the platform."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-kiki space-y-5">
      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          {isYounger ? `Great job, ${childName}! 🎉` : `Well done, ${childName}!`}
        </h3>
        <p className="font-body text-sm text-muted-foreground">
          {isYounger
            ? "Can you answer a few quick questions for us?"
            : "We'd love your quick feedback to make this even better."}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < step ? "bg-success" : i === step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step < questions.length && currentQ && (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >
            <div className="text-center">
              <span className="text-4xl block mb-2">{currentQ.emoji}</span>
              <p className="font-body text-lg font-medium text-foreground">
                {isYounger ? currentQ.younger : currentQ.older}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleAnswer(true)}
                className="touch-target flex flex-col items-center gap-2 rounded-xl border-2 border-success/30 bg-success/5 px-8 py-4 hover:bg-success/15 hover:border-success transition-all"
              >
                <span className="text-3xl">👍</span>
                <span className="font-display text-sm font-bold text-success uppercase tracking-wide">
                  {isYounger ? "Yes!" : "Yes"}
                </span>
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="touch-target flex flex-col items-center gap-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 px-8 py-4 hover:bg-destructive/15 hover:border-destructive transition-all"
              >
                <span className="text-3xl">👎</span>
                <span className="font-display text-sm font-bold text-destructive uppercase tracking-wide">
                  {isYounger ? "No" : "No"}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {step === questions.length && (
          <motion.div
            key="text-step"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >
            <div>
              <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                {isYounger ? "What did you like the most? 🌟" : "What was your favourite part?"}
              </label>
              <textarea
                value={favoritePart}
                onChange={(e) => setFavoritePart(e.target.value)}
                placeholder={isYounger ? "I liked when..." : "My favourite part was..."}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                {isYounger ? "What could be better? 🤔" : "Anything we could improve?"}
              </label>
              <textarea
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                placeholder={isYounger ? "Maybe you could..." : "It would be better if..."}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full touch-target btn-copper py-3 text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending..." : isYounger ? "Send my answers!" : "Submit feedback"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <button onClick={onSkip} className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
          {isYounger ? "Skip for now" : "Skip survey"}
        </button>
      </div>
    </motion.div>
  );
}
