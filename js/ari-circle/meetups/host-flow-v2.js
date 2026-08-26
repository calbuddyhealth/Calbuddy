/* =============================================================
   ARI CIRCLE — HOST FLOW V2 ATTENTION COPY
   Keeps V6 host-facing spot-opened messaging aligned with Meet Up.
   Host request capacity and Host progress remain owned by meetups-v5.js.
============================================================= */
(() => {
  "use strict";

  const VERSION = "2.0.1";
  const OLD_LABEL = "A spot opened in one of your current matches";
  const NEW_LABEL = "A spot opened in your meetup";
  const NEW_DETAIL = "Open Meet Up to choose someone from the waitlist.";

  function clean(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function patchAttention(list) {
    for (const row of list.querySelectorAll(".v6-attention-row")) {
      const strong = row.querySelector("strong");
      if (clean(strong?.textContent) !== OLD_LABEL) continue;
      const small = row.querySelector("small");
      strong.textContent = NEW_LABEL;
      if (small) small.textContent = NEW_DETAIL;
    }
  }

  function init() {
    const list = document.getElementById("v6AttentionList");
    if (!list) return;
    const patch = () => patchAttention(list);
    patch();
    new MutationObserver(patch).observe(list, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.AriCircleHostFlowV2 = Object.freeze({ version: VERSION });
})();
