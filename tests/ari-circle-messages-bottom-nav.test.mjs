import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../ari-circle-messages.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/ari-circle-messages-thread-shell.css", import.meta.url), "utf8");

test("ARI Circle Messages suppresses the shared Feed/Connect bottom dock", () => {
  assert.match(html, /<body class="ari-circle-messages-surface">/i);
  assert.match(html, /ari-circle-messages-thread-shell\.css\?v=1\.0\.1/i);
  assert.match(css, /body\.ari-circle-messages-surface \.circle-v5-bottom-nav\s*\{[\s\S]*display:\s*none\s*!important/i);
  assert.match(css, /body\.ari-circle-messages-surface\.circle-v5-real-world\s*\{[\s\S]*padding-bottom:\s*0\s*!important/i);
  assert.match(css, /\.circle-thread__composer[\s\S]*padding-bottom:\s*max\(10px,\s*env\(safe-area-inset-bottom\)\)/i);
});
