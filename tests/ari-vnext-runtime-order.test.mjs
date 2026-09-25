import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("Ari vNext never reads model result before runAriVNext initializes it", async () => {
  const source = await readFile(
    new URL("../api/ari-vnext.js", import.meta.url),
    "utf8"
  );

  const resultDeclaration = source.indexOf("const result = await runAriVNext(turn)");
  const durableTaskResponse = source.indexOf("durableAgentTask: result?.multiAgent?.durableTask");

  assert.ok(resultDeclaration >= 0, "runAriVNext result declaration must exist");
  assert.ok(durableTaskResponse > resultDeclaration, "durable task diagnostics must be built only after result initialization");

  const preResult = source.slice(0, resultDeclaration);
  assert.doesNotMatch(preResult, /\bresult\?\.multiAgent\?\.durableTask\b/);
  assert.doesNotMatch(preResult, /\bdurableAgentTaskLifecycle\?\./);
});
