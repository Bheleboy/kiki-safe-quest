import { Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Props {
  src: string;
  entryFrame?: number;
  fromX?: number;    // px offset for entrance
  side?: "left" | "right" | "center";
  height?: number;
  bob?: number;      // idle bob amplitude
  bobSpeed?: number;
}

export const Character: React.FC<Props> = ({
  src,
  entryFrame = 0,
  fromX = -400,
  side = "center",
  height = 900,
  bob = 12,
  bobSpeed = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - entryFrame;

  const s = spring({ frame: local, fps, config: { damping: 18, stiffness: 120 } });
  const x = interpolate(s, [0, 1], [fromX, 0]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const idle = Math.sin(local / bobSpeed) * bob;

  const sideStyle: React.CSSProperties =
    side === "left"
      ? { left: "6%", bottom: 40 }
      : side === "right"
      ? { right: "6%", bottom: 40 }
      : { left: "50%", bottom: 40, transform: "translateX(-50%)" };

  return (
    <div
      style={{
        position: "absolute",
        ...sideStyle,
        opacity,
        transform: `${sideStyle.transform ?? ""} translate(${x}px, ${idle}px)`,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ height, width: "auto", filter: "drop-shadow(0 30px 25px rgba(43,32,25,0.25))" }}
      />
    </div>
  );
};
