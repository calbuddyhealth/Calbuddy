import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260824133500_ari_circle_meetup_room_v1.sql", "utf8");
const roomHtml = fs.readFileSync("ari-circle-meetup-room.html", "utf8");
const roomJs = fs.readFileSync("js/ari-circle/meetups/meetup-room-v1.js", "utf8");
const meetupJs = fs.readFileSync("js/ari-circle/meetups/meetups-v5.js", "utf8");
const moderation = fs.readFileSync("js/ari-circle/real-world-moderation-v5.js", "utf8");
const publicMeetupMigration = fs.readFileSync("supabase/migrations/20260824131500_ari_circle_hosting_v1.sql", "utf8");

test("exact meeting point is private room data, not part of public meetup discovery", () => {
  assert.match(migration, /add column if not exists meeting_point text/i);
  assert.match(migration, /Join this meetup to open the room/i);
  const publicListStart = publicMeetupMigration.indexOf("create function public.ari_circle_list_meetups");
  const requestStart = publicMeetupMigration.indexOf("create or replace function public.ari_circle_request_meetup");
  assert.ok(publicListStart >= 0 && requestStart > publicListStart);
  assert.doesNotMatch(publicMeetupMigration.slice(publicListStart, requestStart), /meeting_point/i);
  assert.match(roomHtml, /PRIVATE LOGISTICS/i);
  assert.match(roomHtml, /Joined only/i);
});

test("meetup chat rows are not directly exposed to browser roles", () => {
  assert.match(migration, /create table if not exists public\.ari_circle_meetup_messages/i);
  assert.match(migration, /alter table public\.ari_circle_meetup_messages enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_circle_meetup_messages from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_circle_meetup_messages to service_role/i);
});

test("room reads and writes require current joined membership", () => {
  assert.match(migration, /p\.meetup_id=m\.id and p\.user_id=caller_id and p\.status='joined'/i);
  assert.match(migration, /Join this meetup to read the room chat/i);
  assert.match(migration, /Join this meetup to use the room chat/i);
  assert.match(migration, /This meetup room is archived/i);
});

test("only the host controls the exact meeting point", () => {
  assert.match(migration, /m\.host_user_id<>caller_id then raise exception 'Only the host can update the meeting point'/i);
  assert.match(migration, /Meeting point must be 2-180 characters/i);
  assert.match(roomJs, /ari_circle_set_meetup_point/);
  assert.match(roomJs, /Only joined attendees can see this/i);
});

test("meetup chat is scoped to the room and closes after the meetup window", () => {
  assert.match(migration, /ari_circle_list_meetup_messages/i);
  assert.match(migration, /ari_circle_send_meetup_message/i);
  assert.match(migration, /m\.status<>'scheduled' or now\(\)>m\.ends_at \+ interval '2 hours'/i);
  assert.match(migration, /created_at>now\(\)-interval '1 second'/i);
  assert.match(roomJs, /result_limit: 120/);
  assert.match(roomJs, /setInterval\(\(\) => \{ if \(!document\.hidden\) loadMessages/);
});

test("Meet Up flows directly into the room for hosts and instant joins", () => {
  assert.match(meetupJs, /primaryLabel = "Open Room"/);
  assert.match(meetupJs, /ari-circle-meetup-room\.html\?meetup=/);
  assert.match(meetupJs, /await rpc\("ari_circle_join_meetup"/);
  assert.match(meetupJs, /location\.href = roomUrl\(row\.meetup_id\)/);
  assert.match(meetupJs, /location\.href = roomUrl\(id\)/);
});

test("Meetup Room keeps the host as the visible point of contact", () => {
  assert.match(roomHtml, /POINT OF CONTACT/);
  assert.match(roomHtml, /Message Host/);
  assert.match(roomJs, /HOST · POC/);
  assert.match(roomJs, /ari-circle-messages\.html\?user=/);
});

test("room UGC uses the existing fail-closed Circle moderation wrapper", () => {
  assert.match(moderation, /ari_circle_set_meetup_point/);
  assert.match(moderation, /meetup_room_location/);
  assert.match(moderation, /ari_circle_send_meetup_message/);
  assert.match(moderation, /meetup_room_message/);
  assert.match(roomHtml, /real-world-moderation-v5\.js\?v=5\.1\.0/);
});

test("Phase 2 does not introduce a new XP award path", () => {
  assert.doesNotMatch(migration, /ari_circle_award_xp_capped/i);
  assert.doesNotMatch(roomJs, /ari_circle_xp_events/i);
  assert.doesNotMatch(roomJs, /ari_circle_award_xp/i);
});
