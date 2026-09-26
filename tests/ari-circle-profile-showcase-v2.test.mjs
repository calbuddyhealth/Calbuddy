import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const editor = fs.readFileSync("js/ari-circle/profile/profile-editor.js", "utf8");
const renderer = fs.readFileSync("js/ari-circle/profile/profile-renderer.js", "utf8");
const gallery = fs.readFileSync("js/ari-circle/profile/profile-gallery-v1.js", "utf8");
const profileCss = fs.readFileSync("assets/css/ari-circle-v4.css", "utf8");
const galleryCss = fs.readFileSync("assets/css/ari-circle-profile-gallery-v1.css", "utf8");
const circleCss = fs.readFileSync("assets/css/ari-circle.css", "utf8");
const circleHtml = fs.readFileSync("ari-circle.html", "utf8");
const circleApi = fs.readFileSync("js/ari-circle/data/circle-api.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260925161000_ari_circle_profile_showcase_v2.sql", "utf8");

test("Edit Profile exposes Midnight plus violet fire pink spectrum themes and Custom photo", () => {
  assert.match(editor, /key: "cover_url"/);
  assert.match(editor, /value: "", label: "Default"/);
  assert.match(editor, /value: "__custom_photo__", label: "Custom photo…"/);
  for (const theme of ["midnight","violet-spectrum","fire-spectrum","pink-spectrum"]) {
    assert.match(editor, new RegExp(`template:${theme}`));
    assert.match(profileCss, new RegExp(`data-profile-template="${theme}"`));
  }
  for (const retired of ["arctic-glass","electric-dusk","champagne","aurora","coastal","sunset"]) {
    assert.doesNotMatch(editor, new RegExp(`template:${retired}`));
    assert.doesNotMatch(profileCss, new RegExp(`data-profile-template="${retired}"`));
  }
  assert.match(renderer, /allowedTemplates = new Set/);
  assert.match(renderer, /coverUrl\?\.startsWith\("template:"\)/);
  assert.doesNotMatch(editor, /avatar_url/);
});

test("birthday rendering preserves date-only values across time zones", () => {
  assert.match(renderer, /calendarMatch/);
  assert.match(renderer, /Date\.UTC\(/);
  assert.match(renderer, /timeZone: "UTC"/);
  assert.match(renderer, /HTML date inputs persist birthdays as YYYY-MM-DD calendar dates/);
});

test("profile background templates fill the entire identity card through the action buttons", () => {
  assert.match(renderer, /profileCard\.dataset\.profileTemplate = templateName/);
  assert.match(profileCss, /\.circle-profile\[data-profile-template="violet-spectrum"\]/);
  assert.match(profileCss, /--circle-profile-theme:/);
  assert.match(profileCss, /background-size: 100% 100%/);
  assert.match(profileCss, /\.circle-profile__body[\s\S]*background: transparent !important/);
  assert.match(profileCss, /\.circle-profile__cover[\s\S]*background: transparent !important/);
  assert.match(profileCss, /data-profile-template="midnight"[\s\S]*\.circle-profile__name/);
  assert.doesNotMatch(profileCss, /#fff 168px/);
});

test("main profile photo is larger, circular, and has no decorative outer ring", () => {
  assert.match(profileCss, /circle-profile__avatar-wrap[\s\S]*width: 140px !important/);
  assert.match(profileCss, /circle-profile__avatar-button,[\s\S]*width: 140px !important/);
  assert.match(profileCss, /circle-profile__avatar-button,[\s\S]*border-radius: 50% !important/);
  assert.match(profileCss, /circle-profile__avatar-wrap::before,[\s\S]*circle-profile__avatar-wrap::after[\s\S]*display: none !important/);
  assert.doesNotMatch(profileCss, /circle-profile__avatar-fallback[\s\S]{0,220}border-radius: 28px !important/);
});

test("Custom photo uses an in-dialog iOS-safe picker and the existing media upload pipeline", () => {
  assert.match(editor, /circle-editor-custom-cover-input/);
  assert.match(editor, /Choose photo from library/);
  assert.match(editor, /showCustomBackgroundPicker\(\)/);
  assert.match(editor, /handleCustomBackgroundFile\(event\)/);
  assert.match(editor, /ProfileMedia\.processFile\([\s\S]*MEDIA_TYPES\.COVER/);
  assert.match(editor, /Custom photo \(current\)/);
  assert.match(editor, /circle:profile-media-uploaded/);
  assert.match(editor, /getValue\("cover_url"\) === "__custom_photo__"/);
  assert.match(circleCss, /circle-custom-background-picker\[hidden\]/);
  assert.match(profileCss, /data-profile-template="custom"[\s\S]*circle-profile__cover[\s\S]*position: absolute !important/);
  assert.match(profileCss, /data-profile-template="custom"[\s\S]*circle-profile__cover-image[\s\S]*object-fit: cover !important/);
  assert.match(profileCss, /data-profile-template="custom"[\s\S]*linear-gradient/);
});

test("built-in profile templates disable legacy cover overlays so no horizontal seam is rendered", () => {
  assert.match(profileCss, /data-profile-template\]:not\(\[data-profile-template="custom"\]\)[\s\S]*circle-profile__cover::before/);
  assert.match(profileCss, /circle-profile__cover::after[\s\S]*content: none !important/);
  assert.match(profileCss, /circle-profile__cover-fallback[\s\S]*display: none !important/);
  assert.match(renderer, /coverFallback\.hidden = true/);
});

test("Break the Ice is removed from Edit Profile and the public profile", () => {
  assert.doesNotMatch(editor, /Break the Ice/i);
  assert.doesNotMatch(editor, /icebreaker/i);
  assert.doesNotMatch(renderer, /Break the Ice/i);
  assert.doesNotMatch(renderer, /icebreaker/i);
  assert.doesNotMatch(circleHtml, /circle-icebreakers/);
  assert.doesNotMatch(circleHtml, /circle-icebreaker-template/);
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
  assert.match(gallery, /MAX_VIDEO_BYTES = 50 \* 1024 \* 1024/);
  assert.match(gallery, /input\.accept = normalized === "video" \? "video\/\*" : "image\/\*"/);
});


test("showcase items use a compact three-dot Edit/Delete menu instead of bottom action bars", () => {
  assert.match(gallery, /circle-profile-gallery__item-menu/);
  assert.match(gallery, /data-gallery-edit="\$\{position\}"/);
  assert.match(gallery, /data-gallery-remove="\$\{position\}"/);
  assert.match(gallery, />Edit</);
  assert.match(gallery, />Delete</);
  assert.doesNotMatch(gallery, /data-gallery-replace=/);
  assert.doesNotMatch(gallery, />Replace</);
  assert.match(galleryCss, /circle-profile-gallery__item-menu-popover/);
  assert.doesNotMatch(galleryCss, /circle-profile-gallery__photo-actions/);
});

test("showcase refresh never exposes raw Safari Load failed errors", () => {
  assert.match(gallery, /transientNetworkError/);
  assert.match(gallery, /load failed\|failed to fetch\|network request\|networkerror/i);
  assert.match(gallery, /Profile showcase couldn’t refresh/);
  assert.doesNotMatch(gallery, /status\(error\.message \|\| "Profile showcase is unavailable right now\."/);
});

test("Edit Profile prevents iOS focus auto-zoom and blurs before closing", () => {
  assert.match(circleCss, /#circle-profile-editor input[\s\S]*#circle-profile-editor select[\s\S]*#circle-profile-editor textarea/);
  assert.match(circleCss, /font-size: 16px !important/);
  assert.match(editor, /this\.dom\.dialog\?\.contains\(active\)/);
  assert.match(editor, /active\.blur\(\)/);
  assert.match(circleHtml, /assets\/css\/ari-circle\.css\?v=2\.0\.2/);
});

test("Edit Profile autosaves changes and reports persisted state", () => {
  assert.match(editor, /AUTOSAVE_DELAY_MS = 650/);
  assert.match(editor, /scheduleAutoSave/);
  assert.match(editor, /flushAutoSave/);
  assert.match(editor, /requestId/);
  assert.match(editor, /PROFILE_SAVED_EVENT = "circle:profile-saved"/);
  assert.match(editor, /PROFILE_SAVE_FAILED_EVENT = "circle:profile-save-failed"/);
  assert.match(circleApi, /"circle:profile-saved"/);
  assert.match(circleApi, /"circle:profile-save-failed"/);
  assert.match(circleHtml, /id="circle-profile-save-status"/);
  assert.doesNotMatch(circleHtml, /id="circle-profile-save-button"/);
  assert.match(circleCss, /circle-profile-save-status\[data-state="saved"\]/);
});
