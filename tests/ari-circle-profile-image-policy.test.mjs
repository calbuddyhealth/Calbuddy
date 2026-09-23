import test from "node:test";
import assert from "node:assert/strict";

import {
  PROFILE_IMAGE_POLICY_VERSION,
  PROFILE_IMAGE_THRESHOLDS,
  evaluateAdultProfileImage,
  isAdultProfileImageScope
} from "../api/_lib/ari-circle-profile-image-policy.js";

function result({ flagged = false, categories = {}, scores = {} } = {}) {
  return {
    flagged,
    categories,
    categoryScores: scores
  };
}

test("profile policy applies only to profile image surfaces", () => {
  assert.equal(isAdultProfileImageScope("profile_gallery_photo"), true);
  assert.equal(isAdultProfileImageScope("profile_avatar"), true);
  assert.equal(isAdultProfileImageScope("profile_cover"), true);
  assert.equal(isAdultProfileImageScope("profile_wall_photo"), true);
  assert.equal(isAdultProfileImageScope("challenge_entry"), false);
  assert.equal(isAdultProfileImageScope("moment"), false);
});

test("normal adult social photos pass without relying on provider flagged boolean", () => {
  const decision = evaluateAdultProfileImage(result({
    flagged: true,
    categories: { sexual: true },
    scores: { sexual: 0.63 }
  }));

  assert.equal(decision.allowed, true);
  assert.equal(decision.decision, "allow_profile_image_borderline");
  assert.equal(decision.reviewRecommended, true);
  assert.deepEqual(decision.reviewCategories, ["sexual"]);
  assert.equal(decision.policyVersion, PROFILE_IMAGE_POLICY_VERSION);
});

test("low-risk profile imagery passes directly", () => {
  const decision = evaluateAdultProfileImage(result({
    flagged: false,
    categories: { sexual: false, violence: false },
    scores: { sexual: 0.18, violence: 0.04 }
  }));

  assert.equal(decision.allowed, true);
  assert.equal(decision.decision, "allow_profile_image");
  assert.equal(decision.reviewRecommended, false);
});

test("high-confidence explicit sexual imagery is blocked", () => {
  const decision = evaluateAdultProfileImage(result({
    flagged: true,
    categories: { sexual: true },
    scores: { sexual: PROFILE_IMAGE_THRESHOLDS.sexual.block + 0.02 }
  }));

  assert.equal(decision.allowed, false);
  assert.match(decision.blockedCategories.join(","), /sexual/);
});

test("high-confidence graphic violence is blocked", () => {
  const decision = evaluateAdultProfileImage(result({
    flagged: true,
    categories: { "violence/graphic": true },
    scores: { "violence/graphic": PROFILE_IMAGE_THRESHOLDS["violence/graphic"].block + 0.05 }
  }));

  assert.equal(decision.allowed, false);
  assert.match(decision.blockedCategories.join(","), /violence\/graphic/);
});

test("absolute high-risk categories remain blocked even with low numeric scores", () => {
  for (const category of [
    "sexual/minors",
    "self-harm/instructions",
    "hate",
    "hate/threatening",
    "harassment/threatening",
    "illicit/violent"
  ]) {
    const decision = evaluateAdultProfileImage(result({
      flagged: true,
      categories: { [category]: true },
      scores: { [category]: 0.01 }
    }));
    assert.equal(decision.allowed, false, category);
    assert.ok(decision.blockedCategories.includes(category), category);
  }
});
