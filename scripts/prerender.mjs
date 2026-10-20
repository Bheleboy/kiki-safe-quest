// Prerenders every public route to static HTML after the client build, then writes the sitemap.
// The client app still renders normally in the browser; this HTML is what crawlers read.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";

// Minimal browser shims so modules that touch storage or window at import time can load in Node.
const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
globalThis.localStorage ??= storage;
globalThis.sessionStorage ??= storage;

const { render, publicRoutes, SITE_URL } = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);
const template = await readFile("dist/index.html", "utf8");

async function writePage(path, file) {
  const { markup, head } = render(path);
  if (!markup) throw new Error(`No static content rendered for ${path}`);
  const html = template
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace("</head>", `${head}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

for (const path of publicRoutes) {
  await writePage(path, path === "/" ? "dist/index.html" : resolve("dist", `.${path}`, "index.html"));
}
await writePage("/404", "dist/404.html");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicRoutes
  .map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`)
  .join("\n")}\n</urlset>\n`;
await writeFile("dist/sitemap.xml", sitemap);
console.log(`Prerendered ${publicRoutes.length} public pages plus 404; generated sitemap.`);
