import { bundle } from "@remotion/bundler";
const out = await bundle({ entryPoint: "/dev-server/remotion/src/index.ts", onProgress: () => {} });
console.log("BUNDLE_OK", out);
