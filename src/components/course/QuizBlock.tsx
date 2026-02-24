import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { QuizQuestion } from "@/data/courseData";

interface QuizBlockProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  lessonId: string;
  alreadyCompleted: boolean;
}

export function QuizBlock({ questions, onComplete, alreadyCompleted }: QuizBlockProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(alreadyCompleted);

  const question = questions[currentQ];
  const isCorrect = selected === question?.correctIndex;

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setShowResult(true);
    const newCorrect = index === question.correctIndex ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (index === question.correctIndex) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ["#FFD700", "#4CAF50", "#2196F3"] });
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setFinished(true);
        const score = Math.round((newCorrect / questions.length) * 100);
        onComplete(score);
        if (newCorrect === questions.length) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        }
      }
    }, 2000);
  };

  if (finished) {
    const score = alreadyCompleted ? 100 : Math.round((correctCount / questions.length) * 100);
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card-playful text-center"
      >
        <div className="text-5xl mb-3">{score === 100 ? "🌟" : score >= 50 ? "⭐" : "💪"}</div>
        <h3 className="font-display text-xl font-bold text-foreground">
          {score === 100 ? "Perfect Score!" : score >= 50 ? "Great Job!" : "Keep Trying!"}
        </h3>
        <p className="text-muted-foreground mt-1">
          {alreadyCompleted ? "You already aced this!" : `You got ${correctCount}/${questions.length} correct!`}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="card-playful space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground font-display">
          Question {currentQ + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentQ ? "bg-success" : i === currentQ ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="font-display text-lg font-bold text-foreground">{question.question}</h3>

      <div className="grid gap-3">
        <AnimatePresence mode="wait">
          {question.options.map((opt, i) => (
            <motion.button
              key={`${currentQ}-${i}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`touch-target w-full text-left rounded-xl p-4 font-body font-semibold text-base transition-all border-2 ${
                selected === null
                  ? "border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                  : selected === i
                  ? isCorrect
                    ? "border-success bg-success/10 text-success"
                    : "border-destructive bg-destructive/10 text-destructive"
                  : i === question.correctIndex && showResult
                  ? "border-success bg-success/10"
                  : "border-border bg-card opacity-50"
              }`}
            >
              <span className="mr-3 text-xl">{opt.emoji}</span>
              {opt.label}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className={`rounded-xl p-4 text-sm font-body ${
              isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}
          >
            <span className="font-bold">{isCorrect ? "✅ Correct!" : "❌ Not quite!"}</span>{" "}
            {question.explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
