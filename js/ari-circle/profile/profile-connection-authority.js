/*
 * ARI CIRCLE — RETIRED PROFILE CONNECTION AUTHORITY
 * Compatibility tombstone for clients that cached an older Profile loader.
 *
 * ConnectionsController is the sole relationship UI authority now.
 * This file intentionally performs no DOM mutation and installs no observer.
 * Delete it only after the old Profile loader cache epoch is no longer supported.
 */
(() => {
  "use strict";

  const VERSION = "retired-1.0.0";

  function refresh() {
    const controller = window.AriCircleApp?.modules?.ConnectionsController || null;
    const store = window.AriCircleApp?.modules?.CircleStore || null;
    controller?.render?.(store?.getState?.());
  }

  window.AriCircleProfileConnectionAuthority = Object.freeze({
    version: VERSION,
    retired: true,
    refresh
  });
})();