import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const supabaseConfig = fs.readFileSync("supabase-config.js", "utf8");
const profileV4 = fs.readFileSync("js/ari-circle/profile/profile-v4.js", "utf8");
const profileLoader = fs.readFileSync("js/ari-circle/profile/profile-v3-loader.js", "utf8");
const profileGallery = fs.readFileSync("js/ari-circle/profile/profile-gallery-v1.js", "utf8");
const galleryMigration = fs.readFileSync("supabase/migrations/20260923160828_ari_circle_profile_gallery_v1.sql", "utf8");
const showcaseMigration = fs.readFileSync("supabase/migrations/20260925161000_ari_circle_profile_showcase_v2.sql", "utf8");
const connectionsController = fs.readFileSync("js/ari-circle/connections/connections-controller.js", "utf8");
const messagesController = fs.readFileSync("js/ari-circle/messaging/messages-controller.js", "utf8");

test("Profile first paint still avoids waiting for inbox collections", () => {
  assert.match(supabaseConfig, /installCircleProfileBootAccelerator/);
  assert.match(supabaseConfig, /fastInitialViewerData/);
  assert.match(supabaseConfig, /conversations:\s*\[\]/);
  assert.match(supabaseConfig, /notifications:\s*\[\]/);
});

test("Profile reuses the context already loaded by the main Circle boot", () => {
  assert.match(profileV4, /primeFromLegacyContext/);
  assert.match(profileV4, /CircleStore/);
  assert.match(profileV4, /const primed = primeFromLegacyContext\(\)/);
});

test("legacy profile posts are no longer loaded into the active profile experience", () => {
  assert.match(profileV4, /const VERSION = "4\.5\.0"/);
  const start = profileV4.slice(profileV4.indexOf("async function start()"));
  assert.doesNotMatch(start, /void loadPosts\(\)/);
  assert.doesNotMatch(start, /injectProfileTabs\(\)/);
  assert.doesNotMatch(start, /injectMainNav\(\)/);
});

test("Profile loader brings in showcase, friends, and compatibility shell without XP", () => {
  assert.match(profileLoader, /profile-gallery-v1\.js\?v=2\.0\.0/);
  assert.match(profileLoader, /profile-friends\.js\?v=1\.0\.0/);
  assert.match(profileLoader, /profile-v4\.js\?v=4\.5\.0/);
  assert.match(profileLoader, /v4-ui\.js\?v=5\.6\.0/);
  assert.doesNotMatch(profileLoader, /ari-circle-xp\.css/);
});

test("Showcase hard-caps at four while allowing image video and text", () => {
  assert.match(galleryMigration, /position between 1 and 4/i);
  assert.match(galleryMigration, /unique \(user_id, position\)/i);
  assert.match(profileGallery, /\[1,2,3,4\]/);
  assert.match(profileGallery, /const VERSION = "2\.0\.0"/);
  assert.match(profileGallery, /MAX_IMAGE_BYTES = 20 \* 1024 \* 1024/);
  assert.match(profileGallery, /MAX_VIDEO_BYTES = 25 \* 1024 \* 1024/);
  assert.match(profileGallery, /MAX_VIDEO_SECONDS = 30/);
  assert.match(profileGallery, /MAX_TEXT_LENGTH = 600/);
  assert.match(profileGallery, /Photo · Video · Text/);
  assert.match(showcaseMigration, /content_type in \('image','video','text'\)/);
  assert.match(showcaseMigration, /duration_seconds <= 30\.5/);
});

test("Images keep queued moderation without blocking text or short video", () => {
  assert.match(profileGallery, /profile-gallery-pending/);
  assert.match(profileGallery, /moderation_status: contentType === "image" \? "uploading" : "approved"/);
  assert.match(profileGallery, /Image uploaded\. Checking before it becomes visible/);
  assert.match(showcaseMigration, /if clean_type = 'image' then[\s\S]*pgmq\.send/);
  assert.match(showcaseMigration, /profile_showcase_text/);
  assert.match(showcaseMigration, /profile_showcase_video/);
  assert.match(profileGallery, /STATUS_POLL_MS = 15000/);
  assert.doesNotMatch(profileGallery, /screenPhoto\(/);
  assert.doesNotMatch(profileGallery, /AriCircleProfileSafety\.screen/);
});

test("Friend and message authorities remain separate", () => {
  assert.match(connectionsController, /Own the connection relationship UI/);
  assert.match(connectionsController, /"Add Friend"/);
  assert.match(messagesController, /Single routing authority for messaging entry points/);
});
