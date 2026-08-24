/* =============================================================
   ARI CIRCLE V5 — PRIMARY NAV COMPATIBILITY
   Legacy top navigation is normalized to Feed · Meet Up · Quests.
   The visible V5 experience uses the shared bottom dock.
============================================================= */
(() => {
  "use strict";

  const VERSION = "5.0.0";
  const NAV_SELECTORS = [".feed-tabs", ".partner-tabs", ".challenge-tabs", ".circle-v3-nav"];
  const ORDER = ["Feed", "Meet Up", "Quests"];
  const ICONS = {
    Feed: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4.5" width="16" height="15" rx="2.5"></rect><path d="M8 8.5h8M8 12h5M8 15.5h6"></path></svg>`,
    "Meet Up": `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="8" r="3"></circle><circle cx="16.5" cy="9" r="2.5"></circle><path d="M3.5 19c.5-3.5 2.3-5.3 5-5.3s4.6 1.8 5.1 5.3M14.2 14.2c3.4-.4 5.6 1.2 6.3 4.8"></path></svg>`,
    Quests: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5.5 6.2v5.2c0 4.4 2.7 7.5 6.5 9.6 3.8-2.1 6.5-5.2 6.5-9.6V6.2L12 3Z"></path><path d="m8.8 12 2.1 2.1 4.4-5"></path></svg>`
  };

  function cleanLabel(item) {
    const value = String(item?.dataset?.circleSoftLabel || item?.querySelector?.(".circle-soft-primary-tab__label")?.textContent || item?.textContent || "").trim();
    if (["Buddies","Partners","Find People"].includes(value)) return "Meet Up";
    if (value === "Challenges") return "Quests";
    return value;
  }

  function route(label) {
    if (label === "Feed") return "ari-circle-feed.html";
    if (label === "Meet Up") return "ari-circle-meetup.html";
    if (label === "Quests") return "ari-circle-quests.html";
    return "#";
  }

  function decorate(item, label) {
    item.dataset.circleSoftLabel = label;
    item.classList.add("circle-soft-primary-tab");
    if (item.tagName === "A") item.href = route(label);
    item.innerHTML = `<span class="circle-soft-primary-tab__icon" aria-hidden="true">${ICONS[label] || ""}</span><span class="circle-soft-primary-tab__label">${label}</span>`;
    item.dataset.circleSoftDecorated = "true";
  }

  function normalizeNav(nav) {
    if (!nav) return false;
    const items = [...nav.children].filter((node) => node.matches?.("a,button"));
    if (!items.length) return false;
    const byLabel = new Map();
    items.forEach((item) => { const label=cleanLabel(item); if (ORDER.includes(label)) byLabel.set(label,item); });

    const profileItem = items.find((item) => ["Profile","Me"].includes(cleanLabel(item)));
    profileItem?.remove();
    if (byLabel.size !== ORDER.length) return false;
    nav.classList.add("circle-soft-primary-nav");
    ORDER.forEach((label) => { const item=byLabel.get(label); decorate(item,label); nav.appendChild(item); });
    nav.dataset.circleSoftReady = "true";
    return true;
  }

  function refresh() { NAV_SELECTORS.forEach((selector) => document.querySelectorAll(selector).forEach(normalizeNav)); }
  let queued=false;
  function queueRefresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});}
  document.addEventListener("DOMContentLoaded",refresh,{once:true});
  document.addEventListener("circle:app-ready",queueRefresh);
  const observer=new MutationObserver((mutations)=>{if(mutations.some((m)=>m.addedNodes.length))queueRefresh();});
  if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
  refresh();
  window.AriCirclePrimaryNav=Object.freeze({version:VERSION,refresh});
})();
