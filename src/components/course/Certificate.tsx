import { Button } from "@/components/ui/button";
import { useRef } from "react";
import html2canvas from "html2canvas";
import { ShieldIcon } from "./CourseIcons";

interface CertificateProps {
  learnerName: string;
  ageGroup: "6-9" | "10-13";
}

export function Certificate({ learnerName, ageGroup }: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: "#1C1C1C" });
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
        className="relative rounded-2xl bg-card border-2 border-primary/20 p-6 sm:p-8 md:p-12 text-center max-w-[600px] mx-auto"
      >
        <div
          className="absolute inset-3 rounded-xl border border-primary/15 pointer-events-none"
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
          <ShieldIcon size={40} className="stroke-primary opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 120, height: 120 }} />
          <div className="relative">
            <h2 className="font-display text-lg md:text-2xl font-bold text-primary leading-tight uppercase tracking-wider">
              Certificate of Completion
            </h2>
            <p className="text-xs text-charcoal/70 font-body mt-2">This certifies that</p>
            <p className="font-display text-xl md:text-3xl font-bold text-charcoal mt-1 uppercase tracking-wide">
              {learnerName}
            </p>
            <p className="text-xs text-charcoal/70 font-body mt-2">has successfully completed the</p>
            <p className="font-display text-base md:text-lg font-semibold text-accent mt-1 uppercase tracking-wide">
              Kiki Warrior Internet Safety Champion
            </p>
            <p className="text-xs font-body text-charcoal/70 mt-1">
              Ages {ageGroup} Course
            </p>
            <p className="text-xs text-charcoal/70 font-body mt-3">{dateStr}</p>
            <p className="text-[10px] text-charcoal/60 font-body mt-1">KikiWarrior.com</p>
          </div>
        </div>
      </div>
      <div className="text-center">
        <Button variant="ghost"
          onClick={download}
          className="touch-target inline-flex items-center gap-2 btn-copper adventure-button px-8 py-4 text-base uppercase tracking-widest"
        >
          Download Certificate
        </Button>
      </div>
    </div>
  );
}
