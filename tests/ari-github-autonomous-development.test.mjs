import assert from "node:assert/strict";
import test from "node:test";

import {
  isProtectedAutonomousDevelopmentPath,
  isSafeAutonomousDevelopmentBranch,
  resolveAutonomousDevelopmentPolicy
} from "../api/ari-github-edit.js";

test("autonomous development accepts only a dedicated non-production agent/ari branch", () => {
  assert.equal(
    isSafeAutonomousDevelopmentBranch({
      autonomousBranch: "agent/ari-autonomous-development",
      productionBranch: "main"
    }),
    true
  );
  assert.equal(
    isSafeAutonomousDevelopmentBranch({ autonomousBranch: "main", productionBranch: "main" }),
    false
  );
  assert.equal(
    isSafeAutonomousDevelopmentBranch({ autonomousBranch: "agent/ari-main", productionBranch: "agent/ari-main" }),
    false
  );
  assert.equal(
    isSafeAutonomousDevelopmentBranch({ autonomousBranch: "feature/free-write", productionBranch: "main" }),
    false
  );
});

test("autonomous development protects its own authorization and production control-plane files", () => {
  for (const path of [
    ".github/workflows/ari-vnext-tests.yml",
    ".env.production",
    "OWNER_MODE_SECURITY.md",
    "vercel.json",
    "package.json",
    "package-lock.json",
    "api/ari-github-edit.js",
    "api/ari-owner-intelligence-controls.js",
    "server/ari-owner-auth.js",
    "supabase/migrations/20260917_example.sql"
  ]) {
    assert.equal(isProtectedAutonomousDevelopmentPath(path), true, `${path} should be protected`);
  }

  assert.equal(isProtectedAutonomousDevelopmentPath("api/_lib/ari-vnext/ari-executive.js"), false);
  assert.equal(isProtectedAutonomousDevelopmentPath("ari/developer/example.js"), false);
  assert.equal(isProtectedAutonomousDevelopmentPath("tests/example.test.mjs"), false);
});

test("owner-delegated autonomous development permits bounded exact replacements without per-edit confirmation", () => {
  const policy = resolveAutonomousDevelopmentPolicy({
    enabled: true,
    autonomousBranch: "agent/ari-autonomous-development",
    productionBranch: "main",
    filePath: "api/_lib/ari-vnext/example.js",
    mode: "commit",
    operation: "replace",
    find: "const oldValue = true;",
    replace: "const oldValue = false;",
    replaceAll: false
  });

  assert.equal(policy.allowed, true);
  assert.equal(policy.branch, "agent/ari-autonomous-development");
  assert.equal(policy.confirmationRequired, false);
  assert.equal(policy.productionAuthority, false);
  assert.equal(policy.exactReplaceOnly, true);
  assert.equal(policy.replaceAllAllowed, false);
});

test("autonomous development remains disabled unless the deployment explicitly enables it", () => {
  const policy = resolveAutonomousDevelopmentPolicy({
    enabled: false,
    autonomousBranch: "agent/ari-autonomous-development",
    productionBranch: "main",
    filePath: "api/_lib/ari-vnext/example.js",
    mode: "commit",
    operation: "replace",
    find: "a",
    replace: "b"
  });

  assert.equal(policy.allowed, false);
  assert.equal(policy.code, "AUTONOMOUS_DEVELOPMENT_DISABLED");
  assert.equal(policy.productionAuthority, false);
});

test("autonomous development blocks full replacement, replaceAll, and protected paths", () => {
  const common = {
    enabled: true,
    autonomousBranch: "agent/ari-autonomous-development",
    productionBranch: "main",
    mode: "commit",
    find: "old",
    replace: "new"
  };

  assert.equal(
    resolveAutonomousDevelopmentPolicy({
      ...common,
      filePath: "api/_lib/ari-vnext/example.js",
      operation: "full_replace"
    }).code,
    "AUTONOMOUS_OPERATION_UNSUPPORTED"
  );

  assert.equal(
    resolveAutonomousDevelopmentPolicy({
      ...common,
      filePath: "api/_lib/ari-vnext/example.js",
      operation: "replace",
      replaceAll: true
    }).code,
    "AUTONOMOUS_REPLACE_ALL_BLOCKED"
  );

  assert.equal(
    resolveAutonomousDevelopmentPolicy({
      ...common,
      filePath: "api/ari-github-edit.js",
      operation: "replace"
    }).code,
    "AUTONOMOUS_PATH_PROTECTED"
  );
});
