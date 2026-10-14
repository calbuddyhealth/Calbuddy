/* =============================================================
   ARI CIRCLE CONNECT — COLLAPSING HEADER V1
   Keeps header behavior lightweight: one passive scroll listener,
   requestAnimationFrame batching, and hysteresis to prevent jitter.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const COMPACT_AT = 58;
  const EXPAND_AT = 18;
  const DEEP_AT = 220;

  if (window.AriCircleScrollHeader?.version === VERSION) return;

  let header = null;
  let ticking = false;
  let compact = false;

  function findHeader() {
    header = document.querySelector(
      "body.circle-connect-next .circle-v51-halo-header, body.circle-connect-next .circle-v5-header.feed-header"
    );
    return header;
  }

  function scrollTop() {
    return Math.max(0, Number(window.scrollY || document.documentElement?.scrollTop || 0));
  }

  function render() {
    ticking = false;
    if (!header?.isConnected && !findHeader()) return;

    const y = scrollTop();

    if (!compact && y >= COMPACT_AT) compact = true;
    else if (compact && y <= EXPAND_AT) compact = false;

    header.classList.toggle("is-circle-scroll-compact", compact);
    header.classList.toggle("is-circle-scroll-deep", y >= DEEP_AT);
    header.dataset.circleScrollState = compact ? "compact" : "expanded";
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  function start() {
    findHeader();
    schedule();
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("pageshow", start, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("ari-circle:v5-real-world-ready", start);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.AriCircleScrollHeader = Object.freeze({
    version: VERSION,
    refresh: start
  });
})();
