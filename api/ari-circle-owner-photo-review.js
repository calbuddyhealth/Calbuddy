import {
  sendOwnerAuthorizationError,
  setOwnerSecurityHeaders,
  verifyOwnerRequest
} from "../server/ari-owner-auth.js";

const BUCKET = "ari-circle-post-media";
const MAX_RESULTS = 100;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
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
    throw new Error("Supabase owner moderation configuration is missing.");
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
  if (!base || !encoded) return "";

  const response = await fetch(
    `${base}/storage/v1/object/sign/${BUCKET}/${encoded}`,
    {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify({ expiresIn: 300 })
    }
  );

  const data = await readJson(response);
  if (!response.ok) return "";

  const raw = clean(data?.signedURL || data?.signedUrl || data?.signed_url, 4000);
  if (!raw) return "";
  return raw.startsWith("http")
    ? raw
    : `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

async function listPendingPhotos() {
  const rows = await supabaseRpc("ari_circle_owner_pending_profile_photos", {
    requested_limit: MAX_RESULTS
  });

  const photos = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    photos.push({
      photo_id: row.photo_id,
      user_id: row.user_id,
      position: Number(row.position) || null,
      submitted_at: row.submitted_at || null,
      moderation_retry_count: Number(row.moderation_retry_count) || 0,
      moderation_next_retry_at: row.moderation_next_retry_at || null,
      moderation_last_error: clean(row.moderation_last_error, 500) || null,
      display_name: clean(row.display_name, 120) || "Circle member",
      handle: clean(row.handle, 120) || null,
      image_url: await signedStorageUrl(row.media_path)
    });
  }

  return photos;
}

export default async function handler(req, res) {
  setOwnerSecurityHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const authorization = await verifyOwnerRequest(req);
  if (!authorization.authorized) {
    return sendOwnerAuthorizationError(res, authorization);
  }

  try {
    if (req.method === "GET") {
      const photos = await listPendingPhotos();
      return res.status(200).json({
        success: true,
        pending: photos.length,
        photos
      });
    }

    const photoId = clean(req.body?.photo_id, 80).toLowerCase();
    const decision = clean(req.body?.decision, 20).toLowerCase();

    if (!UUID_PATTERN.test(photoId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PHOTO_ID",
        error: "A valid pending photo is required."
      });
    }

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_DECISION",
        error: "Decision must be approve or reject."
      });
    }

    const result = await supabaseRpc("ari_circle_owner_review_profile_photo", {
      requested_photo_id: photoId,
      requested_owner_user_id: authorization.user.id,
      requested_decision: decision
    });

    if (result?.success !== true) {
      const alreadyResolved = result?.code === "PHOTO_ALREADY_RESOLVED";
      return res.status(alreadyResolved ? 409 : 404).json({
        success: false,
        code: result?.code || "PHOTO_REVIEW_FAILED",
        error: alreadyResolved
          ? "That photo has already been resolved."
          : "That pending photo is no longer available.",
        moderation_status: result?.moderation_status || null,
        moderation_decision: result?.moderation_decision || null
      });
    }

    return res.status(200).json({
      success: true,
      photo_id: photoId,
      moderation_status: result.moderation_status,
      moderation_decision: result.moderation_decision,
      moderation_source: "owner"
    });
  } catch (error) {
    console.error("[ARI Circle Owner Photo Review]", {
      method: req.method,
      error: clean(error?.message || error, 500)
    });

    return res.status(500).json({
      success: false,
      code: "OWNER_PHOTO_REVIEW_FAILED",
      error: "Owner photo review is temporarily unavailable."
    });
  }
}
