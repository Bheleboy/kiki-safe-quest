import { bundle } from "@remotion/bundler";
try {
  const out = await bundle({ entryPoint: "/dev-server/remotion/index.ts", onProgress: () => {} });
  console.log("BUNDLE_OK", out);
} catch (e) {
  console.error("BUNDLE_FAIL:", String(e).slice(0, 2000));
  process.exit(1);
}
