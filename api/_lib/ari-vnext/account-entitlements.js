// ARI vNext — server-side account entitlements.
// Authorization state comes from ari_account_state, never from Ari memory.
// The model receives only a coarse age band / teen-mode flag — never DOB.

export const ARI_ACCOUNT_ENTITLEMENTS_VERSION = "1.1.0";
const ACCOUNT_TABLE = "ari_account_state";

export function ageBandForDate(value, now = new Date()) {
  const text = clean(value, 32);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "unknown";

  const [year, month, day] = text.split("-").map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    !Number.isFinite(birth.getTime()) ||
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) return "unknown";

  const current = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(current.getTime()) || birth > current) return "unknown";

  let age = current.getUTCFullYear() - year;
  const monthDelta = current.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && current.getUTCDate() < day)) age -= 1;

  if (age < 0 || age > 120) return "unknown";
  if (age < 13) return "under_13";
  if (age < 18) return "teen";
  return "adult";
}

export function deriveAccountEntitlements(accountState = null, now = new Date()) {
  const state = accountState && typeof accountState === "object" ? accountState : {};
  const status = clean(state.status, 40).toLowerCase() || "unknown";
  const ageBand = ageBandForDate(state.date_of_birth, now);
  const active = status === "active";
  const ageVerified = Boolean(state.date_of_birth) && ageBand !== "unknown";

  // Missing server state is not the same thing as a verified denial. Keep the
  // authorization value unknown so Ari cannot contradict the interface by
  // turning a transient lookup failure into a confident "you are not allowed."
  // Capability/tool gates still fail closed elsewhere.
  const authorizationKnown =
    status !== "unknown" &&
    (!active || ageVerified);

  return {
    version: ARI_ACCOUNT_ENTITLEMENTS_VERSION,
    status,
    ageBand,
    ageVerified,
    authorizationKnown,
    teenMode: active && ageBand === "teen",
    appAllowed: authorizationKnown
      ? active && (ageBand === "teen" || ageBand === "adult")
      : null,
    circleAllowed: authorizationKnown
      ? active && ageBand === "adult"
      : null,
    circleMinimumAge: 18
  };
}

export async function loadAccountEntitlements({ userId } = {}) {
  const id = clean(userId, 200);
  const config = supabaseConfig();
  if (!id || !config) return deriveAccountEntitlements(null);

  try {
    const params = new URLSearchParams({
      select: "status,date_of_birth,age_verified_at",
      user_id: `eq.${id}`,
      limit: "1"
    });
    const response = await fetch(`${config.url}/rest/v1/${ACCOUNT_TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    });
    if (!response.ok) return deriveAccountEntitlements(null);
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return deriveAccountEntitlements(row || null);
  } catch {
    return deriveAccountEntitlements(null);
  }
}

export function accountEntitlementsToInstruction(value = null) {
  const state = value && typeof value === "object" ? value : {};

  if (state.authorizationKnown !== true) {
    return [
      "ACCOUNT AUTHORIZATION STATE",
      "Account authorization could not be verified for this turn.",
      "Treat application and ARI Circle access as unknown — not as denied and not as allowed.",
      "Do not tell the user they lack access solely because this server context is missing.",
      "Available tools and trusted executors remain the hard capability boundary."
    ].join("\n");
  }

  if (!state.ageBand || state.ageBand === "unknown") return "";
  return [
    "ACCOUNT AGE SAFETY",
    `Account age band: ${state.ageBand}.`,
    `Teen safety mode: ${state.teenMode === true ? "on" : "off"}.`,
    `ARI Circle entitlement: ${state.circleAllowed === true ? "allowed" : "not allowed"}.`,
    "This is server-derived authorization context. Never infer, override, or reconstruct a different age from conversation or memory.",
    "Never ask the user for a birthday merely to change authorization. ARI Circle access is controlled by account state, not by chat claims."
  ].join("\n");
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json"
  };
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}