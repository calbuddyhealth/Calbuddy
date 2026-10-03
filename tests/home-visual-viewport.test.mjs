import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("home.html", "utf8");
const styles = fs.readFileSync("assets/css/home-thread-ux.css", "utf8");
const threadUx = fs.readFileSync("js/home-thread-ux.js", "utf8");

test("Home cache-busts the visual viewport repair assets", () => {
  assert.match(home, /assets\/css\/home-thread-ux\.css\?v=1\.1\.0/);
  assert.match(home, /js\/home-thread-ux\.js\?v=1\.1\.0/);
});

test("Home uses one visual viewport coordinate system for fixed-screen UI", () => {
  assert.match(styles, /--ari-visual-viewport-height:\s*100svh/);
  assert.match(styles, /--ari-visual-viewport-offset-top:\s*0px/);
  assert.match(styles, /\.ari-v1-home\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(styles, /height:\s*var\(--ari-visual-viewport-height,\s*100svh\)/);
  assert.match(styles, /\.ari-header-v5,[\s\S]*?\.ari-conversation-shell,[\s\S]*?\.ari-bottom-input\s*\{[\s\S]*?position:\s*absolute/);
});

test("Home tracks Safari visual viewport height and offset through keyboard and chrome transitions", () => {
  assert.match(threadUx, /window\.visualViewport/);
  assert.match(threadUx, /--ari-visual-viewport-height/);
  assert.match(threadUx, /--ari-visual-viewport-offset-top/);
  assert.match(threadUx, /vv\.addEventListener\("resize",\s*scheduleVisualViewportSync/);
  assert.match(threadUx, /vv\.addEventListener\("scroll",\s*scheduleVisualViewportSync/);
  assert.match(threadUx, /window\.addEventListener\("resize",\s*scheduleVisualViewportSync/);
  assert.match(threadUx, /window\.addEventListener\("orientationchange",\s*scheduleVisualViewportSync/);
  assert.match(threadUx, /window\.addEventListener\("pageshow",\s*scheduleVisualViewportSync/);
  assert.match(threadUx, /input\?\.addEventListener\("blur",\s*scheduleVisualViewportSync\)/);
});

test("viewport changes settle across Safari animation frames without jumping a scrolled-up reader", () => {
  assert.match(threadUx, /VIEWPORT_SETTLE_DELAYS\s*=\s*\[80,\s*180,\s*360\]/);
  assert.match(threadUx, /viewportTimers\.forEach/);
  assert.match(threadUx, /if \(\(viewportChanged \|\| keyboardChanged\) && nearBottom\)/);
  assert.match(threadUx, /scrollToBottom\(\{ smooth: false \}\)/);
});
