import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260824131500_ari_circle_hosting_v1.sql", "utf8");
const retirement = fs.readFileSync("supabase/migrations/20260923151000_ari_circle_retire_xp_completion.sql", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const connect = fs.readFileSync("js/ari-circle/connect/connect-v1.js", "utf8");

test("hosting keeps instant and approval join modes without exposing request rows", () => {
  assert.match(migration, /add column if not exists join_mode text not null default 'instant'/i);
  assert.match(migration, /check \(join_mode in \('instant','approval'\)\)/i);
  assert.match(migration, /create table if not exists public\.ari_circle_meetup_requests/i);
  assert.match(migration, /revoke all on table public\.ari_circle_meetup_requests from public, anon, authenticated/i);
});

test("meetup creation remains one guarded RPC and keeps instant join compatible", () => {
  assert.match(migration, /requested_join_mode text default 'instant'/i);
  assert.match(migration, /clean_join_mode not in \('instant','approval'\)/i);
  assert.match(connect, /rpc\("ari_circle_create_meetup"/);
  assert.match(connect, /requested_join_mode/);
});

test("approval requests are actor-derived and only the host can review them", () => {
  assert.match(migration, /create or replace function public\.ari_circle_request_meetup/i);
  assert.match(migration, /caller_id uuid := auth\.uid\(\)/i);
  assert.match(migration, /create or replace function public\.ari_circle_list_meetup_requests/i);
  assert.match(migration, /Only the host can review requests/i);
  assert.match(migration, /create or replace function public\.ari_circle_review_meetup_request/i);
});

test("host creation keeps the primary path to four simple inputs", () => {
  assert.match(meetupHtml, /<label class="circle-v5-field">What are you doing\?/i);
  assert.match(meetupHtml, /<label class="circle-v5-field">When\?/i);
  assert.match(meetupHtml, /<label class="circle-v5-field">General area/i);
  assert.match(meetupHtml, /<label class="circle-v5-field">Open spots/i);
  assert.match(meetupHtml, /id="meetupFormTitle"[^>]*required/i);
  assert.match(meetupHtml, /id="meetupFormStarts"[^>]*required/i);
  assert.match(meetupHtml, /id="meetupFormArea"[^>]*required/i);
  assert.match(meetupHtml, /id="meetupFormGuestSpots"/i);
  assert.match(meetupHtml, /<summary class="circle-v5-button">More options<\/summary>/i);
  assert.match(meetupHtml, />Anyone can join</i);
  assert.match(meetupHtml, />Approve requests</i);
});

test("client treats capacity as open guest spots and supports request workflow", () => {
  assert.match(connect, /function inferActivity\(title\)/);
  assert.match(connect, /requested_max_participants: guestSpots \+ 1/);
  assert.match(connect, /ari_circle_request_meetup/);
  assert.match(connect, /ari_circle_withdraw_meetup_request/);
  assert.match(connect, /ari_circle_list_meetup_requests/);
  assert.match(connect, /ari_circle_review_meetup_request/);
  assert.match(connect, /Request to Join/);
  assert.match(connect, /Join Waitlist/);
});

test("XP and meetup completion are retired rather than used as host incentives", () => {
  assert.doesNotMatch(meetupHtml, /\bXP\b/i);
  assert.doesNotMatch(connect, /ari_circle_complete_meetup/);
  assert.doesNotMatch(connect, /ari_circle_my_host_summary/);
  assert.match(retirement, /participant_xp set default 0/i);
  assert.match(retirement, /host_bonus_xp set default 0/i);
});
