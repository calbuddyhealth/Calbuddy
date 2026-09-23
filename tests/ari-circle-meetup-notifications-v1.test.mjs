import fs from "node:fs";
import assert from "node:assert/strict";

const migration = fs.readFileSync("supabase/migrations/20260826060000_ari_circle_meetup_notifications_v1.sql", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const connect = fs.readFileSync("js/ari-circle/connect/connect-v1.js", "utf8");

assert.match(migration, /ari_circle_domain_events_meetup_notification_fanout/);
assert.match(migration, /after insert on public\.ari_circle_domain_events/i);
assert.match(migration, /when 'meetup\.requested'/);
assert.match(migration, /when 'meetup\.accepted'/);
assert.match(migration, /when 'meetup\.waitlisted'/);
assert.match(migration, /when 'meetup\.declined'/);
assert.match(migration, /when 'meetup\.spot_opened'/);
assert.match(migration, /when 'meetup\.cancelled'/);
assert.match(migration, /circle_activity_enabled = false/);
assert.match(migration, /circle_domain_event_id/);
assert.match(migration, /meetup_reminder_key/);
assert.doesNotMatch(migration, /update public\.ari_circle_meetup_requests/i);
assert.doesNotMatch(migration, /insert into public\.ari_circle_meetup_participants/i);

assert.match(meetupHtml, /id="meetupRequestsDialog"/);
assert.match(meetupHtml, /id="meetupRequestsStatus"/);
assert.match(connect, /ari_circle_list_meetup_requests/);
assert.match(connect, /ari_circle_review_meetup_request/);
assert.match(connect, /Request sent/);
assert.match(connect, /Guest accepted/);
assert.doesNotMatch(connect, /ari_circle_complete_meetup/);
assert.doesNotMatch(meetupHtml, /verified history|auto-rank|\\bXP\\b/i);

console.log("ARI Circle meetup request/notification contracts OK");
