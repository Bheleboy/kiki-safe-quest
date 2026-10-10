// Browser checks on the live site with the QA account. Phases: ui1 | ui2
import fs from "node:fs";
import { chromium, devices } from "playwright";
const [phase, email, password, arg1, arg2] = process.argv.slice(2);
const SITE = "https://kikiwarrior.com";
const DEVICE = "Dd".repeat(21) + "x"; // 43 chars, fixed test device
fs.mkdirSync("shots", { recursive: true });
const out = { phase, at: new Date().toISOString(), checks: [], shots: [] };
const check = (name, pass, detail) => { out.checks.push({ name, pass: !!pass, detail }); console.log(pass ? "PASS" : "FAIL", name, detail ?? ""); };
const browser = await chromium.launch();
async function ctx(mobile) {
  const c = await browser.newContext(mobile ? { ...devices["iPhone 13"] } : { viewport: { width: 1280, height: 900 } });
  await c.addInitScript((d) => { try { localStorage.setItem("kw_device", d); localStorage.setItem("cookie-consent", "declined"); } catch {} }, DEVICE);
  return c;
}
async function shot(page, name) { const f = `shots/${phase}-${name}.png`; await page.screenshot({ path: f, fullPage: true }); out.shots.push(f); }
async function dismissCookies(page) { for (const t of ["Decline", "Accept"]) { const b = page.getByRole("button", { name: t }); if (await b.count()) { await b.first().click().catch(() => {}); break; } } }
try {
  const c = await ctx(false);
  const page = await c.newPage();
  await page.goto(`${SITE}/auth`, { waitUntil: "domcontentloaded" });
  await dismissCookies(page);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  const t0 = Date.now();
  await page.click('button[type="submit"]');
  await Promise.race([
    page.getByLabel("6-digit sign-in code").waitFor({ timeout: 40000 }).catch(() => {}),
    page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 40000 }).catch(() => {}),
  ]);
  out.signin_ms = Date.now() - t0;
  await page.waitForTimeout(1000);
  const codeScreen = await page.getByLabel("6-digit sign-in code").count();
  if (phase === "ui1") {
    check("new browser is asked for an emailed code", codeScreen > 0);
    await shot(page, "code-screen");
    fs.writeFileSync("storage.json", JSON.stringify(await c.storageState()));
  }
  if (phase === "ui2") {
    if (codeScreen) {
      await shot(page, "code-screen");
      // Wait for the tester to publish the emailed code to code.txt on the e2e-results branch.
      let code = "";
      for (let i = 0; i < 40 && !code; i++) {
        await new Promise((r) => setTimeout(r, 6000));
        try {
          const r = await fetch(`https://api.github.com/repos/Bheleboy/kiki-safe-quest/contents/code.txt?ref=e2e-results&t=${Date.now()}`, { headers: { Accept: "application/vnd.github.raw", ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) } });
          if (r.ok) { const [ts, c] = (await r.text()).trim().split(":"); if (Number(ts) > Date.parse(out.at)) code = c; }
        } catch {}
      }
      check("code received from tester", !!code);
      await page.getByLabel("6-digit sign-in code").fill(code);
      await page.click('button[type="submit"]');
      await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 40000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }
    check("signed in after code", !page.url().includes("/auth"), page.url());
    await shot(page, "after-signin");
    await page.goto(`${SITE}/family`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500);
    check("child picker opens without PIN", (await page.getByText("Test Kid").count()) > 0);
    await shot(page, "family");
    await page.goto(`${SITE}/parent`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500);
    const pinPad = await page.getByLabel("4-digit parent PIN").count();
    check("parent dashboard asks for PIN", pinPad > 0);
    await shot(page, "parent-pin");
    if (pinPad) {
      await page.getByLabel("4-digit parent PIN").fill(arg2 || "4826");
      await page.getByRole("button", { name: /unlock|continue|enter/i }).first().click().catch(() => {});
      await page.waitForTimeout(4000);
      await shot(page, "parent-dashboard");
    }
    await page.goto(`${SITE}/course?child=3aeef6da-924f-4422-83c5-bf1dc03ededa`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(3000);
    const young = page.getByText(/Ages 6.9/i).first();
    if (await young.count()) { await young.click().catch(() => {}); await page.waitForTimeout(3000); }
    await page.waitForTimeout(2000);
    check("course completion screen shows", (await page.getByText("Congratulations!").count()) > 0);
    await shot(page, "course-complete");
    fs.writeFileSync("storage.json", JSON.stringify(await c.storageState()));
    const m = await ctx(true); await m.addCookies((await c.storageState()).cookies);
    const mp = await m.newPage();
    await mp.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
    await mp.evaluate((s) => { for (const o of s.origins) if (o.origin.includes("kikiwarrior")) for (const kv of o.localStorage) localStorage.setItem(kv.name, kv.value); }, await c.storageState());
    await mp.goto(`${SITE}/course?child=3aeef6da-924f-4422-83c5-bf1dc03ededa`, { waitUntil: "domcontentloaded" }); await mp.waitForTimeout(3000);
    const y2 = mp.getByText(/Ages 6.9/i).first();
    if (await y2.count()) { await y2.click().catch(() => {}); await mp.waitForTimeout(3000); }
    await shot(mp, "course-complete-mobile");
  }
} catch (e) { check("script error", false, String(e?.stack ?? e)); }
await browser.close();
out.summary = `${out.checks.filter((c) => c.pass).length}/${out.checks.length} passed`;
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
