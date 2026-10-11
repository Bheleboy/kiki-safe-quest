import fs from "node:fs";
import { chromium, devices } from "playwright";
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const URL_ = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY, REF = new URL(URL_).hostname.split(".")[0];
const SITE = "https://kikiwarrior.com";
const [email, password] = process.argv.slice(2);
const DEV = "F".repeat(37) + "famdev";
fs.mkdirSync("shots", { recursive: true });
const out = { phase: "popup", at: new Date().toISOString(), checks: [], shots: [] };
const check = (n, p, d) => { out.checks.push({ name: n, pass: !!p, detail: d ?? null }); console.log(p ? "PASS" : "FAIL", n); };
const b = await chromium.launch();
try {
  // Sign-in page message (signed out).
  const a = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });
  await a.addInitScript(() => { try { localStorage.setItem("cookie-consent", "declined"); } catch {} });
  const ap = await a.newPage(); await ap.goto(`${SITE}/auth`, { waitUntil: "domcontentloaded" }); await ap.waitForTimeout(4000);
  check("sign-in page shows upgrade line", (await ap.getByText("Kiki Warrior has been upgraded").count()) > 0);
  await ap.screenshot({ path: "shots/popup-auth.png" }); out.shots.push("shots/popup-auth.png");
  for (const [tag, opts] of [["desktop", { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 }], ["mobile", { ...devices["iPhone 13"] }]]) {
    const r = await fetch(`${URL_}/functions/v1/secure-login`, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ email, password, device_secret: DEV }) });
    const s = await r.json();
    const user = await (await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}` } })).json();
    const sess = { access_token: s.access_token, refresh_token: s.refresh_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
    const c = await b.newContext(opts);
    await c.addInitScript(([d, k, v]) => { try { if (!sessionStorage.getItem("seed")) { localStorage.setItem("kw_device", d); localStorage.setItem(k, v); localStorage.setItem("cookie-consent", "declined"); sessionStorage.setItem("seed", "1"); } } catch {} }, [DEV, `sb-${REF}-auth-token`, JSON.stringify(sess)]);
    const p = await c.newPage(); await p.goto(`${SITE}/family`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(6000);
    check(`${tag}: pop-up shows after sign-in`, (await p.getByText("Kiki has had a big upgrade!").count()) > 0, p.url());
    await p.screenshot({ path: `shots/popup-${tag}.png` }); out.shots.push(`shots/popup-${tag}.png`);
    await p.getByRole("button", { name: "Got it" }).click().catch(() => {}); await p.waitForTimeout(1000);
    await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(5000);
    check(`${tag}: pop-up does not return after Got it`, (await p.getByText("Kiki has had a big upgrade!").count()) === 0);
    await fetch(`${URL_}/functions/v1/session-check`, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${s.access_token}` }, body: JSON.stringify({ action: "revoke_self", device_secret: DEV }) });
  }
} catch (e) { check("script error", false, String(e)); }
await b.close();
out.summary = `${out.checks.filter((c) => c.pass).length}/${out.checks.length} passed`;
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
