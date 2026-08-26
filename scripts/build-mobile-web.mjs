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

const nativeRuntimeTag = '<script src="js/native-runtime.js?v=1.6.0"></script>';
const nativePushRuntimeTag = '<script src="js/native-push-runtime.js?v=1.0.0" data-ari-native-push="true"></script>';
const nativeSafeAreaTag = '<link rel="stylesheet" href="assets/css/native-safe-area.css?v=1.2.0" data-ari-native-safe-area="true">';
const nativeTrainingHeaderTag = '<link rel="stylesheet" href="assets/css/ari-training-native-header.css?v=1.1.0" data-ari-native-training-header="true">';
const nativeSettingsHeaderTag = '<link rel="stylesheet" href="assets/css/native-settings-header.css?v=1.1.0" data-ari-native-settings-header="true">';

const nativeSafeAreaPages = new Set([
  "account.html",
  "ari-preference-settings.html",
  "privacy-memory.html",
  "notification-settings.html",
  "help-safety.html",
  "owner-moderation.html",
  "support-ari.html",
  "blocked-users.html",
  "community-guidelines.html",
  "ari-training.html",
  "nutrition.html"
]);

const nativeSettingsPages = new Set([
  "account.html",
  "ari-preference-settings.html",
  "privacy-memory.html",
  "notification-settings.html",
  "help-safety.html",
  "owner-moderation.html",
  "support-ari.html",
  "blocked-users.html",
  "community-guidelines.html"
]);

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

function markNativeDocument(html) {
  return html.replace(/<html\b([^>]*)>/i, (tag, attrs = "") => {
    if (/\bdata-ari-native\s*=/i.test(tag)) return tag;
    return `<html${attrs} data-ari-native="true">`;
  });
}

function injectHeadTag(html, tag, uniqueNeedle) {
  if (html.includes(uniqueNeedle)) return html;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${tag}\n</head>`);
  }

  if (/<body/i.test(html)) {
    return html.replace(/<body/i, `${tag}\n<body`);
  }

  return `${tag}\n${html}`;
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
    const pageName = path.basename(htmlFile).toLowerCase();

    // The generated iOS bundle is known to be native before JavaScript runs.
    // Mark it at build time so native-only CSS never depends on bridge timing.
    html = markNativeDocument(html);

    if (nativeSafeAreaPages.has(pageName)) {
      html = injectHeadTag(html, nativeSafeAreaTag, "data-ari-native-safe-area");
    }

    if (pageName === "ari-training.html") {
      html = injectHeadTag(html, nativeTrainingHeaderTag, "data-ari-native-training-header");
    }

    if (nativeSettingsPages.has(pageName)) {
      html = injectHeadTag(html, nativeSettingsHeaderTag, "data-ari-native-settings-header");
    }

    html = injectHeadTag(html, nativeRuntimeTag, "js/native-runtime.js");
    html = injectHeadTag(html, nativePushRuntimeTag, "data-ari-native-push");

    await writeFile(htmlFile, html, "utf8");
  }
}

await copyFrontend();
await injectNativeRuntime();

console.log("[ARI XP] Bundled mobile frontend created in www/");
