// =====================================================
// ARI REBIRTH
// File: server/ari-owner-auth.js
// Purpose: Server-only Supabase owner verification.
// =====================================================

const OWNER_AUTH_TIMEOUT_MS = 8_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function setOwnerSecurityHeaders(res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

export function extractBearerToken(req) {
  const header = String(req?.headers?.authorization || "").trim();

  if (!/^Bearer\s+/i.test(header)) return "";

  return header.replace(/^Bearer\s+/i, "").trim();
}

export function getOwnerConfiguration() {
  const supabaseUrl = String(process.env.SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const supabaseApiKey = String(
    process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ""
  ).trim();

  const ownerUserId = String(process.env.ARI_OWNER_USER_ID || "")
    .trim()
    .toLowerCase();

  const ownerEmail = String(process.env.ARI_OWNER_EMAIL || "")
    .trim()
    .toLowerCase();

  return {
    supabaseUrl,
    supabaseApiKey,
    ownerUserId,
    ownerEmail,
    configured:
      Boolean(supabaseUrl) &&
      Boolean(supabaseApiKey) &&
      UUID_PATTERN.test(ownerUserId)
  };
}

export async function verifyOwnerRequest(
  req,
  { fetchImpl = globalThis.fetch } = {}
) {
  const accessToken = extractBearerToken(req);

  // A body flag is never authorization. Only a signed Supabase token counts.
  if (!accessToken) {
    return deny(401, "OWNER_AUTH_REQUIRED", "Sign in is required.");
  }

  const configuration = getOwnerConfiguration();

  if (!configuration.configured) {
    return deny(
      500,
      "OWNER_AUTH_NOT_CONFIGURED",
      "Owner authorization is not configured."
    );
  }

  if (typeof fetchImpl !== "function") {
    return deny(
      503,
      "OWNER_AUTH_UNAVAILABLE",
      "Owner authorization is temporarily unavailable."
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OWNER_AUTH_TIMEOUT_MS);

  let response;

  try {
    response = await fetchImpl(
      `${configuration.supabaseUrl}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: configuration.supabaseApiKey,
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        },
        signal: controller.signal
      }
    );
  } catch {
    return deny(
      503,
      "OWNER_AUTH_UNAVAILABLE",
      "Owner authorization is temporarily unavailable."
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return deny(
        401,
        "OWNER_AUTH_INVALID",
        "The authenticated session could not be verified."
      );
    }

    return deny(
      503,
      "OWNER_AUTH_UNAVAILABLE",
      "Owner authorization is temporarily unavailable."
    );
  }

  const user = data?.user || data;
  const userId = String(user?.id || "").trim().toLowerCase();
  const userEmail = String(user?.email || "").trim().toLowerCase();

  const idMatches = userId === configuration.ownerUserId;
  const emailMatches =
    !configuration.ownerEmail || userEmail === configuration.ownerEmail;

  if (!idMatches || !emailMatches) {
    return deny(
      403,
      "OWNER_ACCESS_DENIED",
      "Owner authorization required."
    );
  }

  return {
    authorized: true,
    status: 200,
    code: null,
    error: null,
    mode: "supabase_verified_owner",
    user: {
      id: userId,
      email: userEmail
    }
  };
}

export function sendOwnerAuthorizationError(res, authorization) {
  return res.status(authorization?.status || 403).json({
    success: false,
    error: authorization?.error || "Owner authorization required.",
    code: authorization?.code || "OWNER_ACCESS_DENIED"
  });
}

function deny(status, code, error) {
  return {
    authorized: false,
    status,
    code,
    error,
    mode: null,
    user: null
  };
}
