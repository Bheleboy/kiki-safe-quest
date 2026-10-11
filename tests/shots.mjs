import fs from "node:fs";
import { chromium, devices } from "playwright";
const SITE = "https://kikiwarrior.com";
fs.mkdirSync("shots", { recursive: true });
const out = { phase: "shots", at: new Date().toISOString(), checks: [], shots: [] };
const b = await chromium.launch();
async function ctx(m) { const c = await b.newContext(m ? { ...devices["iPhone 13"] } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }); await c.addInitScript(() => { try { localStorage.setItem("cookie-consent", "declined"); } catch {} }); return c; }
async function snap(p, name, opts = {}) { const f = `shots/${name}.png`; await p.screenshot({ path: f, ...opts }); out.shots.push(f); }
try {
  const c = await ctx(false); const p = await c.newPage();
  await p.goto(SITE + "/", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(6000);
  for (const t of ["Decline", "Accept"]) { const x = p.getByRole("button", { name: t }); if (await x.count()) { await x.first().click().catch(() => {}); break; } }
  await p.waitForTimeout(1000);
  await snap(p, "hero-desktop");
  for (const id of ["paths", "missions", "academy", "rewards", "parents"]) {
    const el = p.locator("#" + id);
    if (await el.count()) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(1800); await el.screenshot({ path: `shots/sec-${id}.png` }); out.shots.push(`shots/sec-${id}.png`); }
  }
  await p.goto(SITE + "/auth", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3000); await snap(p, "auth-desktop");
  await p.goto(SITE + "/courses/internet-safety", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(4000); await snap(p, "course-preview", { fullPage: false });
  const m = await ctx(true); const mp = await m.newPage();
  await mp.goto(SITE + "/", { waitUntil: "domcontentloaded" }); await mp.waitForTimeout(6000);
  for (const t of ["Decline", "Accept"]) { const x = mp.getByRole("button", { name: t }); if (await x.count()) { await x.first().click().catch(() => {}); break; } }
  await mp.waitForTimeout(1000); await snap(mp, "hero-mobile");
  out.checks.push({ name: "done", pass: true });
} catch (e) { out.checks.push({ name: "error", pass: false, detail: String(e) }); }
await b.close();
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
