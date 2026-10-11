import fs from "node:fs";
const out = { phase: "diag", at: new Date().toISOString(), hosts: {}, checks: [] };
for (const h of ["https://kikiwarrior.com/", "https://www.kikiwarrior.com/", "https://kiki-safe-quest.lovable.app/", "https://kikiwarrior.com/course"]) {
  try {
    const r = await fetch(h, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 Chrome/129" } });
    const hdr = Object.fromEntries([...r.headers].filter(([k]) => /cache|age|etag|last-mod|location|server|cf-|x-/.test(k)));
    const html = r.status < 300 ? await r.text() : "";
    const js = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
    let yt = null, gh = null;
    if (js[0]) { const b = await (await fetch(new URL(js[0], h))).text(); yt = (b.match(/youtube\.com\/embed/g) || []).length; gh = (b.match(/releases\/download/g) || []).length; }
    out.hosts[h] = { status: r.status, hdr, js, bundle_youtube_embed: yt, bundle_release_videos: gh };
  } catch (e) { out.hosts[h] = { error: String(e) }; }
}
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
