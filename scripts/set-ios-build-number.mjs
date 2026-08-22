import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const buildNumber = Number(packageJson?.ari?.iosBuild);

if (!Number.isInteger(buildNumber) || buildNumber < 1) {
  throw new Error("package.json ari.iosBuild must be a positive integer.");
}

const projectPath = path.join(root, "ios", "App", "App.xcodeproj", "project.pbxproj");
const current = await readFile(projectPath, "utf8");
const matches = current.match(/CURRENT_PROJECT_VERSION = \d+;/g) || [];

if (matches.length < 2) {
  throw new Error(`Expected at least two CURRENT_PROJECT_VERSION settings, found ${matches.length}.`);
}

const next = current.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`);
await writeFile(projectPath, next, "utf8");
console.log(`[ARI XP] iOS project set to Build ${buildNumber} (${matches.length} configurations).`);
