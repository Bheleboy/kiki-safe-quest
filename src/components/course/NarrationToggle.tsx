import { useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface NarrationToggleProps {
  text: string;
}

export function NarrationToggle({ text }: NarrationToggleProps) {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [text]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, [text]);

  return (
    <button
      onClick={speaking ? stop : speak}
      className={`touch-target inline-flex items-center gap-2 rounded-full px-5 py-3 font-display font-bold text-sm transition-all ${
        speaking
          ? "bg-coral text-coral-foreground pulse-glow"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {speaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      {speaking ? "Stop Reading" : "Read to Me 🔊"}
    </button>
  );
}
