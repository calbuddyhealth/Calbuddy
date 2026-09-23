import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const feed = fs.readFileSync("js/ari-circle/feed/feed.js", "utf8");
const html = fs.readFileSync("ari-circle-feed.html", "utf8");
const css = fs.readFileSync("assets/css/ari-circle-feed.css", "utf8");

test("feed posts no longer expose reaction controls", () => {
  for (const token of [
    "reactionDialog",
    "quickReactionGrid",
    "openReactionPicker",
    "toggleReaction",
    "bindReactionPicker",
    "feed-reaction-pill"
  ]) {
    assert.equal(feed.includes(token), false, token);
    assert.equal(html.includes(token), false, token);
  }
});

test("post footer is a single comment action with a vector icon", () => {
  assert.match(feed, /className = "feed-post__comment-action"/);
  assert.match(feed, /<svg viewBox="0 0 24 24"/);
  assert.match(feed, /<span>Comment/);
  assert.doesNotMatch(feed, /☺|React/);
  assert.match(css, /\.feed-post__actions\s*\{[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.feed-post__comment-action svg/);
});

test("reaction picker markup and reaction-specific styling are removed", () => {
  assert.doesNotMatch(html, /id="reactionDialog"/);
  assert.doesNotMatch(html, /data-reaction=/);
  assert.doesNotMatch(css, /\.feed-emoji-grid/);
  assert.doesNotMatch(css, /\.feed-custom-reaction/);
});
