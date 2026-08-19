// ARI XP — dedicated cost-controlled ARI Circle moderation endpoint.
// Uses only OpenAI's free moderation model. No paid generative-model fallback.
// ARI Circle is restricted to active, verified adult (18+) accounts.

import { enforceAiRateLimit } from "./_lib/ai-rate-limit.js";
import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";

const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
const OPENAI_MODERATION_MODEL = "omni-moderation-latest";
const USAGE_ENDPOINT = "ari-circle-moderation";
const MAX_TEXT = 8000;
const MAX_IMAGES = 4;
const MAX_IMAGE_URL_LENGTH = 1_500_000;
const AI_CONSENT_KEY = "ari_ai_processing_consent";
const AI_CONSENT_VERSION_KEY = "ari_ai_processing_consent_version";
const REQUIRED_AI_CONSENT_VERSION = "2";

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function serverHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function readJson(response) {
  return await response.json().catch(() => ({}));
}

function requestAuthorization(req) {
  const authorization = String(req?.headers?.authorization || "").trim();
  return authorization.toLowerCase().startsWith("bearer ") ? authorization : "";
}

async function getAuthenticatedUser(req) {
  const authorization = requestAuthorization(req);
  if (!authorization) return null;

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: authorization
    }
  });

  if (!response.ok) return null;
  const user = await readJson(response);
  return user?.id ? user : null;
}

function hasCurrentAiConsent(user) {
  const metadata = user?.user_metadata || {};
  return metadata[AI_CONSENT_KEY] === true &&
    String(metadata[AI_CONSENT_VERSION_KEY] || "") === REQUIRED_AI_CONSENT_VERSION;
}

// Retained as a pure helper for regression tests and non-authorization display
// logic. Circle authorization itself comes only from the canonical Supabase RPC.
export function ageBandForDate(value, now = new Date()) {
  const dateText = clean(value, 32);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return "unknown";

  const [year, month, day] = dateText.split("-").map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  const today = now instanceof Date ? now : new Date(now);
  if (
    !Number.isFinite(birth.getTime()) ||
    !Number.isFinite(today.getTime()) ||
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day ||
    birth > today
  ) return "unknown";

  let age = today.getUTCFullYear() - year;
  const monthDelta = today.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < day)) age -= 1;

  if (!Number.isFinite(age) || age < 0 || age > 120) return "unknown";
  if (age < 13) return "under_13";
  if (age < 18) return "teen";
  return "adult";
}

async function getCircleAccessState(authorization) {
  if (!authorization) {
    return { ageBand: "unknown", allowed: false, policy: null };
  }

  // Use the same authenticated account-level entitlement that gates Circle in
  // the browser and database. Do not independently read DOB or recalculate age
  // with a server credential: duplicate authorization paths can disagree with
  // the canonical account state and incorrectly lock eligible adults out.
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/ari_circle_my_age_state`,
    {
      method: "POST",
      headers: serverHeaders({ Authorization: authorization }),
      body: "{}"
    }
  );

  const data = await readJson(response);
  if (!response.ok) {
    console.warn("[ARI Circle Moderation] entitlement lookup failed", {
      status: response.status
    });
    return { ageBand: "unknown", allowed: false, policy: null };
  }

  const state = Array.isArray(data) ? (data[0] || {}) : (data || {});
  const ageBand = clean(state?.age_band || state?.ageBand, 40).toLowerCase() || "unknown";
  const circleAllowed = state?.circle_allowed ?? state?.circleAllowed;

  return {
    ageBand,
    allowed: ageBand === "adult" && circleAllowed === true,
    policy: clean(state?.policy, 80) || null
  };
}

function isAllowedImageUrl(value) {
  const url = clean(value, MAX_IMAGE_URL_LENGTH);
  if (!url) return false;

  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(url)) return true;

  const supabaseOrigin = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  return Boolean(
    supabaseOrigin &&
    url.startsWith(`${supabaseOrigin}/storage/v1/object/sign/`)
  );
}

function normalizeImages(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => clean(value, MAX_IMAGE_URL_LENGTH))
    .filter(isAllowedImageUrl)
    .slice(0, MAX_IMAGES);
}

async function moderateOne({ apiKey, input }) {
  const response = await fetch(OPENAI_MODERATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODERATION_MODEL,
      input
    })
  });

  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Moderation request failed.");
    error.status = response.status;
    throw error;
  }

  const result = data?.results?.[0];
  if (!result || typeof result.flagged !== "boolean") {
    throw new Error("Moderation returned an invalid result.");
  }

  return {
    model: data?.model || OPENAI_MODERATION_MODEL,
    flagged: result.flagged === true,
    categories: result?.categories || {},
    categoryScores: result?.category_scores || {},
    appliedInputTypes: result?.category_applied_input_types || {}
  };
}

function blockedCategories(result) {
  return Object.entries(result?.categories || {})
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .slice(0, 20);
}

async function recordRequest({ userId, scope, checks, decision }) {
  await recordOpenAIUsage({
    userId,
    endpoint: USAGE_ENDPOINT,
    usageType: "moderation",
    requestCategory: scope,
    model: OPENAI_MODERATION_MODEL,
    responseData: {
      model: OPENAI_MODERATION_MODEL,
      usage: {}
    },
    metadata: {
      check_count: Array.isArray(checks) ? checks.length : 0,
      decision: clean(decision, 80) || "unknown",
      billed_cost_usd: 0
    }
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const authorization = requestAuthorization(req);
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Sign in again before sharing to ARI Circle." });

  // Authorization is checked before consent, rate limiting, or OpenAI. A minor
  // cannot spend moderation capacity or use this endpoint as a Circle back door.
  // The canonical RPC derives this entitlement from protected account DOB/status.
  const access = await getCircleAccessState(authorization);
  if (!access.allowed) {
    return res.status(403).json({
      success: false,
      allowed: false,
      error: "ARI Circle is available to adults age 18 and older.",
      code: "ARI_CIRCLE_ADULTS_ONLY",
      age_band: access.ageBand,
      decision: "block_age_entitlement",
      paid_classifier_used: false,
      check_count: 0
    });
  }

  if (!hasCurrentAiConsent(user)) {
    return res.status(403).json({
      error: "Allow AI processing before sharing in ARI Circle.",
      code: "AI_PROCESSING_CONSENT_REQUIRED"
    });
  }

  const rateLimit = await enforceAiRateLimit({
    userId: user.id,
    endpoint: USAGE_ENDPOINT,
    rules: [
      { windowSeconds: 60, maxRequests: 15 },
      { windowSeconds: 3600, maxRequests: 180 }
    ]
  });

  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds || 60));
    return res.status(429).json({
      error: "Too many Circle safety checks. Try again shortly.",
      code: "ARI_CIRCLE_MODERATION_RATE_LIMIT"
    });
  }

  const apiKey = clean(process.env.OPENAI_API_KEY, 2000);
  if (!apiKey) {
    return res.status(503).json({ error: "ARI Circle safety screening is temporarily unavailable." });
  }

  const scope = clean(req.body?.scope, 80) || "ari_circle";
  const text = clean(req.body?.text, MAX_TEXT);
  const images = normalizeImages(req.body?.image_urls);
  const ageBand = access.ageBand;
  const checks = [];

  const finish = async (body, status = 200) => {
    await recordRequest({
      userId: user.id,
      scope,
      checks,
      decision: body?.decision || (status >= 400 ? "provider_error" : "unknown")
    });
    return res.status(status).json(body);
  };

  try {
    // Check text first. If blocked, do not use rate-limit capacity on media.
    if (text) {
      const result = await moderateOne({ apiKey, input: text });
      checks.push({ kind: "text", index: 0, ...result });
      if (result.flagged) {
        return await finish({
          success: true,
          allowed: false,
          scope,
          age_band: ageBand,
          model: result.model,
          decision: "block_text",
          blocked_categories: blockedCategories(result),
          check_count: checks.length,
          paid_classifier_used: false
        });
      }
    }

    // OpenAI moderation accepts images, but not video. ARI Circle supplies three
    // sampled video frames. Each image/frame is moderated independently so
    // provider image-count limits cannot reject the batch.
    for (let index = 0; index < images.length; index += 1) {
      const result = await moderateOne({
        apiKey,
        input: [{ type: "image_url", image_url: { url: images[index] } }]
      });
      checks.push({ kind: "image", index, ...result });

      if (result.flagged) {
        return await finish({
          success: true,
          allowed: false,
          scope,
          age_band: ageBand,
          model: result.model,
          decision: "block_media",
          blocked_categories: blockedCategories(result),
          blocked_frame_index: index,
          check_count: checks.length,
          paid_classifier_used: false
        });
      }
    }

    return await finish({
      success: true,
      allowed: true,
      scope,
      age_band: ageBand,
      model: checks[0]?.model || OPENAI_MODERATION_MODEL,
      decision: checks.length ? "allow" : "allow_empty",
      blocked_categories: [],
      check_count: checks.length,
      paid_classifier_used: false
    });
  } catch (error) {
    console.error("[ARI Circle Moderation Error]", {
      scope,
      status: error?.status || null,
      error: error?.message || error
    });
    return await finish(
      { error: "ARI Circle safety screening is temporarily unavailable.", decision: "provider_error" },
      503
    );
  }
}
