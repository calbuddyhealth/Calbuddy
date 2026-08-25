import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const authority = fs.readFileSync("js/ari-circle/profile/profile-connection-authority.js", "utf8");
const loader = fs.readFileSync("js/ari-circle/profile/profile-v3-loader.js", "utf8");
const socialFlow = fs.readFileSync("js/ari-circle/profile/profile-social-flow.js", "utf8");

// The legacy social-flow explains the regression: outgoing pending removes
// the canonical action and disables the button. The final authority must
// explicitly undo both behaviors from CircleStore state.
assert.match(socialFlow, /case\s+"outgoing_pending"[\s\S]*removeAttribute\("data-circle-action"\)[\s\S]*connection\.disabled\s*=\s*true/);
assert.match(authority, /status === "outgoing_pending"/);
assert.match(authority, /target\.disabled = false/);
assert.match(authority, /target\.dataset\.circleAction = "connection"/);
assert.match(authority, /target\.textContent = "Requested ✓"/);
assert.match(authority, /status === "none"[\s\S]*target\.textContent = "Add to Circle"/);
assert.match(authority, /currentStore\.subscribe/);
assert.match(authority, /MutationObserver/);
assert.match(loader, /profile-connection-authority\.js\?v=1\.0\.0/);

test("profile outgoing request stays cancelable despite legacy social-flow", () => {
  assert.ok(true);
});
