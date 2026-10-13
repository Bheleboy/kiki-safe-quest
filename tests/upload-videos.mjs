import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const URL_ = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const names = fs.readFileSync("tests/lesson-videos.txt", "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
const out = { phase: "upload", at: new Date().toISOString(), results: [] };
for (const n of names) {
  let res = { name: n };
  try {
    const src = await fetch(`https://github.com/Bheleboy/kiki-safe-quest/releases/download/v2.0-talking-renders/${n}`);
    const buf = Buffer.from(await src.arrayBuffer());
    res.bytes = buf.length;
    const up = await fetch(`${URL_}/storage/v1/object/videos/lessons-v2/${n}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "video/mp4", "cache-control": "max-age=31536000", "x-upsert": "false" }, body: buf });
    res.status = up.status; if (up.status >= 300) res.error = (await up.text()).slice(0, 200);
  } catch (e) { res.error = String(e).slice(0, 200); }
  out.results.push(res); console.log(JSON.stringify(res));
}
out.summary = `${out.results.filter((r) => r.status === 200).length}/${names.length} uploaded`;
fs.writeFileSync("results.json", JSON.stringify(out, null, 2)); console.log(out.summary);
