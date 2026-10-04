import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_CODE_TASK_PATCHES,
  applyExactPatch,
  isolatedTaskBranch,
  validateCodeTaskPatches
} from "../api/_lib/ari-vnext/developer-coding-runner.js";

test("coding runner derives a dedicated agent branch from the task id", () => {
  assert.equal(isolatedTaskBranch("Exec 123 / Fix GPS"), "agent/ari-task-exec-123-fix-gps");
  assert.match(isolatedTaskBranch("***"), /^agent\/ari-task-[a-f0-9]{8}$/);
});

test("exact patch succeeds only for one unambiguous target", () => {
  const applied = applyExactPatch("alpha\nbeta\ngamma", { find: "beta", replace: "delta" });
  assert.equal(applied.success, true);
  assert.equal(applied.content, "alpha\ndelta\ngamma");

  assert.equal(applyExactPatch("alpha", { find: "missing", replace: "x" }).code, "CODE_TASK_TARGET_NOT_FOUND");
  assert.equal(applyExactPatch("x x", { find: "x", replace: "y" }).code, "CODE_TASK_TARGET_AMBIGUOUS");
});

test("coding runner validates bounded multi-file patches and protects control-plane paths", () => {
  const valid = validateCodeTaskPatches([
    { filePath: "api/_lib/ari-vnext/example.js", find: "old", replace: "new" },
    { filePath: "tests/example.test.mjs", find: "before", replace: "after" }
  ]);
  assert.equal(valid.valid, true);
  assert.equal(valid.patches.length, 2);

  const protectedResult = validateCodeTaskPatches([
    { filePath: "server/ari-owner-auth.js", find: "old", replace: "new" }
  ]);
  assert.equal(protectedResult.valid, false);
  assert.equal(protectedResult.code, "CODE_TASK_PATH_PROTECTED");
});

test("coding runner rejects oversized task fanout", () => {
  const patches = Array.from({ length: MAX_CODE_TASK_PATCHES + 1 }, (_, index) => ({
    filePath: `api/example-${index}.js`,
    find: "old",
    replace: "new"
  }));
  assert.equal(validateCodeTaskPatches(patches).code, "CODE_TASK_PATCH_COUNT_INVALID");
});
