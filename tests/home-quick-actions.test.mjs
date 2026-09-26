import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("home.html", "utf8");
const css = fs.readFileSync("assets/css/home.css", "utf8");

test("home quick actions are horizontal icon-only orbs ordered meal, Circle, Train", () => {
  const start = home.indexOf('class="ari-home-quick-actions"');
  const end = home.indexOf("</nav>", start);
  assert.ok(start > 0 && end > start, "quick action nav should exist");

  const quick = home.slice(start, end);
  const meal = quick.indexOf('aria-label="Log Meal"');
  const circle = quick.indexOf('aria-label="Open Circle"');
  const train = quick.indexOf('aria-label="Open Training"');

  assert.ok(meal >= 0, "Log Meal action should be present");
  assert.ok(circle > meal, "Circle should be in the middle");
  assert.ok(train > circle, "Train should be last");
  assert.match(css, /\.ari-home-quick-actions\s*\{[\s\S]*display:\s*flex/i);
  assert.match(css, /\.ari-home-quick-orb\s*\{[\s\S]*aspect-ratio:\s*1[\s\S]*border-radius:\s*50%/i);
  assert.equal((quick.match(/class="ari-home-quick-orb"/g) || []).length, 3);
  assert.doesNotMatch(quick, /ari-home-quick-label/i);
  assert.doesNotMatch(quick, />\s*(?:Log Meal|Circle|Train)\s*</i);
});

test("home quick action orbs visibly float, glow, pulse, and respond to taps", () => {
  assert.match(css, /@keyframes\s+ariQuickOrbFloatGlow/i);
  assert.match(css, /@keyframes\s+ariQuickIconPulse/i);
  assert.match(css, /@keyframes\s+ariQuickOrbPulse/i);
  assert.match(css, /@keyframes\s+ariQuickOrbSpark/i);
  assert.match(css, /\.ari-home-quick-orb\s*\{[\s\S]*animation:\s*ariQuickOrbFloatGlow\s+4\.5s/i);
  assert.match(css, /\.ari-home-quick-icon\s*\{[\s\S]*animation:\s*ariQuickIconPulse\s+4\.5s/i);
  assert.match(css, /\.ari-home-quick-orb::before\s*\{[\s\S]*animation:\s*ariQuickOrbPulse\s+4\.5s/i);
  assert.match(css, /\.ari-home-quick-orb::after\s*\{[\s\S]*animation:\s*ariQuickOrbSpark\s+4\.5s/i);
  assert.match(css, /\.ari-home-quick-action--meal\s*\{[\s\S]*--quick-pulse-delay:\s*0s/i);
  assert.match(css, /\.ari-home-quick-action--circle\s*\{[\s\S]*--quick-pulse-delay:\s*-1\.5s/i);
  assert.match(css, /\.ari-home-quick-action--train\s*\{[\s\S]*--quick-pulse-delay:\s*-3s/i);
  assert.match(css, /@keyframes\s+ariQuickOrbFloatGlow\s*\{[\s\S]*translateY\(2px\) scale\(0\.98\)[\s\S]*translateY\(-3px\) scale\(1\.04\)/i);
  assert.match(css, /\.ari-home-quick-action:active \.ari-home-quick-orb\s*\{[\s\S]*animation:\s*none[\s\S]*scale\(0\.92\)/i);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
});

test("home quick actions route to the intended primary destinations", () => {
  assert.match(home, /href="nutrition\.html#manualEntrySection"[^>]*aria-label="Log Meal"/i);
  assert.match(home, /href="ari-circle-meetup\.html"[^>]*aria-label="Open Circle"/i);
  assert.match(home, /href="ari-training\.html"[^>]*aria-label="Open Training"/i);
});

test("Circle quick action keeps the adult entitlement gate", () => {
  assert.match(
    home,
    /href="ari-circle-meetup\.html"[^>]*data-ari-circle-link hidden aria-hidden="true"/i
  );
});

test("quick actions disappear when Ask Ari enters conversation mode", () => {
  assert.match(
    css,
    /\.conversation-mode \.ari-home-quick-actions\s*\{[\s\S]*visibility:\s*hidden[\s\S]*pointer-events:\s*none/i
  );
});

test("welcome hero reserves room for the quick action row", () => {
  assert.match(css, /--ari-quick-actions-height:/i);
  assert.match(css, /--ari-quick-actions-gap:/i);
  assert.match(
    css,
    /\.ari-welcome\s*\{[\s\S]*top:\s*calc\([\s\S]*var\(--ari-quick-actions-height\)/i
  );
});
