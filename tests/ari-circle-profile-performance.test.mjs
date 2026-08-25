import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const supabaseConfig = fs.readFileSync(
  new URL("../supabase-config.js", import.meta.url),
  "utf8"
);

const profileV4 = fs.readFileSync(
  new URL("../js/ari-circle/profile/profile-v4.js", import.meta.url),
  "utf8"
);

const profileLoader = fs.readFileSync(
  new URL("../js/ari-circle/profile/profile-v3-loader.js", import.meta.url),
  "utf8"
);

const profileFriends = fs.readFileSync(
  new URL("../js/ari-circle/profile/profile-friends.js", import.meta.url),
  "utf8"
);

const connectionsController = fs.readFileSync(
  new URL("../js/ari-circle/connections/connections-controller.js", import.meta.url),
  "utf8"
);

const messagesController = fs.readFileSync(
  new URL("../js/ari-circle/messaging/messages-controller.js", import.meta.url),
  "utf8"
);

test("ARI Circle Profile first paint does not wait for viewer inbox collections", () => {
  assert.match(supabaseConfig, /installCircleProfileBootAccelerator/);
  assert.match(supabaseConfig, /fastInitialViewerData/);
  assert.match(supabaseConfig, /originalLoadViewerData/);
  assert.match(supabaseConfig, /conversations:\s*\[\]/);
  assert.match(supabaseConfig, /notifications:\s*\[\]/);
  assert.match(supabaseConfig, /connectionRequests:\s*\[\]/);
  assert.match(supabaseConfig, /connections:\s*\[\]/);
  assert.match(supabaseConfig, /refreshRealtimeAfterBackgroundData/);
  assert.match(supabaseConfig, /app\.connectRealtime/);
});

test("ARI Circle Profile defers Top Circle and Love behind profile-critical data", () => {
  assert.match(supabaseConfig, /fastProfileBundle/);
  assert.match(supabaseConfig, /window\.setTimeout\(\(\) => \{/);
  assert.match(supabaseConfig, /api\.getTopCircle/);
  assert.match(supabaseConfig, /api\.getLove/);
  assert.match(supabaseConfig, /topCircleRows:\s*\[\]/);
  assert.match(supabaseConfig, /love:\s*\{\s*items:\s*\[\],\s*total:\s*0,\s*hasMore:\s*false\s*\}/);
});

test("ARI Circle Profile reuses the context already loaded by the main Circle boot", () => {
  assert.match(profileV4, /primeFromLegacyContext/);
  assert.match(profileV4, /app\?\.modules\?\.CircleStore/);
  assert.match(profileV4, /store\?\.get\?\.\("context"\)/);
  assert.match(profileV4, /const primed = primeFromLegacyContext\(\)/);
});

test("ARI Circle Profile renders post structure before private media signing finishes", () => {
  const firstRender = profileV4.indexOf("// First paint: post text, timestamps and structure appear immediately.");
  const backgroundHydration = profileV4.indexOf("void hydratePosts(state.posts)");

  assert.ok(firstRender >= 0, "first-paint marker should exist");
  assert.ok(backgroundHydration > firstRender, "media signing must happen after the first post render");
  assert.doesNotMatch(profileV4, /await\s+hydratePosts\(state\.posts\)/);
});

test("ARI Circle Profile caches only a verified viewer age state for a short session window", () => {
  assert.match(profileV4, /AGE_CACHE_MS\s*=\s*15\s*\*\s*60\s*\*\s*1000/);
  assert.match(profileV4, /parsed\.age\?\.verified !== true/);
  assert.match(profileV4, /age\?\.verified === true/);
});

test("Profile renderer exposes only current Circle routes and eligibility copy", () => {
  assert.match(profileV4, /const VERSION = "4\.3\.1"/);
  assert.match(profileV4, /ari-circle-feed\.html/);
  assert.match(profileV4, /ari-circle-meetup\.html/);
  assert.match(profileV4, /ari-circle-quests\.html/);
  assert.match(profileV4, /confirm you’re eligible for ARI Circle/);
  assert.doesNotMatch(profileV4, /ari-circle-partners\.html|ari-circle-challenges\.html|>Buddies<|>Challenges</);
  assert.doesNotMatch(profileV4, /teen and adult discovery/i);
});

test("Profile loader keeps one relationship owner and one messaging owner", () => {
  assert.match(profileLoader, /profile-v4\.js\?v=4\.3\.1/);
  assert.match(profileLoader, /v4-ui\.js\?v=5\.3\.2/);
  assert.match(profileLoader, /profile-friends\.js\?v=1\.0\.0/);
  assert.match(profileLoader, /canonicalProfileReady/);
  assert.doesNotMatch(profileLoader, /profile-social-flow|profile-connection-authority|AriCircleProfileSocialFlow/);

  assert.match(connectionsController, /Own the connection relationship UI/);
  assert.match(connectionsController, /case CONNECTION_STATES\.OUTGOING_PENDING/);
  assert.match(connectionsController, /this\.confirmCancelRequest\(\)/);
  assert.match(messagesController, /Single routing authority for messaging entry points/);
  assert.match(messagesController, /CircleEvents\.onAction\("message"/);
});

test("Profile friends module is social-display only", () => {
  assert.match(profileFriends, /ari_circle_profile_friends/);
  assert.match(profileFriends, /view-entire-circle/);
  assert.doesNotMatch(profileFriends, /ari_circle_relationship_state/);
  assert.doesNotMatch(profileFriends, /ari_circle_feed_hide_post|ari_circle_feed_delete_post/);
  assert.doesNotMatch(profileFriends, /data\.circleAction\s*=\s*"connection"/);
});