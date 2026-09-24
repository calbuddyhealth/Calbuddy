import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const core = fs.readFileSync("calbuddy-core.js", "utf8");
const api = fs.readFileSync("api/ari-visual-inspector.js", "utf8");
const worker = fs.readFileSync("scripts/ari-visual-inspector.mjs", "utf8");
const workflow = fs.readFileSync(".github/workflows/ari-visual-inspector.yml", "utf8");
const selfModel = fs.readFileSync("api/_lib/ari-vnext/self-model.js", "utf8");
const registry = fs.readFileSync("ari/developer/ari-rebirth-capability-registry-engine.js", "utf8");

test("visual inspector files are syntactically valid", () => {
  for (const path of [
    "calbuddy-core.js",
    "api/ari-visual-inspector.js",
    "scripts/ari-visual-inspector.mjs"
  ]) {
    execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
  }
});

test("owner visual inspector API is authenticated and GitHub-workflow backed", () => {
  assert.match(api, /verifyOwnerRequest\(req\)/);
  assert.match(api, /sendOwnerAuthorizationError/);
  assert.match(api, /ari-visual-inspector\.yml/);
  assert.match(api, /workflow_dispatch/);
  assert.match(api, /action === "start"/);
  assert.match(api, /action === "status"/);
  assert.match(api, /display_title/);
  assert.match(api, /ARI_VISUAL_RESULT:/);
  assert.match(api, /actions\/jobs\/\$\{job\.id\}\/logs/);
});

test("visual inspector is restricted to ARI XP production or Vercel preview hosts", () => {
  assert.match(api, /www\.calbuddyhealth\.com/);
  assert.match(api, /calbuddyhealth\.com/);
  assert.match(api, /endsWith\("\.vercel\.app"\)/);
  assert.match(api, /requires HTTPS/);
});

test("browser worker uses a read-only owner sandbox and captures real visual evidence", () => {
  assert.match(worker, /installReadOnlyOwnerSandbox/);
  assert.match(worker, /owner_access: true/);
  assert.match(worker, /visualSandbox: true/);
  assert.match(worker, /readOnly: true/);
  assert.match(worker, /page\.screenshot/);
  assert.match(worker, /horizontalOverflow/);
  assert.match(worker, /fixedWidthSuspects/);
  assert.match(worker, /consoleErrors/);
  assert.match(worker, /failedRequests/);
  assert.match(worker, /collectInteractive/);
  assert.match(worker, /collectNavigation/);
  assert.match(worker, /ARI_VISUAL_RESULT:/);
  assert.doesNotMatch(worker, /SUPABASE_SERVICE_ROLE_KEY|GITHUB_TOKEN|OPENAI_API_KEY/);
});

test("visual screenshots are sent through a vision model before Ari reasons from them", () => {
  assert.match(api, /Visual App Inspector/);
  assert.match(api, /image_url/);
  assert.match(api, /detail: "high"/);
  assert.match(api, /visionUsed: true/);
  assert.match(api, /searchHints/);
  assert.match(api, /recordOpenAIUsage/);
});

test("chat runtime can detect, route, resume and use visual inspection evidence", () => {
  assert.match(core, /CalBuddy\.isVisualInspectionCommand/);
  assert.match(core, /CalBuddy\.inferVisualInspectionPath/);
  assert.match(core, /CalBuddy\.inferVisualViewports/);
  assert.match(core, /CalBuddy\.runVisualInspection/);
  assert.match(core, /calbuddyPendingVisualInspection/);
  assert.match(core, /DETERMINISTIC OWNER VISUAL INSPECTION/);
  assert.match(core, /calbuddy-core-visual-inspector/);
  assert.match(core, /VISUAL EVIDENCE:/);
  assert.match(core, /CalBuddy\.handleDeveloperIntent/);
});

test("visual route maps important ARI XP screens", () => {
  for (const path of [
    "/home.html",
    "/ari-circle.html",
    "/ari-circle-messages.html",
    "/ari-circle-feed.html",
    "/ari-circle-meetup.html",
    "/ari-training.html",
    "/nutrition.html",
    "/progress.html",
    "/goals.html",
    "/owner-ai-controls.html",
    "/profile.html"
  ]) {
    assert.ok(core.includes(path), `missing visual route ${path}`);
  }
});

test("workflow installs Chromium and runs only the bounded inspector worker", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /@playwright\/test@1\.55\.0/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.match(workflow, /node scripts\/ari-visual-inspector\.mjs/);
});

test("Ari self-model and capability registry know visual inspection is available", () => {
  assert.match(selfModel, /ARI_SELF_MODEL_VERSION = "1\.4\.2"/);
  assert.match(selfModel, /ownerVisualAppInspectionSupported: true/);
  assert.match(selfModel, /Visual App Inspector/);
  assert.match(selfModel, /read-only Playwright browser sandbox/);

  assert.match(registry, /version: "1\.1\.0"/);
  assert.match(registry, /name: "visual_app_inspection"/);
  assert.match(registry, /navigate_read_only_sandbox/);
  assert.match(registry, /vision_analyze_screenshots/);
  assert.match(registry, /mutate_real_user_data/);
});
