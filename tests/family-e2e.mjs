// Family flow checks on the live site: learner lock, PIN on child sign out, 3-device limit.
// Usage: node tests/family-e2e.mjs <email> <password>
import fs from "node:fs";
import { chromium } from "playwright";
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const URL_ = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY, REF = new URL(URL_).hostname.split(".")[0];
const SITE = "https://kikiwarrior.com";
const [email, password] = process.argv.slice(2);
const DEV = "F".repeat(37) + "famdev";
const PIN = "4826";
fs.mkdirSync("shots", { recursive: true });
const out = { phase: "family", at: new Date().toISOString(), checks: [], shots: [] };
const check = (name, pass, detail) => { out.checks.push({ name, pass: !!pass, detail: detail ?? null }); console.log(pass ? "PASS" : "FAIL", name, JSON.stringify(detail ?? "")); };
async function fn(name, body, token) {
  const r = await fetch(`${URL_}/functions/v1/${name}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${token ?? KEY}` }, body: JSON.stringify({ device_secret: DEV, ...body }) });
  let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j };
}
async function login() { const r = await fn("secure-login", { email, password }); return r.body; }
async function valid(tok) { return (await fn("session-check", {}, tok)).body?.valid === true; }
const browser = await chromium.launch();
try {
  // Setup by API on device DEV (first device, trusted straight away).
  const s1 = await login();
  check("setup: sign in on first device", !!s1?.access_token, Object.keys(s1 ?? {}));
  const tok = s1.access_token;
  const user = await (await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${tok}` } })).json();
  const pinSet = await fn("parent-pin", { action: "set", pin: PIN, password }, tok);
  check("setup: parent PIN set", pinSet.status === 200, pinSet.body);
  const existing = await (await fetch(`${URL_}/rest/v1/children?select=id,first_name&order=created_at`, { headers: { apikey: KEY, Authorization: `Bearer ${tok}` } })).json();
  const kids = Array.isArray(existing) && existing.length >= 2 ? existing.slice(0, 2).map((k) => k.id) : [];
  if (!kids.length) for (const [first_name, age_band] of [["Ayanda", "6-9"], ["Lwazi", "10-13"]]) {
    const r = await fetch(`${URL_}/rest/v1/children`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${tok}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ parent_id: user.id, first_name, age_band }) });
    const j = await r.json(); kids.push(j?.[0]?.id);
  }
  check("setup: two children added", kids.every(Boolean), kids);
  const [A, B] = kids;

  // Browser on the same device with that session.
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sess = { access_token: tok, refresh_token: s1.refresh_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
  await c.addInitScript(([d, k, s]) => { try { if (!sessionStorage.getItem("kw_seeded")) { localStorage.setItem("kw_device", d); localStorage.setItem(k, s); localStorage.setItem("cookie-consent", "declined"); sessionStorage.setItem("kw_seeded", "1"); } } catch {} }, [DEV, `sb-${REF}-auth-token`, JSON.stringify(sess)]);
  const p = await c.newPage();
  const shot = async (n) => { const f = `shots/fam-${n}.png`; await p.screenshot({ path: f }); out.shots.push(f); };
  const pinVisible = async () => (await p.getByLabel("4-digit parent PIN").count()) > 0;

  await p.goto(`${SITE}/family`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(5000);
  if (p.url().includes("/verify-age")) {
    await p.getByPlaceholder("DD").fill("15"); await p.getByPlaceholder("MM").fill("06"); await p.getByPlaceholder("YYYY").fill("1985");
    for (const cb of await p.locator('input[type="checkbox"]').all()) await cb.check();
    await p.locator('button[type="submit"]').click(); await p.waitForTimeout(4000);
    check("new parent completes age check", !p.url().includes("/verify-age"), p.url());
    await p.goto(`${SITE}/family`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(5000);
  }
  check("family page shows both children", (await p.getByText("Ayanda").count()) > 0 && (await p.getByText("Lwazi").count()) > 0, p.url());
  check("hint about switching shown", (await p.getByText("Switching to another child needs the parent PIN.").count()) > 0);
  await shot("family");

  // First child goes straight in.
  const card = (name) => p.locator("div", { has: p.getByText(name, { exact: true }) }).filter({ has: p.getByRole("button", { name: /learn/i }) }).last();
  await card("Ayanda").getByRole("button", { name: /learn/i }).click(); await p.waitForTimeout(4000);
  check("first child starts without PIN", p.url().includes(`child=${A}`) && !(await pinVisible()), p.url());
  await shot("course-A");

  // Sign out from the child page needs the PIN.
  await p.locator("header button:has(svg.lucide-log-out)").click(); await p.waitForTimeout(2000);
  check("sign out on child page asks for parent PIN", await pinVisible(), p.url());
  await shot("signout-pin");
  await p.keyboard.press("Escape"); await p.waitForTimeout(1000);
  check("still signed in after cancelling", p.url().includes("/course"), p.url());

  // Back to family: active badge, then switching to sibling needs PIN.
  await p.goto(`${SITE}/family`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(4000);
  check("active child marked 'Learning on this device'", (await p.getByText("Learning on this device").count()) > 0);
  await card("Lwazi").getByRole("button", { name: /learn/i }).click(); await p.waitForTimeout(2000);
  check("switching to sibling asks for parent PIN", (await pinVisible()) && p.url().includes("/family"), p.url());
  await shot("switch-pin");
  await p.keyboard.press("Escape"); await p.waitForTimeout(800);

  // URL edit cannot bypass.
  await p.goto(`${SITE}/course?child=${B}`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(4000);
  check("editing the address to a sibling shows the PIN pad", (await pinVisible()) && (await p.getByText("Switching to another child needs the parent PIN.").count()) > 0, p.url());
  await shot("url-pin");
  await p.getByLabel("4-digit parent PIN").click(); await p.keyboard.type(PIN);
  await p.getByRole("button", { name: /unlock|continue|enter/i }).first().click().catch(() => {});
  await p.waitForTimeout(5000);
  check("correct PIN opens the sibling's course", !(await pinVisible()) && (await p.getByText("Lwazi").count()) > 0, p.url());
  await shot("course-B");

  // Device limit 3: two more sign-ins keep the browser session, a third pushes it out.
  const s2 = await login(); const s3 = await login();
  check("3 sessions: first session still valid", await valid(tok), { s2: !!s2?.access_token, s3: !!s3?.access_token });
  const s4 = await login();
  check("4th sign-in signs out the oldest session", !(await valid(tok)) && (await valid(s4.access_token)));
  for (const s of [s2, s3, s4]) if (s?.access_token) await fn("session-check", { action: "revoke_self" }, s.access_token);
} catch (e) { check("script error", false, String(e?.stack ?? e)); }
await browser.close();
out.summary = `${out.checks.filter((c) => c.pass).length}/${out.checks.length} passed`;
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
console.log(out.summary);
