import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("ari-circle-meetup.html");
const connect = await read("js/ari-circle/connect/connect-v1.js");
const css = await read("assets/css/ari-circle-connect-v1.css");
const migration = await read("supabase/migrations/20260926085500_ari_circle_meetup_cover_media_v1.sql");

test("Host flow offers one optional invitation photo without template assets", () => {
  assert.match(html, /id="meetupFormCover"[^>]*type="file"/);
  assert.match(html, /Invitation photo/);
  assert.match(html, /id="meetupCoverChoose"/);
  assert.match(html, /id="meetupCoverRemove"/);
  assert.match(html, /category visual automatically/i);
  assert.doesNotMatch(html, /meetup-template[^"']*[.]png/i);
});

test("Connect cards render uploaded cover media or code-generated category fallbacks", () => {
  assert.match(connect, /function meetupMedia\(/);
  assert.match(connect, /row\.cover_image_path/);
  assert.match(connect, /getPublicUrl\(cleanPath\)/);
  assert.match(connect, /circle-connect-card__media-fallback/);
  assert.match(connect, /circle-connect-media--movies/);
  assert.match(connect, /ari_circle_list_meetups_with_media/);
  assert.match(css, /\.circle-connect-card__content\s*\{/);
  assert.match(css, /aspect-ratio:4 \/ 3/);
  assert.match(css, /border-radius:34px 34px 30px 42px/);
  assert.match(css, /\.circle-connect-media--movies/);
});

test("meetup photos are normalized and safety-screened before upload", () => {
  assert.match(connect, /MAX_COVER_EDGE = 1600/);
  assert.match(connect, /canvas\.toBlob/);
  assert.match(connect, /"image\/jpeg"/);
  assert.match(connect, /scope: "meetup_cover_photo"/);
  assert.match(connect, /AriCircleContentModeration/);
  assert.match(connect, /await moderateMeetupCover\(preparedCover/);
  assert.match(connect, /storage\?\.from\?\.\(MEDIA_BUCKET\)/);
  assert.match(connect, /ari_circle_set_meetup_cover/);
  assert.match(connect, /userId}\/cover\/meetups\/\$\{id\}/);
});

test("database keeps meetup media host-owned and preserves canonical discovery", () => {
  assert.match(migration, /add column if not exists cover_image_path text/i);
  assert.match(migration, /ari_circle_set_meetup_cover/i);
  assert.match(migration, /meetup_row\.host_user_id <> caller_id/i);
  assert.match(migration, /storage\.objects/i);
  assert.match(migration, /bucket_id = 'ari-circle-media'/i);
  assert.match(migration, /caller_id::text \|\| '\/cover\/meetups\/' \|\| requested_meetup_id::text/i);
  assert.match(migration, /ari_circle_list_meetups_with_media/i);
  assert.match(migration, /from public\.ari_circle_list_meetups\(/i);
  assert.match(migration, /to authenticated, service_role/i);
});
