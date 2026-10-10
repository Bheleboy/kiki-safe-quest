// End-to-end checks for the Kiki Warrior sign-in security layer.
// Run by .github/workflows/security-e2e.yml. Results go to results.json.
// Phases: signup | confirm | main | verify | revoke
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  }),
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FN = `${URL_}/functions/v1`;
const [phase, email, password, arg1, arg2] = process.argv.slice(2);
const DEV = { A: "A".repeat(40) + "devA01", B: "B".repeat(40) + "devB01", C: "C".repeat(40) + "devC01" };
const out = { phase, at: new Date().toISOString(), checks: [] };
const scrub = (v) => JSON.parse(JSON.stringify(v ?? null, (k, x) => (/token|password|email/i.test(k) && typeof x === "string" ? "[hidden]" : x)));
const check = (name, pass, detail) => { detail = scrub(detail); out.checks.push({ name, pass: !!pass, detail }); console.log(pass ? "PASS" : "FAIL", name, JSON.stringify(detail ?? "")); };

async function fn(name, body, token) {
  const r = await fetch(`${FN}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${token ?? KEY}`, "User-Agent": "KW-E2E-Test" },
    body: JSON.stringify(body),
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
async function rest(path, token) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
async function directLogin() {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
  });
  return { status: r.status, body: await r.json() };
}

try {
  if (phase === "signup") {
    const weak = await fn("secure-signup", { email, password: "password123", first_name: "Test", age_band: "6-9", device_secret: DEV.A });
    check("weak/breached password rejected at signup", weak.status >= 400, weak);
    const s = await fn("secure-signup", { email, password, first_name: "Test", age_band: "6-9", device_secret: DEV.A });
    check("signup accepted", s.status < 300, s);
  }

  if (phase === "confirm") {
    const r = await fetch(arg1, { redirect: "manual" });
    check("confirmation link accepted", [200, 302, 303].includes(r.status), { status: r.status, location: r.headers.get("location")?.slice(0, 120) });
  }

  if (phase === "main") {
    // Direct auth API login (bypassing secure-login) must not unlock any data.
    const d = await directLogin();
    const dTok = d.body?.access_token;
    check("direct auth login returns a token (expected)", !!dTok, { status: d.status });
    if (dTok) {
      const p = await rest("profiles?select=id", dTok);
      check("unregistered session reads no profile data", Array.isArray(p.body) ? p.body.length === 0 : p.status >= 400, p);
      const c = await rest("children?select=id", dTok);
      check("unregistered session reads no child data", Array.isArray(c.body) ? c.body.length === 0 : c.status >= 400, { status: c.status, n: c.body?.length });
    }
    // First device login (device A) should be trusted straight away.
    const a = await fn("secure-login", { email, password, device_secret: DEV.A });
    check("first device sign-in returns tokens", !!a.body?.access_token, { status: a.status, keys: Object.keys(a.body ?? {}) });
    if (a.body?.access_token) {
      const sc = await fn("session-check", { device_secret: DEV.A }, a.body.access_token);
      check("registered session passes session-check", sc.body?.valid === true, sc);
      const scWrong = await fn("session-check", { device_secret: DEV.C }, a.body.access_token);
      check("same session from another device fails session-check", scWrong.body?.valid === false, scWrong);
      const p = await rest("profiles?select=id", a.body.access_token);
      check("registered session can read own profile", Array.isArray(p.body) && p.body.length === 1, { status: p.status, n: p.body?.length });
    }
    // New device B must get a step-up challenge, no tokens.
    const b = await fn("secure-login", { email, password, device_secret: DEV.B });
    check("new device gets step-up and no tokens", b.body?.step_up === true && !b.body?.access_token, b);
    out.challenge_id = b.body?.challenge_id; // not secret on its own (needs the emailed code and device)
    // Lockout on a throwaway email.
    const junk = `nobody-${Date.now()}@example.com`;
    let last;
    for (let i = 0; i < 6; i++) last = await fn("secure-login", { email: junk, password: "wrong-password-x", device_secret: DEV.C });
    check("6th wrong attempt is locked with wait time", last.status === 429 && last.body?.retry_after_seconds > 0, last);
    const unknown = await fn("secure-login", { email: `ghost-${Date.now()}@example.com`, password: "x".repeat(12), device_secret: DEV.C });
    check("unknown account gets the generic error", unknown.body?.message === "Invalid email or password.", unknown.body);
  }

  if (phase === "verify") {
    const challenge = arg1, code = arg2;
    const mis = await fn("verify-login-challenge", { challenge_id: challenge, code, device_secret: DEV.C });
    check("code entered on a different device is rejected", mis.status === 403 && mis.body?.error === "device_mismatch", mis);
    const ok = await fn("verify-login-challenge", { challenge_id: challenge, code, device_secret: DEV.B });
    check("code on the starting device signs in", !!ok.body?.access_token, { status: ok.status, keys: Object.keys(ok.body ?? {}) });
    const reuse = await fn("verify-login-challenge", { challenge_id: challenge, code, device_secret: DEV.B });
    check("code cannot be reused", !reuse.body?.access_token, reuse);
    const bTok = ok.body?.access_token;
    // Session limit: two more sign-ins on trusted device A should push device B's session out.
    const a2 = await fn("secure-login", { email, password, device_secret: DEV.A });
    const a3 = await fn("secure-login", { email, password, device_secret: DEV.A });
    check("trusted device signs in without a code", !!a2.body?.access_token && !!a3.body?.access_token, { a2: a2.status, a3: a3.status });
    if (bTok) {
      const scB = await fn("session-check", { device_secret: DEV.B }, bTok);
      check("oldest session signed out when a 3rd sign-in happens", scB.body?.valid === false, scB);
      const pB = await rest("profiles?select=id", bTok);
      check("signed-out session can no longer read data", Array.isArray(pB.body) ? pB.body.length === 0 : pB.status >= 400, { status: pB.status, n: pB.body?.length });
    }
    // Parent PIN
    const tok = a3.body?.access_token;
    if (tok) {
      const st = await fn("parent-pin", { action: "status" }, tok);
      check("PIN status works", st.status === 200, st);
      const triv = await fn("parent-pin", { action: "set", pin: "1234" }, tok);
      check("trivial PIN rejected", triv.status >= 400, triv);
      const set = await fn("parent-pin", { action: "set", pin: "4826", password }, tok);
      check("PIN set", set.status === 200, set);
      let w;
      for (let i = 0; i < 5; i++) w = await fn("parent-pin", { action: "verify", pin: "0000" }, tok);
      const after = await fn("parent-pin", { action: "verify", pin: "4826" }, tok);
      check("PIN locks after 5 wrong tries (even correct PIN refused)", after.status >= 400, { last_wrong: w, after });
      const out1 = await fn("session-check", { action: "revoke_self", device_secret: DEV.A }, tok);
      const chk = await fn("session-check", { device_secret: DEV.A }, tok);
      check("sign out ends the session on the server", chk.body?.valid === false, { out1: out1.status, chk });
    }
  }

  if (phase === "revoke") {
    const fake = await fn("security-revoke", { token: "x".repeat(43) });
    check("fake revoke token refused", fake.status >= 400 || fake.body?.ok !== true, fake);
    const r = await fn("security-revoke", { token: arg1 });
    check("real revoke link signs out everywhere", r.status === 200, r);
    const again = await fn("security-revoke", { token: arg1 });
    check("revoke link only works once", again.status >= 400 || again.body?.ok !== true, again);
    const a = await fn("secure-login", { email, password, device_secret: DEV.A });
    check("after revoke, old trusted device needs a code again", a.body?.step_up === true, a.body);
  }
} catch (e) {
  check("script error", false, String(e?.stack ?? e));
}
out.summary = `${out.checks.filter((c) => c.pass).length}/${out.checks.length} passed`;
fs.writeFileSync("results.json", JSON.stringify(out, null, 2));
console.log(out.summary);
