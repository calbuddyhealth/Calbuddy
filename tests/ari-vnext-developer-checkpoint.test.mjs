import test from "node:test";
import assert from "node:assert/strict";
import {
  createDeveloperCheckpoint, developerResumeCheckpoint, finalizeDeveloperPause,
  normalizeDeveloperCheckpoint
} from "../api/_lib/ari-vnext/developer-checkpoint.js";
import { advanceExecutionSession, deriveExecutionWorkspace } from "../api/_lib/ari-vnext/execution-session.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { runAriVNext } from "../api/_lib/ari-vnext/orchestrator.js";
import { shouldPersistCognitiveState } from "../api/_lib/ari-vnext/cognitive-loop.js";

const entitlement = { ownerEligible: true, accountRole: "owner", advancedEnabled: true, cognitiveLoopEnabled: true };
const readArgs = filePath => ({ filePath, branch: "main", startLine: null, endLine: null });
const checkpoint = () => createDeveloperCheckpoint({
  checked: { name: "owner_repo_read", arguments: readArgs("api/continuity.js") },
  reads: [{ filePath: "api/continuity.js", branch: "main", sha: "a".repeat(40), fullFile: true, content: "must not be stored" }]
});
const turn = (overrides = {}) => ({
  userId: "00000000-0000-4000-8000-000000000001", conversationId: "checkpoint-thread",
  turnId: "checkpoint-first", message: "Investigate the repository continuity implementation", history: [],
  context: { intelligenceEntitlement: entitlement }, ...overrides
});

function resumeTurn(savedCheckpoint = checkpoint()) {
  const initial = turn();
  const workspace = deriveExecutionWorkspace({ turn: initial, route: { developer: true } });
  const saved = advanceExecutionSession({ workspace, turn: initial, result: {
    executionWorkspaceUpdate: { status: "active", developerCheckpoint: savedCheckpoint }
  } });
  const next = turn({ turnId: "checkpoint-resume", message: "Continue" });
  const resumed = deriveExecutionWorkspace({ previous: JSON.parse(JSON.stringify(saved)), turn: next, route: {} });
  next.context.userWorldModel = { ariCognitiveWorkspace: { executionWorkspace: resumed } };
  return next;
}

function mockRuntime(t, respond) {
  for (const [key, value] of Object.entries({
    OPENAI_API_KEY: "test-only", ARI_PROVIDER_API_KEY: "test-only",
    ARI_MULTI_AGENT_ENABLED: "false", ARI_CORTEX_ADVISER_ENABLED: "false",
    GITHUB_TOKEN: "test-only", GITHUB_REPO: "fixture/repository", GITHUB_BRANCH: "main"
  })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => previous === undefined ? delete process.env[key] : process.env[key] = previous);
  }
  const reads = [];
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (String(url).startsWith("https://api.github.com/")) {
      reads.push(String(url));
      return { ok: true, json: async () => ({ type: "file", sha: "b".repeat(40), content: Buffer.from("export const current = true;\n").toString("base64") }) };
    }
    const body = JSON.parse(options.body);
    requests.push(body);
    assert.ok(requests.length <= 7, "investigation must stay bounded");
    return { ok: true, json: async () => ({ output: respond(requests.length, body) }) };
  });
  return { reads, requests };
}

test("six-step exhaustion checkpoints the exact unexecuted read and exposes collected evidence", async t => {
  const { reads, requests } = mockRuntime(t, count => [{
    type: "function_call", name: "owner_repo_read", call_id: `read-${count}`,
    arguments: JSON.stringify(readArgs(`api/file-${count}.js`))
  }]);
  const initial = turn();
  const result = await runAriVNext(initial);
  assert.equal(reads.length, 6);
  assert.equal(requests.length, 7);
  assert.equal(result.source, "ari_vnext_owner_developer_step_limit");
  const state = result.executionWorkspaceUpdate.developerCheckpoint;
  assert.deepEqual(state.nextOperation, { name: "owner_repo_read", arguments: readArgs("api/file-7.js") });
  assert.equal(state.inspectedFiles.length, 6);
  assert.equal(state.inspectedFiles[0].sha, "b".repeat(40));
  assert.equal(JSON.stringify(state).includes("export const"), false);
  assert.match(result.reply, /Read api\/file-6.js/);
  assert.match(result.reply, /Next: Read api\/file-7.js/);
  assert.doesNotMatch(result.reply, /session is preserved|checkpoint was saved/);
  const persisted = advanceExecutionSession({ turn: initial,
    workspace: deriveExecutionWorkspace({ turn: initial, route: result.route }), result });
  assert.deepEqual(persisted.developerCheckpoint, state);
});

test("continue resumes the exact read without chat history and notices changed source", async t => {
  const { reads, requests } = mockRuntime(t, () => [{
    type: "message", content: [{ type: "output_text", text: "The current file differs from the previous inspection." }]
  }]);
  const next = resumeTurn();
  assert.equal(routeContext(next).developer, true);
  const result = await runAriVNext(next);
  assert.equal(reads.length, 1);
  assert.match(reads[0], /contents\/api\/continuity.js\?ref=main/);
  assert.equal(requests.length, 1, "resumption replaces the initial model call");
  const output = requests[0].input.find(item => item.type === "function_call_output");
  assert.equal(JSON.parse(output.output).checkpointRevisionChanged, true);
  assert.ok(result.executionEvidence.observations.some(item => item.kind === "repository_revision_changed"));
  assert.equal(result.executionWorkspaceUpdate.developerCheckpoint, null);
  const advanced = advanceExecutionSession({ turn: next,
    workspace: next.context.userWorldModel.ariCognitiveWorkspace.executionWorkspace, result });
  assert.equal(advanced.developerCheckpoint, null, "consumed work must not replay next turn");
});

test("save claims require a successful write of the matching checkpoint", () => {
  const state = checkpoint();
  const result = { source: "ari_vnext_owner_developer_step_limit", executionWorkspaceUpdate: { developerCheckpoint: state } };
  const saved = finalizeDeveloperPause(result, { stateStored: true, session: { developerCheckpoint: state } });
  assert.equal(saved.developerInvestigation.checkpointStored, true);
  assert.match(saved.reply, /checkpoint was saved/);
  for (const options of [{ stateStored: false, session: { developerCheckpoint: state } }, { stateStored: true, session: {} }]) {
    const failed = finalizeDeveloperPause(result, options);
    assert.equal(failed.developerInvestigation.checkpointStored, false);
    assert.match(failed.reply, /couldn't save/);
    assert.doesNotMatch(failed.reply, /checkpoint was saved/);
  }
});

test("lightweight continuation persists a changed checkpoint even when summary counts are unchanged", () => {
  const previous = { executionSession: { id: "same-session", status: "active", nextStep: "Inspect the next file", developerCheckpoint: checkpoint() } };
  const next = JSON.parse(JSON.stringify(previous));
  next.executionSession.developerCheckpoint.nextOperation.arguments.filePath = "api/another-file.js";
  assert.equal(shouldPersistCognitiveState({ previous, next, mode: "lightweight" }), true);
  assert.equal(shouldPersistCognitiveState({ previous, next: previous, mode: "lightweight" }), false);
});

test("checkpoint replay excludes writes, unrelated turns, non-owners, and raw contents", () => {
  const state = checkpoint();
  assert.equal(Object.hasOwn(state.inspectedFiles[0], "content"), false);
  assert.equal(normalizeDeveloperCheckpoint({ ...state, nextOperation: { name: "owner_agent_mailbox_send", arguments: { content: "send this" } } }), null);
  const edit = createDeveloperCheckpoint({ checked: { name: "propose_owner_github_edit", arguments: { filePath: "api/continuity.js", find: "old", replace: "new" } } });
  assert.equal(edit.nextOperation.name, "owner_repo_read");
  assert.equal(Object.hasOwn(edit.nextOperation.arguments, "replace"), false);
  for (const message of ["What's left?", "Continue with my meal plan", "Stop", "What should I eat?"]) {
    assert.equal(developerResumeCheckpoint({ ...resumeTurn(), message }), null);
  }
  const nonOwner = resumeTurn();
  nonOwner.context.intelligenceEntitlement = { ownerEligible: false };
  assert.equal(routeContext(nonOwner).developer, false);
});
