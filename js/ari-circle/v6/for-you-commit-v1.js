/* =============================================================
   ARI CIRCLE V6.1 — FOR YOU COMMIT
   Adds a direct commitment action to For You cards while keeping the existing
   detail link. Each rendered card is bound to the exact Opportunity UUID from
   the same server context that rendered it, then reverified at tap time.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const MAX_FRESH_MATCHES = 10;
  const state = {
    client: null,
    busyCards: new WeakSet(),
    observer: null,
    syncing: false,
    syncQueued: false
  };

  const clean = (value, max = 1000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

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

  async function waitForV6Ready(timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const api = window.AriCircleActionNetworkV6;
      const page = document.getElementById("v6Page");
      if (api && typeof api.refresh === "function" && page && !page.hasAttribute("hidden")) return api;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error("The Circle V6 experience is not ready yet.");
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  async function accessToken() {
    const { data, error } = await state.client.auth.getSession();
    if (error) throw error;
    return clean(data?.session?.access_token, 7000) || null;
  }

  async function freshContext() {
    const token = await accessToken();
    if (!token) throw new Error("Your ARI session needs to be refreshed.");

    const response = await fetch("/api/ari-vnext-circle-context", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ surface: "circle_v6_for_you_commit" }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.available !== true) {
      throw new Error(clean(data?.error) || "Circle could not verify this recommendation right now.");
    }
    return data;
  }

  function cardIdentity(card) {
    const opportunityId = clean(card?.dataset?.v6OpportunityId, 120);
    const title = clean(card?.querySelector?.("h3")?.textContent, 120);
    const eyebrow = clean(card?.querySelector?.(".v6-eyebrow")?.textContent, 160).toLowerCase();
    const type = eyebrow.startsWith("mission") ? "mission" : eyebrow.startsWith("meet up") ? "meetup" : "";
    return { opportunityId, title, type };
  }

  function bindCardIdentities(context = {}) {
    const list = document.getElementById("v6ForYouList");
    if (!list) return;

    const cards = [...list.querySelectorAll(".v6-opportunity")];
    const rows = (Array.isArray(context?.bestMatches) ? context.bestMatches : []).slice(0, 6);

    cards.forEach((card, index) => {
      delete card.dataset.v6OpportunityId;
      const item = rows[index];
      if (!item) return;

      const identity = cardIdentity(card);
      const itemId = clean(item?.id, 120);
      const itemType = clean(item?.type, 30).toLowerCase();
      const itemTitle = clean(item?.title, 120);

      if (!isUuid(itemId) || !identity.type || !identity.title) return;
      if (itemType !== identity.type || itemTitle !== identity.title) return;
      card.dataset.v6OpportunityId = itemId;
    });
  }

  function resolveFreshOpportunity(card, context = {}) {
    const identity = cardIdentity(card);
    if (!isUuid(identity.opportunityId) || !identity.title || !identity.type) {
      return { target: null, reason: "card_identity_missing" };
    }

    const matches = (Array.isArray(context?.bestMatches) ? context.bestMatches : [])
      .slice(0, MAX_FRESH_MATCHES)
      .filter((item) => clean(item?.id, 120) === identity.opportunityId)
      .filter((item) => clean(item?.type, 30).toLowerCase() === identity.type)
      .filter((item) => clean(item?.title, 120) === identity.title);

    if (matches.length !== 1) {
      return { target: null, reason: matches.length ? "ambiguous_current_match" : "recommendation_changed" };
    }

    return { target: matches[0], reason: "exact_current_match" };
  }

  function decorateCards() {
    const list = document.getElementById("v6ForYouList");
    if (!list) return;

    list.querySelectorAll(".v6-opportunity").forEach((card) => {
      const openLink = card.querySelector(".v6-primary-link");
      if (!openLink) return;

      openLink.classList.add("v6-commit-details");
      openLink.textContent = "Details";

      const existing = card.querySelector("[data-v6-commit-action]");
      if (existing) return;
      if (!isUuid(card?.dataset?.v6OpportunityId)) return;

      const actions = document.createElement("div");
      actions.className = "v6-commit-actions";

      const commit = document.createElement("button");
      commit.type = "button";
      commit.className = "v6-card-action is-primary";
      commit.dataset.v6CommitAction = "true";
      commit.textContent = cardIdentity(card).type === "mission" ? "Join Mission" : "Join / Request";
      commit.addEventListener("click", () => commitCard(card));

      openLink.parentNode?.insertBefore(actions, openLink);
      actions.append(commit, openLink);

      const status = document.createElement("p");
      status.className = "v6-commit-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      actions.insertAdjacentElement("afterend", status);
    });
  }

  async function commitCard(card) {
    if (!card || state.busyCards.has(card)) return;
    state.busyCards.add(card);
    setBusy(card, true);
    setStatus(card, "Checking current availability…");

    try {
      const context = await freshContext();
      const resolved = resolveFreshOpportunity(card, context);
      if (!resolved.target) {
        setStatus(card, "This recommendation changed. Refreshing For You before any action is taken.");
        await refreshV6();
        return;
      }

      const item = resolved.target;
      const viewerState = clean(item?.viewerState, 40).toLowerCase();
      if (viewerState && viewerState !== "available") {
        setStatus(card, currentStateMessage(viewerState));
        await refreshV6();
        return;
      }

      if (item.type === "mission") {
        await commitMission(item);
        setStatus(card, "Mission joined.");
      } else if (item.type === "meetup") {
        const result = await commitMeetup(item);
        setStatus(card, meetupResultMessage(result));
      } else {
        throw new Error("This Opportunity cannot be committed from For You yet.");
      }

      window.dispatchEvent(new CustomEvent("ari:circleChanged", {
        detail: { source: "circle_v6_for_you_commit", opportunityType: item.type }
      }));
      await refreshV6();
    } catch (error) {
      setStatus(card, clean(error?.message, 300) || "Circle could not commit this Opportunity right now.");
    } finally {
      state.busyCards.delete(card);
      setBusy(card, false);
    }
  }

  async function commitMeetup(item = {}) {
    const meetupId = clean(item?.id, 120);
    if (!isUuid(meetupId)) throw new Error("This meetup no longer has a valid identity.");
    return rpc("ari_circle_apply_join_intent", { requested_meetup_id: meetupId });
  }

  async function commitMission(item = {}) {
    const missionId = clean(item?.id, 120);
    if (!isUuid(missionId)) throw new Error("This Mission no longer has a valid identity.");
    return rpc("ari_circle_join_quest", { requested_quest_id: missionId });
  }

  function meetupResultMessage(result = {}) {
    const resolution = clean(result?.resolution, 40).toLowerCase();
    if (resolution === "joined") return "Joined. This meetup is now in Your next.";
    if (resolution === "requested") return "Request sent. The host is the point of contact.";
    if (resolution === "waitlisted") return "Added to the waitlist. Circle will keep your status current.";
    if (resolution === "already_joined") return "You are already joined.";
    if (resolution === "already_host") return "You are hosting this meetup.";
    if (resolution === "declined") return "This request is no longer available to join.";
    return "Meetup status updated.";
  }

  function currentStateMessage(viewerState) {
    if (viewerState === "joined") return "You are already joined.";
    if (viewerState === "host") return "You are hosting this meetup.";
    if (viewerState === "pending") return "Your request is already pending.";
    if (viewerState === "waitlisted") return "You are already on the waitlist.";
    if (viewerState === "creator") return "You created this Mission.";
    if (viewerState === "submitted") return "Your Mission progress is awaiting review.";
    if (viewerState === "verified" || viewerState === "completed") return "This Opportunity is already completed for you.";
    return "This Opportunity changed state. For You is refreshing.";
  }

  async function refreshV6() {
    if (state.syncing) return null;
    const api = window.AriCircleActionNetworkV6;
    if (!api || typeof api.refresh !== "function") return null;

    state.syncing = true;
    try {
      const context = await api.refresh();
      bindCardIdentities(context);
      decorateCards();
      return context;
    } finally {
      state.syncing = false;
    }
  }

  function scheduleSync() {
    if (state.syncing || state.syncQueued) return;
    state.syncQueued = true;
    queueMicrotask(async () => {
      state.syncQueued = false;
      if (state.syncing) return;

      const list = document.getElementById("v6ForYouList");
      if (!list) return;
      const hasUnboundCard = [...list.querySelectorAll(".v6-opportunity")]
        .some((card) => !isUuid(card?.dataset?.v6OpportunityId));

      if (!hasUnboundCard) {
        decorateCards();
        return;
      }

      try {
        await refreshV6();
      } catch (error) {
        console.warn("[ARI Circle V6 For You Commit sync]", clean(error?.message, 300) || error);
        decorateCards();
      }
    });
  }

  function setBusy(card, busy) {
    card?.querySelectorAll?.("button[data-v6-commit-action]")?.forEach((node) => {
      node.disabled = Boolean(busy);
    });
  }

  function setStatus(card, text) {
    const node = card?.querySelector?.(".v6-commit-status");
    if (node) node.textContent = clean(text, 300);
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 120));
  }

  async function boot() {
    try {
      state.client = await waitForClient();
      await waitForV6Ready();
      const list = document.getElementById("v6ForYouList");
      if (!list) return;
      state.observer = new MutationObserver(scheduleSync);
      state.observer.observe(list, { childList: true });
      await refreshV6();
    } catch (error) {
      console.warn("[ARI Circle V6 For You Commit]", clean(error?.message, 300) || error);
      decorateCards();
    }
  }

  window.AriCircleForYouCommitV1 = Object.freeze({ version: VERSION });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
