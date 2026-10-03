/* ARI Circle Host Window V1 — scheduling guardrails + destination-aware hiking search. */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const MAX_DAYS_AHEAD = 60;
  const WINDOW_MS = MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  const PLACE_SEARCH_ENDPOINT = "/api/ari-circle-place-search";
  const SEARCH_DEBOUNCE_MS = 280;
  const $ = (id) => document.getElementById(id);

  let cutoff = null;
  let destinationSelection = null;
  let areaDirty = false;
  let searchTimer = 0;
  let searchAbort = null;
  let rpcBridgeInstalled = false;

  const clean = (value, max = 180) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function localDateTimeValue(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  function cutoffLabel(date) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function setSubmitBlocked(blocked) {
    const button = $("createMeetupSubmit");
    if (!button) return;

    if (blocked) {
      button.dataset.startWindowDisabled = "true";
      button.disabled = true;
      return;
    }

    if (button.dataset.startWindowDisabled === "true") {
      delete button.dataset.startWindowDisabled;
      if (button.dataset.permanentDisabled !== "true") button.disabled = false;
    }
  }

  function validate() {
    const input = $("meetupFormStarts");
    const error = $("meetupStartWindowError");
    if (!input || !cutoff) return true;

    const value = input.value ? new Date(input.value) : null;
    const tooLate = Boolean(value && !Number.isNaN(value.getTime()) && value.getTime() > cutoff.getTime());
    const message = tooLate ? "Choose a date within the next 60 days." : "";

    input.setCustomValidity(message);
    if (tooLate) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    if (error) error.hidden = !tooLate;
    setSubmitBlocked(tooLate);

    return !tooLate;
  }

  function refreshWindow() {
    const input = $("meetupFormStarts");
    const note = $("meetupStartWindowNote");
    if (!input) return;

    cutoff = new Date(Date.now() + WINDOW_MS);
    input.max = localDateTimeValue(cutoff);
    if (note) {
      note.textContent = `Events can be scheduled up to ${MAX_DAYS_AHEAD} days ahead. Latest: ${cutoffLabel(cutoff)}.`;
    }
    validate();
  }

  function blockOutOfWindowSubmit(event) {
    if (validate()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const input = $("meetupFormStarts");
    input?.focus({ preventScroll: true });
    input?.scrollIntoView({ block: "center", behavior: "smooth" });
    input?.reportValidity?.();
  }

  function inferredActivity() {
    const selected = clean($("meetupFormActivity")?.value, 40).toLowerCase();
    if (selected && selected !== "other") return selected;
    const title = clean($("meetupFormTitle")?.value, 120).toLowerCase();
    return /\b(hike|hiking|trail|mountain|peak|summit)\b/.test(title) ? "hiking" : selected || "other";
  }

  function isHikingMode() {
    return inferredActivity() === "hiking";
  }

  function destinationRoot() {
    return $("meetupDestinationSearch");
  }

  function ensureDestinationUi() {
    const area = $("meetupFormArea");
    if (!area) return null;
    let root = destinationRoot();
    if (root) return root;

    root = document.createElement("div");
    root.id = "meetupDestinationSearch";
    root.className = "circle-connect-destination-search";
    root.hidden = true;
    root.innerHTML = `
      <div class="circle-connect-destination-search__hint">
        <strong>Trail & destination search</strong>
        <span>Search public hiking spots across the U.S. Suggestions are biased toward your Circle area, not limited to it.</span>
      </div>
      <div class="circle-connect-destination-search__status" id="meetupDestinationStatus" role="status" aria-live="polite"></div>
      <div class="circle-connect-destination-search__results" id="meetupDestinationResults" role="listbox" aria-label="Hiking destination suggestions"></div>
    `;
    area.parentElement?.insertAdjacentElement("afterend", root);
    return root;
  }

  function setDestinationStatus(message) {
    const node = $("meetupDestinationStatus");
    if (node) node.textContent = clean(message, 220);
  }

  function clearDestinationResults() {
    const results = $("meetupDestinationResults");
    if (results) results.innerHTML = "";
  }

  function resetDestinationState({ keepExisting = false } = {}) {
    clearTimeout(searchTimer);
    searchTimer = 0;
    searchAbort?.abort?.();
    searchAbort = null;
    clearDestinationResults();
    setDestinationStatus("");
    if (!keepExisting) destinationSelection = null;
    areaDirty = false;
  }

  function renderDestinationMode() {
    const root = ensureDestinationUi();
    const area = $("meetupFormArea");
    if (!root || !area) return;

    const hiking = isHikingMode();
    root.hidden = !hiking;
    area.setAttribute("autocomplete", hiking ? "off" : "address-level2");
    area.setAttribute("aria-autocomplete", hiking ? "list" : "none");
    if (hiking) {
      area.placeholder = "Cowles Mountain, Potato Chip Rock, Yosemite…";
    } else if (!area.value) {
      area.placeholder = "Mission Valley, San Diego";
    }

    if (!hiking) {
      clearDestinationResults();
      setDestinationStatus("");
    }
  }

  async function searchBias() {
    try {
      const preference = await window.AriCircleSearchLocation?.getPreference?.();
      if (!preference?.hasCoordinates) return null;
      const latitude = Number(preference.approximateLatitude);
      const longitude = Number(preference.approximateLongitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { latitude, longitude };
    } catch {
      return null;
    }
  }

  function destinationButton(item, index) {
    const kind = clean(item?.kind, 60).replaceAll("_", " ");
    return `
      <button type="button" class="circle-connect-destination-result" role="option" data-destination-index="${index}">
        <span class="circle-connect-destination-result__pin" aria-hidden="true">⌖</span>
        <span class="circle-connect-destination-result__copy">
          <strong>${escapeHtml(item?.name || item?.label || "Destination")}</strong>
          <small>${escapeHtml(item?.label || "")}${kind ? ` · ${escapeHtml(kind)}` : ""}</small>
        </span>
      </button>
    `;
  }

  function chooseDestination(item) {
    const area = $("meetupFormArea");
    if (!area || !item) return;
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    destinationSelection = {
      label: clean(item.label || item.name, 180),
      latitude,
      longitude,
      source: clean(item.source, 30) || "place_search"
    };
    area.value = destinationSelection.label;
    areaDirty = true;
    clearDestinationResults();
    setDestinationStatus(`Selected ${destinationSelection.label}. Hiking discovery will use this destination.`);
  }

  async function runDestinationSearch(query) {
    if (!isHikingMode()) return;
    const value = clean(query, 100);
    if (value.length < 2) {
      clearDestinationResults();
      setDestinationStatus("");
      return;
    }

    searchAbort?.abort?.();
    searchAbort = new AbortController();
    const localAbort = searchAbort;
    setDestinationStatus("Searching hiking destinations across the U.S.…");

    try {
      const bias = await searchBias();
      const url = new URL(PLACE_SEARCH_ENDPOINT, window.location.origin);
      url.searchParams.set("q", value);
      url.searchParams.set("category", "hiking");
      url.searchParams.set("limit", "8");
      if (bias) {
        url.searchParams.set("lat", String(bias.latitude));
        url.searchParams.set("lon", String(bias.longitude));
      }

      const response = await fetch(url.toString(), {
        signal: localAbort.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("search unavailable");
      const payload = await response.json();
      if (localAbort !== searchAbort) return;

      const items = Array.isArray(payload?.results) ? payload.results : [];
      const results = $("meetupDestinationResults");
      if (!results) return;
      results.innerHTML = items.map(destinationButton).join("");
      results.querySelectorAll("[data-destination-index]").forEach((button) => {
        button.addEventListener("click", () => chooseDestination(items[Number(button.dataset.destinationIndex)]));
      });
      setDestinationStatus(items.length
        ? "Choose the trail or destination you mean."
        : "No exact place found. You can still use the area you typed.");
    } catch (error) {
      if (error?.name === "AbortError") return;
      clearDestinationResults();
      setDestinationStatus("Place suggestions are unavailable right now. You can still type the general area manually.");
    }
  }

  function scheduleDestinationSearch() {
    clearTimeout(searchTimer);
    const area = $("meetupFormArea");
    if (!area || !isHikingMode()) return;
    searchTimer = setTimeout(() => runDestinationSearch(area.value), SEARCH_DEBOUNCE_MS);
  }

  function supabaseClient() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  function destinationPayload(meetupId, activity) {
    const selected = activity === "hiking" ? destinationSelection : null;
    return {
      requested_meetup_id: meetupId,
      requested_destination_label: selected?.label || null,
      requested_destination_latitude: selected?.latitude ?? null,
      requested_destination_longitude: selected?.longitude ?? null,
      requested_destination_source: selected?.source || null
    };
  }

  function installRpcDestinationBridge() {
    if (rpcBridgeInstalled) return true;
    const client = supabaseClient();
    if (!client?.rpc || client.rpc.__ariCircleDestinationBridge === true) {
      rpcBridgeInstalled = Boolean(client?.rpc?.__ariCircleDestinationBridge);
      return rpcBridgeInstalled;
    }

    const originalRpc = client.rpc.bind(client);
    const wrappedRpc = async (name, params = {}, options) => {
      const result = await originalRpc(name, params, options);
      if (result?.error) return result;

      const rpcName = clean(name, 80);
      if (rpcName !== "ari_circle_create_meetup" && rpcName !== "ari_circle_update_meetup") {
        return result;
      }

      const meetupId = rpcName === "ari_circle_create_meetup"
        ? clean(result?.data, 80)
        : clean(params?.requested_meetup_id, 80);
      const activity = clean(params?.requested_activity, 40).toLowerCase();
      const shouldWriteDestination = Boolean(meetupId) && (
        Boolean(destinationSelection) ||
        activity !== "hiking" ||
        (rpcName === "ari_circle_update_meetup" && areaDirty)
      );

      if (shouldWriteDestination) {
        try {
          const destinationResult = await originalRpc(
            "ari_circle_set_meetup_destination",
            destinationPayload(meetupId, activity)
          );
          if (destinationResult?.error) {
            console.warn("Circle destination sync failed:", destinationResult.error?.message || destinationResult.error);
          }
        } catch (error) {
          console.warn("Circle destination sync failed:", error?.message || error);
        }
      }

      return result;
    };

    wrappedRpc.__ariCircleDestinationBridge = true;
    wrappedRpc.__ariCircleOriginalRpc = originalRpc;

    try {
      client.rpc = wrappedRpc;
      rpcBridgeInstalled = true;
      return true;
    } catch {
      return false;
    }
  }

  function bindDestinationSearch() {
    const area = $("meetupFormArea");
    const activity = $("meetupFormActivity");
    const title = $("meetupFormTitle");
    const form = $("hostMeetupForm");
    if (!area || !form) return;

    ensureDestinationUi();
    renderDestinationMode();

    area.addEventListener("input", () => {
      areaDirty = true;
      if (destinationSelection && clean(area.value) !== destinationSelection.label) {
        destinationSelection = null;
      }
      scheduleDestinationSearch();
    });

    activity?.addEventListener("change", () => {
      renderDestinationMode();
      if (isHikingMode()) scheduleDestinationSearch();
    });

    title?.addEventListener("input", () => {
      setTimeout(() => {
        renderDestinationMode();
        if (isHikingMode()) scheduleDestinationSearch();
      }, 0);
    });

    form.addEventListener("reset", () => {
      setTimeout(() => {
        resetDestinationState();
        renderDestinationMode();
      }, 0);
    });
  }

  function init() {
    const input = $("meetupFormStarts");
    const form = $("hostMeetupForm");
    const dialog = $("hostMeetupDialog");
    if (!input || !form) return;

    refreshWindow();
    input.addEventListener("input", validate);
    input.addEventListener("change", validate);
    input.addEventListener("invalid", validate);
    form.addEventListener("submit", blockOutOfWindowSubmit, true);

    bindDestinationSearch();
    installRpcDestinationBridge();
    if (!rpcBridgeInstalled) setTimeout(installRpcDestinationBridge, 500);
    if (!rpcBridgeInstalled) setTimeout(installRpcDestinationBridge, 1600);

    if (dialog && "MutationObserver" in window) {
      const observer = new MutationObserver((records) => {
        if (records.some((record) => record.attributeName === "open") && dialog.open) {
          refreshWindow();
          resetDestinationState({ keepExisting: false });
          renderDestinationMode();
        }
      });
      observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    }
  }

  window.AriCircleHostWindowV1 = Object.freeze({
    version: VERSION,
    maxDaysAhead: MAX_DAYS_AHEAD,
    refresh: refreshWindow,
    validate,
    getDestination: () => destinationSelection ? { ...destinationSelection } : null,
    searchDestination: runDestinationSearch
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
