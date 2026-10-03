/* =============================================================
   ARI CIRCLE — CATEGORY RAILS V1
   Reorganizes the existing Connect meetup cards into horizontal,
   swipeable activity rails without changing their actions or data flow.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const ROOT_ID = "meetupCategorySections";
  const EMPTY_ID = "meetupEmpty";
  const LEGACY = Object.freeze([
    ["meetupNowSection", "meetupNowList"],
    ["meetupTodaySection", "meetupTodayList"],
    ["meetupTomorrowSection", "meetupTomorrowList"],
    ["meetupWeekendSection", "meetupWeekendList"],
    ["meetupLaterSection", "meetupLaterList"]
  ]);
  const CATEGORY = Object.freeze([
    ["gym", "Gym", "🏋️"],
    ["coffee", "Coffee", "☕"],
    ["walking", "Walking", "🚶"],
    ["hiking", "Hiking", "🥾"],
    ["running", "Running", "🏃"],
    ["sports", "Sports", "🏀"],
    ["cycling", "Cycling", "🚴"],
    ["yoga", "Yoga", "🧘"],
    ["food", "Food", "🍴"],
    ["community", "Community", "◎"],
    ["volunteer", "Volunteer", "🤝"],
    ["other", "Other", "✦"]
  ]);

  const byId = (id) => document.getElementById(id);
  let scheduled = false;
  let observer = null;

  function ensureRoot() {
    let root = byId(ROOT_ID);
    if (root) return root;

    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "circle-connect-category-board";
    root.setAttribute("aria-label", "Meetups by category");
    const status = byId("meetupStatus");
    status?.insertAdjacentElement("afterend", root);
    return root;
  }

  function categoryKey(card) {
    const badge = String(card.querySelector(".circle-connect-activity-badge")?.textContent || "").toLowerCase();
    for (const [key, label] of CATEGORY) {
      if (key !== "other" && badge.includes(label.toLowerCase())) return key;
    }
    return "other";
  }

  function hideLegacySections() {
    LEGACY.forEach(([sectionId]) => {
      const section = byId(sectionId);
      if (section) section.hidden = true;
    });
  }

  function collectFreshCards() {
    const cards = [];
    LEGACY.forEach(([, listId]) => {
      const list = byId(listId);
      if (!list) return;
      cards.push(...list.querySelectorAll(":scope > .circle-connect-card"));
    });
    return cards;
  }

  function makeRail(key, label, icon, cards) {
    const section = document.createElement("section");
    section.className = `circle-connect-category-rail${cards.length === 1 ? " is-single" : ""}`;
    section.dataset.activity = key;
    section.setAttribute("aria-labelledby", `meetup-category-${key}`);

    const head = document.createElement("div");
    head.className = "circle-connect-category-rail__head";
    head.innerHTML = `
      <div class="circle-connect-category-rail__title-wrap">
        <span class="circle-connect-category-rail__icon" aria-hidden="true">${icon}</span>
        <h2 id="meetup-category-${key}">${label}</h2>
        <span class="circle-connect-category-rail__count">${cards.length}</span>
      </div>
      ${cards.length > 1 ? '<span class="circle-connect-category-rail__hint" aria-hidden="true">Swipe →</span>' : ""}
    `;

    const track = document.createElement("div");
    track.className = "circle-connect-category-rail__track";
    track.setAttribute("role", "list");
    track.setAttribute("aria-label", `${label} meetups`);
    cards.forEach((card) => {
      card.setAttribute("role", "listitem");
      track.append(card);
    });

    section.append(head, track);
    return section;
  }

  function regroup() {
    scheduled = false;
    const root = ensureRoot();
    const freshCards = collectFreshCards();

    if (!freshCards.length) {
      if (byId(EMPTY_ID)?.hidden === false) root.replaceChildren();
      hideLegacySections();
      return;
    }

    const groups = new Map(CATEGORY.map(([key]) => [key, []]));
    freshCards.forEach((card) => groups.get(categoryKey(card))?.push(card));

    const fragment = document.createDocumentFragment();
    CATEGORY.forEach(([key, label, icon]) => {
      const cards = groups.get(key) || [];
      if (cards.length) fragment.append(makeRail(key, label, icon, cards));
    });

    root.replaceChildren(fragment);
    hideLegacySections();
  }

  function scheduleRegroup() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(regroup);
  }

  function start() {
    const main = document.querySelector(".circle-connect-main");
    if (!main) return;

    ensureRoot();
    observer = new MutationObserver(scheduleRegroup);
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    scheduleRegroup();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  window.AriCircleCategoryRails = Object.freeze({ version: VERSION, refresh: scheduleRegroup });
})();