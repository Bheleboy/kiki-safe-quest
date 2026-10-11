// Live link check for kikiwarrior.com public pages. Writes results.json.
import fs from "node:fs";
import { chromium, devices } from "playwright";
const SITE = "https://kikiwarrior.com";
const PAGES = ["/", "/auth", "/auth?mode=signup", "/courses/internet-safety", "/books/armour-of-god", "/privacy", "/terms", "/verify-age"];
fs.mkdirSync("shots", { recursive: true });
const out = { phase: "links", at: new Date().toISOString(), checks: [], links: {}, external: {}, stores: [], amazon: [] };
const check = (name, pass, detail) => { out.checks.push({ name, pass: !!pass, detail }); console.log(pass ? "PASS" : "FAIL", name, JSON.stringify(detail ?? "")); };
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const b = await chromium.launch();
async function ctx(mobile) {
  const c = await b.newContext(mobile ? { ...devices["iPhone 13"] } : { viewport: { width: 1440, height: 900 }, userAgent: UA });
  await c.addInitScript(() => { try { localStorage.setItem("cookie-consent", "declined"); } catch {} });
  return c;
}
async function is404(p) { return (await p.getByText("Oops! Page not found").count()) > 0; }

try {
  for (const mobile of [false, true]) {
    const tag = mobile ? "mobile" : "desktop";
    const c = await ctx(mobile); const p = await c.newPage();
    for (const path of PAGES) {
      await p.goto(SITE + path, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(4000);
      check(`${tag} ${path} loads`, !(await is404(p)), {});
      if (mobile && path === "/") { const menu = p.getByRole("button", { name: /menu/i }); if (await menu.count()) { await menu.first().click().catch(() => {}); await p.waitForTimeout(800); } }
      const hrefs = await p.$$eval("a[href]", (as) => as.map((a) => ({ href: a.getAttribute("href"), text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 60) })));
      for (const h of hrefs) { const k = h.href; (out.links[k] ??= { texts: new Set(), on: new Set() }); out.links[k].texts.add(h.text); out.links[k].on.add(`${tag}:${path}`); }
    }
    await c.close();
  }
  for (const k of Object.keys(out.links)) out.links[k] = { texts: [...out.links[k].texts], on: [...out.links[k].on] };

  // Internal routes and anchors
  const c = await ctx(false); const p = await c.newPage();
  for (const href of Object.keys(out.links)) {
    if (/^(https?:|mailto:|tel:)/.test(href) && !href.startsWith(SITE)) continue;
    const url = href.startsWith("http") ? href : SITE + (href.startsWith("/") ? href : "/" + href);
    await p.goto(url, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3500);
    const hash = new URL(url).hash.slice(1);
    let ok = !(await is404(p)); let detail = { final: p.url() };
    if (hash) { const n = await p.locator("#" + hash).count(); ok = ok && n > 0; detail.anchor_found = n > 0; }
    check(`internal ${href}`, ok, detail);
  }

  // External links
  for (const href of Object.keys(out.links)) {
    if (!/^https?:/.test(href) || href.startsWith(SITE)) continue;
    try {
      const r = await p.request.get(href, { headers: { "User-Agent": UA }, maxRedirects: 10, timeout: 30000 });
      out.external[href] = { status: r.status(), final: r.url() };
      check(`external ${href}`, r.status() < 400, out.external[href]);
    } catch (e) { check(`external ${href}`, false, String(e).slice(0, 200)); }
  }
  for (const href of Object.keys(out.links)) if (href.startsWith("mailto:")) check(`mailto ${href}`, true, { note: "address only, not sent" });

  // Book store buttons as a signed-out visitor
  await p.goto(SITE + "/books/armour-of-god", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(4000);
  for (const name of ["Amazon", "Apple Books", "Kobo", "Barnes & Noble"]) {
    await p.goto(SITE + "/books/armour-of-god", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3000);
    const btn = p.getByRole("button", { name: new RegExp("^" + name.replace("&", "\\&")) });
    const popupP = c.waitForEvent("page", { timeout: 6000 }).catch(() => null);
    await btn.first().click().catch(() => {});
    const pop = await popupP; await p.waitForTimeout(1500);
    const res = { store: name, opened_store: pop ? pop.url() : null, page_after: p.url() };
    if (pop) { await pop.waitForLoadState("domcontentloaded").catch(() => {}); res.store_title = (await pop.title().catch(() => "")).slice(0, 120); await pop.close(); }
    out.stores.push(res);
    check(`book button ${name} (signed out)`, !!pop, res);
  }

  // Amazon listing check across stores
  for (const u of ["https://www.amazon.com.br/dp/B0FBX2XS3H", "https://www.amazon.com/dp/B0FBX2XS3H", "https://www.amazon.co.uk/dp/B0FBX2XS3H", "https://www.amazon.co.za/dp/B0FBX2XS3H"]) {
    const ap = await c.newPage();
    try {
      const r = await ap.goto(u, { waitUntil: "domcontentloaded", timeout: 30000 }); await ap.waitForTimeout(2500);
      const title = (await ap.locator("#productTitle, #ebooksProductTitle").first().innerText().catch(() => "")).trim();
      const price = (await ap.locator(".kindle-price, #kindle-price, .a-price .a-offscreen").first().innerText().catch(() => "")).trim();
      const name = u.split("/")[2];
      await ap.screenshot({ path: `shots/amazon-${name}.png` });
      out.amazon.push({ url: u, status: r?.status(), final: ap.url(), title, price, page_title: (await ap.title()).slice(0, 120) });
    } catch (e) { out.amazon.push({ url: u, error: String(e).slice(0, 200) }); }
    await ap.close();
  }
} catch (e) { check("script error", false, String(e?.stack ?? e)); }
await b.close();
out.summary = `${out.checks.filter((c) => c.pass).length}/${out.checks.length} passed`;
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
console.log(out.summary);
