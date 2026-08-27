/* =============================================================
   ARI CIRCLE — ARI NEXT ASSIST V1
   Keeps ARI Next intent-first instead of filter-first.
   - Free-text intent + quick intents are the primary controls.
   - Structured Activity / When / Group remain optional refinements.
   - Saved Circle area/radius remain authoritative through the existing
     hidden search-location controls.
   - If there is no active intent yet, current public opportunities can be
     shown as unranked options without pretending they are matched fits.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const $ = (id) => document.getElementById(id);
  const clean = (value, max = 1000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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
    const supabase = await waitForClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession().catch(() => ({ data: null }));
    const token = clean(data?.session?.access_token, 7000);
    if (!token) return;

    const response = await fetch("/api/ari-vnext-circle-context", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ surface: "ari_next_initial_options" }),
      cache: "no-store"
    }).catch(() => null);
    if (!response?.ok) return;
    const context = await response.json().catch(() => null);
    if (context?.available !== true) return;
    if (Array.isArray(context?.activeIntents) && context.activeIntents.length) return;
    if (Array.isArray(context?.bestMatches) && context.bestMatches.length) return;

    const opportunities = Array.isArray(context?.opportunities) ? context.opportunities.slice(0, 4) : [];
    if (!opportunities.length) return;

    const list = $("v6ForYouList");
    const empty = $("v6ForYouEmpty");
    const title = $("v6ForYouTitle");
    if (!list || !empty || list.childElementCount) return;

    list.replaceChildren(...opportunities.map((item, index) => genericOpportunityCard(item, index === 0)));
    empty.hidden = true;
    if (title) title.textContent = "Worth a look";
    const eyebrow = title?.closest?.(".v6-section-heading")?.querySelector?.(".v6-eyebrow");
    if (eyebrow) eyebrow.textContent = "ARI FOUND";
  }

  function boot() {
    bindRefinementIntent();
    bindPrompt();
    observeStatusCopy();
    window.setTimeout(showCurrentOptionsWhenNoIntent, 700);
  }

  window.AriCircleAriNextAssistV1 = Object.freeze({
    version: VERSION,
    inferActivity,
    inferWhen,
    inferGroup,
    applyPromptInference
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
