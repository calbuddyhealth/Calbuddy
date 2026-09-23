import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260923195500_ari_circle_profile_moderation_queue.sql",
  "utf8"
);
const worker = fs.readFileSync("api/ari-circle-moderation-worker.js", "utf8");
const gallery = fs.readFileSync("js/ari-circle/profile/profile-gallery-v1.js", "utf8");
const vercel = fs.readFileSync("vercel.json", "utf8");

test("profile photos upload privately before moderation", () => {
  assert.match(gallery, /profile-gallery-pending/);
  assert.match(gallery, /moderation_status: "uploading"/);
  assert.match(gallery, /Photo uploaded\. Checking before it becomes visible to other people/);
  assert.doesNotMatch(gallery, /AriCircleProfileSafety\.screen/);
  assert.doesNotMatch(gallery, /screenPhoto\(/);
});

test("PGMQ is the durable moderation buffer", () => {
  assert.match(migration, /create extension if not exists pgmq/i);
  assert.match(migration, /pgmq\.create\('ari_circle_profile_moderation'\)/);
  assert.match(migration, /pgmq\.send\(/);
  assert.match(migration, /pgmq\.read\('ari_circle_profile_moderation'/);
  assert.match(migration, /pgmq\.set_vt\('ari_circle_profile_moderation'/);
  assert.match(migration, /pgmq\.delete\('ari_circle_profile_moderation'/);
});

test("pending photos are owner-only while approved photos can be viewed by permitted adults", () => {
  assert.match(migration, /caller_id = requested_user_id\s+or p\.moderation_status = 'approved'/);
  assert.match(migration, /p\.user_id = auth\.uid\(\)[\s\S]*p\.moderation_status = 'approved'/);
  assert.match(migration, /profile-gallery-pending/);
});

test("queue consumer functions are service-role only", () => {
  assert.match(migration, /revoke all on function public\.ari_circle_profile_moderation_claim[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.ari_circle_profile_moderation_claim[\s\S]*to service_role/);
  assert.match(migration, /grant execute on function public\.ari_circle_profile_moderation_complete[\s\S]*to service_role/);
  assert.match(migration, /grant execute on function public\.ari_circle_profile_moderation_retry[\s\S]*to service_role/);
});

test("controlled worker stops a batch on provider 429 and schedules queue retry", () => {
  assert.match(worker, /QUEUE_BATCH_DEFAULT = 8/);
  assert.match(worker, /SPACING_MS_DEFAULT = 750/);
  assert.match(worker, /ari_circle_profile_moderation_claim/);
  assert.match(worker, /ari_circle_profile_moderation_retry/);
  assert.match(worker, /ari_circle_profile_moderation_complete/);
  assert.match(worker, /if \(Number\(error\?\.status\) === 429\)/);
  assert.match(worker, /summary\.stoppedForRateLimit = true/);
  assert.match(worker, /break;/);
});

test("worker remains cron-secret protected", () => {
  assert.match(worker, /process\.env\.CRON_SECRET/);
  assert.match(worker, /authorization !== `Bearer \$\{cronSecret\}`/);
  const config = JSON.parse(vercel);
  const moderationCron = config.crons.find((item) => item.path === "/api/ari-circle-moderation-worker");
  assert.deepEqual(moderationCron, {
    path: "/api/ari-circle-moderation-worker",
    schedule: "* * * * *"
  });
});
