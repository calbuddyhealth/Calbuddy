import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260824131500_ari_circle_hosting_v1.sql", "utf8");
const meetupHtml = fs.readFileSync("ari-circle-meetup.html", "utf8");
const meetupJs = fs.readFileSync("js/ari-circle/meetups/meetups-v5.js", "utf8");

test("hosting V1 adds instant and approval join modes without exposing request rows", () => {
  assert.match(migration, /add column if not exists join_mode text not null default 'instant'/i);
  assert.match(migration, /check \(join_mode in \('instant','approval'\)\)/i);
  assert.match(migration, /create table if not exists public\.ari_circle_meetup_requests/i);
  assert.match(migration, /alter table public\.ari_circle_meetup_requests enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_circle_meetup_requests from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_circle_meetup_requests to service_role/i);
});

test("meetup creation remains one RPC and keeps instant join backward compatible", () => {
  assert.match(migration, /drop function if exists public\.ari_circle_create_meetup\(text,text,text,timestamptz,integer,integer,text\)/i);
  assert.match(migration, /requested_join_mode text default 'instant'/i);
  assert.match(migration, /clean_join_mode not in \('instant','approval'\)/i);
  assert.match(migration, /grant execute on function public\.ari_circle_create_meetup\(text,text,text,timestamptz,integer,integer,text,text\) to authenticated, service_role/i);
});

test("approval requests are actor-derived and only the host can review them", () => {
  assert.match(migration, /create or replace function public\.ari_circle_request_meetup/i);
  assert.match(migration, /caller_id uuid := auth\.uid\(\)/i);
  assert.match(migration, /m\.join_mode <> 'approval'/i);
  assert.match(migration, /create or replace function public\.ari_circle_list_meetup_requests/i);
  assert.match(migration, /m\.host_user_id<>caller_id then raise exception 'Only the host can review requests'/i);
  assert.match(migration, /create or replace function public\.ari_circle_review_meetup_request/i);
  assert.match(migration, /clean_decision not in \('accept','decline','waitlist'\)/i);
});

test("approval mode cannot bypass the host through the instant join RPC", () => {
  assert.match(migration, /if m\.join_mode='approval' and caller_id<>m\.host_user_id then raise exception 'Request to join this meetup'/i);
  assert.match(migration, /if joined_count>=m\.max_participants/i);
});

test("host creation keeps the primary path to four simple inputs", () => {
  assert.match(meetupHtml, /<label class="circle-v5-field">What are you doing\?/i);
  assert.match(meetupHtml, /<label class="circle-v5-field">When\?/i);
  assert.match(meetupHtml, /<label class="circle-v5-field">Where\?/i);
  assert.match(meetupHtml, /<label class="circle-v5-field">Guest spots/i);
  assert.match(meetupHtml, /id="meetupFormTitle"[^>]*required/i);
  assert.match(meetupHtml, /id="meetupFormStarts"[^>]*required/i);
  assert.match(meetupHtml, /id="meetupFormArea"[^>]*required/i);
  assert.match(meetupHtml, /id="meetupFormGuestSpots"/i);
  assert.match(meetupHtml, /<summary class="circle-v5-button">More options<\/summary>/i);
  assert.match(meetupHtml, />Anyone can join</i);
  assert.match(meetupHtml, />I approve requests</i);
  assert.match(meetupHtml, /You are the point of contact/i);
});

test("client treats capacity as guest spots and supports the host request workflow", () => {
  assert.match(meetupJs, /function inferActivity\(title\)/);
  assert.match(meetupJs, /requested_max_participants: guestSpots \+ 1/);
  assert.match(meetupJs, /ari_circle_request_meetup/);
  assert.match(meetupJs, /ari_circle_withdraw_meetup_request/);
  assert.match(meetupJs, /ari_circle_list_meetup_requests/);
  assert.match(meetupJs, /ari_circle_review_meetup_request/);
  assert.match(meetupJs, /HOST · POC/);
  assert.match(meetupJs, /Request to Join/);
  assert.match(meetupJs, /Join Waitlist/);
});

test("host incentives remain completion-based rather than creation-based", () => {
  assert.match(meetupHtml, /Host up to \+6 XP/i);
  assert.match(meetupHtml, /Participant up to \+4 XP/i);
  assert.match(meetupHtml, /Successful hosting builds your Host status/i);
  const createStart = migration.indexOf("create function public.ari_circle_create_meetup");
  const listStart = migration.indexOf("drop function if exists public.ari_circle_list_meetups");
  assert.ok(createStart >= 0 && listStart > createStart);
  assert.doesNotMatch(migration.slice(createStart, listStart), /ari_circle_award_xp_capped/);
});
