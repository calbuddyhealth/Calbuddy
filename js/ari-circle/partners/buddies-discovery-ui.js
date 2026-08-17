// ARI CIRCLE — Buddies discovery UI v1.2.0
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const RADIUS_OPTIONS = Object.freeze([25, 50, 100]);
  const DEFAULT_RADIUS = 25;
  const LOCATION_LAT_KEY = "ari_buddy_approx_lat";
  const LOCATION_LON_KEY = "ari_buddy_approx_lon";
  const RADIUS_KEY = "ari_buddy_radius_miles";

  let teenMode = false;
  let ageBand = "";
  let observer = null;
  let partnerObserver = null;
  let rpcWrapped = false;
  let fallbackArea = "";
  let approximateLatitude = null;
  let approximateLongitude = null;
  let radiusMiles = readRadius();
  const distanceByIntent = new Map();

  function clean(value) {
    return String(value ?? "").trim();
  }

  function readRadius() {
    try {
      const value = Number(localStorage.getItem(RADIUS_KEY));
      return RADIUS_OPTIONS.includes(value) ? value : DEFAULT_RADIUS;
    } catch {
      return DEFAULT_RADIUS;
    }
  }

  function roundApproxCoordinate(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) / 100 : null;
  }

  function restoreSessionLocation() {
    try {
      const lat = Number(sessionStorage.getItem(LOCATION_LAT_KEY));
      const lon = Number(sessionStorage.getItem(LOCATION_LON_KEY));
      if (Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180) {
        approximateLatitude = roundApproxCoordinate(lat);
        approximateLongitude = roundApproxCoordinate(lon);
      }
    } catch {}
  }

  function saveSessionLocation() {
    try {
      if (Number.isFinite(approximateLatitude) && Number.isFinite(approximateLongitude)) {
        sessionStorage.setItem(LOCATION_LAT_KEY, String(approximateLatitude));
        sessionStorage.setItem(LOCATION_LON_KEY, String(approximateLongitude));
      }
    } catch {}
  }

  function hasApproximateLocation() {
    return Number.isFinite(approximateLatitude) && Number.isFinite(approximateLongitude);
  }

  function client() {
    return window.calbuddySupabase || window.supabaseClient || null;
  }

  function showLocalToast(message, duration = 3600) {
    const toast = document.getElementById("partnerToast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.setTimeout(() => {
      if (toast.textContent === message) toast.hidden = true;
    }, duration);
  }

  function normalizeAgeState(data) {
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }

  async function ensureOwnAreaAndLocation() {
    if (ageBand !== "adult") return;
    const supabase = client();
    if (!supabase?.from) return;
    try {
      const { data, error } = await supabase
        .from("ari_circle_partner_intents")
        .select("area,approximate_latitude,approximate_longitude,updated_at")
        .eq("status", "looking")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) return;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) return;
      fallbackArea = clean(row.area);
      if (!hasApproximateLocation()) {
        const lat = roundApproxCoordinate(row.approximate_latitude);
        const lon = roundApproxCoordinate(row.approximate_longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          approximateLatitude = lat;
          approximateLongitude = lon;
          saveSessionLocation();
        }
      }
      updateRadiusUi();
    } catch {}
  }

  function recordPartnerDistances(rows) {
    distanceByIntent.clear();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const id = clean(row?.intent_id);
      const distance = Number(row?.distance_miles);
      if (id && Number.isFinite(distance)) distanceByIntent.set(id, distance);
    });
  }

  function wrapRpc() {
    const supabase = client();
    if (!supabase?.rpc || rpcWrapped) return;
    rpcWrapped = true;

    const originalRpc = supabase.rpc.bind(supabase);
    supabase.rpc = async function ariBuddyRpc(name, args = {}, options) {
      let targetName = name;
      let targetArgs = args || {};

      if (name === "ari_circle_find_partners") {
        if (ageBand === "adult") await ensureOwnAreaAndLocation();
        targetName = "ari_circle_find_partners_v2";
        targetArgs = {
          requested_activity: targetArgs.requested_activity ?? null,
          requested_area: targetArgs.requested_area || fallbackArea || null,
          requested_latitude: ageBand === "adult" && hasApproximateLocation() ? approximateLatitude : null,
          requested_longitude: ageBand === "adult" && hasApproximateLocation() ? approximateLongitude : null,
          requested_radius_miles: ageBand === "adult" ? radiusMiles : DEFAULT_RADIUS,
          result_limit: targetArgs.result_limit ?? 40
        };
      } else if (name === "ari_circle_upsert_partner_intent") {
        targetName = "ari_circle_upsert_partner_intent_v2";
        targetArgs = {
          ...targetArgs,
          requested_latitude: ageBand === "adult" && hasApproximateLocation() ? approximateLatitude : null,
          requested_longitude: ageBand === "adult" && hasApproximateLocation() ? approximateLongitude : null
        };
      }

      const result = await originalRpc(targetName, targetArgs, options);

      if (name === "ari_circle_my_age_state" || name === "ari_circle_verify_my_age") {
        const age = normalizeAgeState(result?.data);
        if (age?.verified) {
          ageBand = clean(age.age_band || age.band);
          teenMode = ageBand === "teen";
          if (ageBand === "adult") window.setTimeout(ensureOwnAreaAndLocation, 0);
          window.setTimeout(() => ageBand === "teen" ? applyTeenLayout() : applyAdultLayout(), 0);
        }
      }

      if (name === "ari_circle_find_partners" && !result?.error) {
        recordPartnerDistances(result?.data);
        window.setTimeout(decoratePartnerCards, 0);
      }

      return result;
    };
  }

  function openPrivacy() {
    const dialog = document.getElementById("privacyDialog");
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function toggleMore(button) {
    const extras = [...document.querySelectorAll(".buddy-extra-activity")];
    const willOpen = extras.some((item) => item.hidden);
    extras.forEach((item) => { item.hidden = !willOpen; });
    const icon = button.querySelector("span");
    if (icon) icon.textContent = willOpen ? "−" : "＋";
    button.lastChild.textContent = willOpen ? " Less" : " More";
    if (willOpen) extras[0]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }

  function hideTeenLocationArtifacts(root = document) {
    if (!teenMode) return;

    root.querySelectorAll?.(".partner-meta-pill").forEach((pill) => {
      if (pill.textContent.trim().startsWith("📍") || pill.classList.contains("buddy-distance-pill")) pill.hidden = true;
    });

    root.querySelectorAll?.(".partner-invite-card__copy span").forEach((line) => {
      line.textContent = line.textContent.replace(/\s*·\s*Teen Circle\s*$/i, " · Teen Circle");
    });
  }

  function ensureRadiusControls() {
    if (document.getElementById("buddyRadiusControls")) return;
    const search = document.getElementById("partnerSearchForm");
    if (!search?.parentNode) return;

    const controls = document.createElement("section");
    controls.id = "buddyRadiusControls";
    controls.className = "buddy-radius-controls";
    controls.setAttribute("aria-label", "Nearby Buddy radius");
    controls.innerHTML = `
      <button class="buddy-location-button" id="buddyUseLocationButton" type="button">
        <span class="buddy-location-button__icon" aria-hidden="true">◎</span>
        <span><strong>Use my location</strong><small>Approximate only</small></span>
      </button>
      <div class="buddy-radius-picker" role="group" aria-label="Search radius">
        <span>Within</span>
        ${RADIUS_OPTIONS.map((miles) => `<button type="button" data-buddy-radius="${miles}">${miles} mi</button>`).join("")}
      </div>
      <p class="buddy-radius-status" id="buddyRadiusStatus">Turn on location for real distance matching. Area search still works.</p>
    `;
    search.parentNode.insertBefore(controls, search);

    document.getElementById("buddyUseLocationButton")?.addEventListener("click", () => requestApproximateLocation({ interactive: true }));
    controls.querySelectorAll("[data-buddy-radius]").forEach((button) => {
      button.addEventListener("click", async () => {
        const next = Number(button.dataset.buddyRadius);
        if (!RADIUS_OPTIONS.includes(next) || next === radiusMiles) return;
        radiusMiles = next;
        try { localStorage.setItem(RADIUS_KEY, String(radiusMiles)); } catch {}
        updateRadiusUi();
        if (hasApproximateLocation()) await window.AriCirclePartnerFinder?.refresh?.();
      });
    });
    updateRadiusUi();
  }

  function updateRadiusUi() {
    const controls = document.getElementById("buddyRadiusControls");
    if (controls) controls.hidden = teenMode;

    document.querySelectorAll("[data-buddy-radius]").forEach((button) => {
      const active = Number(button.dataset.buddyRadius) === radiusMiles;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const button = document.getElementById("buddyUseLocationButton");
    if (button) {
      const strong = button.querySelector("strong");
      const small = button.querySelector("small");
      button.classList.toggle("is-active", hasApproximateLocation());
      if (strong) strong.textContent = hasApproximateLocation() ? "Location on" : "Use my location";
      if (small) small.textContent = hasApproximateLocation() ? "Rounded for privacy" : "Approximate only";
    }

    const status = document.getElementById("buddyRadiusStatus");
    if (status) {
      status.textContent = hasApproximateLocation()
        ? `Showing adults within ${radiusMiles} miles first. Only a rounded approximate location is stored; exact coordinates are never shown.`
        : "Turn on location for true 25 / 50 / 100 mile matching. Area search still works without it.";
    }
  }

  function requestApproximateLocation({ interactive = false } = {}) {
    if (teenMode || ageBand === "teen") return Promise.resolve(false);
    if (!navigator.geolocation) {
      if (interactive) showLocalToast("Location is not available on this device.");
      return Promise.resolve(false);
    }

    const button = document.getElementById("buddyUseLocationButton");
    if (button) button.disabled = true;
    const status = document.getElementById("buddyRadiusStatus");
    if (status) status.textContent = "Getting an approximate location…";

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        approximateLatitude = roundApproxCoordinate(position.coords.latitude);
        approximateLongitude = roundApproxCoordinate(position.coords.longitude);
        saveSessionLocation();
        updateRadiusUi();

        try {
          const supabase = client();
          if (supabase?.rpc) {
            await supabase.rpc("ari_circle_set_my_partner_location_v1", {
              requested_latitude: approximateLatitude,
              requested_longitude: approximateLongitude
            });
          }
        } catch (error) {
          console.warn("Could not refresh Buddy listing location:", error?.message || error);
        }

        await ensureOwnAreaAndLocation();
        if (button) button.disabled = false;
        if (interactive) showLocalToast(`Near You is now using a ${radiusMiles}-mile radius.`);
        await window.AriCirclePartnerFinder?.refresh?.();
        resolve(true);
      }, (error) => {
        if (button) button.disabled = false;
        updateRadiusUi();
        if (interactive) {
          const denied = error?.code === 1;
          showLocalToast(denied
            ? "Location permission was not granted. You can still search by city or area."
            : "ARI could not get your location. You can still search by city or area.", 4300);
        }
        resolve(false);
      }, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 10 * 60 * 1000
      });
    });
  }

  async function useLocationIfAlreadyGranted() {
    if (teenMode || ageBand !== "adult" || hasApproximateLocation() || !navigator.permissions?.query) return;
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (permission.state === "granted") await requestApproximateLocation({ interactive: false });
    } catch {}
  }

  function decoratePartnerCards() {
    if (teenMode) return hideTeenLocationArtifacts();
    document.querySelectorAll("#partnerList .partner-person-card").forEach((card) => {
      const interestButton = card.querySelector("[data-interest-intent]");
      const intentId = clean(interestButton?.dataset.interestIntent);
      if (!intentId) return;
      const distance = distanceByIntent.get(intentId);
      const row = card.querySelector(".partner-meta-row");
      if (!row) return;
      row.querySelector(".buddy-distance-pill")?.remove();
      if (!Number.isFinite(distance)) return;
      const pill = document.createElement("span");
      pill.className = "partner-meta-pill buddy-distance-pill";
      pill.textContent = distance < 1.5 ? "◎ Within 1 mi" : `◎ About ${Math.round(distance)} mi away`;
      row.prepend(pill);
    });

    const status = document.getElementById("partnerResultStatus");
    if (status && hasApproximateLocation() && /^\d+\s+(person is|people are)\s+open to connecting\./i.test(status.textContent.trim())) {
      const count = Number(status.textContent.match(/^\d+/)?.[0] || 0);
      status.textContent = `${count} ${count === 1 ? "person is" : "people are"} within your ${radiusMiles}-mile discovery view.`;
    }
  }

  function observePartnerResults() {
    const host = document.getElementById("partnerList");
    if (!host || partnerObserver) return;
    partnerObserver = new MutationObserver(() => window.setTimeout(decoratePartnerCards, 0));
    partnerObserver.observe(host, { childList: true, subtree: true });
  }

  function applyTeenLayout() {
    teenMode = true;
    ageBand = "teen";

    const searchForm = document.getElementById("partnerSearchForm");
    if (searchForm) searchForm.hidden = true;

    const searchInput = document.getElementById("partnerAreaSearch");
    if (searchInput) {
      searchInput.value = "";
      searchInput.disabled = true;
    }

    const radius = document.getElementById("buddyRadiusControls");
    if (radius) radius.hidden = true;

    const areaInput = document.getElementById("intentArea");
    if (areaInput) {
      areaInput.value = "Teen Circle";
      areaInput.required = false;
      const field = areaInput.closest(".partner-field");
      if (field) field.hidden = true;
    }

    const discoveryKicker = document.querySelector(".partner-discover .partner-kicker");
    if (discoveryKicker) discoveryKicker.textContent = "TEEN CIRCLE";

    const discoveryTitle = document.getElementById("discoverTitle");
    if (discoveryTitle) discoveryTitle.textContent = "Find people with the same interests";

    const oneOnOne = document.querySelector('input[name="intentMode"][value="one_on_one"]');
    if (oneOnOne) {
      oneOnOne.disabled = true;
      const label = oneOnOne.closest("label");
      if (label) label.hidden = true;
    }

    const group = document.querySelector('input[name="intentMode"][value="group"]');
    if (group) {
      group.checked = true;
      const labelText = group.closest("label")?.querySelector("span");
      if (labelText) labelText.textContent = "Teen Circle";
    }

    const note = document.getElementById("intentNote");
    if (note) note.placeholder = "Share the interest, not your location or contact info.";

    const teenNote = document.getElementById("teenIntentNote");
    if (teenNote) {
      teenNote.hidden = false;
      teenNote.textContent = "Teen Buddies matches by shared interests, not location. Keep conversations in ARI Circle; exact locations, private meetup plans, phone numbers, email addresses, links, and off-app handles are blocked.";
    }

    hideTeenLocationArtifacts();

    if (!observer) {
      observer = new MutationObserver((records) => {
        if (!teenMode) return;
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) hideTeenLocationArtifacts(node);
          });
        });
      });
      [document.getElementById("partnerList"), document.getElementById("inviteList"), document.getElementById("ownListingCard")]
        .filter(Boolean)
        .forEach((node) => observer.observe(node, { childList: true, subtree: true }));
    }
  }

  function applyAdultLayout() {
    teenMode = false;
    if (ageBand !== "teen") ageBand = "adult";
    ensureRadiusControls();
    updateRadiusUi();

    const searchForm = document.getElementById("partnerSearchForm");
    if (searchForm) searchForm.hidden = false;

    const searchInput = document.getElementById("partnerAreaSearch");
    if (searchInput) searchInput.disabled = false;

    const areaInput = document.getElementById("intentArea");
    if (areaInput) {
      areaInput.required = true;
      const field = areaInput.closest(".partner-field");
      if (field) field.hidden = false;
    }

    ensureOwnAreaAndLocation().then(() => useLocationIfAlreadyGranted());
  }

  async function refreshAgeMode() {
    const supabase = client();
    if (!supabase?.rpc) return;
    try {
      const { data, error } = await supabase.rpc("ari_circle_my_age_state");
      const age = normalizeAgeState(data);
      if (error || !age?.verified) return;
      ageBand = clean(age.age_band || age.band);
      if (ageBand === "teen") applyTeenLayout();
      else applyAdultLayout();
    } catch (error) {
      console.warn("Buddies age-aware UI unavailable:", error?.message || error);
    }
  }

  restoreSessionLocation();
  wrapRpc();

  // Compatibility bridge for partner-finder's age-mode renderer.
  ["partnerSafetyTitle", "partnerSafetyText"].forEach((id) => {
    if (document.getElementById(id)) return;
    const node = document.createElement(id === "partnerSafetyTitle" ? "strong" : "span");
    node.id = id;
    node.hidden = true;
    node.setAttribute("aria-hidden", "true");
    document.body.appendChild(node);
  });

  document.addEventListener("DOMContentLoaded", () => {
    ensureRadiusControls();
    observePartnerResults();

    document.querySelector("[data-more-activities]")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleMore(event.currentTarget);
    });

    document.getElementById("buddyPrivacyButton")?.addEventListener("click", openPrivacy);

    document.querySelectorAll("[data-close-dialog='privacyDialog']").forEach((button) => {
      button.addEventListener("click", () => document.getElementById("privacyDialog")?.close());
    });

    document.getElementById("ageForm")?.addEventListener("submit", () => {
      window.setTimeout(refreshAgeMode, 450);
    });

    window.setTimeout(refreshAgeMode, 0);
    window.setTimeout(refreshAgeMode, 500);
  });

  window.AriCircleBuddyRadius = Object.freeze({
    version: VERSION,
    getRadius: () => radiusMiles,
    hasLocation: hasApproximateLocation,
    refreshLocation: () => requestApproximateLocation({ interactive: true })
  });
})();
