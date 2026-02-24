import { useRef } from "react";
import html2canvas from "html2canvas";

interface CertificateProps {
  learnerName: string;
  ageGroup: "6-9" | "10-13";
}

export function Certificate({ learnerName, ageGroup }: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `KikiWarrior-Certificate-${learnerName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div
        ref={certRef}
        className="relative bg-card rounded-2xl p-8 md:p-12 border-4 border-secondary text-center"
        style={{ aspectRatio: "1.4/1", maxWidth: 600, margin: "0 auto" }}
      >
        <div className="absolute inset-4 border-2 border-secondary/40 rounded-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
          <span className="text-3xl md:text-4xl">🏆</span>
          <h2 className="font-display text-lg md:text-2xl font-extrabold text-primary leading-tight">
            Certificate of Completion
          </h2>
          <p className="text-xs text-muted-foreground font-body">This certifies that</p>
          <p className="font-display text-xl md:text-3xl font-extrabold text-foreground">
            {learnerName || "Internet Hero"}
          </p>
          <p className="text-xs text-muted-foreground font-body">has successfully completed the</p>
          <p className="font-display text-base md:text-lg font-bold text-coral">
            Kiki Warrior Internet Safety Champion
          </p>
          <p className="text-xs font-body text-muted-foreground">
            Ages {ageGroup} Course
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xl">⭐</span>
            <span className="text-xl">🛡️</span>
            <span className="text-xl">⭐</span>
          </div>
          <p className="text-xs text-muted-foreground font-body mt-1">{dateStr}</p>
          <p className="text-[10px] text-muted-foreground/60 font-body">KikiWarrior.com</p>
        </div>
      </div>
      <div className="text-center">
        <button
          onClick={download}
          className="touch-target inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-display font-bold text-primary-foreground text-lg hover:opacity-90 active:scale-95 transition-all"
        >
          📥 Download Certificate
        </button>
      </div>
    </div>
  );
}
