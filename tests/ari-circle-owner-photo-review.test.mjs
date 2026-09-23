import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const api = fs.readFileSync("api/ari-circle-owner-photo-review.js", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20260923204500_ari_circle_owner_photo_review.sql",
  "utf8"
);
const html = fs.readFileSync("owner-moderation.html", "utf8");
const client = fs.readFileSync("js/owner-moderation.js", "utf8");

test("owner photo review is server-authorized, not client-flag authorized", () => {
  assert.match(api, /verifyOwnerRequest/);
  assert.match(api, /sendOwnerAuthorizationError/);
  assert.match(api, /Authorization: `Bearer \$\{accessToken\}`|Authorization:/);
  assert.doesNotMatch(api, /owner_access/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("owner can list any still-pending profile photo immediately", () => {
  assert.match(migration, /ari_circle_owner_pending_profile_photos/);
  assert.match(migration, /where p\.moderation_status = 'pending'/);
  assert.match(api, /ari_circle_owner_pending_profile_photos/);
  assert.match(api, /downloadPendingPhoto/);
  assert.match(html, /Photo Review/);
  assert.match(client, /loadPhotoReviews/);
});

test("owner approval resolves pending photo without calling automated moderation", () => {
  assert.match(migration, /ari_circle_owner_review_profile_photo/);
  assert.match(migration, /final_status := case when decision = 'approve' then 'approved'/);
  assert.match(migration, /final_decision := case when decision = 'approve' then 'owner_approved'/);
  assert.match(migration, /moderation_source = 'owner'/);
  assert.match(migration, /moderated_by_user_id = requested_owner_user_id/);
  assert.match(api, /decision must be approve or reject|INVALID_DECISION/i);
  assert.doesNotMatch(api, /openai\.com|moderations/);
});

test("owner review and worker are first-decision-wins", () => {
  assert.match(migration, /for update/);
  assert.match(migration, /if current_row\.moderation_status <> 'pending'/);
  assert.match(migration, /PHOTO_ALREADY_RESOLVED/);
  assert.match(migration, /and moderation_status = 'pending'/);
  assert.match(migration, /pgmq\.q_ari_circle_profile_moderation/);
  assert.match(migration, /pgmq\.delete\('ari_circle_profile_moderation'/);
  assert.match(client, /status === 409/);
});

test("photo review is the default owner moderation panel and supports one-tap approve", () => {
  assert.match(html, /data-owner-panel="photos" class="is-active"/);
  assert.match(html, /id="photoReviewPanel"/);
  assert.match(client, /let activePanel = "photos"/);
  assert.match(client, /data-photo-decision="approve">Approve now/);
  assert.match(client, /Photo approved and published\. Automated moderation was skipped\./);
});

test("owner moderation audit fields distinguish owner from worker decisions", () => {
  assert.match(migration, /add column if not exists moderation_source text/);
  assert.match(migration, /add column if not exists moderated_by_user_id uuid/);
  assert.match(migration, /moderation_source = 'worker'/);
  assert.match(migration, /moderation_source = 'owner'/);
});


test("queued worker still respects the member's AI-processing consent", () => {
  const worker = fs.readFileSync("api/ari-circle-moderation-worker.js", "utf8");
  assert.match(worker, /ari_ai_processing_consent/);
  assert.match(worker, /ari_ai_processing_consent_version/);
  assert.match(worker, /userHasCurrentAiConsent\(job\.user_id\)/);
  assert.match(worker, /AI_PROCESSING_CONSENT_REQUIRED/);
  const processJob = worker.slice(worker.indexOf("async function processJob(job)"));
  assert.ok(
    processJob.indexOf("userHasCurrentAiConsent(job.user_id)") <
      processJob.indexOf("moderateProfileImage(imageUrl)")
  );
});


test("owner photo previews use authenticated same-origin blob fetches", () => {
  assert.match(api, /req\.query\?\.preview/);
  assert.match(api, /storage\/v1\/object\/authenticated/);
  assert.match(api, /res\.status\(200\)\.send\(preview\.bytes\)/);
  assert.match(client, /ownerPhotoPreviewBlob/);
  assert.match(client, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(client, /URL\.createObjectURL\(blob\)/);
  assert.match(client, /data-photo-preview-id/);
  assert.doesNotMatch(client, /photo\.image_url/);
});

test("owner moderation opens on photo review and teen actions still refresh teen safety", () => {
  assert.match(client, /let activePanel = "photos"/);
  assert.match(client, /await loadPhotoReviews\(\);\s*}\s*\n\s*window\.addEventListener\("pagehide"/);
  assert.match(client, /updateTeenSafetyEvent[\s\S]*await loadTeenSafetyEvents\(\);/);
});
