/* =============================================================
   ARI CIRCLE V6 — HOST FLOW V2 ATTENTION COPY
   Keeps meetup vacancy events host-actionable without changing event authority.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";

  function clean(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function patchSpotOpenedCopy() {
    const list = document.getElementById("v6AttentionList");
    if (!list) return;

    for (const row of list.querySelectorAll(".v6-attention-row")) {
      const title = row.querySelector("strong");
      const detail = row.querySelector("small");
      if (clean(title?.textContent) !== "A spot opened in one of your current matches") continue;
      title.textContent = "A spot opened in your meetup";
      if (detail) detail.textContent = "Open Meet Up to choose someone from the waitlist.";
    }
  }

  function init() {
    const list = document.getElementById("v6AttentionList");
    if (!list) return;
    patchSpotOpenedCopy();
    const observer = new MutationObserver(patchSpotOpenedCopy);
    observer.observe(list, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleHostFlowV2Attention = Object.freeze({ version: VERSION, refresh: patchSpotOpenedCopy });
})();
