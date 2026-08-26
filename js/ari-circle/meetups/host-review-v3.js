/* =============================================================
   ARI CIRCLE — HOST REVIEW V3
   Presentation-only enhancement for the canonical Meet Up request queue.
   Capacity and request mutations remain owned by meetups-v5.js.
============================================================= */
(() => {
  "use strict";

  const VERSION = "3.0.0";
  const list = document.getElementById("meetupRequestsList");
  const statusNode = document.getElementById("meetupRequestsStatus");
  if (!list) return;

  function clean(value) {
    return String(value ?? "").trim();
  }

  function profileHref(card) {
    const identity = clean(card.querySelector(".circle-v5-card-identity span")?.textContent);
    const match = identity.match(/@([a-z0-9._]+)/i);
    return match?.[1]
      ? `ari-circle.html?handle=${encodeURIComponent(match[1])}`
      : null;
  }

  function makeProfileTarget(node, href, label) {
    if (!node || !href || node.dataset.hostReviewProfileLink === "true") return;
    node.dataset.hostReviewProfileLink = "true";
    node.tabIndex = 0;
    node.setAttribute("role", "link");
    node.setAttribute("aria-label", label || "Open Circle profile");
    node.style.cursor = "pointer";
    const open = () => { window.location.href = href; };
    node.addEventListener("click", open);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  }

  function decorateCard(card) {
    if (!(card instanceof HTMLElement) || card.dataset.hostReviewV3 === VERSION) return;
    card.dataset.hostReviewV3 = VERSION;

    const badge = clean(card.querySelector(".circle-v5-host-badge")?.textContent).toLowerCase();
    if (badge === "accepted") {
      card.hidden = true;
      card.dataset.hostReviewResolved = "accepted";
      return;
    }

    card.classList.add("circle-v5-host-review-card");
    const href = profileHref(card);
    const displayName = clean(card.querySelector(".circle-v5-card-identity strong")?.textContent) || "this person";
    makeProfileTarget(card.querySelector(".circle-v5-avatar"), href, `Open ${displayName}'s Circle profile`);
    makeProfileTarget(card.querySelector(".circle-v5-card-identity"), href, `Open ${displayName}'s Circle profile`);

    const history = card.querySelector(".circle-v5-card-identity span");
    if (history) {
      const text = clean(history.textContent);
      if (/\b0 verified meetups\b/i.test(text)) {
        history.textContent = text.replace(/0 verified meetups/i, "new to verified meetups");
      }
    }

    const note = card.querySelector(".circle-v5-completion-note");
    if (note && !/verified history/i.test(note.textContent)) {
      const tier = clean(note.textContent);
      note.textContent = `${tier || "Member"} · verified history only — no automatic ranking`;
    }

    const accept = card.querySelector('[data-request-decision="accept"]');
    const waitlist = card.querySelector('[data-request-decision="waitlist"]');
    const decline = card.querySelector('[data-request-decision="decline"]');
    if (accept && !accept.disabled) accept.textContent = "Accept guest";
    if (accept?.disabled) {
      accept.textContent = "Full";
      accept.title = "Accept unlocks when a guest spot opens";
    }
    if (waitlist) waitlist.textContent = "Keep waiting";
    if (decline) decline.textContent = "Decline";
  }

  function refresh() {
    const cards = [...list.querySelectorAll(".circle-v5-meetup-card")];
    cards.forEach(decorateCard);
    const accepted = cards.filter((card) => card.dataset.hostReviewResolved === "accepted").length;
    if (statusNode && accepted > 0) {
      const base = clean(statusNode.textContent).replace(/\s*Accepted guests are managed in the Meetup Room\.$/i, "");
      statusNode.textContent = `${base} Accepted guests are managed in the Meetup Room.`.trim();
    }
  }

  const observer = new MutationObserver(refresh);
  observer.observe(list, { childList: true, subtree: true });
  refresh();

  window.AriCircleHostReviewV3 = Object.freeze({ version: VERSION, refresh });
})();
