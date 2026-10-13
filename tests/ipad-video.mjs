// Plays lesson videos in WebKit (Safari engine) on an iPad profile, signed in as the test parent.
import fs from "node:fs";
import { webkit, devices } from "playwright";
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const URL_ = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY, REF = new URL(URL_).hostname.split(".")[0];
const SITE = "https://kikiwarrior.com";
const [email, password] = process.argv.slice(2);
const DEV = "F".repeat(37) + "famdev";
fs.mkdirSync("shots", { recursive: true });
const out = { phase: "ipad", at: new Date().toISOString(), checks: [], shots: [] };
const check = (n, p, d) => { out.checks.push({ name: n, pass: !!p, detail: d ?? null }); console.log(p ? "PASS" : "FAIL", n, JSON.stringify(d ?? "")); };
const b = await webkit.launch();
try {
  // 1. Direct playback of every lesson URL in the live bundle.
  const html = await (await fetch(SITE + "/")).text();
  const js = html.match(/\/assets\/index-[^"']+\.js/)[0];
  const bundle = await (await fetch(SITE + js)).text();
  const urls = [...new Set(bundle.match(/https:\/\/[^"'`\s]+\.mp4/g) || [])].filter((u) => !u.includes("/hero/"));
  check("live site lesson video links", urls.length >= 40, { count: urls.length, host: [...new Set(urls.map((u) => new URL(u).host))] });
  const c0 = await b.newContext({ ...devices["iPad (gen 7)"] });
  const p0 = await c0.newPage(); await p0.setContent("<video id=v playsinline muted preload=metadata></video>");
  let ok = 0; const bad = [];
  for (const u of urls) {
    const r = await p0.evaluate(async (src) => {
      const v = document.getElementById("v"); v.src = src;
      return await new Promise((res) => { const t = setTimeout(() => res({ err: "timeout", rs: v.readyState }), 20000); v.onloadedmetadata = () => { clearTimeout(t); res({ ok: true, d: v.duration }); }; v.onerror = () => { clearTimeout(t); res({ err: v.error && v.error.code }); }; v.load(); });
    }, u);
    if (r.ok) ok++; else bad.push({ u: u.split("/").pop(), r });
  }
  const sb = urls.find((u) => u.includes("/lessons-v2/"));
  if (sb) { const h = await fetch(sb, { headers: { Range: "bytes=0-1" } }); check("new storage labels files as video with streaming", h.status === 206 && h.headers.get("content-type") === "video/mp4" && !(h.headers.get("content-disposition") || "").includes("attachment"), { status: h.status, type: h.headers.get("content-type"), disp: h.headers.get("content-disposition") }); }
  check("no lesson still served from GitHub", urls.filter((u) => u.includes("github.com")).length === 0, { github: urls.filter((u) => u.includes("github.com")).length });
  check("every lesson video loads in Safari engine", ok === urls.length, { ok, total: urls.length, bad: bad.slice(0, 5) });
  // 2. Real lesson page on iPad, signed in.
  const r = await fetch(`${URL_}/functions/v1/secure-login`, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ email, password, device_secret: DEV }) });
  const s = await r.json();
  const user = await (await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}` } })).json();
  const sess = { access_token: s.access_token, refresh_token: s.refresh_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
  const kids = await (await fetch(`${URL_}/rest/v1/children?select=id,age_band&order=created_at`, { headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}` } })).json();
  const kid = kids.find((k) => k.age_band === "6-9") || kids[0];
  const c = await b.newContext({ ...devices["iPad (gen 7)"] });
  await c.addInitScript(([d, k, v, kidId, uid]) => { try { if (!sessionStorage.getItem("seed")) { localStorage.setItem("kw_device", d); localStorage.setItem(k, v); localStorage.setItem("cookie-consent", "declined"); localStorage.setItem("kw_active_learner", JSON.stringify({ uid, childId: kidId })); localStorage.setItem(`kw_notice_family-update-2026-10_${uid}`, "1"); sessionStorage.setItem("seed", "1"); } } catch {} }, [DEV, `sb-${REF}-auth-token`, JSON.stringify(sess), kid.id, user.id]);
  const p = await c.newPage(); await p.goto(`${SITE}/course?child=${kid.id}`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(6000);
  const stream = p.getByText(/Ages 6.9/i).first(); if (await stream.count()) { await stream.click().catch(() => {}); await p.waitForTimeout(3000); }
  const lesson = p.getByText(/Kindness on the Internet/i).first();
  if (await lesson.count()) { await lesson.click().catch(() => {}); await p.waitForTimeout(6000); }
  const vstate = await p.evaluate(() => { const v = document.querySelector("video:not([src*='/hero/'])"); return v ? { src: v.currentSrc || v.src, rs: v.readyState, err: v.error && v.error.code, dur: v.duration } : null; });
  check("lesson page video ready on iPad", vstate && vstate.rs >= 1 && !vstate.err, vstate);
  check("no third-party credit caption", (await p.getByText(/Creative Commons|BrainPOP/).count()) === 0);
  await p.evaluate(() => { const v = document.querySelector("video"); if (v) { v.muted = true; v.currentTime = 8; } }); await p.waitForTimeout(3000);
  await p.screenshot({ path: "shots/ipad-lesson.png" }); out.shots.push("shots/ipad-lesson.png");
  await fetch(`${URL_}/functions/v1/session-check`, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${s.access_token}` }, body: JSON.stringify({ action: "revoke_self", device_secret: DEV }) });
} catch (e) { check("script error", false, String(e?.stack ?? e).slice(0, 400)); }
await b.close();
out.summary = `${out.checks.filter((c) => c.pass).length}/${out.checks.length} passed`;
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
