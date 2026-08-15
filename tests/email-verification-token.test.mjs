import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [auth, verification] = await Promise.all([
  readFile(new URL("../js/auth.js", import.meta.url), "utf8"),
  readFile(new URL("../js/email-verification.js", import.meta.url), "utf8")
]);

test("signup verification never truncates Supabase codes to six digits", () => {
  assert.doesNotMatch(auth, /slice\(0,\s*6\)/);
  assert.doesNotMatch(verification, /slice\(0,\s*6\)/);
});

test("shared auth accepts the current variable-length numeric signup token", () => {
  assert.match(auth, /replace\(\/\\D\/g,\s*""\)\.slice\(0,\s*10\)/);
  assert.match(auth, /type:\s*"signup"/);
});

test("interactive verification preserves the exact numeric token sent by Supabase", () => {
  assert.match(verification, /const MAX_CODE_LENGTH = 10/);
  assert.match(verification, /token,\s*\n\s*type:\s*"signup"/);
  assert.match(verification, /Do not truncate it to a[\s\S]*historical 6-digit assumption/);
});
