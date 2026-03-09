import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const defaults = (size = 48): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 48 48",
  fill: "none",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function HelmetIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 28C12 16 18 8 24 8s12 8 12 20" stroke="currentColor" strokeWidth="2" />
      <path d="M8 28h32v4c0 2-2 4-4 4H12c-2 0-4-2-4-4v-4z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 28v-6c0-1 1-2 4-2s4 1 4 2v6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BreastplateIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M14 8h20l4 10v16c0 2-2 4-4 4H14c-2 0-4-2-4-4V18l4-10z" stroke="currentColor" strokeWidth="2" />
      <path d="M18 8v6l6 4 6-4V8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 18v14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 24h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BeltIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <rect x="6" y="18" width="36" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="19" y="16" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ShieldIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M24 4L6 12v10c0 12 8 18 18 22 10-4 18-10 18-22V12L24 4z" stroke="currentColor" strokeWidth="2" />
      <path d="M24 12v20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 18h20" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="22" r="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SwordIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M24 4v28" stroke="currentColor" strokeWidth="2" />
      <path d="M20 6l4-2 4 2v8l-4 2-4-2V6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 32h16" stroke="currentColor" strokeWidth="2" />
      <path d="M22 32v8h4v-8" stroke="currentColor" strokeWidth="2" />
      <path d="M21 36h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ShoesIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M8 20c0-4 4-8 8-8h2v16H10c-1 0-2-1-2-2v-6z" stroke="currentColor" strokeWidth="2" />
      <path d="M30 20c0-4 4-8 8-8h2v16H32c-1 0-2-1-2-2v-6z" stroke="currentColor" strokeWidth="2" transform="scale(-1,1) translate(-48,0)" />
      <path d="M18 28h-8c-1 0-2 1-2 2v4c0 1 1 2 2 2h10v-6c0-1-1-2-2-2z" stroke="currentColor" strokeWidth="2" />
      <path d="M30 28h8c1 0 2 1 2 2v4c0 1-1 2-2 2H28v-6c0-1 1-2 2-2z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const iconMap: Record<string, (props: IconProps) => JSX.Element> = {
  "helmet-of-salvation": HelmetIcon,
  "breastplate-of-righteousness": BreastplateIcon,
  "belt-of-truth": BeltIcon,
  "shield-of-faith": ShieldIcon,
  "sword-of-the-spirit": SwordIcon,
  "shoes-of-peace": ShoesIcon,
};

interface ArmourPieceIconProps extends IconProps {
  pieceId: string;
  earned?: boolean;
}

export function ArmourPieceIcon({ pieceId, earned, size = 48, className = "", ...props }: ArmourPieceIconProps) {
  const Icon = iconMap[pieceId] || ShieldIcon;
  return (
    <Icon
      size={size}
      className={`transition-all duration-300 ${
        earned
          ? "text-primary drop-shadow-[0_0_8px_hsl(25_85%_55%/0.5)]"
          : "text-muted-foreground/30"
      } ${className}`}
      {...props}
    />
  );
}
