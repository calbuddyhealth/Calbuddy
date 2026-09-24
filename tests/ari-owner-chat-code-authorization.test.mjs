import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const core = fs.readFileSync("calbuddy-core.js", "utf8");
const selfModel = fs.readFileSync("api/_lib/ari-vnext/self-model.js", "utf8");

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start marker: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `Missing end marker: ${endNeedle}`);
  return source.slice(start, end);
}

test("validated GitHub edit intents become owner-confirmable chat actions", () => {
  assert.match(
    core,
    /CalBuddy\.createGithubEditPendingAction\s*=\s*async function/
  );
  assert.match(
    core,
    /action_type:\s*"github_edit_request"/
  );
  assert.match(
    core,
    /response\.developerIntent\.type\s*===\s*"github_edit_request"/
  );
  assert.match(
    core,
    /response\.pendingAction\s*=\s*pendingGithubEdit/
  );
  assert.match(
    core,
    /Apply Ari's proposed code change to \$\{filePath\} and commit it to the configured GitHub branch\?/
  );
});

test("confirmed GitHub edit actions re-check owner mode and use the verified edit endpoint", () => {
  const block = sliceBetween(
    core,
    'if (type === "github_edit_request")',
    'if (type === "owner_code_task"'
  );

  assert.match(block, /context\.ownerMode\s*!==\s*true/);
  assert.match(block, /OWNER_ACCESS_DENIED/);
  assert.match(block, /CalBuddy\.sendGithubEditRequest/);
  assert.match(block, /mode:\s*"commit"/);
  assert.match(block, /confirmationText:\s*"CONFIRM GITHUB EDIT"/);
  assert.match(block, /MISSING_FIND_REPLACE/);
});

test("client GitHub request still delegates authorization to the server", () => {
  const block = sliceBetween(
    core,
    "CalBuddy.sendGithubEditRequest = async function",
    "CalBuddy.readGithubFile = async function"
  );

  assert.match(block, /delete safePayload\.owner_access/);
  assert.match(block, /getOwnerRequestHeaders\(\)/);
  assert.match(block, /\/api\/ari-github-edit/);
});


test("validated owner GitHub edits do not depend on developer-keyword phrasing", () => {
  const block = sliceBetween(
    core,
    "CalBuddy.shouldHandleDeveloperIntent = function",
    "ARI TEMP ACTION MEMORY"
  );

  assert.match(block, /hasValidatedGithubEdit/);
  assert.match(block, /developerIntent\.type === "github_edit_request"/);
  assert.match(block, /developerIntent\.safety\?\.ownerRequired === true/);
  assert.match(block, /developerIntent\.safety\?\.requiresConfirmation === true/);
  assert.match(block, /if \(hasValidatedGithubEdit\) return true/);
  assert.match(block, /return explicitDeveloperCommand && hasExecutableGithubWork/);
});

test("typed chat authorization uses the normal pending-action path before legacy GitHub fallback", () => {
  const start = core.indexOf("CalBuddy._askAriInternal = async function");
  const end = core.indexOf("DETERMINISTIC OWNER GITHUB ROUTING", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const block = core.slice(start, end);

  const pendingConfirm = block.indexOf("pending && CalBuddy.isYes(message)");
  const legacyConfirm = block.indexOf("exactLegacyGithubConfirmation");
  assert.ok(pendingConfirm >= 0);
  assert.ok(legacyConfirm > pendingConfirm);
  assert.match(
    block,
    /trim\(\)\.toUpperCase\(\) === "CONFIRM GITHUB EDIT"/
  );
  assert.doesNotMatch(
    block,
    /pendingGithubEdit && CalBuddy\.isYes\(message\)/
  );
});

test("new GitHub proposals clear legacy GitHub-only state and cancellation cannot resurrect it", () => {
  assert.match(
    core,
    /New code edits use the normal pending-action lifecycle/
  );
  assert.match(
    core,
    /localStorage\.removeItem\("calbuddyPendingGithubEdit"\);[\s\S]{0,500}createGithubEditPendingAction/
  );

  const cancelBlock = sliceBetween(
    core,
    "CalBuddy.cancelPendingAction = function",
    "CalBuddy.isDeveloperCommand = function"
  );
  assert.match(cancelBlock, /github_edit_request/);
  assert.match(cancelBlock, /localStorage\.removeItem\("calbuddyPendingGithubEdit"\)/);
});

test("Ari self-model knows owner-confirmed chat code editing is a real capability", () => {
  assert.match(selfModel, /ARI_SELF_MODEL_VERSION = "1\.4\.1"/);
  assert.match(selfModel, /ownerConfirmedChatCodeEditsSupported:\s*true/);
  assert.match(selfModel, /owner-gated GitHub edit workflow/);
  assert.match(selfModel, /chat pending-action confirmation flow/);
  assert.match(selfModel, /never claim a commit or deployment happened until the action result confirms success/);
});
