import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const projectPath = path.join(root, "ios", "App", "App.xcodeproj", "project.pbxproj");
const entitlementsPath = path.join(root, "ios", "App", "App", "App.entitlements");

let project = await readFile(projectPath, "utf8");
await readFile(entitlementsPath, "utf8");

function targetBlock(configurationId) {
  const startNeedle = `\t\t${configurationId} /*`;
  const start = project.indexOf(startNeedle);
  if (start < 0) throw new Error(`Could not find Xcode configuration ${configurationId}.`);
  const end = project.indexOf("\n\t\t};", start);
  if (end < 0) throw new Error(`Could not parse Xcode configuration ${configurationId}.`);
  return { start, end: end + "\n\t\t};".length, text: project.slice(start, end + "\n\t\t};".length) };
}

function ensureBuildSetting(configurationId, key, value) {
  const block = targetBlock(configurationId);
  if (new RegExp(`\\b${key}\\s*=`).test(block.text)) return;
  const needle = "\t\t\t\tCODE_SIGN_STYLE = Automatic;";
  if (!block.text.includes(needle)) throw new Error(`Could not find CODE_SIGN_STYLE in ${configurationId}.`);
  const next = block.text.replace(needle, `${needle}\n\t\t\t\t${key} = ${value};`);
  project = `${project.slice(0, block.start)}${next}${project.slice(block.end)}`;
}

ensureBuildSetting("504EC3171FED79650016851F", "CODE_SIGN_ENTITLEMENTS", "App/App.entitlements");
ensureBuildSetting("504EC3171FED79650016851F", "ARI_APS_ENVIRONMENT", "development");
ensureBuildSetting("504EC3181FED79650016851F", "CODE_SIGN_ENTITLEMENTS", "App/App.entitlements");
ensureBuildSetting("504EC3181FED79650016851F", "ARI_APS_ENVIRONMENT", "production");

if (!project.includes("com.apple.Push =")) {
  const targetNeedle = "\t\t\t\t\t504EC3031FED79650016851F = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 9.2;\n\t\t\t\t\t\tLastSwiftMigration = 1100;\n\t\t\t\t\t\tProvisioningStyle = Automatic;";
  if (!project.includes(targetNeedle)) throw new Error("Could not find App target attributes for Push Notifications capability.");
  project = project.replace(targetNeedle, `${targetNeedle}\n\t\t\t\t\t\tSystemCapabilities = {\n\t\t\t\t\t\t\tcom.apple.Push = {\n\t\t\t\t\t\t\t\tenabled = 1;\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t};`);
}

await writeFile(projectPath, project, "utf8");
console.log("[ARI XP] iOS Push Notifications capability is configured for Debug and Release.");
