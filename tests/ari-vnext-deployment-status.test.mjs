import test from 'node:test';
import assert from 'node:assert/strict';
import { readDeploymentStatus } from '../api/_lib/ari-vnext/deployment-status.js';
import { runAriVNext } from '../api/_lib/ari-vnext/orchestrator.js';
import { routeContext } from '../api/_lib/ari-vnext/context-router.js';
import { validateToolCall } from '../api/_lib/ari-vnext/tools.js';
import { startDeveloperTaskController, recordDeveloperTaskStep } from '../api/_lib/ari-vnext/developer-task-controller.js';
import { persistAriCognitiveState } from '../api/_lib/ari-vnext/cognitive-state-store.js';

const owner = { ownerEligible: true, accountRole: 'owner', advancedEnabled: true, cognitiveLoopEnabled: true };
const turn = message => ({ userId: '00000000-0000-4000-8000-000000000001', conversationId: 'deployment-test', turnId: 'deploy-read', message,
  history: [], context: { intelligenceEntitlement: owner } });
const question = 'Are you able to look at your latest production deployments on vercel?';
const record = (id, extra = {}) => ({ id, environment: 'Production', production_environment: false, sha: 'a'.repeat(40), ref: 'main', creator: { login: 'vercel[bot]' }, ...extra });
const message = text => ({ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] });
function env(t, extra = {}) {
  for (const [key, value] of Object.entries({ OPENAI_API_KEY: 'test-only', ARI_PROVIDER_API_KEY: 'test-only', ARI_MULTI_AGENT_ENABLED: 'false', ARI_CORTEX_ADVISER_ENABLED: 'false', GITHUB_TOKEN: 'test-only', GITHUB_REPO: 'fixture/repository', GITHUB_BRANCH: 'main', ...extra })) {
    const old = process.env[key]; process.env[key] = value;
    t.after(() => old === undefined ? delete process.env[key] : process.env[key] = old);
  }
}

test('deployment routing is owner-only and does not swallow debugging or mutations', () => {
  assert.equal(routeContext(turn(question)).deploymentInspection, true);
  for (const text of ['What are the latest Vercel prices?', 'Show latest deployments and check CI', 'Fix Vercel deployment status', 'Check Vercel and deploy the fix', 'Show Vercel runtime logs', 'Investigate why the latest deployment failed']) {
    assert.equal(routeContext(turn(text)).deploymentInspection, false, text);
  }
  const ordinary = turn(question); ordinary.context = {};
  const route = routeContext(ordinary);
  assert.equal(route.deploymentInspection, false);
  assert.equal(validateToolCall({ name: 'owner_deployment_status', arguments: '{"environment":"production"}' }, route).valid, false);
  assert.equal(validateToolCall({ name: 'owner_deployment_status', arguments: '{"environment":"other"}' }, routeContext(turn(question))).valid, false);
});

test('bounded reader filters Vercel production records and exposes only status fields', async t => {
  const urls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    urls.push(url); assert.equal(options.method, 'GET');
    return { ok: true, json: async () => url.includes('/statuses?')
      ? [{ state: 'success', environment_url: 'https://example.vercel.app', log_url: 'javascript:alert(1)', secret: 'never return' }]
      : [record(1, { environment: 'Preview' }), record(2, { creator: { login: 'other' } }), record(3, { payload: { secret: 'never return' } }), record(4), record(5), record(6)] };
  });
  const result = await readDeploymentStatus({ repo: 'fixture/repository', token: 'test-only' });
  assert.equal(result.success, true);
  assert.equal(urls.length, 4);
  assert.match(urls[0], /environment=Production/);
  assert.deepEqual(result.deployments.map(x => x.id), [3, 4, 5]);
  assert.equal(result.deployments[0].status, 'success');
  assert.equal(result.deployments[0].detailsUrl, null);
  assert.equal(JSON.stringify(result).includes('never return'), false);
  assert.match(result.limitation, /not verified/);
});

for (const status of [200, 403]) test(`exact user question performs one direct inspection and one synthesis (HTTP ${status})`, async t => {
  env(t); const requests = []; const reads = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.startsWith('https://api.github.com/')) {
      reads.push(url); assert.doesNotMatch(url, /search\/code|contents\//);
      return { ok: status === 200, status, json: async () => url.includes('/statuses?') ? [{ state: 'success' }] : [record(10)] };
    }
    const body = JSON.parse(options.body); requests.push(body);
    const evidence = body.input.find(item => item.type === 'function_call_output');
    assert.ok(evidence);
    assert.equal(JSON.parse(evidence.output).success, status === 200);
    assert.ok(!body.tools?.length);
    return { ok: true, json: async () => ({ output: [message(status === 200 ? 'GitHub reports a successful deployment; live health was not checked.' : 'Deployment read access is unavailable.') ] }) };
  });
  const result = await runAriVNext(turn(question));
  assert.equal(requests.length, 1);
  assert.equal(reads.length, status === 200 ? 2 : 1);
  assert.equal(result.action.applicationAction, 'deployment_status');
  assert.equal(result.action.verified, status === 200);
  assert.equal(result.pendingAction, null);
});

test('two differently worded empty searches disable further search even if the model persists', async t => {
  env(t); let searches = 0; let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.startsWith('https://api.github.com/')) {
      assert.match(url, /search\/code/); searches++;
      return { ok: true, json: async () => ({ items: [], total_count: 0 }) };
    }
    const body = JSON.parse(options.body); calls++;
    if (calls === 3) assert.equal(body.tools.some(tool => tool.name === 'owner_repo_search'), false);
    assert.ok(calls <= 3);
    return { ok: true, json: async () => ({ output: [{ type: 'function_call', name: 'owner_repo_search', call_id: `search-${calls}`, arguments: JSON.stringify({ query: `empty query variant ${calls}`, path: null, branch: null }) }] }) };
  });
  const result = await runAriVNext(turn('Investigate the repository session continuity'));
  assert.equal(searches, 2);
  assert.equal(calls, 3);
  assert.match(result.reply, /Two repository searches returned no matches/);
  assert.equal(result.executionWorkspaceUpdate.developerCheckpoint, null);
});

test('empty query variants do not reset evidence stagnation', () => {
  let state = startDeveloperTaskController();
  for (let i = 0; i < 3; i++) state = recordDeveloperTaskStep(state, {
    evidence: { observations: [{ id: String(i), summary: `query ${i}: zero matches`, verified: true }] },
    toolResult: { operation: 'repo_search', success: true, resultCount: 0 }
  });
  assert.equal(state.window.productiveSteps, 0);
  assert.equal(state.lastDecision.reason, 'evidence_stalled');
});

test('checkpoint saves tolerate a slow response and serialization failure never claims success', async t => {
  env(t, { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-only' });
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    writes++;
    assert.ok(JSON.parse(options.body).state.executionSession.developerCheckpoint);
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ ok: true }), 1000);
      options.signal.addEventListener('abort', () => { clearTimeout(timer); reject(Object.assign(new Error('aborted'), { name: 'AbortError' })); }, { once: true });
    });
  });
  const state = { executionSession: { developerCheckpoint: { version: 1 } } };
  assert.equal(await persistAriCognitiveState({ userId: turn('').userId, state }), true);
  state.circular = state;
  assert.equal(await persistAriCognitiveState({ userId: turn('').userId, state }), false);
  assert.equal(writes, 1);
});
