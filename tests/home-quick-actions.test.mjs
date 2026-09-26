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
