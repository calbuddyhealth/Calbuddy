/* =============================================================
   ARI CIRCLE — HIKING DESTINATION ANCHOR V2
   A selected public hiking destination is separate from the member's
   private Circle search origin. Existing meetup create/list RPCs stay intact.
============================================================= */
(() => {
  "use strict";

  const VERSION = "2.0.0";
  const SEARCH_ENDPOINT = "/api/ari-circle-place-search-v2";
  const SEARCH_DELAY_MS = 320;
  const $ = (id) => document.getElementById(id);

  let selected = null;
  let searchTimer = 0;
  let searchSequence = 0;

  const clean = (value, max = 180) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const finite = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  function isHikingForm() {
    const explicit = clean($("meetupFormActivity")?.value).toLowerCase();
    if (explicit === "hiking") return true;
    if (explicit && explicit !== "other") return false;
    return /\b(hike|hiking|trail|mountain|peak)\b/i.test(clean($("meetupFormTitle")?.value));
  }

  function setStatus(message = "") {
    const node = $("ariHikingDestinationStatus");
    if (node) node.textContent = clean(message, 240);
  }

  function showToast(message) {
    const toast = $("meetupToast");
    if (!toast) return;
    toast.textContent = clean(message, 240);
    toast.hidden = false;
    setTimeout(() => {
      if (toast.textContent === clean(message, 240)) toast.hidden = true;
    }, 4200);
  }

  function clearResults() {
    const list = $("ariHikingDestinationResults");
    if (list) {
      list.replaceChildren();
      list.hidden = true;
    }
  }

  function clearSelection() {
    selected = null;
    const input = $("meetupFormArea");
    if (input) delete input.dataset.hikingDestinationSelected;
  }

  function renderResults(results) {
    const list = $("ariHikingDestinationResults");
    const input = $("meetupFormArea");
    if (!list || !input) return;

    list.replaceChildren();
    const safeResults = Array.isArray(results) ? results.slice(0, 6) : [];
    if (!safeResults.length) {
      list.hidden = true;
      setStatus("No matching hiking destinations found. You can still use a general area.");
      return;
    }

    safeResults.forEach((row) => {
      const label = clean(row?.label, 180);
      const latitude = finite(row?.latitude);
      const longitude = finite(row?.longitude);
      if (!label || latitude === null || longitude === null) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ari-hiking-destination-option";
      button.textContent = label;
      button.addEventListener("click", () => {
        selected = { label, latitude, longitude };
        input.value = label;
        input.dataset.hikingDestinationSelected = "true";
        clearResults();
        setStatus(`Destination selected: ${label}`);
      });
      list.appendChild(button);
    });

    list.hidden = !list.childElementCount;
    if (!list.hidden) setStatus("Choose a destination to anchor this hike.");
  }

  async function searchDestination(query) {
    const sequence = ++searchSequence;
    const preference = await window.AriCircleSearchLocation?.getPreference?.().catch?.(() => null) || null;
    const url = new URL(SEARCH_ENDPOINT, location.origin);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "6");

    const latitude = finite(preference?.approximateLatitude);
    const longitude = finite(preference?.approximateLongitude);
    if (latitude !== null && longitude !== null) {
      url.searchParams.set("lat", String(latitude));
      url.searchParams.set("lon", String(longitude));
    }

    try {
      setStatus("Searching hiking destinations…");
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Search unavailable");
      const payload = await response.json();
      if (sequence !== searchSequence) return;
      renderResults(payload?.results);
    } catch {
      if (sequence !== searchSequence) return;
      clearResults();
      setStatus("Destination search is unavailable. You can still enter a general area manually.");
    }
  }

  function scheduleSearch() {
    clearTimeout(searchTimer);
    const input = $("meetupFormArea");
    if (!input || !isHikingForm()) {
      clearResults();
      setStatus("");
      return;
    }

    if (selected && clean(input.value) !== selected.label) clearSelection();
    const query = clean(input.value, 100);
    if (query.length < 3) {
      clearResults();
      setStatus("Type a trail, mountain, park, or hiking destination.");
      return;
    }

    searchTimer = setTimeout(() => searchDestination(query), SEARCH_DELAY_MS);
  }

  function syncVisibility() {
    const shell = $("ariHikingDestinationShell");
    if (!shell) return;
    const hiking = isHikingForm();
    shell.hidden = !hiking;
    if (!hiking) {
      clearResults();
      clearSelection();
      setStatus("");
    } else if (!clean($("meetupFormArea")?.value)) {
      setStatus("Type a trail, mountain, park, or hiking destination.");
    }
  }

  function installStyles() {
    if ($("ariHikingDestinationStyles")) return;
    const style = document.createElement("style");
    style.id = "ariHikingDestinationStyles";
    style.textContent = `
      .ari-hiking-destination-shell{margin:-.2rem 0 .65rem;}
      .ari-hiking-destination-status{margin:.2rem 0 0;color:#66758d;font-size:.78rem;line-height:1.35;}
      .ari-hiking-destination-results{display:grid;gap:.42rem;margin-top:.5rem;}
      .ari-hiking-destination-option{width:100%;border:1px solid rgba(118,139,179,.22);background:rgba(255,255,255,.96);border-radius:14px;padding:.72rem .8rem;text-align:left;color:#18243b;font:inherit;font-size:.86rem;font-weight:700;box-shadow:0 8px 22px rgba(56,73,112,.08);}
      .ari-hiking-destination-option:active{transform:scale(.99);}
    `;
    document.head.appendChild(style);
  }

  function mountPicker() {
    const input = $("meetupFormArea");
    if (!input || $("ariHikingDestinationShell")) return;

    const field = input.closest("label");
    if (!field) return;

    const shell = document.createElement("div");
    shell.id = "ariHikingDestinationShell";
    shell.className = "ari-hiking-destination-shell";
    shell.hidden = true;
    shell.innerHTML = `
      <p class="ari-hiking-destination-status" id="ariHikingDestinationStatus" role="status" aria-live="polite"></p>
      <div class="ari-hiking-destination-results" id="ariHikingDestinationResults" role="listbox" hidden></div>
    `;
    field.insertAdjacentElement("afterend", shell);

    input.addEventListener("input", scheduleSearch);
    $("meetupFormActivity")?.addEventListener("change", () => {
      syncVisibility();
      scheduleSearch();
    });
    $("meetupFormTitle")?.addEventListener("input", syncVisibility);
    $("hostMeetupForm")?.addEventListener("reset", () => {
      clearSelection();
      clearResults();
      setTimeout(syncVisibility, 0);
    });

    syncVisibility();
  }

  function resolveMeetupId(name, params, result) {
    if (name === "ari_circle_create_meetup") return clean(result?.data, 80);
    if (name === "ari_circle_update_meetup") return clean(params?.requested_meetup_id, 80);
    return "";
  }

  function shouldAttachDestination(name, params) {
    if (!selected) return false;
    if (name !== "ari_circle_create_meetup" && name !== "ari_circle_update_meetup") return false;
    return clean(params?.requested_activity).toLowerCase() === "hiking";
  }

  function patchRpc(client) {
    if (!client?.rpc || client.rpc.__ariHikingDestinationV2) return Boolean(client?.rpc);

    const originalRpc = client.rpc.bind(client);
    const wrappedRpc = async (name, params = {}, options) => {
      const result = await originalRpc(name, params, options);
      if (result?.error || !shouldAttachDestination(name, params)) return result;

      const meetupId = resolveMeetupId(name, params, result);
      if (!meetupId) return result;

      const destination = selected;
      const attach = await originalRpc("ari_circle_set_hiking_destination_v2", {
        requested_meetup_id: meetupId,
        requested_destination_label: destination.label,
        requested_latitude: destination.latitude,
        requested_longitude: destination.longitude
      });

      if (attach?.error) {
        console.warn("Circle hiking destination anchor failed:", attach.error?.message || attach.error);
        showToast("Meetup saved, but its hiking destination could not be anchored. The general area is still available.");
      }
      return result;
    };

    Object.defineProperty(wrappedRpc, "__ariHikingDestinationV2", { value: true });
    client.rpc = wrappedRpc;
    return true;
  }

  async function installRpcPatch() {
    const started = Date.now();
    while (Date.now() - started < 8000) {
      const client = window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
      if (patchRpc(client)) return;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }

  function boot() {
    installStyles();
    mountPicker();
    installRpcPatch();
  }

  window.AriCircleHikingDestinationV2 = Object.freeze({
    version: VERSION,
    getSelectedDestination: () => selected ? { ...selected } : null
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
