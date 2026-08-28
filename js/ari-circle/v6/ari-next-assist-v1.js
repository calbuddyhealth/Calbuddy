/* =============================================================
   ARI CIRCLE — ARI NEXT ASSIST V1.1
   Keeps ARI Next intent-first instead of filter-first.
   - Free-text intent + quick intents are the primary controls.
   - Structured Activity / When / Group remain optional refinements.
   - Saved Circle area/radius remain authoritative through the existing
     hidden search-location controls.
   - Duplicate active intents are intercepted before another suggestion is
     created, and every successful creation gets an immediate visible notice.
   - If there is no active intent yet, current public opportunities can be
     shown as unranked options without pretending they are matched fits.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const $ = (id) => document.getElementById(id);
  const clean = (value, max = 1000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const state = {
    duplicateGuardBypass: false,
    duplicateGuardBusy: false,
    pendingCreation: null,
    pendingCreationTimer: null,
    noticeBusy: false
  };

  const QUICK_PROMPTS = Object.freeze({
    anything: "Anything sounds good",
    workout: "I want a workout",
    outside: "I want to get outside",
    social: "I want something social"
  });

  function client() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  async function waitForClient(timeout = 6000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const found = client();
      if (found?.auth) return found;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    return null;
  }

  async function waitForInitialRender(timeout = 6000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const page = $("v6Page");
      if (page && !page.hasAttribute("hidden")) return true;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    return false;
  }

  async function accessToken() {
    const supabase = await waitForClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession().catch(() => ({ data: null }));
    return clean(data?.session?.access_token, 7000) || null;
  }

  async function loadContext(surface = "ari_next_assist") {
    const token = await accessToken();
    if (!token) return null;
    const response = await fetch("/api/ari-vnext-circle-context", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ surface }),
      cache: "no-store"
    }).catch(() => null);
    if (!response?.ok) return null;
    const context = await response.json().catch(() => null);
    return context?.available === true ? context : null;
  }

  function inferActivity(text) {
    const value = clean(text, 400).toLowerCase();
    if (!value) return null;
    if (/\b(run|running|jog|jogging)\b/.test(value)) return "running";
    if (/\b(walk|walking|stroll)\b/.test(value)) return "walking";
    if (/\b(hike|hiking|trail)\b/.test(value)) return "hiking";
    if (/\b(gym|lift|lifting|weights?|strength|workout|train)\b/.test(value)) return "gym";
    if (/\b(bike|biking|cycle|cycling)\b/.test(value)) return "cycling";
    if (/\byoga\b/.test(value)) return "yoga";
    if (/\b(basketball|soccer|football|tennis|pickleball|volleyball|sport|sports)\b/.test(value)) return "sports";
    if (/\b(volunteer|volunteering|give back|help out)\b/.test(value)) return "volunteer";
    if (/\b(community|community event)\b/.test(value)) return "community";
    if (/\b(outside|outdoors?|park|beach|fresh air)\b/.test(value)) return "outdoor";
    if (/\b(anything|whatever|surprise me|open to anything)\b/.test(value)) return "any";
    return null;
  }

  function inferWhen(text) {
    const value = clean(text, 400).toLowerCase();
    if (!value) return null;
    if (/\bweekend\b/.test(value)) return "weekend";
    if (/\b(tomorrow|tomorrow night|tomorrow evening)\b/.test(value)) return "tomorrow_evening";
    if (/\b(this week|next week|few days|sometime this week)\b/.test(value)) return "next7d";
    if (/\b(now|soon|today|tonight|this evening|next few hours?)\b/.test(value)) return "next3h";
    return null;
  }

  function inferGroup(text) {
    const value = clean(text, 400).toLowerCase();
    if (!value) return null;
    if (/\b(alone|solo|by myself)\b/.test(value)) return "1-1";
    if (/\b(small group|couple people|few people)\b/.test(value)) return "2-4";
    if (/\b(social|group|with people|meet people|make friends)\b/.test(value)) return "3-8";
    return null;
  }

  function setSelectFromInference(id, value, force = false) {
    if (!value) return;
    const node = $(id);
    if (!node) return;
    if (!force && node.dataset.userRefined === "true") return;
    const exists = [...node.options].some((option) => option.value === value);
    if (exists) node.value = value;
  }

  function applyPromptInference({ force = false } = {}) {
    const prompt = clean($("v6IntentPrompt")?.value, 400);
    if (!prompt) return;
    setSelectFromInference("v6IntentActivity", inferActivity(prompt), force);
    setSelectFromInference("v6IntentWhen", inferWhen(prompt), force);
    setSelectFromInference("v6IntentGroup", inferGroup(prompt), force);
  }

  function bindRefinementIntent() {
    ["v6IntentActivity", "v6IntentWhen", "v6IntentGroup"].forEach((id) => {
      $(id)?.addEventListener("change", (event) => {
        event.currentTarget.dataset.userRefined = "true";
      });
    });
  }

  function bindPrompt() {
    const form = $("v6IntentForm");
    const prompt = $("v6IntentPrompt");
    if (!form || !prompt) return;

    form.addEventListener("submit", () => applyPromptInference(), true);

    document.querySelectorAll("[data-v6-quick-intent]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = clean(button.dataset.v6QuickIntent, 30).toLowerCase();
        const value = QUICK_PROMPTS[key];
        if (!value) return;
        prompt.value = value;
        ["v6IntentActivity", "v6IntentWhen", "v6IntentGroup"].forEach((id) => {
          const select = $(id);
          if (select) delete select.dataset.userRefined;
        });
        applyPromptInference({ force: true });
        form.requestSubmit();
      });
    });
  }

  function intentWindow(preset) {
    const now = new Date();

    if (preset === "tomorrow_evening") {
      const start = new Date(now);
      start.setDate(start.getDate() + 1);
      start.setHours(17, 0, 0, 0);
      const end = new Date(start);
      end.setHours(21, 0, 0, 0);
      return { start, end };
    }

    if (preset === "weekend") {
      const start = new Date(now);
      const day = start.getDay();
      const daysToSaturday = (6 - day + 7) % 7;
      start.setDate(start.getDate() + daysToSaturday);
      start.setHours(daysToSaturday === 0 ? Math.max(start.getHours(), 7) : 7, 0, 0, 0);
      if (start.getTime() <= now.getTime() + 10 * 60 * 1000) start.setTime(now.getTime() + 15 * 60 * 1000);

      const end = new Date(start);
      const remainingToSunday = (7 - end.getDay()) % 7;
      end.setDate(end.getDate() + remainingToSunday);
      end.setHours(20, 0, 0, 0);
      if (end <= start) end.setTime(start.getTime() + 8 * 60 * 60 * 1000);
      return { start, end };
    }

    if (preset === "next7d") {
      const start = new Date(now.getTime() + 15 * 60 * 1000);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { start, end };
    }

    const start = new Date(now.getTime() + 15 * 60 * 1000);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    return { start, end };
  }

  function currentIntentCandidate() {
    const activity = clean($("v6IntentActivity")?.value, 40).toLowerCase() || "any";
    const preset = clean($("v6IntentWhen")?.value, 40) || "next3h";
    const area = clean($("v6IntentArea")?.value, 100) || null;
    const group = clean($("v6IntentGroup")?.value, 20) || "1-8";
    const radius = Number(clean($("v6IntentRadius")?.value, 8) || "25");
    const [groupMin, groupMax] = group.split("-").map((value) => Number(value));
    const window = intentWindow(preset);
    return {
      activity,
      preset,
      area,
      groupMin,
      groupMax,
      radius,
      start: window.start,
      end: window.end
    };
  }

  function normalizedArea(value) {
    return clean(value, 100).toLowerCase();
  }

  function overlapRatio(intent = {}, candidate = {}) {
    const aStart = Date.parse(intent?.timeWindowStart || "");
    const aEnd = Date.parse(intent?.timeWindowEnd || "");
    const bStart = candidate?.start instanceof Date ? candidate.start.getTime() : NaN;
    const bEnd = candidate?.end instanceof Date ? candidate.end.getTime() : NaN;
    if (![aStart, aEnd, bStart, bEnd].every(Number.isFinite)) return 0;
    const overlap = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
    const shortest = Math.min(Math.max(1, aEnd - aStart), Math.max(1, bEnd - bStart));
    return overlap / shortest;
  }

  function duplicateIntent(context, candidate) {
    const intents = Array.isArray(context?.activeIntents) ? context.activeIntents : [];
    return intents.find((intent) => (
      clean(intent?.activity, 40).toLowerCase() === candidate.activity &&
      normalizedArea(intent?.area) === normalizedArea(candidate.area) &&
      Number(intent?.desiredGroupMin) === candidate.groupMin &&
      Number(intent?.desiredGroupMax) === candidate.groupMax &&
      Number(intent?.radiusMiles) === candidate.radius &&
      overlapRatio(intent, candidate) >= 0.6
    )) || null;
  }

  function ensureSuggestionNotice() {
    let notice = $("v6SuggestionNotice");
    if (notice) return notice;
    const status = $("v6IntentStatus");
    if (!status?.parentNode) return null;

    notice = document.createElement("div");
    notice.id = "v6SuggestionNotice";
    notice.className = "v6-suggestion-notice";
    notice.hidden = true;
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    status.insertAdjacentElement("afterend", notice);
    return notice;
  }

  function suggestionTarget() {
    const bundles = $("v6IntentBundles");
    if (bundles && !bundles.hidden) return bundles;
    const active = $("v6ActiveIntent");
    if (active && !active.hidden) return active;
    return $("ari-next");
  }

  function scrollToSuggestions() {
    suggestionTarget()?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  function noticeMarkup({ eyebrow, title, detail, canDismiss = false, canUndo = false }) {
    return `
      <div class="v6-suggestion-notice__copy">
        <span>${escapeHtml(eyebrow)}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
      <div class="v6-suggestion-notice__actions">
        ${canUndo ? '<button type="button" data-v6-notice-undo>Undo</button>' : '<button type="button" data-v6-notice-view>View suggestion</button>'}
        ${canDismiss ? '<button type="button" data-v6-notice-dismiss>Dismiss</button>' : ""}
      </div>
    `;
  }

  function showSuggestionNotice({ eyebrow, title, detail, candidate = null, canDismiss = false, undoIntent = null }) {
    const notice = ensureSuggestionNotice();
    if (!notice) return;
    notice.hidden = false;
    notice.innerHTML = noticeMarkup({
      eyebrow,
      title,
      detail,
      canDismiss,
      canUndo: Boolean(undoIntent)
    });

    notice.querySelector("[data-v6-notice-view]")?.addEventListener("click", scrollToSuggestions);
    notice.querySelector("[data-v6-notice-dismiss]")?.addEventListener("click", () => dismissMatchingSuggestion(candidate));
    notice.querySelector("[data-v6-notice-undo]")?.addEventListener("click", () => restoreSuggestion(undoIntent));
  }

  async function dismissMatchingSuggestion(candidate) {
    if (!candidate || state.noticeBusy) return;
    state.noticeBusy = true;
    try {
      const context = await loadContext("ari_next_notice_dismiss");
      const intent = duplicateIntent(context, candidate);
      if (!intent?.intentId) throw new Error("That suggestion is no longer active.");
      const supabase = await waitForClient();
      const { error } = await supabase.rpc("ari_circle_cancel_action_intent", {
        requested_intent_id: intent.intentId
      });
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("ari:circleChanged", { detail: { source: "ari_next_notice_dismiss" } }));
      await window.AriCircleActionNetworkV6?.refresh?.().catch(() => null);
      showSuggestionNotice({
        eyebrow: "SUGGESTION DISMISSED",
        title: `${activityLabel(intent.activity)} suggestion removed`,
        detail: "It is no longer active. Undo will restore the same private intent.",
        undoIntent: intent
      });
    } catch (error) {
      showSuggestionNotice({
        eyebrow: "COULD NOT DISMISS",
        title: "The suggestion stayed active",
        detail: clean(error?.message, 220) || "Try again in a moment.",
        candidate,
        canDismiss: true
      });
    } finally {
      state.noticeBusy = false;
    }
  }

  async function restoreSuggestion(intent) {
    if (!intent || state.noticeBusy) return;
    state.noticeBusy = true;
    try {
      const supabase = await waitForClient();
      const { error } = await supabase.rpc("ari_circle_create_action_intent", {
        requested_activity: clean(intent?.activity, 40).toLowerCase() || "any",
        requested_time_window_start: intent?.timeWindowStart,
        requested_time_window_end: intent?.timeWindowEnd,
        requested_experience_level: clean(intent?.experienceLevel, 40).toLowerCase() || "any",
        requested_intensity: clean(intent?.intensity, 40).toLowerCase() || "any",
        requested_group_min: Math.max(1, Number(intent?.desiredGroupMin) || 1),
        requested_group_max: Math.max(1, Number(intent?.desiredGroupMax) || 8),
        requested_area: clean(intent?.area, 100) || null,
        requested_radius_miles: Number(intent?.radiusMiles) || 25,
        requested_note: null,
        requested_latitude: null,
        requested_longitude: null
      });
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("ari:circleChanged", { detail: { source: "ari_next_notice_restore" } }));
      await window.AriCircleActionNetworkV6?.refresh?.().catch(() => null);
      const candidate = {
        activity: clean(intent?.activity, 40).toLowerCase() || "any",
        area: clean(intent?.area, 100) || null,
        groupMin: Math.max(1, Number(intent?.desiredGroupMin) || 1),
        groupMax: Math.max(1, Number(intent?.desiredGroupMax) || 8),
        radius: Number(intent?.radiusMiles) || 25,
        start: new Date(intent?.timeWindowStart),
        end: new Date(intent?.timeWindowEnd)
      };
      showSuggestionNotice({
        eyebrow: "PRIVATE SUGGESTION RESTORED",
        title: `${activityLabel(intent.activity)} is back in ARI Next`,
        detail: "Review the matched plan below. Nobody has been invited or assumed to attend.",
        candidate,
        canDismiss: true
      });
    } catch (error) {
      showSuggestionNotice({
        eyebrow: "COULD NOT RESTORE",
        title: "The suggestion was not restored",
        detail: clean(error?.message, 220) || "Try creating it again with Ask Ari."
      });
    } finally {
      state.noticeBusy = false;
    }
  }

  async function guardDuplicateSubmission(event) {
    if (state.duplicateGuardBypass) {
      state.duplicateGuardBypass = false;
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.duplicateGuardBusy) return;

    const form = event.currentTarget;
    const status = $("v6IntentStatus");
    const candidate = currentIntentCandidate();
    state.duplicateGuardBusy = true;
    if (status) status.textContent = "Checking your current ARI Next suggestions…";

    try {
      const context = await loadContext("ari_next_duplicate_preflight");
      const duplicate = duplicateIntent(context, candidate);
      if (duplicate) {
        if (status) status.textContent = "";
        showSuggestionNotice({
          eyebrow: "ALREADY IN ARI NEXT",
          title: `You already have a ${activityLabel(candidate.activity)} suggestion for this time`,
          detail: "Ari kept the existing suggestion instead of creating a duplicate.",
          candidate,
          canDismiss: true
        });
        return;
      }

      state.pendingCreation = candidate;
      clearTimeout(state.pendingCreationTimer);
      state.pendingCreationTimer = window.setTimeout(() => {
        state.pendingCreation = null;
      }, 8000);
      state.duplicateGuardBypass = true;
      form.requestSubmit();
    } catch {
      state.pendingCreation = candidate;
      state.duplicateGuardBypass = true;
      form.requestSubmit();
    } finally {
      state.duplicateGuardBusy = false;
    }
  }

  function bindDuplicateGuard() {
    $("v6IntentForm")?.addEventListener("submit", guardDuplicateSubmission, true);
    window.addEventListener("ari:circleChanged", (event) => {
      if (event?.detail?.source !== "circle_v6_intent" || !state.pendingCreation) return;
      const candidate = state.pendingCreation;
      state.pendingCreation = null;
      clearTimeout(state.pendingCreationTimer);
      showSuggestionNotice({
        eyebrow: "NEW PRIVATE SUGGESTION",
        title: `Ari added a ${activityLabel(candidate.activity)} suggestion to ARI Next`,
        detail: "It is only a suggestion until you choose Make this happen. Nobody has been invited or assumed to attend.",
        candidate,
        canDismiss: true
      });
    });
  }

  function syncNetworkSummary() {
    const node = $("v6NetworkSummary");
    if (!node) return;
    const text = clean(node.textContent, 300);
    node.hidden = !text || /loading your action network|tell circle what you are up for/i.test(text);
  }

  function softenInternalStatus() {
    const node = $("v6PageStatus");
    if (!node) return;
    const text = clean(node.textContent, 500);
    if (!text) return;
    if (/ari circle context is not configured|action network.*unavailable|action network lab/i.test(text)) {
      const friendly = "ARI Next couldn’t load recommendations right now. Try Refresh in a moment.";
      if (node.textContent !== friendly) node.textContent = friendly;
    }
  }

  function observeStatusCopy() {
    const summary = $("v6NetworkSummary");
    const status = $("v6PageStatus");
    if (summary) {
      syncNetworkSummary();
      new MutationObserver(syncNetworkSummary).observe(summary, { childList: true, characterData: true, subtree: true });
    }
    if (status) {
      softenInternalStatus();
      new MutationObserver(softenInternalStatus).observe(status, { childList: true, characterData: true, subtree: true });
    }
  }

  function activityLabel(value) {
    const text = clean(value || "activity", 80).replaceAll("_", " ");
    return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function dateTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function genericOpportunityCard(item = {}, featured = false) {
    const article = document.createElement("article");
    article.className = `v6-opportunity${featured ? " is-featured" : ""}`;
    const mission = clean(item?.type, 30).toLowerCase() === "mission";
    const spots = item?.spotsRemaining === null || item?.spotsRemaining === undefined ? null : Number(item.spotsRemaining);
    const meta = [
      clean(item?.area, 100),
      item?.startsAt ? dateTime(item.startsAt) : "",
      Number.isFinite(spots) ? `${Math.max(0, Math.trunc(spots))} open` : ""
    ].filter(Boolean);
    const href = mission ? "ari-circle-quests.html" : "ari-circle-meetup.html";

    article.innerHTML = `
      <div class="v6-card-topline">
        <span class="v6-eyebrow">${mission ? "MISSION" : "MEET UP"} · ${escapeHtml(activityLabel(item?.activity))}</span>
        ${featured ? '<span class="v6-fit-pill">AVAILABLE</span>' : ""}
      </div>
      <h3>${escapeHtml(item?.title || "Current opportunity")}</h3>
      <div class="v6-meta">${meta.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>
      <a class="v6-primary-link" href="${href}">Open</a>
    `;
    return article;
  }

  async function showCurrentOptionsWhenNoIntent() {
    if (!(await waitForInitialRender())) return;

    const list = $("v6ForYouList");
    const activeIntent = $("v6ActiveIntent");
    if (!list || list.childElementCount > 0) return;
    if (activeIntent && !activeIntent.hidden) return;

    const context = await loadContext("ari_next_initial_options");
    if (!context) return;
    if (Array.isArray(context?.activeIntents) && context.activeIntents.length) return;
    if (Array.isArray(context?.bestMatches) && context.bestMatches.length) return;

    const opportunities = Array.isArray(context?.opportunities) ? context.opportunities.slice(0, 4) : [];
    if (!opportunities.length) return;

    const empty = $("v6ForYouEmpty");
    const title = $("v6ForYouTitle");
    if (!empty || list.childElementCount) return;

    list.replaceChildren(...opportunities.map((item, index) => genericOpportunityCard(item, index === 0)));
    empty.hidden = true;
    if (title) title.textContent = "Worth a look";
    const eyebrow = title?.closest?.(".v6-section-heading")?.querySelector?.(".v6-eyebrow");
    if (eyebrow) eyebrow.textContent = "ARI FOUND";
  }

  function boot() {
    bindRefinementIntent();
    bindPrompt();
    bindDuplicateGuard();
    observeStatusCopy();
    ensureSuggestionNotice();
    window.setTimeout(showCurrentOptionsWhenNoIntent, 700);
  }

  window.AriCircleAriNextAssistV1 = Object.freeze({
    version: VERSION,
    inferActivity,
    inferWhen,
    inferGroup,
    applyPromptInference,
    duplicateIntent
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
