import fs from "node:fs";
const u = "https://github.com/Bheleboy/kiki-safe-quest/releases/download/v2.0-talking-renders/ages_6_9_m3_l1_kindness_on_the_internet.mp4";
const out = { phase: "range", at: new Date().toISOString(), hops: [] };
let url = u;
for (let i = 0; i < 5; i++) {
  const r = await fetch(url, { redirect: "manual", headers: { Range: "bytes=0-1", "User-Agent": "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" } });
  const h = Object.fromEntries([...r.headers].filter(([k]) => /content|accept-ranges|location|cache|access-control|cross-origin/.test(k)));
  if (h.location) h.location = h.location.slice(0, 90) + "...";
  out.hops.push({ host: new URL(url).host, status: r.status, headers: h });
  const loc = r.headers.get("location");
  if (r.status >= 300 && r.status < 400 && loc) { url = new URL(loc, url).toString(); continue; }
  const buf = Buffer.from(await r.arrayBuffer()); out.hops.at(-1).body_bytes = buf.length; break;
}
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
