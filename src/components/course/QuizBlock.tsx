import { MotionButton } from "@/components/ui/editorial";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { QuizQuestion } from "@/data/courseData";

const PASS_THRESHOLD = 70;

interface QuizBlockProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  lessonId: string;
  alreadyCompleted: boolean;
}

export function QuizBlock({ questions, onComplete, alreadyCompleted }: QuizBlockProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(alreadyCompleted);
  const [passed, setPassed] = useState(alreadyCompleted);

  const question = questions[currentQ];
  const isCorrect = selected === question?.correctIndex;

  const correctCount = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const resetQuiz = useCallback(() => {
    setCurrentQ(0);
    setSelected(null);
    setAnswers(Array(questions.length).fill(null));
    setShowResult(false);
    setFinished(false);
    setPassed(false);
  }, [questions.length]);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setShowResult(true);

    const newAnswers = [...answers];
    newAnswers[currentQ] = index;
    setAnswers(newAnswers);

    if (index === question.correctIndex) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ["#C87533", "#B8860B", "#DAA520"] });
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        // Quiz finished -- calculate final score
        const finalCorrect = newAnswers.filter((a, i) => a === questions[i]?.correctIndex).length;
        const finalScore = Math.round((finalCorrect / questions.length) * 100);
        setFinished(true);

        if (finalScore >= PASS_THRESHOLD) {
          setPassed(true);
          onComplete(finalScore);
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ["#C87533", "#B8860B", "#DAA520"] });
        }
      }
    }, 2000);
  };

  if (finished) {
    const displayScore = alreadyCompleted ? 100 : score;
    const displayCorrect = alreadyCompleted ? questions.length : correctCount;
    const didPass = alreadyCompleted || displayScore >= PASS_THRESHOLD;

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card-kiki text-center space-y-4"
      >
        {/* Score circle */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-4 ${
          didPass ? "border-success" : "border-destructive"
        }`}>
          <span className={`font-display text-2xl font-bold ${
            didPass ? "text-success" : "text-destructive"
          }`}>
            {displayScore}%
          </span>
        </div>

        <p className="font-display text-xl font-bold text-charcoal uppercase tracking-wide">
          {alreadyCompleted
            ? "Already Completed"
            : didPass
            ? displayScore === 100
              ? "Perfect Score!"
              : "Quiz Passed!"
            : "Not Quite There"}
        </p>

        <p className="text-charcoal/70 font-body">
          {alreadyCompleted
            ? "You already aced this quiz!"
            : `You got ${displayCorrect}/${questions.length} correct (${displayScore}%). ${
                didPass ? "Great work!" : `You need at least ${PASS_THRESHOLD}% to continue.`
              }`}
        </p>

        {/* Show incorrect answers summary when failed */}
        {!alreadyCompleted && !didPass && (
          <div className="text-left space-y-2 mt-2">
            {questions.map((q, i) => {
              const wasWrong = answers[i] !== q.correctIndex;
              if (!wasWrong) return null;
              return (
                <div key={i} className="rounded-lg bg-destructive/10 p-3 text-sm font-body">
                  <p className="font-semibold text-destructive">
                    Q{i + 1}: {q.question}
                  </p>
                  <p className="text-charcoal/70 mt-1">
                    Your answer: <span className="text-destructive">{q.options[answers[i]!]?.label}</span>
                    {" · "}
                    Correct: <span className="text-success">{q.options[q.correctIndex]?.label}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {!alreadyCompleted && !didPass && (
          <Button variant="ghost"
            onClick={resetQuiz}
            className="btn-copper adventure-button px-6 py-3 text-sm uppercase tracking-widest"
          >
            Try Again
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="card-kiki space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-charcoal/70 font-display uppercase tracking-wide">
          Question {currentQ + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => {
            const answered = answers[i] !== null;
            const correct = answers[i] === questions[i]?.correctIndex;
            return (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  !answered
                    ? i === currentQ
                      ? "bg-primary"
                      : "bg-primary/10"
                    : correct
                    ? "bg-success"
                    : "bg-destructive"
                }`}
              />
            );
          })}
        </div>
      </div>

      <h3 className="font-display text-base font-semibold text-charcoal">{question.question}</h3>

      <div className="grid gap-3">
        <AnimatePresence mode="wait">
          {question.options.map((opt, i) => (
            <MotionButton variant="ghost"
              key={`${currentQ}-${i}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`editorial-quiz-option touch-target w-full text-left rounded-lg p-4 font-body font-medium text-sm transition-all border ${
                selected === null
                  ? "border-primary/20 bg-card hover:border-primary/50 active:scale-[0.98]"
                  : selected === i
                  ? isCorrect
                    ? "border-success bg-success/10 text-success"
                    : "border-destructive bg-destructive/10 text-destructive"
                  : i === question.correctIndex && showResult
                  ? "border-success bg-success/10"
                  : "border-primary/20 bg-card opacity-40"
              }`}
            >
              {opt.label}
            </MotionButton>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className={`rounded-lg p-4 text-sm font-body ${
              isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}
          >
            <span className="font-semibold">{isCorrect ? "Correct!" : "Not quite."}</span>{" "}
            {question.explanation}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pass threshold info */}
      <p className="text-xs text-charcoal/70 font-body text-center">
        Score {PASS_THRESHOLD}% or higher to unlock the next lesson
      </p>
    </div>
  );
}
