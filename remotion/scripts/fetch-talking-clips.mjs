#!/usr/bin/env node
// Fetches HeyGen talking-presenter clips and converts them to alpha webm.
// Usage: node scripts/fetch-talking-clips.mjs [lesson-id ...]
// If lesson ids are given, only those configs are processed; otherwise all.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "src/talking-manifest.json");
const CONFIG_DIR = path.join(ROOT, "src/configs");
const OUT_DIR = path.join(ROOT, "public/talking");
const TMP_DIR = "/tmp/talk";
const MIN_CREATED = 1791158400; // 5 Oct 2026

const WANTED_IDS = process.argv.slice(2).filter(Boolean);

const writeManifest = (list) => fs.writeFileSync(MANIFEST, JSON.stringify(list, null, 2) + "\n");

const KEY = process.env.HEYGEN_API_KEY;
if (!KEY) {
  console.warn("WARN: HEYGEN_API_KEY not set - writing empty manifest, static presenter will be used.");
  writeManifest([]);
  process.exit(0);
}

async function api(url) {
  const res = await fetch(url, {
    headers: { "X-Api-Key": KEY, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function listVideos() {
  const all = [];
  let token = null;
  for (let page = 0; page < 30; page++) {
    let url = "https://api.heygen.com/v1/video.list?limit=100";
    if (token) url += `&token=${encodeURIComponent(token)}`;
    const json = await api(url);
    const vids = json?.data?.videos ?? [];
    all.push(...vids);
    console.log(`page ${page + 1}: ${vids.length} videos`);
    const next = json?.data?.token;
    if (!next || next === token || vids.length === 0) break;
    token = next;
  }
  return all;
}

async function download(url, dest) {
  const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  let videos = [];
  try {
    videos = await listVideos();
  } catch (e) {
    console.warn("WARN: failed to list HeyGen videos:", e.message);
    writeManifest([]);
    return;
  }
  console.log(`HeyGen raw video count: ${videos.length}`);

  const configs = fs.readdirSync(CONFIG_DIR).filter((f) => f.endsWith(".json")).sort();
  const ok = [];
  for (const f of configs) {
    let slug;
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, f), "utf8"));
      if (WANTED_IDS.length > 0 && !WANTED_IDS.includes(cfg.id)) continue;
      if (!cfg.audioFile) { console.log(`missing: ${f} (no audioFile)`); continue; }
      slug = cfg.audioFile.replace(/\.m4a$/, "");
      const wanted = "KW " + slug;
      const match = videos
        .filter((v) => v.video_title === wanted && v.status === "completed" && Number(v.created_at) >= MIN_CREATED)
        .sort((a, b) => Number(b.created_at) - Number(a.created_at))[0];
      if (!match) { console.log(`missing: ${slug}`); continue; }
      console.log(`found: ${slug} (video id ${match.video_id}, created_at ${match.created_at})`);

      const status = await api(`https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(match.video_id)}`);
      const videoUrl = status?.data?.video_url;
      if (!videoUrl) throw new Error("no video_url");
      const mp4 = path.join(TMP_DIR, `${slug}.mp4`);
      await download(videoUrl, mp4);
      const mb = (fs.statSync(mp4).size / (1024 * 1024)).toFixed(1);
      console.log(`downloaded: ${slug} (${mb} MB)`);

      const t0 = Date.now();
      execFileSync("ffmpeg", [
        "-y", "-i", mp4,
        "-vf", "chromakey=0x00FF00:0.16:0.06,despill=type=green,format=yuva420p",
        "-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8", "-row-mt", "1",
        "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "2M", "-an",
        path.join(OUT_DIR, `${slug}.webm`),
      ], { stdio: ["ignore", "ignore", "inherit"], timeout: 600000 });
      console.log(`converted: ${slug} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      ok.push(slug);
    } catch (e) {
      console.log(`failed: ${slug ?? f} - ${e.message}`);
    }
  }
  writeManifest(ok);
  console.log(`Talking clips ready: ${ok.length}/${configs.length}`);
}

main().catch((e) => {
  console.warn("WARN: unexpected error:", e.message);
  writeManifest([]);
});
