import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const out = path.join(root, "www");

const excludedDirectories = new Set([
  ".git",
  ".github",
  "api",
  "architecture",
  "docs",
  "ios",
  "node_modules",
  "scripts",
  "supabase",
  "tests",
  "www"
]);

const excludedRootFiles = new Set([
  "capacitor.config.json",
  "package.json",
  "package-lock.json",
  "vercel.json"
]);

const allowedRootExtensions = new Set([
  ".html",
  ".js",
  ".css",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf"
]);

const nativeRuntimeTag = '<script src="js/native-runtime.js?v=1.4.0"></script>';

async function copyFrontend() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludedDirectories.has(entry.name)) continue;
      await cp(path.join(root, entry.name), path.join(out, entry.name), {
        recursive: true,
        force: true
      });
      continue;
    }

    if (!entry.isFile()) continue;
    if (excludedRootFiles.has(entry.name)) continue;
    if (!allowedRootExtensions.has(path.extname(entry.name).toLowerCase())) continue;

    await cp(path.join(root, entry.name), path.join(out, entry.name), { force: true });
  }
}

async function injectNativeRuntime() {
  const htmlFiles = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) htmlFiles.push(fullPath);
    }
  }

  await walk(out);

  for (const htmlFile of htmlFiles) {
    let html = await readFile(htmlFile, "utf8");
    if (html.includes("js/native-runtime.js")) continue;

    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${nativeRuntimeTag}\n</head>`);
    } else if (/<body/i.test(html)) {
      html = html.replace(/<body/i, `${nativeRuntimeTag}\n<body`);
    } else {
      html = `${nativeRuntimeTag}\n${html}`;
    }

    await writeFile(htmlFile, html, "utf8");
  }
}

await copyFrontend();
await injectNativeRuntime();

console.log("[ARI XP] Bundled mobile frontend created in www/");
