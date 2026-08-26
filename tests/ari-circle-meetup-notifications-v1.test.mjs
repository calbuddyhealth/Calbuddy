import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration = fs.readFileSync('supabase/migrations/20260826060000_ari_circle_meetup_notifications_v1.sql', 'utf8');
const review = fs.readFileSync('js/ari-circle/meetups/host-review-v3.js', 'utf8');
const meetupHtml = fs.readFileSync('ari-circle-meetup.html', 'utf8');

new Function(review);

assert.match(migration, /ari_circle_domain_events_meetup_notification_fanout/);
assert.match(migration, /after insert on public\.ari_circle_domain_events/i);
assert.match(migration, /when 'meetup\.requested'/);
assert.match(migration, /when 'meetup\.accepted'/);
assert.match(migration, /when 'meetup\.waitlisted'/);
assert.match(migration, /when 'meetup\.declined'/);
assert.match(migration, /when 'meetup\.spot_opened'/);
assert.match(migration, /when 'meetup\.cancelled'/);
assert.match(migration, /when 'meetup\.completed'/);
assert.match(migration, /circle_activity_enabled = false/);
assert.match(migration, /circle_domain_event_id/);
assert.match(migration, /meetup_reminder_key/);
assert.match(migration, /'24h:' \|\| reminder_row\.meetup_id::text/);
assert.match(migration, /'2h:' \|\| reminder_row\.meetup_id::text/);
assert.match(migration, /'\*\/15 \* \* \* \*'/);
assert.doesNotMatch(migration, /update public\.ari_circle_meetup_requests/i);
assert.doesNotMatch(migration, /insert into public\.ari_circle_meetup_participants/i);

assert.match(review, /const VERSION = "3\.0\.0"/);
assert.match(review, /card\.hidden = true/);
assert.match(review, /Accepted guests are managed in the Meetup Room/);
assert.match(review, /verified history only — no automatic ranking/);
assert.match(review, /accept\.textContent = "Accept guest"/);
assert.match(review, /waitlist\.textContent = "Keep waiting"/);
assert.match(review, /ari-circle\.html\?handle=/);
assert.doesNotMatch(review, /\.click\(\)/);
assert.doesNotMatch(review, /data-request-decision="accept"[\s\S]*dispatchEvent/);

assert.match(meetupHtml, /Requests stay chronological/);
assert.match(meetupHtml, /does not auto-rank or auto-accept/);
assert.match(meetupHtml, /host-review-v3\.js\?v=3\.0\.0/);

console.log('ARI Circle meetup notifications + Host Review V3 contracts OK');
