/* =============================================================
   ARI CIRCLE — PARTNER FINDER
   Version: 1.0.0

   Purpose:
   - Let users publish an activity-partner intent.
   - Discover people already looking for the same activity.
   - Replace cold DMs with low-pressure mutual-interest invites.
   - Keep verified teens and adults separated at the database layer.
   - Keep teen discovery group/accountability-only.
============================================================= */

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);

  const ACTIVITY_META = Object.freeze({
    gym: { label: "Gym", emoji: "🏋️" },
    hiking: { label: "Hiking", emoji: "🥾" },
    running: { label: "Running", emoji: "🏃" },
    cycling: { label: "Cycling", emoji: "🚴" },
    sports: { label: "Sports", emoji: "🏀" },
    walking: { label: "Walking", emoji: "🚶" },
    accountability: { label: "Accountability", emoji: "⚡" },
    other: { label: "Activity", emoji: "✦" }
  });

  const MODE_LABELS = Object.freeze({
    one_on_one: "1-on-1",
    group: "Group",
    accountability: "Accountability"
  });

  const EXPERIENCE_LABELS = Object.freeze({
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    any: "Any level"
  });

  const TIME_LABELS = Object.freeze({
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    weekdays: "Weekdays",
    weekends: "Weekends",
    flexible: "Flexible"
  });

  const state = {
    client: null,
    user: null,
    age: null,
    selectedActivity: "",
    area: "",
    partners: [],
    ownIntents: [],
    receivedInvites: [],
    activeInviteTarget: null,
    busy: false,
    toastTimer: null
  };

  function clean(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function activityMeta(activity) {
    return ACTIVITY_META[activity] || ACTIVITY_META.other;
  }

  function initialFor(name) {
    const value = clean(name);
    return value ? value.charAt(0).toUpperCase() : "A";
  }

  function titleCase(value) {
    const text = clean(value).replaceAll("_", " ");
    return text
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function showToast(message, duration = 3000) {
    const toast = $("partnerToast");
    if (!toast) return;

    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;

    state.toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, duration);
  }

  function openDialog(id) {
    const dialog = $(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
    }
  }

  function closeDialog(id) {
    const dialog = $(id);
    if (dialog?.open) dialog.close();
  }

  function setBusy(isBusy) {
    state.busy = Boolean(isBusy);
    document.querySelectorAll("button[data-busy-sensitive], #saveIntentButton, #verifyAgeButton")
      .forEach((button) => {
        button.disabled = state.busy;
      });
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;

    const user = data?.user || null;
    if (!user) {
      window.location.replace("signin.html");
      return null;
    }

    state.user = user;
    return user;
  }

  async function loadAgeState() {
    state.age = await rpc("ari_circle_my_age_state");
    applyAgeMode();
    return state.age;
  }

  function applyAgeMode() {
    const band = state.age?.age_band || null;
    const isTeen = band === "teen";

    const oneOnOne = document.querySelector('input[name="intentMode"][value="one_on_one"]');
    const group = document.querySelector('input[name="intentMode"][value="group"]');

    if (oneOnOne) {
      oneOnOne.disabled = isTeen;
      if (isTeen && oneOnOne.checked && group) {
        group.checked = true;
      }
    }

    $("teenIntentNote").hidden = !isTeen;

    if (isTeen) {
      $("partnerSafetyTitle").textContent = "Teen-safe discovery";
      $("partnerSafetyText").textContent =
        "Adult profiles are excluded. Partner Finder is limited to group activities and accountability, with only a general area shown.";
    } else {
      $("partnerSafetyTitle").textContent = "Private by design";
      $("partnerSafetyText").textContent =
        "Partner Finder uses a general area, never your precise location. A DM opens only after mutual interest.";
    }
  }

  async function verifyAge(event) {
    event.preventDefault();

    const value = clean($("ageDateInput").value);
    if (!value) {
      showToast("Enter your date of birth to continue.");
      return;
    }

    setBusy(true);

    try {
      state.age = await rpc("ari_circle_verify_my_age", {
        requested_date_of_birth: value
      });

      closeDialog("ageDialog");
      applyAgeMode();
      showToast("Age verified. Your birth date stays private.");
      await refreshAll();
    } catch (error) {
      console.error("Partner Finder age verification failed:", error);
      showToast(error.message || "Could not verify age.", 4500);
    } finally {
      setBusy(false);
    }
  }

  async function loadOwnIntents() {
    const { data, error } = await state.client
      .from("ari_circle_partner_intents")
      .select("id,user_id,activity,mode,experience_level,area,time_preferences,note,status,expires_at,updated_at")
      .eq("user_id", state.user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    state.ownIntents = Array.isArray(data) ? data : [];
    renderOwnListing();
  }

  function renderOwnListing() {
    const section = $("ownListingSection");
    const host = $("ownListingCard");
    const active = state.ownIntents.find((item) => item.status === "looking") || null;

    if (!active) {
      section.hidden = true;
      host.replaceChildren();
      return;
    }

    section.hidden = false;
    const meta = activityMeta(active.activity);
    const times = Array.isArray(active.time_preferences)
      ? active.time_preferences.map((item) => TIME_LABELS[item] || titleCase(item)).join(" · ")
      : "";

    host.innerHTML = `
      <article class="partner-own-card">
        <span class="partner-own-card__icon" aria-hidden="true">${meta.emoji}</span>
        <div>
          <strong>${escapeHtml(meta.label)} · ${escapeHtml(MODE_LABELS[active.mode] || titleCase(active.mode))}</strong>
          <small>${escapeHtml(active.area)}${times ? ` · ${escapeHtml(times)}` : ""}</small>
        </div>
        <span class="partner-live-dot" aria-label="Discoverable"></span>
      </article>
    `;
  }

  function fillIntentForm(intent = null) {
    const source = intent || state.ownIntents.find((item) => item.status === "looking") || null;

    $("intentActivity").value = source?.activity || state.selectedActivity || "gym";
    $("intentExperience").value = source?.experience_level || "any";
    $("intentArea").value = source?.area || state.area || "";
    $("intentNote").value = source?.note || "";

    const mode = source?.mode || (state.age?.age_band === "teen" ? "group" : "one_on_one");
    document.querySelectorAll('input[name="intentMode"]').forEach((input) => {
      input.checked = input.value === mode;
    });

    const selectedTimes = new Set(Array.isArray(source?.time_preferences) ? source.time_preferences : []);
    document.querySelectorAll('input[name="intentTime"]').forEach((input) => {
      input.checked = selectedTimes.has(input.value);
    });

    applyAgeMode();
  }

  function openIntentEditor() {
    if (!state.age?.verified) {
      openDialog("ageDialog");
      return;
    }

    fillIntentForm();
    openDialog("intentDialog");
  }

  async function saveIntent(event) {
    event.preventDefault();

    const mode = document.querySelector('input[name="intentMode"]:checked')?.value || "one_on_one";
    const times = [...document.querySelectorAll('input[name="intentTime"]:checked')]
      .map((input) => input.value);

    const payload = {
      requested_activity: clean($("intentActivity").value),
      requested_mode: mode,
      requested_experience_level: clean($("intentExperience").value) || "any",
      requested_area: clean($("intentArea").value),
      requested_time_preferences: times,
      requested_note: clean($("intentNote").value) || null
    };

    if (!payload.requested_area) {
      showToast("Add a general city or area.");
      return;
    }

    setBusy(true);

    try {
      await rpc("ari_circle_upsert_partner_intent", payload);
      closeDialog("intentDialog");
      showToast("You’re discoverable for this activity.");
      state.selectedActivity = payload.requested_activity;
      syncActivityChips();
      await refreshAll();
    } catch (error) {
      console.error("Partner listing save failed:", error);
      showToast(error.message || "Could not save your listing.", 4500);
    } finally {
      setBusy(false);
    }
  }

  function syncActivityChips() {
    document.querySelectorAll("[data-activity]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.activity === state.selectedActivity);
    });
  }

  async function loadPartners() {
    const host = $("partnerList");
    const empty = $("partnerEmpty");
    const status = $("partnerResultStatus");

    status.textContent = "Finding people who are already looking…";
    empty.hidden = true;

    try {
      const data = await rpc("ari_circle_find_partners", {
        requested_activity: state.selectedActivity || null,
        requested_area: state.area || null,
        result_limit: 40
      });

      state.partners = Array.isArray(data) ? data : [];
      renderPartners();
    } catch (error) {
      console.error("Partner discovery failed:", error);
      state.partners = [];
      host.replaceChildren();
      empty.hidden = false;
      status.textContent = error.message || "Partner Finder is unavailable right now.";
    }
  }

  function renderPartners() {
    const host = $("partnerList");
    const empty = $("partnerEmpty");
    const status = $("partnerResultStatus");

    host.replaceChildren();

    if (!state.partners.length) {
      empty.hidden = false;
      status.textContent = "No matching profiles yet.";
      return;
    }

    empty.hidden = true;
    status.textContent = `${state.partners.length} ${state.partners.length === 1 ? "person is" : "people are"} open to an activity.`;

    state.partners.forEach((partner) => {
      host.append(createPartnerCard(partner));
    });
  }

  function createPartnerCard(partner) {
    const article = document.createElement("article");
    article.className = "partner-person-card";

    const meta = activityMeta(partner.activity);
    const handle = clean(partner.handle) ? `@${clean(partner.handle).replace(/^@+/, "")}` : "ARI Circle";
    const times = Array.isArray(partner.time_preferences)
      ? partner.time_preferences.map((item) => TIME_LABELS[item] || titleCase(item))
      : [];

    const avatarHtml = clean(partner.avatar_url)
      ? `<img src="${escapeHtml(partner.avatar_url)}" alt="" />`
      : `<span aria-hidden="true">${escapeHtml(initialFor(partner.display_name))}</span>`;

    const pills = [
      partner.area ? `📍 ${partner.area}` : null,
      MODE_LABELS[partner.mode] || titleCase(partner.mode),
      EXPERIENCE_LABELS[partner.experience_level] || titleCase(partner.experience_level),
      ...times.slice(0, 3)
    ].filter(Boolean);

    article.innerHTML = `
      <div class="partner-person-card__top">
        <a class="partner-avatar" href="ari-circle.html?user=${encodeURIComponent(partner.user_id)}" aria-label="View ${escapeHtml(partner.display_name || "profile")}">
          ${avatarHtml}
        </a>
        <div class="partner-person-card__identity">
          <strong>${escapeHtml(partner.display_name || "ARI User")}</strong>
          <span>${escapeHtml(handle)}</span>
        </div>
        <span class="partner-person-card__activity-icon" aria-label="${escapeHtml(meta.label)}">${meta.emoji}</span>
      </div>
      <div class="partner-person-card__body">
        ${partner.bio ? `<p class="partner-person-card__bio">${escapeHtml(partner.bio)}</p>` : ""}
        ${partner.note ? `<p class="partner-person-card__note">“${escapeHtml(partner.note)}”</p>` : ""}
        <div class="partner-meta-row">
          ${pills.map((pill) => `<span class="partner-meta-pill">${escapeHtml(pill)}</span>`).join("")}
        </div>
      </div>
      <div class="partner-person-card__actions">
        <a class="partner-secondary" href="ari-circle.html?user=${encodeURIComponent(partner.user_id)}">View profile</a>
        <button class="partner-primary" type="button" data-interest-intent="${escapeHtml(partner.intent_id)}" data-busy-sensitive>Say hey</button>
      </div>
    `;

    article.querySelector("[data-interest-intent]")?.addEventListener("click", () => {
      openInviteFor(partner);
    });

    return article;
  }

  function openInviteFor(partner) {
    state.activeInviteTarget = partner;
    const meta = activityMeta(partner.activity);
    $("inviteDialogTitle").textContent = `Say hey to ${clean(partner.display_name) || "them"}`;
    $("inviteDialogDescription").textContent =
      `You’re both interested in ${meta.label.toLowerCase()}. Pick a low-pressure opener — they choose whether to connect.`;
    openDialog("inviteDialog");
  }

  async function sendInvite(starterKey) {
    const partner = state.activeInviteTarget;
    if (!partner || state.busy) return;

    setBusy(true);

    try {
      await rpc("ari_circle_send_partner_invite", {
        requested_intent_id: partner.intent_id,
        requested_starter_key: starterKey
      });

      closeDialog("inviteDialog");
      showToast(`Invite sent to ${clean(partner.display_name) || "this person"}. No awkward cold DM.`);
      state.activeInviteTarget = null;
    } catch (error) {
      console.error("Partner invite failed:", error);
      showToast(error.message || "Could not send the invite.", 4500);
    } finally {
      setBusy(false);
    }
  }

  async function loadInvites() {
    try {
      const data = await rpc("ari_circle_list_partner_invites", {
        requested_direction: "received"
      });

      state.receivedInvites = (Array.isArray(data) ? data : [])
        .filter((invite) => invite.status === "pending");
      renderInvites();
    } catch (error) {
      console.error("Partner invite loading failed:", error);
      state.receivedInvites = [];
      renderInvites();
    }
  }

  function renderInvites() {
    const section = $("invitesSection");
    const host = $("inviteList");
    const count = $("inviteCount");

    host.replaceChildren();

    if (!state.receivedInvites.length) {
      section.hidden = true;
      count.textContent = "";
      return;
    }

    section.hidden = false;
    count.textContent = `(${state.receivedInvites.length})`;

    state.receivedInvites.forEach((invite) => {
      const meta = activityMeta(invite.activity);
      const card = document.createElement("article");
      card.className = "partner-invite-card";

      const avatarHtml = clean(invite.other_avatar_url)
        ? `<img src="${escapeHtml(invite.other_avatar_url)}" alt="" />`
        : `<span aria-hidden="true">${escapeHtml(initialFor(invite.other_display_name))}</span>`;

      card.innerHTML = `
        <div class="partner-invite-card__top">
          <a class="partner-avatar" href="ari-circle.html?user=${encodeURIComponent(invite.other_user_id)}">
            ${avatarHtml}
          </a>
          <div class="partner-invite-card__copy">
            <strong>${escapeHtml(invite.other_display_name || "ARI User")} wants to connect</strong>
            <span>${meta.emoji} ${escapeHtml(meta.label)} · ${escapeHtml(invite.area || "General area")}</span>
          </div>
        </div>
        <p class="partner-invite-card__message">${escapeHtml(invite.starter_text)}</p>
        <div class="partner-invite-card__actions">
          <button class="partner-secondary" type="button" data-decline-invite="${escapeHtml(invite.invite_id)}" data-busy-sensitive>Not now</button>
          <button class="partner-primary" type="button" data-accept-invite="${escapeHtml(invite.invite_id)}" data-busy-sensitive>Connect</button>
        </div>
      `;

      card.querySelector("[data-decline-invite]")?.addEventListener("click", () => {
        respondToInvite(invite, false);
      });

      card.querySelector("[data-accept-invite]")?.addEventListener("click", () => {
        respondToInvite(invite, true);
      });

      host.append(card);
    });
  }

  async function respondToInvite(invite, accepted) {
    if (state.busy) return;
    setBusy(true);

    try {
      const result = await rpc("ari_circle_respond_partner_invite", {
        requested_invite_id: invite.invite_id,
        accept_invite: Boolean(accepted)
      });

      await loadInvites();

      if (!accepted) {
        showToast("Invite dismissed.");
        return;
      }

      const meta = activityMeta(invite.activity);
      $("matchDialogText").textContent =
        `You and ${clean(invite.other_display_name) || "this person"} both want to connect around ${meta.label.toLowerCase()}.`;

      if (result?.conversation_id) {
        sessionStorage.setItem("ariCirclePartnerConversationId", String(result.conversation_id));
      }

      openDialog("matchDialog");
    } catch (error) {
      console.error("Partner invite response failed:", error);
      showToast(error.message || "Could not update this invite.", 4500);
    } finally {
      setBusy(false);
    }
  }

  async function refreshAll() {
    if (!state.age?.verified) return;
    await Promise.all([
      loadOwnIntents(),
      loadPartners(),
      loadInvites()
    ]);
  }

  function bindActivityFilters() {
    $("activityStrip")?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-activity]");
      if (!button) return;

      state.selectedActivity = button.dataset.activity || "";
      syncActivityChips();
      await loadPartners();
    });
  }

  function bindSearch() {
    $("partnerSearchForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      state.area = clean($("partnerAreaSearch").value);
      await loadPartners();
    });

    $("refreshPartnersButton")?.addEventListener("click", loadPartners);
  }

  function bindDialogs() {
    document.addEventListener("click", (event) => {
      const close = event.target.closest("[data-close-dialog]");
      if (!close) return;
      closeDialog(close.dataset.closeDialog);
    });

    $("ageForm")?.addEventListener("submit", verifyAge);
    $("intentForm")?.addEventListener("submit", saveIntent);

    $("starterList")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-starter]");
      if (!button) return;
      sendInvite(button.dataset.starter);
    });
  }

  function bindLaunchers() {
    [$("openIntentButton"), $("editIntentButton"), $("emptyCreateButton")]
      .filter(Boolean)
      .forEach((button) => button.addEventListener("click", openIntentEditor));

    document.querySelectorAll("[data-coming-soon]").forEach((button) => {
      button.addEventListener("click", () => {
        showToast(`${button.dataset.comingSoon} is next in the ARI Circle rebuild.`);
      });
    });
  }

  async function init() {
    try {
      state.client = window.calbuddySupabase || window.supabaseClient || null;
      if (!state.client) {
        throw new Error("Supabase is unavailable.");
      }

      const user = await requireUser();
      if (!user) return;

      await loadAgeState();

      $("partnerPage").hidden = false;
      $("partnerLoading").hidden = true;

      bindActivityFilters();
      bindSearch();
      bindDialogs();
      bindLaunchers();

      if (!state.age?.verified) {
        openDialog("ageDialog");
        $("partnerResultStatus").textContent = "Verify your age to use Partner Finder.";
        return;
      }

      await refreshAll();
    } catch (error) {
      console.error("ARI Circle Partner Finder failed to start:", error);
      $("partnerLoading").innerHTML = `
        <strong>Partner Finder couldn’t open.</strong>
        <span>${escapeHtml(error.message || "Please try again.")}</span>
        <a class="partner-secondary" href="ari-circle.html">Back to ARI Circle</a>
      `;
    }
  }

  window.AriCirclePartnerFinder = Object.freeze({
    version: VERSION,
    refresh: refreshAll
  });

  document.addEventListener("DOMContentLoaded", init);
})();
