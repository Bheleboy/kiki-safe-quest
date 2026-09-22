import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { VisemeCue } from "../visemes";
import type { Presenter } from "../types";

/**
 * Mouth position config per character (percentage of image dimensions).
 * Kiki: 457x803, Nonala: 1264x848
 * Colors sampled from actual character image pixels around the mouth.
 */
const MOUTH_CONFIG = {
  kiki: {
    cx: 48.6,
    cy: 29.0,
    width: 13,
    height: 4,
    // Averaged from actual pixel samples around the mouth region
    skin: "rgb(73,40,22)",      // avg of above_lip + below_lip
    skinEdge: "rgb(70,38,20)",  // slightly darker for edge blending
    lipLine: "rgb(48,24,10)",
    mouthInner: "rgb(28,10,4)",
    teeth: "rgb(200,190,178)",
    tongue: "rgb(120,50,40)",
  },
  nonala: {
    cx: 50.6,
    cy: 30.2,
    width: 8,
    height: 3,
    skin: "rgb(114,56,31)",
    skinEdge: "rgb(100,50,26)",
    lipLine: "rgb(72,36,18)",
    mouthInner: "rgb(38,16,8)",
    teeth: "rgb(210,200,188)",
    tongue: "rgb(130,58,44)",
  },
} as const;

// SVG viewBox: 100x60. Skin patch uses a radial gradient fading to transparent.

interface SC {
  skin: string;
  skinEdge: string;
  lipLine: string;
  mouthInner: string;
  teeth: string;
  tongue: string;
}

const Shapes: Record<string, React.FC<SC>> = {
  X: (c) => (
    <g>
      <path d="M 26 29 Q 38 38 50 38 Q 62 38 74 29"
        fill="none" stroke={c.lipLine} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  ),
  A: (c) => (
    <g>
      <path d="M 30 30 Q 40 33 50 33 Q 60 33 70 30"
        fill="none" stroke={c.lipLine} strokeWidth="2.8" strokeLinecap="round" />
    </g>
  ),
  B: (c) => (
    <g>
      <ellipse cx="50" cy="31" rx="14" ry="8" fill={c.mouthInner} />
      <ellipse cx="50" cy="31" rx="14" ry="8" fill="none" stroke={c.lipLine} strokeWidth="1.8" />
    </g>
  ),
  C: (c) => (
    <g>
      <ellipse cx="50" cy="31" rx="18" ry="12" fill={c.mouthInner} />
      <rect x="37" y="21" width="26" height="6" rx="2" fill={c.teeth} />
      <ellipse cx="50" cy="31" rx="18" ry="12" fill="none" stroke={c.lipLine} strokeWidth="1.8" />
    </g>
  ),
  D: (c) => (
    <g>
      <ellipse cx="50" cy="32" rx="22" ry="16" fill={c.mouthInner} />
      <rect x="34" y="18" width="32" height="7" rx="2" fill={c.teeth} />
      <ellipse cx="50" cy="42" rx="10" ry="5" fill={c.tongue} />
      <ellipse cx="50" cy="32" rx="22" ry="16" fill="none" stroke={c.lipLine} strokeWidth="2.2" />
    </g>
  ),
  E: (c) => (
    <g>
      <ellipse cx="50" cy="32" rx="11" ry="14" fill={c.mouthInner} />
      <ellipse cx="50" cy="32" rx="11" ry="14" fill="none" stroke={c.lipLine} strokeWidth="2.2" />
    </g>
  ),
  F: (c) => (
    <g>
      <ellipse cx="50" cy="32" rx="16" ry="10" fill={c.mouthInner} />
      <rect x="36" y="24" width="28" height="6" rx="2" fill={c.teeth} />
      <ellipse cx="50" cy="32" rx="16" ry="10" fill="none" stroke={c.lipLine} strokeWidth="1.8" />
    </g>
  ),
  G: (c) => (
    <g>
      <ellipse cx="50" cy="32" rx="9" ry="11" fill={c.mouthInner} />
      <ellipse cx="50" cy="32" rx="9" ry="11" fill="none" stroke={c.lipLine} strokeWidth="2.2" />
    </g>
  ),
  H: (c) => (
    <g>
      <ellipse cx="50" cy="31" rx="20" ry="9" fill={c.mouthInner} />
      <rect x="35" y="24" width="30" height="6" rx="2" fill={c.teeth} />
      <ellipse cx="50" cy="32" rx="9" ry="6" fill={c.tongue} />
      <ellipse cx="50" cy="31" rx="20" ry="9" fill="none" stroke={c.lipLine} strokeWidth="1.8" />
    </g>
  ),
};

interface Props {
  presenter: Presenter;
  cues: VisemeCue[];
}

export const MouthOverlay: React.FC<Props> = ({ presenter, cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  // Binary search for the active viseme cue
  let shape = "X";
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = cues[mid];
    if (currentSec >= cue.start && currentSec < cue.end) {
      shape = cue.value;
      break;
    } else if (currentSec < cue.start) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  const mc = MOUTH_CONFIG[presenter];
  const ShapeComponent = Shapes[shape] || Shapes.X;

  return (
    <div
      style={{
        position: "absolute",
        left: `${mc.cx - mc.width / 2}%`,
        top: `${mc.cy - mc.height / 2}%`,
        width: `${mc.width}%`,
        height: `${mc.height}%`,
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          {/* Radial gradient for the skin patch - solid center, fades at edges */}
          <radialGradient id={`skin-${presenter}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mc.skin} stopOpacity="1" />
            <stop offset="55%" stopColor={mc.skin} stopOpacity="0.95" />
            <stop offset="78%" stopColor={mc.skinEdge} stopOpacity="0.7" />
            <stop offset="100%" stopColor={mc.skinEdge} stopOpacity="0" />
          </radialGradient>
          {/* Soft blur for the skin patch edges */}
          <filter id={`blur-${presenter}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Skin patch to cover original smile - uses gradient + blur for blending */}
        <ellipse
          cx="50" cy="30" rx="30" ry="20"
          fill={`url(#skin-${presenter})`}
          filter={`url(#blur-${presenter})`}
        />

        {/* The mouth shape */}
        <ShapeComponent
          skin={mc.skin}
          skinEdge={mc.skinEdge}
          lipLine={mc.lipLine}
          mouthInner={mc.mouthInner}
          teeth={mc.teeth}
          tongue={mc.tongue}
        />
      </svg>
    </div>
  );
};
