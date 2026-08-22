import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const webRoot = path.join(root, "www");
const iosPublic = path.join(root, "ios", "App", "App", "public");

const criticalFiles = [
  "nutrition.html",
  "js/nutrition-barcode-scan.js",
  "js/nutrition-barcode-lazy.js",
  "js/nutrition-scan-save-bridge.js",
  "ari-circle-challenges.html",
  "js/ari-circle/challenges/challenges.js",
  "js/ari-circle/challenges/challenge-video-recorder.js",
  "js/native-runtime.js"
];

const criticalMarkers = new Map([
  ["nutrition.html", [
    'id="scanBarcodeBtn"',
    "js/nutrition-barcode-scan.js",
    "js/nutrition-barcode-lazy.js",
    "js/nutrition-scan-save-bridge.js"
  ]],
  ["ari-circle-challenges.html", [
    "challengeVideoRecorder",
    "js/ari-circle/challenges/challenges.js",
    "js/ari-circle/challenges/challenge-video-recorder.js"
  ]],
  ["js/nutrition-barcode-scan.js", [
    "AriNutritionScanBridge",
    "decodeFromVideoDevice"
  ]],
  ["js/ari-circle/challenges/challenge-video-recorder.js", [
    "getUserMedia",
    "MediaRecorder"
  ]]
]);

async function collectFiles(directory, prefix = "") {
  const output = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await collectFiles(fullPath, relative));
    else if (entry.isFile()) output.push(relative);
  }
  return output.sort();
}

async function sha256(filePath) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

async function assertDirectory(directory, label) {
  const info = await stat(directory).catch(() => null);
  if (!info?.isDirectory()) throw new Error(`${label} does not exist: ${directory}`);
}

async function main() {
  await assertDirectory(webRoot, "Generated mobile web bundle");
  await assertDirectory(iosPublic, "Synced Xcode public bundle");

  const webFiles = await collectFiles(webRoot);
  const iosFiles = new Set(await collectFiles(iosPublic));
  const failures = [];

  for (const relative of webFiles) {
    if (!iosFiles.has(relative)) {
      failures.push(`Missing from iOS bundle: ${relative}`);
      continue;
    }
    const webHash = await sha256(path.join(webRoot, relative));
    const iosHash = await sha256(path.join(iosPublic, relative));
    if (webHash !== iosHash) failures.push(`Stale/different iOS asset: ${relative}`);
  }

  for (const relative of criticalFiles) {
    if (!webFiles.includes(relative)) failures.push(`Critical Safari capability asset missing from mobile bundle: ${relative}`);
    if (!iosFiles.has(relative)) failures.push(`Critical Safari capability asset missing from Xcode bundle: ${relative}`);
  }

  for (const [relative, markers] of criticalMarkers) {
    const target = path.join(iosPublic, relative);
    const text = await readFile(target, "utf8").catch(() => "");
    for (const marker of markers) {
      if (!text.includes(marker)) failures.push(`Capability marker '${marker}' missing from ${relative}`);
    }
  }

  if (failures.length) {
    console.error("[ARI XP] iOS Safari parity check FAILED");
    failures.forEach((failure) => console.error(` - ${failure}`));
    process.exit(1);
  }

  console.log(`[ARI XP] iOS Safari parity verified: ${webFiles.length} bundled files match Xcode public.`);
  console.log("[ARI XP] Verified critical parity: Nutrition barcode + label scan, Circle challenges/media/video, native runtime.");
}

main().catch((error) => {
  console.error("[ARI XP] iOS Safari parity check failed:", error);
  process.exit(1);
});
