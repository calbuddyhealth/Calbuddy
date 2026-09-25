import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const editor = fs.readFileSync("js/ari-circle/profile/profile-editor.js", "utf8");
const renderer = fs.readFileSync("js/ari-circle/profile/profile-renderer.js", "utf8");
const gallery = fs.readFileSync("js/ari-circle/profile/profile-gallery-v1.js", "utf8");
const profileCss = fs.readFileSync("assets/css/ari-circle-v4.css", "utf8");
const galleryCss = fs.readFileSync("assets/css/ari-circle-profile-gallery-v1.css", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260925161000_ari_circle_profile_showcase_v2.sql", "utf8");

test("Edit Profile exposes curated backgrounds without replacing the avatar", () => {
  assert.match(editor, /key: "cover_url"/);
  for (const theme of ["aurora","coastal","sunset","violet","midnight"]) {
    assert.match(editor, new RegExp(`template:${theme}`));
    assert.match(profileCss, new RegExp(`data-profile-template="${theme}"`));
  }
  assert.match(renderer, /coverUrl\?\.startsWith\("template:"\)/);
  assert.doesNotMatch(editor, /avatar_url/);
});

test("Edit Profile stores exactly one selected icebreaker answer", () => {
  assert.match(editor, /name = "icebreaker\.key"/);
  assert.match(editor, /name = "icebreaker\.answer"/);
  assert.match(editor, /Choose one question to show on your profile/);
  assert.match(editor, /const icebreakers = icebreakerKey && icebreakerAnswer[\s\S]*\{ \[icebreakerKey\]: icebreakerAnswer \}/);
  assert.doesNotMatch(editor, /Answer any, all, or none/);
});

test("Profile renders only one icebreaker publicly", () => {
  assert.match(renderer, /const item = items\[0\] \|\| null/);
  assert.match(renderer, /this\.appendIcebreaker\(item\)/);
  assert.match(renderer, /icebreakersToggle\.hidden = true/);
  assert.match(renderer, /promoteIcebreaker/);
});

test("four showcase slots support photo video and text without an infinite profile feed", () => {
  assert.match(gallery, /slotLimit: 4/);
  assert.match(gallery, /supportedTypes: Object\.freeze\(\["image","video","text"\]\)/);
  assert.match(gallery, /accept="image\/\*,video\/\*"/);
  assert.match(gallery, /MAX_VIDEO_SECONDS = 30/);
  assert.match(gallery, /MAX_TEXT_LENGTH = 600/);
  assert.match(galleryCss, /circle-profile-gallery__video/);
  assert.match(galleryCss, /circle-profile-gallery__text/);
  assert.match(migration, /requested_position not between 1 and 4/i);
  assert.match(migration, /content_type in \('image','video','text'\)/i);
});

test("normal images and short videos get practical upload limits rather than tiny social limits", () => {
  assert.match(gallery, /MAX_IMAGE_BYTES = 20 \* 1024 \* 1024/);
  assert.match(gallery, /MAX_VIDEO_BYTES = 25 \* 1024 \* 1024/);
  assert.match(gallery, /input\.accept = normalized === "video" \? "video\/\*" : "image\/\*"/);
});
