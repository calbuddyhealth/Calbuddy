import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const supabaseConfig = fs.readFileSync("supabase-config.js", "utf8");
const profileV4 = fs.readFileSync("js/ari-circle/profile/profile-v4.js", "utf8");
const profileLoader = fs.readFileSync("js/ari-circle/profile/profile-v3-loader.js", "utf8");
const profileGallery = fs.readFileSync("js/ari-circle/profile/profile-gallery-v1.js", "utf8");
const galleryMigration = fs.readFileSync("supabase/migrations/20260923160828_ari_circle_profile_gallery_v1.sql", "utf8");
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
  assert.match(profileV4, /const VERSION = "4\.4\.0"/);
  const start = profileV4.slice(profileV4.indexOf("async function start()"));
  assert.doesNotMatch(start, /void loadPosts\(\)/);
  assert.doesNotMatch(start, /injectProfileTabs\(\)/);
});

test("Profile loader brings in gallery, friends, and compatibility shell without XP", () => {
  assert.match(profileLoader, /profile-gallery-v1\.js\?v=1\.0\.0/);
  assert.match(profileLoader, /profile-friends\.js\?v=1\.0\.0/);
  assert.match(profileLoader, /profile-v4\.js\?v=4\.4\.0/);
  assert.match(profileLoader, /v4-ui\.js\?v=5\.5\.0/);
  assert.doesNotMatch(profileLoader, /ari-circle-xp\.css/);
});

test("Gallery hard-caps supporting photos at four", () => {
  assert.match(galleryMigration, /position between 1 and 4/i);
  assert.match(galleryMigration, /unique \(user_id, position\)/i);
  assert.match(profileGallery, /\[1,2,3,4\]/);
  assert.match(profileGallery, /MAX_BYTES = 8 \* 1024 \* 1024/);
});

test("Friend and message authorities remain separate", () => {
  assert.match(connectionsController, /Own the connection relationship UI/);
  assert.match(connectionsController, /"Add Friend"/);
  assert.match(messagesController, /Single routing authority for messaging entry points/);
});
