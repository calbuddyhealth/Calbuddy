import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../api/ari-vnext-initiative.js', import.meta.url), 'utf8');
// Isolate the HTTP gate from storage; any unauthorized storage access fails.
const executable = source.replace(/import\s+[\s\S]*?from\s+"[^"]+";\n/g, '').replace('export default async function handler', 'async function handler');
for (const status of [403, 401, 503]) {
  test(`authorization ${status} never reaches initiative storage`, async () => {
    const context = vm.createContext({
      verifyOwnerRequest: async () => ({ authorized: false, status, code: 'DENIED', error: 'Denied' }),
      console, Buffer
    });
    vm.runInContext(executable, context);
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await context.handler({ method: 'POST', body: { action: 'check', ownerMode: true } }, res);
    assert.equal(res.code, status === 403 ? 200 : status);
    assert.equal(res.body.shouldInitiate, false);
    if (status === 403) assert.equal(res.body.initiative, null);
  });
}
test('verified owner retains initiative engagement', async () => {
  let called;
  const context = vm.createContext({
    verifyOwnerRequest: async () => ({ authorized: true, user: { id: 'verified-owner' } }),
    extractBearerToken: () => 'token',
    updateInitiativeStatus: async args => { called = args; return { success: true }; },
    console, Buffer
  });
  vm.runInContext(executable, context);
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await context.handler({ method: 'POST', body: { action: 'engage', initiativeId: 'signal' } }, res);
  assert.equal(res.code, 200);
  assert.equal(called.userId, 'verified-owner');
  assert.equal(called.status, 'engaged');
});
test('browser skips context and network work outside Owner Mode', async () => {
  const source = readFileSync(new URL('../ari/vnext/ari-vnext-initiative.js', import.meta.url), 'utf8');
  for (const ownerMode of [false, undefined]) {
    const window = {
      AriVNextOperationRegistry: { ready: true },
      CalBuddy: { getUserContext: async () => ({ ownerMode }) },
      dispatchEvent() {}
    };
    const context = vm.createContext({ window, console, CustomEvent: class {} });
    vm.runInContext(source, context);
    await new Promise(resolve => setImmediate(resolve));
    const result = await window.AriVNextInitiative.check();
    assert.equal(result.shouldInitiate, false);
    assert.equal(result.reason, 'owner_only');
  }
});
