/* =============================================================
   ARI CIRCLE — SHARED SEARCH LOCATION V1
   User-controlled, privacy-safe search origin shared by For You, Explore,
   and Meet Up. Geolocation is requested only from an explicit button tap.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const ALLOWED_RADII = new Set([5, 10, 25, 50, 100]);
  const state = {
    client: null,
    user: null,
    preference: null,
    loadPromise: null,
    busy: false
  };

  const clean = (value, max = 100) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const numberOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  function client() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  async function waitForClient(timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const found = client();
      if (found?.auth && found?.rpc) return found;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error("ARI Circle could not connect right now.");
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.user = data?.user || null;
    return state.user;
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function normalize(row) {
    if (!row || typeof row !== "object") return null;
    const latitude = numberOrNull(row.approximate_latitude);
    const longitude = numberOrNull(row.approximate_longitude);
    const radius = Number(row.radius_miles);
    return {
      areaLabel: clean(row.area_label),
      approximateLatitude: latitude,
      approximateLongitude: longitude,
      radiusMiles: ALLOWED_RADII.has(radius) ? radius : 25,
      source: clean(row.source, 40) || "manual_area",
      updatedAt: clean(row.updated_at, 80),
      hasCoordinates: latitude !== null && longitude !== null
    };
  }

  async function loadPreference(force = false) {
    if (!force && state.preference) return state.preference;
    if (!force && state.loadPromise) return state.loadPromise;

    state.loadPromise = (async () => {
      if (!state.client) state.client = await waitForClient();
      if (!state.user) await requireUser();
      if (!state.user) return null;
      const rows = await rpc("ari_circle_get_my_search_location");
      const row = Array.isArray(rows) ? rows[0] : rows;
      state.preference = normalize(row);
      return state.preference;
    })().finally(() => {
      state.loadPromise = null;
    });

    return state.loadPromise;
  }

  function activeRadius(host = document) {
    const own = host.querySelector?.("[data-circle-location-radius]");
    const value = Number(own?.value || state.preference?.radiusMiles || 25);
    return ALLOWED_RADII.has(value) ? value : 25;
  }

  function contextualAreaLabel(host = document) {
    const editor = host.querySelector?.("[data-circle-location-area]");
    const candidates = [
      editor?.value,
      document.getElementById("v6IntentArea")?.value,
      document.getElementById("exploreAreaInput")?.value,
      document.getElementById("meetupFormArea")?.value,
      state.preference?.areaLabel
    ];
    for (const value of candidates) {
      const label = clean(value);
      if (label) return label;
    }
    return null;
  }

  async function savePreference({ areaLabel = null, latitude = null, longitude = null, radiusMiles = 25, source = "manual_area" }) {
    const rows = await rpc("ari_circle_set_my_search_location", {
      requested_area_label: clean(areaLabel) || null,
      requested_latitude: latitude,
      requested_longitude: longitude,
      requested_radius_miles: radiusMiles,
      requested_source: source
    });
    const row = Array.isArray(rows) ? rows[0] : rows;
    state.preference = normalize(row);
    syncPageDefaults();
    renderAll();
    announceChange();
    return state.preference;
  }

  async function clearPreference() {
    await rpc("ari_circle_clear_my_search_location");
    state.preference = null;
    renderAll();
    announceChange();
  }

  function geolocationOnce() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation?.getCurrentPosition) {
        reject(new Error("Location is not available on this device."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => {
          if (error?.code === 1) reject(new Error("Location permission was not granted."));
          else reject(new Error("Circle could not get your location right now."));
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
      );
    });
  }

  async function useCurrentLocation(host) {
    if (state.busy) return;
    state.busy = true;
    renderAll();
    setHostStatus(host, "Getting your location…");
    try {
      const coords = await geolocationOnce();
      await savePreference({
        areaLabel: contextualAreaLabel(host),
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusMiles: activeRadius(host),
        source: "current_location"
      });
      setHostStatus(host, "Current-area search is on. Circle stores only a coarse rounded location.");
    } catch (error) {
      setHostStatus(host, error?.message || "Circle could not update your search location.");
    } finally {
      state.busy = false;
      renderAll();
    }
  }

  async function saveManualArea(host, event) {
    event?.preventDefault?.();
    if (state.busy) return;
    const input = host.querySelector("[data-circle-location-area]");
    const areaLabel = clean(input?.value);
    if (areaLabel.length < 2) {
      setHostStatus(host, "Enter a city, ZIP code, or general neighborhood.");
      input?.focus?.();
      return;
    }

    state.busy = true;
    renderAll();
    try {
      await savePreference({
        areaLabel,
        latitude: null,
        longitude: null,
        radiusMiles: activeRadius(host),
        source: "manual_area"
      });
      setHostStatus(host, "Search area saved. Use current location any time you want true mileage ranking.");
    } catch (error) {
      setHostStatus(host, error?.message || "Circle could not save that search area.");
    } finally {
      state.busy = false;
      renderAll();
    }
  }

  async function changeRadius(host, event) {
    const radius = Number(event?.target?.value);
    if (!ALLOWED_RADII.has(radius) || !state.preference || state.busy) return;
    state.busy = true;
    try {
      await savePreference({
        areaLabel: state.preference.areaLabel || null,
        latitude: state.preference.approximateLatitude,
        longitude: state.preference.approximateLongitude,
        radiusMiles: radius,
        source: state.preference.source
      });
      setHostStatus(host, `Search distance updated to ${radius} miles.`);
    } catch (error) {
      setHostStatus(host, error?.message || "Circle could not update search distance.");
    } finally {
      state.busy = false;
      renderAll();
    }
  }

  function setHostStatus(host, message) {
    const node = host?.querySelector?.("[data-circle-location-status]");
    if (node) node.textContent = clean(message, 240);
  }

  function displayLabel(pref) {
    if (!pref) return "Not set";
    if (pref.areaLabel) return pref.areaLabel;
    return pref.hasCoordinates ? "Current area" : "Not set";
  }

  function renderHost(host) {
    if (!host) return;
    const pref = state.preference;
    const radius = pref?.radiusMiles || 25;
    const locationMode = pref?.hasCoordinates
      ? "Mileage-ready"
      : pref?.areaLabel
        ? "Area matching"
        : "Choose a search area";

    host.innerHTML = `
      <section class="ari-circle-location-card" aria-label="Circle search location">
        <div class="ari-circle-location-card__copy">
          <span class="ari-circle-location-card__eyebrow">SEARCH AROUND</span>
          <strong>${escapeHtml(displayLabel(pref))}</strong>
          <small>${escapeHtml(locationMode)}${pref ? ` · ${radius} mi` : ""}</small>
        </div>
        <label class="ari-circle-location-card__radius">
          <span>Distance</span>
          <select data-circle-location-radius aria-label="Circle search distance" ${state.busy ? "disabled" : ""}>
            ${[5,10,25,50,100].map((value) => `<option value="${value}"${value === radius ? " selected" : ""}>${value} mi</option>`).join("")}
          </select>
        </label>
        <div class="ari-circle-location-card__actions">
          <button type="button" data-circle-use-current ${state.busy ? "disabled" : ""}>Use current location</button>
          <button type="button" data-circle-edit-area ${state.busy ? "disabled" : ""}>${pref?.areaLabel ? "Change area" : "Enter area"}</button>
          ${pref ? `<button type="button" data-circle-clear-location class="is-quiet" ${state.busy ? "disabled" : ""}>Clear</button>` : ""}
        </div>
        <form class="ari-circle-location-card__editor" data-circle-location-editor hidden>
          <label>
            <span>City, ZIP code, or general neighborhood</span>
            <input data-circle-location-area maxlength="100" autocomplete="postal-code" value="${escapeHtml(pref?.areaLabel || "")}" placeholder="Mission Valley, San Diego" />
          </label>
          <button type="submit" ${state.busy ? "disabled" : ""}>Save area</button>
        </form>
        <p class="ari-circle-location-card__privacy">Circle never needs your home address. Current location is requested only after you tap the button and is rounded before storage. Manual areas use name-based matching until a coarse location is available.</p>
        <p class="ari-circle-location-card__status" data-circle-location-status role="status" aria-live="polite"></p>
      </section>
    `;

    host.querySelector("[data-circle-use-current]")?.addEventListener("click", () => useCurrentLocation(host));
    host.querySelector("[data-circle-edit-area]")?.addEventListener("click", () => {
      const editor = host.querySelector("[data-circle-location-editor]");
      if (!editor) return;
      editor.hidden = !editor.hidden;
      if (!editor.hidden) editor.querySelector("input")?.focus?.();
    });
    host.querySelector("[data-circle-location-editor]")?.addEventListener("submit", (event) => saveManualArea(host, event));
    host.querySelector("[data-circle-location-radius]")?.addEventListener("change", (event) => changeRadius(host, event));
    host.querySelector("[data-circle-clear-location]")?.addEventListener("click", async () => {
      if (state.busy) return;
      state.busy = true;
      try {
        await clearPreference();
      } catch (error) {
        setHostStatus(host, error?.message || "Circle could not clear your search location.");
      } finally {
        state.busy = false;
        renderAll();
      }
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderAll() {
    document.querySelectorAll("[data-ari-circle-search-location]").forEach(renderHost);
  }

  function syncPageDefaults() {
    const pref = state.preference;
    if (!pref) return;

    const v6Radius = document.getElementById("v6IntentRadius");
    if (v6Radius && ALLOWED_RADII.has(pref.radiusMiles) && !document.querySelector("#v6ActiveIntent:not([hidden])")) {
      v6Radius.value = String(pref.radiusMiles);
    }

    const v6Area = document.getElementById("v6IntentArea");
    if (v6Area && !clean(v6Area.value) && pref.areaLabel) v6Area.value = pref.areaLabel;

    const exploreArea = document.getElementById("exploreAreaInput");
    if (exploreArea && !clean(exploreArea.value) && pref.areaLabel) exploreArea.placeholder = `Search ${pref.areaLabel} or another area`;

    const meetupArea = document.getElementById("meetupFormArea");
    if (meetupArea && !clean(meetupArea.value) && pref.areaLabel) meetupArea.value = pref.areaLabel;
  }

  function announceChange() {
    const detail = { version: VERSION, preference: state.preference };
    window.dispatchEvent(new CustomEvent("ari:circleSearchLocationChanged", { detail }));

    // Refresh existing canonical read paths instead of introducing competing loaders.
    document.getElementById("refreshMeetups")?.click?.();
    document.getElementById("exploreRefresh")?.click?.();
  }

  async function boot() {
    const hosts = document.querySelectorAll("[data-ari-circle-search-location]");
    if (!hosts.length) return;
    try {
      state.client = await waitForClient();
      if (!await requireUser()) return;
      await loadPreference(true);
      syncPageDefaults();
      renderAll();
      window.dispatchEvent(new CustomEvent("ari:circleSearchLocationReady", {
        detail: { version: VERSION, preference: state.preference }
      }));
    } catch (error) {
      console.warn("Circle search location unavailable:", error?.message || error);
      renderAll();
    }
  }

  window.AriCircleSearchLocation = Object.freeze({
    version: VERSION,
    getPreference: () => loadPreference(false),
    refresh: () => loadPreference(true),
    clear: clearPreference
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
