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

async function pendingPhotoPath(photoId) {
  const base = clean(process.env.SUPABASE_URL, 2000).replace(/\/+$/, "");
  const id = clean(photoId, 80).toLowerCase();
  if (!base || !UUID_PATTERN.test(id)) return "";

  const response = await fetch(
    `${base}/rest/v1/ari_circle_profile_photos?id=eq.${encodeURIComponent(id)}&moderation_status=eq.pending&select=media_path&limit=1`,
    {
      method: "GET",
      headers: {
        ...serviceHeaders(),
        Accept: "application/json"
      }
    }
  );
  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error("Could not load the pending photo.");
    error.status = response.status;
    throw error;
  }
  return clean(Array.isArray(data) ? data[0]?.media_path : "", 1000);
}

async function downloadPendingPhoto(photoId) {
  const base = clean(process.env.SUPABASE_URL, 2000).replace(/\/+$/, "");
  const path = await pendingPhotoPath(photoId);
  const encoded = encodeObjectPath(path);
  if (!base || !encoded) {
    const error = new Error("Pending photo not found.");
    error.status = 404;
    throw error;
  }

  const response = await fetch(
    `${base}/storage/v1/object/authenticated/${BUCKET}/${encoded}`,
    {
      method: "GET",
      headers: {
        apikey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000),
        Authorization: `Bearer ${clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000)}`
      }
    }
  );

  if (!response.ok) {
    const error = new Error("Pending photo preview could not be loaded.");
    error.status = response.status;
    throw error;
  }

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: clean(response.headers.get("content-type"), 120) || "image/jpeg",
    contentLength: Number(response.headers.get("content-length")) || null
  };
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
      handle: clean(row.handle, 120) || null
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
      const previewId = clean(req.query?.preview, 80).toLowerCase();

      if (previewId) {
        if (!UUID_PATTERN.test(previewId)) {
          return res.status(400).json({
            success: false,
            code: "INVALID_PHOTO_ID",
            error: "A valid pending photo is required."
          });
        }

        const preview = await downloadPendingPhoto(previewId);
        res.setHeader("Content-Type", preview.contentType);
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        if (preview.contentLength) {
          res.setHeader("Content-Length", String(preview.contentLength));
        }
        return res.status(200).send(preview.bytes);
      }

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
