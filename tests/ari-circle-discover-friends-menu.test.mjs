import assert from "node:assert/strict";
import fs from "node:fs";

const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const profile = fs.readFileSync("ari-circle.html", "utf8");

const notificationsIndex = menu.indexOf('label: "Notifications"');
const profileIndex = menu.indexOf('label: "Profile"');
const discoverIndex = menu.indexOf('label: "Discover Friends"');
const meetupIndex = menu.indexOf('label: "Meet Up"');

assert.ok(notificationsIndex >= 0, "Notifications remains in the Main drawer group");
assert.ok(profileIndex > notificationsIndex, "Profile remains below Notifications");
assert.ok(discoverIndex > profileIndex, "Discover Friends is below Profile");
assert.ok(meetupIndex > discoverIndex, "Discover Friends is above Meet Up");

assert.match(
  menu,
  /ari-circle\.html\?panel=discover-friends/,
  "Discover Friends routes into the existing profile discovery surface"
);
assert.match(
  menu,
  /document\.getElementById\("circle-find-friends-button"\)/,
  "The shared drawer reuses the existing Find Friends action instead of creating a second connection system"
);
assert.match(
  menu,
  /document\.getElementById\("circle-people-discovery"\)/,
  "The route verifies that the existing people-discovery dialog opened"
);
assert.match(
  profile,
  /id="circle-find-friends-button"[\s\S]*?data-circle-action="find-friends"/,
  "The profile still owns the authoritative Find Friends action"
);
assert.match(
  profile,
  /id="circle-people-discovery"/,
  "The existing people-discovery dialog remains the destination"
);

console.log("ARI Circle Discover Friends menu contract passed.");
