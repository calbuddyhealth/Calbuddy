import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup.html");
const rails = await read("js/ari-circle/connect/category-rails-v1.js");
const css = await read("assets/css/ari-circle-connect-category-rails-v1.css");
const migration = await read("supabase/migrations/20261003054500_ari_circle_host_limit_v1.sql");

test("Connect exposes category-first horizontal meetup discovery", () => {
  assert.match(html, /id="meetupCategorySections"/);
  assert.match(html, /data-activity="other"[^>]*><span>Other<\/span>/);
  assert.match(html, /category-rails-v1\.js\?v=1\.0\.0/);
  assert.match(html, /ari-circle-connect-category-rails-v1\.css\?v=1\.0\.0/);
  assert.match(rails, /const CATEGORY = Object\.freeze/);
  assert.match(rails, /\["hiking", "Hiking", "🥾"\]/);
  assert.match(rails, /\["food", "Food", "🍴"\]/);
  assert.match(rails, /\["other", "Other", "✦"\]/);
  assert.match(rails, /circle-connect-category-rail__track/);
  assert.match(css, /grid-auto-flow:column/);
  assert.match(css, /overflow-x:auto/);
  assert.match(css, /scroll-snap-type:x mandatory/);
  assert.match(css, /grid-auto-columns:calc\(100% - 34px\)/);
});

test("legacy time buckets remain compatible but are not the discovery surface", () => {
  for (const id of ["meetupNowSection", "meetupTodaySection", "meetupTomorrowSection", "meetupWeekendSection", "meetupLaterSection"]) {
    assert.match(html, new RegExp(`id="${id}"`));
    assert.match(css, new RegExp(`#${id}`));
  }
  assert.match(rails, /collectFreshCards/);
  assert.match(rails, /track\.append\(card\)/);
});

test("hosts are limited to five active or upcoming meetups at the RPC boundary", () => {
  assert.match(migration, /create or replace function public\.ari_circle_create_meetup/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /hashtextextended\('ari_circle_host_limit:' \|\| caller_id::text, 0\)/i);
  assert.match(migration, /m\.host_user_id = caller_id/i);
  assert.match(migration, /m\.status = 'scheduled'/i);
  assert.match(migration, /m\.ends_at > now\(\)/i);
  assert.match(migration, /active_hosted_count >= 5/i);
  assert.match(migration, /You can host up to 5 active or upcoming events at a time\./i);
  assert.match(html, /You can host up to 5 active or upcoming events at a time\./i);
});
