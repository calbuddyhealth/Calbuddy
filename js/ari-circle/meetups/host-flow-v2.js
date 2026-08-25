/* =============================================================
   ARI CIRCLE — HOST FLOW V2
   Small additive host-experience layer for verified Host progress,
   capacity-aware request review, and host-specific V6 attention copy.
============================================================= */
(() => {
  "use strict";

  const VERSION = "2.0.0";
  const TIER = Object.freeze({
    new_host: "New Host",
    organizer: "Organizer",
    active_host: "Active Host",
    community_leader: "Community Leader",
    community_builder: "Community Builder"
  });

  const state = {
    client: null,
    activeRequestCapacity: null,
    requestObserver: null,
    attentionObserver: null
  };

  const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const $ = (id) => document.getElementById(id);

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

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function tierLabel(value) {
    return TIER[clean(value)] || "New Host";
  }

  function hostProgressPercent(summary = {}) {
    const count = Math.max(0, Number(summary.verified_hosted_meetups) || 0);
    const threshold = Number(summary.next_threshold);
    if (!Number.isFinite(threshold) || threshold <= 0) return 100;

    let floor = 0;
    if (threshold === 10) floor = 3;
    else if (threshold === 25) floor = 10;
    else if (threshold === 50) floor = 25;

    return Math.max(0, Math.min(100, ((count - floor) / Math.max(1, threshold - floor)) * 100));
  }

  async function loadHostProgress() {
    const hud = $("meetupXpCard");
    if (!hud) return;

    let host = $("meetupHostProgress");
    if (!host) {
      host = document.createElement("div");
      host.id = "meetupHostProgress";
      host.className = "circle-host-v2-progress";
      host.innerHTML = `
        <div class="circle-host-v2-progress__copy">
          <span>HOST STATUS</span>
          <strong id="meetupHostTier">Loading…</strong>
          <small id="meetupHostProgressCopy">Verified hosting builds status.</small>
        </div>
        <div class="circle-host-v2-progress__meter" aria-hidden="true"><i id="meetupHostProgressBar"></i></div>
      `;
      hud.append(host);
    }

    try {
      const summary = await rpc("ari_circle_my_host_summary");
      const count = Math.max(0, Number(summary?.verified_hosted_meetups) || 0);
      const remaining = Math.max(0, Number(summary?.remaining_to_next) || 0);
      const next = clean(summary?.next_tier);
      const tier = tierLabel(summary?.tier);
      const bar = $("meetupHostProgressBar");

      $("meetupHostTier").textContent = `${tier} · ${count} verified`;
      $("meetupHostProgressCopy").textContent = next
        ? `${remaining} more verified hosted meetup${remaining === 1 ? "" : "s"} to ${tierLabel(next)}. Hosts earn up to +6 XP on verified completion.`
        : "Top Host tier reached. Keep building real-world activity; verified hosts earn up to +6 XP.";
      if (bar) bar.style.width = `${hostProgressPercent(summary)}%`;
    } catch (error) {
      console.warn("Host progress unavailable:", error);
      $("meetupHostTier").textContent = "Host status";
      $("meetupHostProgressCopy").textContent = "Verified hosted meetups build Host status.";
    }
  }

  function readCapacityFromCard(button) {
    const card = button?.closest?.(".circle-v5-meetup-card");
    if (!card) return null;
    const meta = Array.from(card.querySelectorAll(".circle-v5-meta span"))
      .map((node) => clean(node.textContent))
      .find((text) => text.includes("guests"));
    const match = meta?.match(/(\d+)\s*\/\s*(\d+)\s*guests/i);
    if (!match) return null;
    const joinedGuests = Math.max(0, Number(match[1]) || 0);
    const guestCapacity = Math.max(0, Number(match[2]) || 0);
    return {
      joinedGuests,
      guestCapacity,
      openGuestSpots: Math.max(0, guestCapacity - joinedGuests)
    };
  }

  function updateRequestCapacityUI() {
    const list = $("meetupRequestsList");
    const status = $("meetupRequestsStatus");
    const capacity = state.activeRequestCapacity;
    if (!list || !status || !capacity) return;

    const open = Math.max(0, Number(capacity.openGuestSpots) || 0);
    const cards = Array.from(list.querySelectorAll(".circle-v5-meetup-card"));
    const actionable = cards.filter((card) => card.querySelector('[data-request-decision="accept"]'));
    const waitlisted = cards.filter((card) => clean(card.querySelector(".circle-v5-host-badge")?.textContent).toLowerCase() === "waitlisted");

    actionable.forEach((card) => {
      const accept = card.querySelector('[data-request-decision="accept"]');
      if (!accept) return;
      accept.disabled = open <= 0;
      accept.dataset.hostFlowCapacityDisabled = open <= 0 ? "true" : "false";
      accept.title = open <= 0 ? "No guest spots are open right now." : "Accept this person into an open guest spot.";
    });

    if (!actionable.length) return;
    if (open <= 0) {
      status.textContent = `${actionable.length} request${actionable.length === 1 ? "" : "s"} remain. This meetup is full; keep people waitlisted or decline them.`;
      return;
    }
    if (waitlisted.length) {
      status.textContent = `${open} guest spot${open === 1 ? "" : "s"} open · choose who you want from the request list.`;
      return;
    }
    status.textContent = `${open} guest spot${open === 1 ? "" : "s"} open · ${actionable.length} request${actionable.length === 1 ? "" : "s"} to review.`;
  }

  function bindRequestCapacity() {
    const list = $("meetupRequestsList");
    if (!list) return;

    document.addEventListener("click", (event) => {
      const requestButton = event.target.closest?.('[data-meetup-action="requests"]');
      if (requestButton) {
        state.activeRequestCapacity = readCapacityFromCard(requestButton);
        queueMicrotask(updateRequestCapacityUI);
        return;
      }

      const accept = event.target.closest?.('[data-request-decision="accept"]');
      if (!accept || !state.activeRequestCapacity) return;
      if (accept.dataset.hostFlowCapacityDisabled === "true" || state.activeRequestCapacity.openGuestSpots <= 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        updateRequestCapacityUI();
        return;
      }

      state.activeRequestCapacity.openGuestSpots = Math.max(0, state.activeRequestCapacity.openGuestSpots - 1);
      state.activeRequestCapacity.joinedGuests = Math.min(
        state.activeRequestCapacity.guestCapacity,
        state.activeRequestCapacity.joinedGuests + 1
      );
      setTimeout(updateRequestCapacityUI, 0);
    }, true);

    state.requestObserver = new MutationObserver(updateRequestCapacityUI);
    state.requestObserver.observe(list, { childList: true, subtree: true });
  }

  function patchV6Attention() {
    const list = $("v6AttentionList");
    if (!list) return;

    const patch = () => {
      for (const row of list.querySelectorAll(".v6-attention-row")) {
        const strong = row.querySelector("strong");
        const small = row.querySelector("small");
        if (clean(strong?.textContent) !== "A spot opened in one of your current matches") continue;
        strong.textContent = "A spot opened in your meetup";
        if (small) small.textContent = "Open Meet Up to choose someone from the waitlist.";
      }
    };

    patch();
    state.attentionObserver = new MutationObserver(patch);
    state.attentionObserver.observe(list, { childList: true, subtree: true });
  }

  function injectStyles() {
    if ($("ariCircleHostFlowV2Styles")) return;
    const style = document.createElement("style");
    style.id = "ariCircleHostFlowV2Styles";
    style.textContent = `
      #meetupPage .circle-host-v2-progress{margin-top:11px;padding-top:11px;border-top:1px solid #edf1f6}
      #meetupPage .circle-host-v2-progress__copy{display:grid;grid-template-columns:auto 1fr;align-items:baseline;gap:5px 10px}
      #meetupPage .circle-host-v2-progress__copy>span{color:#369bbd;font:850 .56rem/1 Inter,sans-serif;letter-spacing:.12em}
      #meetupPage .circle-host-v2-progress__copy>strong{color:#182943;font:900 .72rem/1 Inter,sans-serif;text-align:right}
      #meetupPage .circle-host-v2-progress__copy>small{grid-column:1/-1;color:#7d899b;font:650 .58rem/1.35 Inter,sans-serif}
      #meetupPage .circle-host-v2-progress__meter{display:block;height:6px;margin-top:8px;overflow:hidden;border-radius:999px;background:#e9eef5}
      #meetupPage .circle-host-v2-progress__meter>i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(110deg,#39d8f4,#3978f6 54%,#9368f7);transition:width .35s ease}
      #meetupPage [data-request-decision="accept"][data-host-flow-capacity-disabled="true"]{opacity:.45;cursor:not-allowed}
    `;
    document.head.append(style);
  }

  async function initMeetup() {
    if (!$("meetupPage")) return;
    injectStyles();
    state.client = await waitForClient();
    bindRequestCapacity();
    await loadHostProgress();
  }

  async function init() {
    patchV6Attention();
    try {
      await initMeetup();
    } catch (error) {
      console.warn("Host Flow V2 initialization skipped:", error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleHostFlowV2 = Object.freeze({
    version: VERSION,
    refreshHostProgress: loadHostProgress
  });
})();
