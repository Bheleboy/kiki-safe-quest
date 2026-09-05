import type { LessonConfig } from "../types";

import internetSafety101 from "./ages-10-13_internet-safety-101.json";
import fiveWaysToStayPrivate from "./ages-10-13_5-ways-to-stay-private.json";
import beKindOnline from "./ages-10-13_be-kind-online.json";

// Every lesson config in ./configs must be registered here so the bundler
// picks it up (Remotion's bundler does not support Vite's import.meta.glob).
export const LESSON_CONFIGS: LessonConfig[] = [
  internetSafety101,
  fiveWaysToStayPrivate,
  beKindOnline,
].map((c) => c as unknown as LessonConfig);
