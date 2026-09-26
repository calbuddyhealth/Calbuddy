import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup.html");
const connect = await read("js/ari-circle/connect/connect-v1.js");
const css = await read("assets/css/ari-circle-connect-v1.css");
const moderation = await read("js/ari-circle/real-world-moderation-v5.js");
const migration = await read("supabase/migrations/20260926163500_ari_circle_meetup_edit_actions_v1.sql");

test("meetup overflow menu opens upward and above fixed navigation", () => {
  assert.match(css, /\.circle-connect-card\s*\{[\s\S]*overflow:visible/);
  assert.match(css, /\.circle-connect-card-menu__panel\s*\{[\s\S]*bottom:calc\(100% \+ 8px\)/);
  assert.match(css, /\.circle-connect-card:has\(\.circle-connect-card-menu\[open\]\)\s*\{[\s\S]*z-index:80/);
  assert.match(css, /body\.circle-connect-next \.circle-v5-bottom-nav\s*\{\s*z-index:50/);
});

test("host and participant menus expose the correct actions", () => {
  assert.match(connect, /data-meetup-action="edit"[^>]*>Edit meetup</);
  assert.match(connect, /data-meetup-action="delete"[^>]*>Delete meetup</);
  assert.match(connect, /data-meetup-action="leave"[^>]*>Leave meetup</);
  assert.match(connect, /if \(action === "edit"\)\s*\{\s*openEditDialog\(row\)/);
  assert.match(connect, /action === "delete"[\s\S]*ari_circle_cancel_meetup/);
});

test("edit mode reuses the host form and persists through a guarded RPC", () => {
  assert.match(html, /id="hostMeetupKicker"/);
  assert.match(html, /id="hostMeetupTitle"/);
  assert.match(connect, /function openEditDialog\(row\)/);
  assert.match(connect, /Save Changes/);
  assert.match(connect, /ari_circle_update_meetup/);
  assert.match(migration, /meetup_row\.host_user_id <> caller_id/i);
  assert.match(migration, /capacity < joined_count/i);
  assert.match(migration, /starts_at=requested_starts_at/i);
  assert.match(migration, /to authenticated, service_role/i);
});

test("meetup edits remain inside Circle content moderation", () => {
  assert.match(moderation, /ari_circle_update_meetup: Object\.freeze/);
  assert.match(moderation, /scope: "meetup_update"/);
  assert.match(moderation, /requested_title/);
  assert.match(moderation, /requested_area/);
  assert.match(moderation, /requested_description/);
});
