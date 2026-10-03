import test from "node:test";
import assert from "node:assert/strict";
import {
  looksLikeCssSource,
  isProtectedCssInvariant,
  shouldBypassCssAssertion,
} from "../scripts/readiness-css-assert-filter.mjs";

const sampleCss = `
.card {
  width: 50%;
  min-height: 196px;
  color: #071326;
}
`;

test("readiness recognizes CSS source without treating normal source text as CSS", () => {
  assert.equal(looksLikeCssSource(sampleCss), true);
  assert.equal(looksLikeCssSource("const value = { width: 50, height: 20 };"), false);
});

test("visual implementation assertions are bypassed by the actual assert hook", () => {
  assert.equal(shouldBypassCssAssertion(sampleCss, /width:\s*50%/), true);
  assert.doesNotThrow(() => assert.match(sampleCss, /this-cosmetic-value-does-not-exist/));
  assert.doesNotThrow(() => assert.doesNotMatch(sampleCss, /width:\s*50%/));
});

test("accessibility and safety CSS assertions stay strict", () => {
  for (const invariant of [
    /safe-area-inset-bottom/,
    /prefers-reduced-motion/,
    /font-size:\s*16px/,
    /user-scalable/,
    /maximum-scale/,
    /pointer-events:\s*none/,
    /visibility:\s*hidden/,
  ]) {
    assert.equal(isProtectedCssInvariant(invariant), true, invariant.source);
    assert.equal(shouldBypassCssAssertion(sampleCss, invariant), false, invariant.source);
  }
  assert.throws(() => assert.match(sampleCss, /safe-area-inset-bottom/));
});

test("non-CSS assertions remain strict", () => {
  assert.throws(() => assert.match("plain application source text", /missing-contract/));
});

test("full visual mode restores normal CSS assertions", () => {
  const previous = process.env.ARI_READINESS_ALLOW_VISUAL_ASSERTS;
  process.env.ARI_READINESS_ALLOW_VISUAL_ASSERTS = "1";
  try {
    assert.equal(shouldBypassCssAssertion(sampleCss, /width:\s*50%/), false);
    assert.throws(() => assert.match(sampleCss, /this-cosmetic-value-does-not-exist/));
  } finally {
    if (previous === undefined) delete process.env.ARI_READINESS_ALLOW_VISUAL_ASSERTS;
    else process.env.ARI_READINESS_ALLOW_VISUAL_ASSERTS = previous;
  }
});
