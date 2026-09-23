// ARI Circle adult profile image moderation policy.
// Keeps the provider's raw moderation output, but applies Circle-specific
// thresholds so normal adult social photos are not rejected by a generic
// top-level "flagged" boolean.

export const PROFILE_IMAGE_POLICY_VERSION = "adult-profile-v1";

export const PROFILE_IMAGE_SCOPES = new Set([
  "profile_gallery_photo",
  "profile_avatar",
  "profile_cover",
  "profile_wall_photo"
]);

export const PROFILE_IMAGE_THRESHOLDS = Object.freeze({
  sexual: Object.freeze({ review: 0.55, block: 0.92 }),
  "violence/graphic": Object.freeze({ review: 0.45, block: 0.82 }),
  "self-harm": Object.freeze({ review: 0.50, block: 0.88 }),
  violence: Object.freeze({ review: 0.72, block: 0.97 })
});

const ABSOLUTE_BLOCK_CATEGORIES = new Set([
  "sexual/minors",
  "self-harm/instructions",
  "hate",
  "hate/threatening",
  "harassment/threatening",
  "illicit/violent"
]);

function scoreFor(result, category) {
  const raw = Number(result?.categoryScores?.[category]);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(1, raw));
}

export function isAdultProfileImageScope(scope) {
  return PROFILE_IMAGE_SCOPES.has(String(scope || "").trim().toLowerCase());
}

export function evaluateAdultProfileImage(result = {}) {
  const categories = result?.categories || {};
  const blocked = [];

  for (const category of ABSOLUTE_BLOCK_CATEGORIES) {
    if (categories?.[category] === true) blocked.push(category);
  }

  for (const [category, thresholds] of Object.entries(PROFILE_IMAGE_THRESHOLDS)) {
    if (scoreFor(result, category) >= thresholds.block && !blocked.includes(category)) {
      blocked.push(category);
    }
  }

  if (blocked.length) {
    return {
      allowed: false,
      decision: "block_profile_image_policy",
      policyVersion: PROFILE_IMAGE_POLICY_VERSION,
      blockedCategories: blocked,
      reviewRecommended: false,
      reviewCategories: []
    };
  }

  const reviewCategories = [];
  for (const [category, thresholds] of Object.entries(PROFILE_IMAGE_THRESHOLDS)) {
    const score = scoreFor(result, category);
    if (
      score >= thresholds.review ||
      (categories?.[category] === true && score < thresholds.block)
    ) {
      reviewCategories.push(category);
    }
  }

  return {
    allowed: true,
    decision: reviewCategories.length
      ? "allow_profile_image_borderline"
      : "allow_profile_image",
    policyVersion: PROFILE_IMAGE_POLICY_VERSION,
    blockedCategories: [],
    reviewRecommended: reviewCategories.length > 0,
    reviewCategories
  };
}
