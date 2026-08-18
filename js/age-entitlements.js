// ARI XP — coarse client age entitlements.
// Reads only the server RPC's age band; it never exposes DOB to Ari/model code.
(function () {
  "use strict";

  function clean(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function normalizeAgeState(value) {
    const state = value && typeof value === "object" ? value : {};
    const ageBand = clean(state.age_band || state.ageBand) || "unknown";
    const explicitCircleAllowed = state.circle_allowed ?? state.circleAllowed;
    return Object.freeze({
      ageBand,
      teenMode: ageBand === "teen" || state.teen_mode === true || state.teenMode === true,
      circleAllowed: ageBand === "adult" && explicitCircleAllowed !== false,
      circleMinimumAge: 18
    });
  }

  async function load() {
    const client = window.calbuddySupabase;
    if (!client?.auth?.getSession || !client?.rpc) {
      return normalizeAgeState(null);
    }

    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData?.session?.user?.id) return normalizeAgeState(null);

    const { data, error } = await client.rpc("ari_circle_my_age_state");
    if (error) {
      console.warn("ARI age entitlement check unavailable:", error.message);
      return normalizeAgeState(null);
    }
    return normalizeAgeState(data);
  }

  function applyCircleNavigation(state) {
    const allowed = state?.circleAllowed === true;
    document.querySelectorAll("[data-ari-circle-link]").forEach((node) => {
      node.hidden = !allowed;
      node.setAttribute("aria-hidden", allowed ? "false" : "true");
      if (!allowed) node.setAttribute("tabindex", "-1");
      else node.removeAttribute("tabindex");
    });
  }

  async function bootstrap() {
    // Circle entry points are hidden in markup by default so minors never see a
    // flash of the option while authorization is loading.
    const state = await load();
    window.ARI_ACCOUNT_ENTITLEMENTS = state;
    applyCircleNavigation(state);
    window.dispatchEvent(new CustomEvent("ari-age-entitlements-ready", { detail: state }));
    return state;
  }

  window.AriAgeEntitlements = Object.freeze({ normalizeAgeState, load, applyCircleNavigation, bootstrap });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
