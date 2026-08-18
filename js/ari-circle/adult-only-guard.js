// ARI Circle — adults-only client gate.
// Presentation guard only. Database/RPC/storage authorization remains authoritative.
(function () {
  "use strict";

  const HOME = "home.html?circle=unavailable";
  const SIGN_IN = "signin.html";

  function clean(value) {
    return String(value ?? "").trim();
  }

  function finishVisible() {
    document.documentElement.style.visibility = "";
    document.documentElement.removeAttribute("data-ari-circle-gate");
  }

  function redirect(target) {
    try {
      window.location.replace(target);
    } catch {
      window.location.href = target;
    }
  }

  function normalizeAgeState(value) {
    const state = value && typeof value === "object" ? value : {};
    const ageBand = clean(state.age_band || state.ageBand).toLowerCase() || "unknown";
    // Compatibility: the shared production DB may not yet expose circle_allowed.
    // Adult age-band is still required; an explicit false always denies access.
    const explicitAllowed = state.circle_allowed ?? state.circleAllowed;
    const allowed = ageBand === "adult" && explicitAllowed !== false;
    return {
      verified: state.verified === true || ageBand === "adult" || ageBand === "teen",
      ageBand,
      circleAllowed: allowed,
      teenMode: ageBand === "teen" || state.teen_mode === true || state.teenMode === true
    };
  }

  async function getSession() {
    const client = window.calbuddySupabase;
    if (!client?.auth?.getSession) return null;
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    return data?.session || null;
  }

  async function loadAgeState() {
    const client = window.calbuddySupabase;
    if (!client?.rpc) throw new Error("Circle authorization is unavailable.");
    const { data, error } = await client.rpc("ari_circle_my_age_state");
    if (error) throw error;
    return normalizeAgeState(data);
  }

  async function requireAdultCircleAccess() {
    document.documentElement.setAttribute("data-ari-circle-gate", "pending");
    document.documentElement.style.visibility = "hidden";

    const session = await getSession();
    if (!session?.user?.id) {
      redirect(SIGN_IN);
      return { allowed: false, reason: "signed_out" };
    }

    try {
      const state = await loadAgeState();
      window.ARI_CIRCLE_AGE_STATE = state;
      if (!state.circleAllowed) {
        redirect(HOME);
        return { allowed: false, reason: state.teenMode ? "teen" : "not_adult", state };
      }
      finishVisible();
      window.dispatchEvent(new CustomEvent("ari-circle-access-ready", { detail: state }));
      return { allowed: true, state };
    } catch (error) {
      console.warn("ARI Circle access check failed:", error?.message || error);
      redirect(HOME);
      return { allowed: false, reason: "authorization_unavailable" };
    }
  }

  window.AriCircleAdultGuard = Object.freeze({
    normalizeAgeState,
    loadAgeState,
    requireAdultCircleAccess
  });

  requireAdultCircleAccess();
})();
