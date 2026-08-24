import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const notifications = fs.readFileSync(
  "js/ari-circle/notifications/circle-notifications.js",
  "utf8"
);
const requests = fs.readFileSync(
  "js/ari-circle/connections/connection-requests.js",
  "utf8"
);

test("accepted or declined Circle requests leave the active notification inbox immediately", () => {
  assert.match(notifications, /circle:incoming-request-resolved/);
  assert.match(notifications, /const resolvedNotificationIds = this\.state\.items/);
  assert.match(notifications, /this\.markRead\(notificationId\);\s*this\.removeNotification\(notificationId\);/s);
});

test("resolved request rows stay out during refresh and realtime add", () => {
  const resolvedGuards = notifications.match(/this\.state\.resolvedRequests\.has\([^)]*requestId[^)]*\)/g) || [];
  assert.ok(resolvedGuards.length >= 2, "expected resolved-request guards for refresh and realtime add");
});

test("request workflow emits resolution for both accept and decline", () => {
  const events = requests.match(/circle:incoming-request-resolved/g) || [];
  assert.ok(events.length >= 2, "accept and decline should both emit request resolution");
  assert.match(requests, /action:\s*"accepted"/s);
  assert.match(requests, /action:\s*"declined"/s);
});
