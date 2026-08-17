// ARI XP Profile + Daily Account Maintenance API
// V3.5.0

const CIRCLE_MEDIA_BUCKETS = Object.freeze([
  "ari-circle-media",
  "ari-circle-post-media",
  "ari-circle-challenge-media"
]);

const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODERATION_MODEL = "omni-moderation-latest";
const ADULT_CONTEXT_MODEL = process.env.ARI_ADULT_CONTENT_MODEL || "gpt-5-mini";
const ADULT_SEXUAL_FALLBACK_BLOCK_SCORE = 0.97;
const MAX_MODERATION_TEXT = 8000;
const MAX_MODERATION_IMAGES = 4;
const MAX_MODERATION_IMAGE_URL_LENGTH = 1_500_000;
const AI_CONSENT_KEY = "ari_ai_processing_consent";
const AI_CONSENT_VERSION_KEY = "ari_ai_processing_consent_version";
const REQUIRED_AI_CONSENT_VERSION = "2";
const SUPPORT_RATE_LIMIT_PER_HOUR = 5;

const SUPPORT_TARGET_TYPES = new Set([
  "app",
  "user",
  "content",
  "safety",
  "billing",
  "other"
]);

const SUPPORT_CATEGORIES = new Set([
  "technical_problem",
  "harassment",
  "hate_or_abuse",
  "spam_or_scam",
  "unsafe_content",
  "privacy_concern",
  "account_help",
  "other"
]);

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

function cleanText(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeSupportEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return "";
  return email;
}

function normalizeUuid(value) {
  const candidate = cleanText(value, 64).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(candidate)
    ? candidate
    : null;
}

async function getAuthenticatedUser(req) {
  const authorization = String(req.headers.authorization || "").trim();
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;

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

function userHasCurrentAiConsent(user) {
  const metadata = user?.user_metadata || {};
  return (
    metadata[AI_CONSENT_KEY] === true &&
    String(metadata[AI_CONSENT_VERSION_KEY] || "") === REQUIRED_AI_CONSENT_VERSION
  );
}

function ageBandForDate(value) {
  const dateText = cleanText(value, 32);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;

  const [year, month, day] = dateText.split("-").map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  const monthDelta = (today.getUTCMonth() + 1) - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < day)) age -= 1;

  if (!Number.isFinite(age) || age < 0) return null;
  if (age < 13) return "under_13";
  if (age < 18) return "teen";
  return "adult";
}

async function getCircleAgeBand(userId) {
  const id = normalizeUuid(userId);
  if (!id) return null;

  try {
    const params = new URLSearchParams({
      select: "date_of_birth",
      user_id: `eq.${id}`,
      limit: "1"
    });
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/ari_account_state?${params.toString()}`,
      { headers: serverHeaders() }
    );
    const data = await readJson(response);
    if (!response.ok) {
      console.warn("[ARI Circle Age Band Lookup Failed]", response.status);
      return null;
    }
    return ageBandForDate(Array.isArray(data) ? data[0]?.date_of_birth : null);
  } catch (error) {
    console.warn("[ARI Circle Age Band Lookup Error]", error?.message || error);
    return null;
  }
}

function isAllowedModerationImageUrl(value) {
  const url = cleanText(value, MAX_MODERATION_IMAGE_URL_LENGTH);
  if (!url) return false;

  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(url)) {
    return true;
  }

  const supabaseOrigin = cleanText(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  return Boolean(
    supabaseOrigin &&
    url.startsWith(`${supabaseOrigin}/storage/v1/object/sign/`)
  );
}

function normalizeModerationImages(values) {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => cleanText(value, MAX_MODERATION_IMAGE_URL_LENGTH))
    .filter(isAllowedModerationImageUrl)
    .slice(0, MAX_MODERATION_IMAGES);
}

function extractResponseText(data) {
  const parts = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

async function classifyAdultSexualContext({ text, imageUrls, apiKey } = {}) {
  const safeText = cleanText(text, MAX_MODERATION_TEXT);
  const safeImages = normalizeModerationImages(imageUrls).slice(0, 1);
  const content = [
    {
      type: "input_text",
      text: [
        "Classify this 18+ social-network post under ARI Circle's adult content policy.",
        "ALLOW ordinary adult expression even when it is sexy, revealing, or contains non-explicit nudity.",
        "ALLOW bikinis, swimwear, shirtless adults, lingerie/editorial fashion, sports bras, sheer/see-through fashion, revealing outfits, cleavage, provocative modeling poses, body-positive content, and non-explicit adult nudity.",
        "BLOCK only explicit sexual activity or sex acts, masturbation, sexual services/solicitation, non-consensual or exploitative sexual material, or sexualized/nude content where a depicted subject is a minor or reasonably appears under 18.",
        "Do not treat visible skin, attractiveness, posing, swimwear, or fashion by itself as harmful.",
        safeText ? `Post text: ${safeText}` : "Post text: (none)"
      ].join("\n")
    }
  ];

  for (const url of safeImages) {
    content.push({ type: "input_image", image_url: url, detail: "low" });
  }

  let response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ADULT_CONTEXT_MODEL,
        store: false,
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "ari_adult_content_decision",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                decision: { type: "string", enum: ["allow", "block"] },
                reason: {
                  type: "string",
                  enum: [
                    "non_explicit_adult_expression",
                    "adult_nudity_or_suggestive",
                    "explicit_sexual_activity",
                    "sexual_solicitation",
                    "nonconsensual_or_exploitative",
                    "sexualized_minor_or_uncertain_age",
                    "unclear"
                  ]
                },
                sensitive: { type: "boolean" },
                confidence: { type: "number", minimum: 0, maximum: 1 }
              },
              required: ["decision", "reason", "sensitive", "confidence"]
            }
          }
        }
      })
    });
  } catch (error) {
    console.warn("[ARI Adult Context Network Error]", error?.message || error);
    return null;
  }

  const data = await readJson(response);
  if (!response.ok) {
    console.warn("[ARI Adult Context Provider Error]", {
      status: response.status,
      error: data?.error?.message || data?.error || "Adult context request failed"
    });
    return null;
  }

  try {
    const parsed = JSON.parse(extractResponseText(data));
    if (!["allow", "block"].includes(parsed?.decision)) return null;
    return {
      decision: parsed.decision,
      reason: cleanText(parsed.reason, 80) || "unclear",
      sensitive: parsed.sensitive === true,
      confidence: Number.isFinite(Number(parsed.confidence)) ? Number(parsed.confidence) : 0
    };
  } catch (error) {
    console.warn("[ARI Adult Context Parse Error]", error?.message || error);
    return null;
  }
}

async function resolveModerationDecision({ result, ageBand, text, imageUrls, apiKey } = {}) {
  const blockedCategories = Object.entries(result?.categories || {})
    .filter(([, flagged]) => flagged === true)
    .map(([category]) => category)
    .slice(0, 20);
  const categoryScores = result?.category_scores && typeof result.category_scores === "object"
    ? result.category_scores
    : {};

  if (result?.flagged !== true) {
    return {
      allowed: true,
      blockedCategories,
      categoryScores,
      decision: "allow",
      sensitive: false,
      adultContextReason: null
    };
  }

  // Teen and unverified accounts stay strict. Any provider flag blocks.
  if (ageBand !== "adult") {
    return {
      allowed: false,
      blockedCategories,
      categoryScores,
      decision: "block_strict",
      sensitive: false,
      adultContextReason: null
    };
  }

  // Adults only receive a contextual exception when "sexual" is the sole
  // provider category. Hate, threats, violence, self-harm, illicit content,
  // sexual/minors and every other flagged category remain blocked.
  const nonSexualBlocks = blockedCategories.filter((category) => category !== "sexual");
  if (nonSexualBlocks.length || !blockedCategories.includes("sexual")) {
    return {
      allowed: false,
      blockedCategories,
      categoryScores,
      decision: "block_nonsexual_safety_category",
      sensitive: false,
      adultContextReason: null
    };
  }

  const sexualScore = Number(categoryScores?.sexual || 0);
  const contextual = await classifyAdultSexualContext({ text, imageUrls, apiKey });
  if (contextual?.decision === "allow") {
    return {
      allowed: true,
      blockedCategories: [],
      providerFlaggedCategories: blockedCategories,
      categoryScores,
      decision: "allow_adult_context",
      sensitive: contextual.sensitive === true,
      adultContextReason: contextual.reason
    };
  }

  if (contextual?.decision === "block" && contextual.reason !== "unclear") {
    return {
      allowed: false,
      blockedCategories,
      categoryScores,
      decision: "block_adult_explicit",
      sensitive: contextual.sensitive === true,
      adultContextReason: contextual.reason
    };
  }

  // If the contextual classifier is unavailable, do not make normal adult
  // swimwear/fashion users pay for a provider outage. A very high sexual score
  // still fails closed as a likely explicit-content case.
  const fallbackBlocked = sexualScore >= ADULT_SEXUAL_FALLBACK_BLOCK_SCORE;
  return {
    allowed: !fallbackBlocked,
    blockedCategories: fallbackBlocked ? blockedCategories : [],
    providerFlaggedCategories: blockedCategories,
    categoryScores,
    decision: fallbackBlocked ? "block_adult_fallback_high_score" : "allow_adult_fallback",
    sensitive: true,
    adultContextReason: "context_classifier_unavailable"
  };
}

async function moderateCircleContent({ scope, text, imageUrls, ageBand } = {}) {
  const apiKey = cleanText(process.env.OPENAI_API_KEY, 2000);
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: "ARI Circle safety screening is temporarily unavailable."
      }
    };
  }

  const safeScope = cleanText(scope, 80) || "ari_circle";
  const safeText = cleanText(text, MAX_MODERATION_TEXT);
  const safeImages = normalizeModerationImages(imageUrls);
  const input = [];

  if (safeText) {
    input.push({
      type: "text",
      text: safeText
    });
  }

  for (const url of safeImages) {
    input.push({
      type: "image_url",
      image_url: { url }
    });
  }

  if (!input.length) {
    return {
      status: 200,
      body: {
        success: true,
        allowed: true,
        scope: safeScope,
        model: OPENAI_MODERATION_MODEL,
        age_band: ageBand || "unverified",
        decision: "allow_empty",
        sensitive: false,
        blocked_categories: []
      }
    };
  }

  let response;
  try {
    response = await fetch(OPENAI_MODERATION_URL, {
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
  } catch (error) {
    console.error("[ARI Circle Moderation Network Error]", error?.message || error);
    return {
      status: 503,
      body: {
        error: "ARI Circle safety screening is temporarily unavailable."
      }
    };
  }

  const data = await readJson(response);
  if (!response.ok) {
    console.error("[ARI Circle Moderation Provider Error]", {
      status: response.status,
      error: data?.error?.message || data?.error || "Moderation request failed"
    });

    return {
      status: 503,
      body: {
        error: "ARI Circle safety screening is temporarily unavailable."
      }
    };
  }

  const result = data?.results?.[0];
  if (!result || typeof result.flagged !== "boolean") {
    return {
      status: 503,
      body: {
        error: "ARI Circle safety screening returned an invalid result."
      }
    };
  }

  const decision = await resolveModerationDecision({
    result,
    ageBand,
    text: safeText,
    imageUrls: safeImages,
    apiKey
  });

  return {
    status: 200,
    body: {
      success: true,
      allowed: decision.allowed === true,
      scope: safeScope,
      model: data?.model || OPENAI_MODERATION_MODEL,
      age_band: ageBand || "unverified",
      decision: decision.decision,
      sensitive: decision.sensitive === true,
      adult_context_reason: decision.adultContextReason || undefined,
      blocked_categories: decision.blockedCategories || [],
      provider_flagged_categories: decision.providerFlaggedCategories || undefined,
      category_scores: decision.categoryScores || {}
    }
  };
}

async function listStoragePaths(bucket, prefix, visited = new Set()) {
  const visitKey = `${bucket}:${prefix}`;
  if (visited.has(visitKey)) return [];
  visited.add(visitKey);

  const paths = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(bucket)}`,
      {
        method: "POST",
        headers: serverHeaders(),
        body: JSON.stringify({
          prefix,
          limit: pageSize,
          offset,
          sortBy: { column: "name", order: "asc" }
        })
      }
    );

    const entries = await readJson(response);
    if (!response.ok) {
      if (
        [400, 404].includes(response.status) &&
        /bucket.*not found|not found.*bucket/i.test(JSON.stringify(entries))
      ) {
        return [];
      }
      throw new Error(`Storage listing failed for ${bucket}: ${JSON.stringify(entries)}`);
    }

    const list = Array.isArray(entries) ? entries : [];

    for (const entry of list) {
      const name = String(entry?.name || "").trim();
      if (!name) continue;
      const path = prefix ? `${prefix}/${name}` : name;

      if (entry.id || entry.metadata) {
        paths.push(path);
      } else {
        paths.push(...await listStoragePaths(bucket, path, visited));
      }
    }

    if (list.length < pageSize) break;
    offset += pageSize;
  }

  return paths;
}

async function removeUserStorageFromBucket(bucket, userId) {
  const paths = await listStoragePaths(bucket, userId);

  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    const response = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}`,
      {
        method: "DELETE",
        headers: serverHeaders(),
        body: JSON.stringify({ prefixes: batch })
      }
    );

    if (!response.ok) {
      const data = await readJson(response);
      throw new Error(`Storage deletion failed for ${bucket}: ${JSON.stringify(data)}`);
    }
  }

  return paths.length;
}

async function removeUserStorage(userId) {
  const byBucket = {};
  let total = 0;

  for (const bucket of CIRCLE_MEDIA_BUCKETS) {
    const removed = await removeUserStorageFromBucket(bucket, userId);
    byBucket[bucket] = removed;
    total += removed;
  }

  return {
    total,
    by_bucket: byBucket
  };
}

async function recordDeletionError(userId, attempts, error) {
  await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/ari_account_state?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: serverHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        deletion_attempts: Number(attempts || 0) + 1,
        last_deletion_error: String(error?.message || error || "Unknown deletion error").slice(0, 2000),
        updated_at: new Date().toISOString()
      })
    }
  );
}

async function deleteDueAccount(row) {
  try {
    const removedObjects = await removeUserStorage(row.user_id);
    const response = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(row.user_id)}`,
      { method: "DELETE", headers: serverHeaders() }
    );

    if (!response.ok) {
      const data = await readJson(response);
      throw new Error(`Auth deletion failed: ${JSON.stringify(data)}`);
    }

    return {
      user_id: row.user_id,
      success: true,
      removed_objects: removedObjects.total,
      removed_objects_by_bucket: removedObjects.by_bucket
    };
  } catch (error) {
    await recordDeletionError(row.user_id, row.deletion_attempts, error);
    return { user_id: row.user_id, success: false, error: error.message };
  }
}

async function verifySupabaseMaintenanceToken(token) {
  const candidate = cleanText(token, 512);
  if (!candidate) return false;

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/verify_ari_maintenance_secret`,
      {
        method: "POST",
        headers: serverHeaders(),
        body: JSON.stringify({ candidate })
      }
    );

    const data = await readJson(response);
    return response.ok && data === true;
  } catch (error) {
    console.error("[ARI Maintenance Token Verification Error]", error?.message || error);
    return false;
  }
}

async function isAuthorizedMaintenanceRequest(req) {
  const configuredCronSecret = cleanText(process.env.CRON_SECRET, 2000);
  const authorization = cleanText(req?.headers?.authorization, 3000);

  if (
    configuredCronSecret &&
    authorization === `Bearer ${configuredCronSecret}`
  ) {
    return true;
  }

  const supabaseToken = cleanText(
    req?.headers?.["x-ari-maintenance-secret"],
    512
  );

  return await verifySupabaseMaintenanceToken(supabaseToken);
}

async function runDailyMaintenance(req, res) {
  if (!(await isAuthorizedMaintenanceRequest(req))) {
    return res.status(401).json({ error: "Unauthorized maintenance request." });
  }

  const purgeResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/purge_expired_ari_data`,
    { method: "POST", headers: serverHeaders(), body: "{}" }
  );
  const purge = await readJson(purgeResponse);

  if (!purgeResponse.ok) {
    return res.status(purgeResponse.status).json({ error: purge });
  }

  const params = new URLSearchParams({
    select: "user_id,deletion_attempts,deletion_scheduled_for",
    status: "eq.pending_deletion",
    deletion_scheduled_for: `lte.${new Date().toISOString()}`,
    order: "deletion_scheduled_for.asc",
    limit: "25"
  });

  const dueResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/ari_account_state?${params.toString()}`,
    { headers: serverHeaders() }
  );
  const dueAccounts = await readJson(dueResponse);

  if (!dueResponse.ok) {
    return res.status(dueResponse.status).json({ error: dueAccounts });
  }

  const deletions = await Promise.all(
    (Array.isArray(dueAccounts) ? dueAccounts : []).map(deleteDueAccount)
  );

  return res.status(200).json({
    success: true,
    purge,
    deletion_count: deletions.filter((item) => item.success).length,
    deletion_failures: deletions.filter((item) => !item.success),
    completed_at: new Date().toISOString()
  });
}

async function isSupportRateLimited(email) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: "id",
    reporter_contact_email: `eq.${email}`,
    created_at: `gte.${oneHourAgo}`,
    limit: String(SUPPORT_RATE_LIMIT_PER_HOUR)
  });

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/ari_reports?${params.toString()}`,
    { headers: serverHeaders() }
  );
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error("ARI XP support rate-limit check failed.");
  }

  return Array.isArray(data) && data.length >= SUPPORT_RATE_LIMIT_PER_HOUR;
}

async function submitSupportRequest(req, res, body = {}) {
  const email = normalizeSupportEmail(body.email);
  const details = cleanText(body.details, 5000);
  const honeypot = cleanText(body.website, 300);

  if (honeypot) {
    return res.status(200).json({ success: true });
  }

  if (!email) {
    return res.status(400).json({ error: "Enter a valid contact email." });
  }

  if (details.length < 10) {
    return res.status(400).json({ error: "Please add at least 10 characters of detail." });
  }

  const requestedTargetType = cleanText(body.target_type, 40);
  const requestedCategory = cleanText(body.category, 60);
  const targetType = SUPPORT_TARGET_TYPES.has(requestedTargetType)
    ? requestedTargetType
    : "app";
  const category = SUPPORT_CATEGORIES.has(requestedCategory)
    ? requestedCategory
    : "other";

  if (await isSupportRateLimited(email)) {
    return res.status(429).json({
      error: "Too many support requests were sent from this contact email recently. Please try again later."
    });
  }

  const user = await getAuthenticatedUser(req);
  const reportedUserId = normalizeUuid(body.reported_user_id);
  const targetId = cleanText(body.target_id, 200) || null;
  const sourcePage = cleanText(body.source_page, 500) || null;
  const submittedFrom = cleanText(body.submitted_from, 300) || null;
  const priority = ["unsafe_content", "privacy_concern"].includes(category)
    ? "urgent"
    : "normal";

  const insertResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/ari_reports`,
    {
      method: "POST",
      headers: serverHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({
        reporter_user_id: user?.id || null,
        reporter_contact_email: email,
        target_type: targetType,
        reported_user_id: reportedUserId,
        target_id: targetId,
        category,
        details,
        evidence: {
          source_page: sourcePage,
          submitted_from: submittedFrom,
          guest_submission: !user?.id
        },
        status: "pending",
        priority
      })
    }
  );

  const inserted = await readJson(insertResponse);
  if (!insertResponse.ok) {
    console.error("[ARI XP Support Insert Error]", inserted);
    return res.status(500).json({
      error: "ARI XP could not send your request. Please try again."
    });
  }

  const row = Array.isArray(inserted) ? inserted[0] : inserted;
  const reference = cleanText(row?.id, 64).slice(0, 8).toUpperCase();

  return res.status(200).json({
    success: true,
    reference: reference || undefined
  });
}

async function handleProfileRequest(req, res) {
  const body = req.body || {};
  const action = body.action;

  if (action === "submit_support_request") {
    return await submitSupportRequest(req, res, body);
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "A valid signed-in session is required." });
  }

  const updates = body.updates || {};

  if (action === "moderate_circle_content") {
    if (!userHasCurrentAiConsent(user)) {
      return res.status(403).json({
        error: "AI processing permission is required for ARI Circle safety screening.",
        code: "AI_PROCESSING_CONSENT_REQUIRED"
      });
    }

    const ageBand = await getCircleAgeBand(user.id);
    const moderation = await moderateCircleContent({
      scope: body.scope,
      text: body.text,
      imageUrls: body.image_urls,
      ageBand
    });

    return res.status(moderation.status).json(moderation.body);
  }

  if (action === "get_profile") {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers: serverHeaders() }
    );
    const data = await readJson(response);
    if (!response.ok) return res.status(response.status).json({ error: data });
    return res.status(200).json({ success: true, profile: data?.[0] || null });
  }

  if (action === "update_profile") {
    const allowedKeys = new Set([
      "display_name",
      "daily_calorie_goal",
      "reset_hour",
      "current_weight",
      "goal_weight",
      "goal_type",
      "activity_level"
    ]);
    const safeUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(([key]) => allowedKeys.has(key))
    );

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`,
      {
        method: "PATCH",
        headers: serverHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify({ ...safeUpdates, updated_at: new Date().toISOString() })
      }
    );
    const data = await readJson(response);
    if (!response.ok) return res.status(response.status).json({ error: data });
    return res.status(200).json({ success: true, profile: data?.[0] || null });
  }

  return res.status(400).json({ error: "Unknown profile action." });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Missing Supabase environment variables." });
    }

    if (req.method === "GET") return await runDailyMaintenance(req, res);
    if (req.method === "POST") return await handleProfileRequest(req, res);

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Profile API failed."
    });
  }
}