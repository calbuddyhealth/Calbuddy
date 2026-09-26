import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const meetupHtml = await readFile(new URL("../ari-circle-meetup.html", import.meta.url), "utf8");
const connectController = await readFile(new URL("../js/ari-circle/connect/connect-v1.js", import.meta.url), "utf8");
const connectCss = await readFile(new URL("../assets/css/ari-circle-connect-v1.css", import.meta.url), "utf8");
const locationCss = await readFile(new URL("../assets/css/ari-circle-search-location-v1.css", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260826050000_ari_circle_host_flow_v2.sql", import.meta.url), "utf8");
const retirement = await readFile(new URL("../supabase/migrations/20260923160837_ari_circle_retire_xp_completion.sql", import.meta.url), "utf8");

test("simplified Connect controller remains valid browser JavaScript", () => {
  assert.doesNotThrow(() => new Function(connectController));
  assert.match(connectController, /const VERSION = "1\.3\.0"/);
  assert.match(meetupHtml, /connect-v1\.js\?v=1\.3\.0/);
  assert.doesNotMatch(meetupHtml, /meetups-v5\.js/);
});

test("host request review remains capacity-aware", () => {
  assert.match(connectController, /function guestSpotsOpen/);
  assert.match(connectController, /const openSpots = guestSpotsOpen\(row\)/);
  assert.match(connectController, /canAccept = canReview && openSpots > 0/);
  assert.match(connectController, /data-permanent-disabled="true" disabled/);
  assert.match(connectController, /canAccept \? "Accept" : "Full"/);
});

test("accepting a request refreshes meetup state before rebuilding the queue", () => {
  assert.match(connectController, /await loadMeetups\(\);\s*state\.requestMeetup = state\.rows\.find[\s\S]*?await loadRequests\(\);/);
  assert.doesNotMatch(connectController, /Promise\.all\(\[loadRequests\(\), loadMeetups\(\)\]\)/);
});

test("legacy Host progression is no longer part of the active Connect controller", () => {
  assert.doesNotMatch(connectController, /ari_circle_my_host_summary/);
  assert.doesNotMatch(connectController, /verified_hosted_meetups/);
  assert.doesNotMatch(connectController, /leadership_tier/);
  assert.doesNotMatch(connectController, /\bXP\b/);
});

test("historical host-flow migration remains readable for compatibility only", () => {
  assert.match(migration, /ari_circle_my_host_summary\(\)/);
  assert.match(retirement, /revoke all on function public\.ari_circle_my_host_summary\(\)/i);
  assert.match(retirement, /ari_circle_award_xp_capped/i);
  assert.match(retirement, /select 0::integer/i);
});


test("Connect hides empty discovery groups and gives live instant meetups a Jump In action", () => {
  assert.match(connectController, /const buckets = \{ now: \[\], today: \[\], tomorrow: \[\], weekend: \[\], later: \[\] \}/);
  assert.match(connectController, /renderBucket\("Tomorrow", buckets\.tomorrow\)/);
  assert.match(connectController, /section\.hidden = rows\.length === 0/);
  assert.match(connectController, /live \? "Join now" : "Join"/);
  assert.match(meetupHtml, /id="meetupTomorrowSection"[^>]*hidden/);
  assert.doesNotMatch(meetupHtml, /id="meetupNowEmpty"/);
  assert.doesNotMatch(meetupHtml, /id="meetupTodayEmpty"/);
  assert.doesNotMatch(meetupHtml, /id="meetupWeekendEmpty"/);
});


test("Connect premium cards keep one Host CTA and hide empty-state UI correctly", () => {
  assert.equal((meetupHtml.match(/id="hostMeetupButton"/g) || []).length, 1);
  assert.doesNotMatch(meetupHtml, /id="emptyHostMeetupButton"/);
  assert.match(connectCss, /\.circle-connect-all-empty\[hidden\]\s*\{\s*display:none\s*!important/);
  assert.match(connectController, /circle-connect-card-menu/);
  assert.match(connectController, /Edit meetup/);
  assert.match(connectController, /circle-connect-facts/);
  assert.doesNotMatch(connectController, /circle-connect-timing/);
  assert.match(meetupHtml, /ari-circle-connect-v1\.css\?v=1\.6\.0/);
});


test("Connect primary actions and vibe filters are true circles", () => {
  assert.match(connectCss, /\.circle-connect-action\s*\{[\s\S]*width:104px[\s\S]*height:104px[\s\S]*border-radius:50%/);
  assert.match(connectCss, /\.circle-connect-chip\s*\{[\s\S]*width:78px[\s\S]*height:78px[\s\S]*border-radius:50%/);
  assert.match(meetupHtml, /circle-connect-chip__icon/);
  assert.match(meetupHtml, /circle-connect-action__icon/);
});

test("Connect places the circular GPS action between Host and Find Friends", () => {
  assert.match(
    meetupHtml,
    /id="hostMeetupButton"[\s\S]*data-ari-circle-search-location data-surface="meetup"[\s\S]*href="ari-circle-friends\.html"/
  );
  assert.match(locationCss, /\.ari-circle-location-orb\s*\{[\s\S]*width:104px[\s\S]*height:104px[\s\S]*border-radius:50%/);
  assert.match(locationCss, /\.ari-circle-location-orb__current/);
  assert.match(locationCss, /\.ari-circle-location-orb__meta/);
});

test("Connect mobile shell cannot exceed the viewport width", () => {
  assert.match(connectCss, /body\.circle-connect-next,\s*body\.circle-connect-next \*,[\s\S]*box-sizing:border-box/);
  assert.match(connectCss, /body\.circle-connect-next\s*\{[\s\S]*overflow-x:hidden/);
  assert.match(connectCss, /body\.circle-connect-next \.circle-v5-page\s*\{[\s\S]*width:100%\s*!important;[\s\S]*max-width:760px\s*!important/);
  assert.match(connectCss, /body\.circle-connect-next \.circle-v5-page-main\.circle-connect-main\s*\{[\s\S]*width:100%\s*!important;[\s\S]*min-width:0/);
  assert.match(connectCss, /\.circle-connect-actionbar\s*\{[\s\S]*display:flex[\s\S]*justify-content:center/);
  assert.match(connectCss, /data-surface="meetup"[\s\S]*width:104px[\s\S]*height:104px/);
});
