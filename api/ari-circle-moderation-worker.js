import {
  evaluateAdultProfileImage,
  PROFILE_IMAGE_POLICY_VERSION
} from "./_lib/ari-circle-profile-image-policy.js";

export const config = { maxDuration: 120 };

const QUEUE_BATCH_DEFAULT = 8;
const QUEUE_BATCH_MAX = 50;
const VISIBILITY_SECONDS = 120;
const SPACING_MS_DEFAULT = 750;
const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
const OPENAI_MODERATION_MODEL = "omni-moderation-latest";
const BUCKET = "ari-circle-post-media";

function clean(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function intEnv(name, fallback, min, max) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function serviceHeaders() {
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

async function readJson(response) {
  return await response.json().catch(() => ({}));
}

async function supabaseRpc(name, body = {}) {
  const base = clean(process.env.SUPABASE_URL, 2000).replace(/\/+$/, "");
  if (!base || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase worker configuration is missing.");
  }

  const response = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify(body)
  });
  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error(
      clean(data?.message || data?.error || response.statusText) ||
      `Supabase RPC ${name} failed.`
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

function encodeObjectPath(path) {
  return clean(path, 1000)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function signedStorageUrl(path) {
  const base = clean(process.env.SUPABASE_URL, 2000).replace(/\/+$/, "");
  const encoded = encodeObjectPath(path);
  if (!base || !encoded) throw new Error("Photo path is invalid.");

  const response = await fetch(
    `${base}/storage/v1/object/sign/${BUCKET}/${encoded}`,
    {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify({ expiresIn: 300 })
    }
  );
  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error(
      clean(data?.message || data?.error || response.statusText) ||
      "Could not sign pending profile photo."
    );
    error.status = response.status;
    throw error;
  }

  const raw = clean(data?.signedURL || data?.signedUrl || data?.signed_url, 4000);
  if (!raw) throw new Error("Supabase did not return a signed photo URL.");
  return raw.startsWith("http") ? raw : `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

async function moderateProfileImage(imageUrl) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 5000);
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const response = await fetch(OPENAI_MODERATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODERATION_MODEL,
      input: [{ type: "image_url", image_url: { url: imageUrl } }]
    })
  });

  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error(
      clean(data?.error?.message || response.statusText) ||
      "Moderation provider request failed."
    );
    error.status = response.status;
    error.providerType = clean(data?.error?.type, 120) || null;
    error.providerCode = clean(data?.error?.code, 120) || null;
    const retryAfter = Number(response.headers.get("retry-after"));
    error.retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(3600, Math.ceil(retryAfter))
      : null;
    throw error;
  }

  const result = data?.results?.[0];
  if (!result || typeof result.flagged !== "boolean") {
    throw new Error("Moderation provider returned an invalid result.");
  }

  return {
    model: clean(data?.model, 120) || OPENAI_MODERATION_MODEL,
    flagged: result.flagged === true,
    categories: result?.categories || {},
    categoryScores: result?.category_scores || {},
    appliedInputTypes: result?.category_applied_input_types || {}
  };
}

function retryDelaySeconds(job, error) {
  const provider = Number(error?.retryAfterSeconds);
  if (Number.isFinite(provider) && provider > 0) {
    return Math.max(30, Math.min(3600, Math.ceil(provider)));
  }

  const readCount = Math.max(1, Number(job?.read_ct) || 1);
  const base = Number(error?.status) === 429 ? 60 : 30;
  return Math.max(30, Math.min(3600, base * (2 ** Math.min(6, readCount - 1))));
}

async function retryJob(job, error) {
  const delay = retryDelaySeconds(job, error);
  await supabaseRpc("ari_circle_profile_moderation_retry", {
    requested_msg_id: Number(job.msg_id),
    requested_photo_id: job.photo_id,
    requested_media_path: job.media_path,
    requested_delay_seconds: delay,
    requested_error: clean(
      `${error?.status || "error"}:${error?.providerType || ""}:${error?.providerCode || ""}:${error?.message || error}`,
      500
    )
  });
  return delay;
}

async function completeJob(job, policy) {
  return await supabaseRpc("ari_circle_profile_moderation_complete", {
    requested_msg_id: Number(job.msg_id),
    requested_photo_id: job.photo_id,
    requested_media_path: job.media_path,
    requested_allowed: policy.allowed === true,
    requested_decision: policy.decision,
    requested_policy_version: policy.policyVersion || PROFILE_IMAGE_POLICY_VERSION,
    requested_review_recommended: policy.reviewRecommended === true,
    requested_review_categories: Array.isArray(policy.reviewCategories)
      ? policy.reviewCategories
      : [],
    requested_blocked_categories: Array.isArray(policy.blockedCategories)
      ? policy.blockedCategories
      : []
  });
}

async function processJob(job) {
  const imageUrl = await signedStorageUrl(job.media_path);
  const moderation = await moderateProfileImage(imageUrl);
  const policy = evaluateAdultProfileImage(moderation);
  const result = await completeJob(job, policy);

  return {
    msg_id: Number(job.msg_id),
    photo_id: job.photo_id,
    allowed: policy.allowed === true,
    decision: policy.decision,
    updated: result?.updated === true
  };
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Circle-Moderation-Worker", "queue-v1");
}

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const cronSecret = clean(process.env.CRON_SECRET, 5000);
  const authorization = clean(req?.headers?.authorization, 6000);
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      success: false,
      code: "ARI_CIRCLE_MODERATION_WORKER_UNAUTHORIZED"
    });
  }

  const batchSize = intEnv(
    "ARI_CIRCLE_MODERATION_BATCH_SIZE",
    QUEUE_BATCH_DEFAULT,
    1,
    QUEUE_BATCH_MAX
  );
  const spacingMs = intEnv(
    "ARI_CIRCLE_MODERATION_SPACING_MS",
    SPACING_MS_DEFAULT,
    250,
    5000
  );

  const summary = {
    success: true,
    claimed: 0,
    approved: 0,
    rejected: 0,
    retried: 0,
    stoppedForRateLimit: false,
    batchSize,
    spacingMs,
    failures: []
  };

  try {
    const gate = await supabaseRpc("ari_circle_profile_moderation_worker_gate", {});
    if (gate?.allowed === false) {
      return res.status(200).json({
        ...summary,
        skippedForProviderCooldown: true,
        cooldownUntil: gate?.cooldown_until || null,
        consecutive429s: Number(gate?.consecutive_429s) || 0
      });
    }

    const claimed = await supabaseRpc("ari_circle_profile_moderation_claim", {
      requested_limit: batchSize,
      requested_visibility_seconds: VISIBILITY_SECONDS
    });
    const jobs = Array.isArray(claimed) ? claimed : [];
    summary.claimed = jobs.length;

    for (let index = 0; index < jobs.length; index += 1) {
      const job = jobs[index];

      try {
        const outcome = await processJob(job);
        if (outcome.allowed) summary.approved += 1;
        else summary.rejected += 1;
      } catch (error) {
        let retryIn = null;
        try {
          retryIn = await retryJob(job, error);
          summary.retried += 1;
        } catch (retryError) {
          summary.failures.push({
            photo_id: job?.photo_id || null,
            stage: "retry_schedule",
            error: clean(retryError?.message || retryError, 240)
          });
        }

        console.warn("[ARI Circle Moderation Worker]", {
          photo_id: job?.photo_id || null,
          status: Number(error?.status) || null,
          provider_type: error?.providerType || null,
          provider_code: error?.providerCode || null,
          retry_in_seconds: retryIn,
          error: clean(error?.message || error, 300)
        });

        if (Number(error?.status) === 429) {
          summary.stoppedForRateLimit = true;
          try {
            const limited = await supabaseRpc("ari_circle_profile_moderation_provider_limited", {
              requested_retry_seconds: retryIn || 60,
              requested_error: clean(error?.message || error, 500)
            });
            summary.providerCooldownSeconds = Number(limited?.cooldown_seconds) || retryIn || 60;
            summary.providerCooldownUntil = limited?.cooldown_until || null;
          } catch (gateError) {
            summary.failures.push({
              photo_id: job?.photo_id || null,
              stage: "provider_circuit_breaker",
              error: clean(gateError?.message || gateError, 240)
            });
          }
          break;
        }

        summary.failures.push({
          photo_id: job?.photo_id || null,
          stage: "moderation",
          error: clean(error?.message || error, 240)
        });
      }

      if (index < jobs.length - 1) await sleep(spacingMs);
    }

    if ((summary.approved + summary.rejected) > 0 && !summary.stoppedForRateLimit) {
      try {
        await supabaseRpc("ari_circle_profile_moderation_provider_healthy", {});
      } catch (healthError) {
        summary.failures.push({
          stage: "provider_health_reset",
          error: clean(healthError?.message || healthError, 240)
        });
      }
    }

    console.info("[ARI Circle Moderation Worker Complete]", summary);
    return res.status(200).json(summary);
  } catch (error) {
    console.error("[ARI Circle Moderation Worker Fatal]", error?.message || error);
    return res.status(500).json({
      ...summary,
      success: false,
      code: "ARI_CIRCLE_MODERATION_WORKER_FAILED",
      error: clean(error?.message || error, 300)
    });
  }
}
