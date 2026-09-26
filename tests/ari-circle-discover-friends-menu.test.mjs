import assert from "node:assert/strict";
import fs from "node:fs";

const menu = fs.readFileSync("js/ari-circle/circle-menu-v5.js", "utf8");
const friends = fs.readFileSync("ari-circle-friends.html", "utf8");

const notificationsIndex = menu.indexOf('label: "Notifications"');
const profileIndex = menu.indexOf('label: "Profile"');
const discoverIndex = menu.indexOf('label: "Discover Friends"');
const meetupIndex = menu.indexOf('label: "Meet Up"');

assert.ok(notificationsIndex >= 0, "Notifications remains in the Main drawer group");
assert.ok(profileIndex > notificationsIndex, "Profile remains below Notifications");
assert.ok(discoverIndex > profileIndex, "Discover Friends is below Profile");
assert.equal(meetupIndex, -1, "Connect/Meet Up is primary navigation and is not duplicated in the drawer");

assert.match(
  menu,
  /href: "ari-circle-friends\.html", label: "Discover Friends"/,
  "Discover Friends routes to the dedicated local discovery page"
);
assert.match(
  friends,
  /data-ari-circle-search-location data-surface="friends"/,
  "Find Friends owns a customizable shared location radar"
);
assert.match(
  friends,
  /id="friendsSuggestedSection"/,
  "Find Friends includes mutual-connection suggestions"
);
assert.match(
  friends,
  /id="friendsNearbySection"/,
  "Find Friends includes nearby people discovery"
);

console.log("ARI Circle Discover Friends menu contract passed.");
