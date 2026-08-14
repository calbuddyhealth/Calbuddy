// ARI XP Profile + Daily Account Maintenance API
// V3.2.0

const CIRCLE_MEDIA_BUCKETS = Object.freeze([
  "ari-circle-media",
  "ari-circle-post-media",
  "ari-circle-challenge-media"
]);

const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
const OPENAI_MODERATION_MODEL = "omni-moderation-latest";
const MAX_MODERATION_TEXT = 8000;
const MAX_MODERATION_IMAGES = 4;
const MAX_MODERATION_IMAGE_URL_LENGTH = 1_500_000;

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

async function moderateCircleContent({ scope, text, imageUrls } = {}) {
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

  const blockedCategories = Object.entries(result.categories || {})
    .filter(([, flagged]) => flagged === true)
    .map(([category]) => category)
    .slice(0, 20);

  return {
    status: 200,
    body: {
      success: true,
      allowed: result.flagged !== true,
      scope: safeScope,
      model: data?.model || OPENAI_MODERATION_MODEL,
      blocked_categories: blockedCategories
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

async function runDailyMaintenance(req, res) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  const authorization = String(req.headers.authorization || "").trim();

  if (!secret) {
    return res.status(500).json({ error: "CRON_SECRET is not configured." });
  }

  if (authorization !== `Bearer ${secret}`) {
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

async function handleProfileRequest(req, res) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "A valid signed-in session is required." });
  }

  const body = req.body || {};
  const action = body.action;
  const updates = body.updates || {};

  if (action === "moderate_circle_content") {
    const moderation = await moderateCircleContent({
      scope: body.scope,
      text: body.text,
      imageUrls: body.image_urls
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
