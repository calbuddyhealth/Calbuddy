/*
 * ARI CIRCLE — RETIRED PROFILE SOCIAL FLOW
 * Compatibility tombstone for clients that cached an older Profile loader.
 *
 * Relationship actions are owned by ConnectionsController.
 * Direct messages are owned by MessagesController.
 * Friends UI is owned by profile-friends.js.
 *
 * Delete this tombstone only after the old Profile loader cache epoch is no
 * longer supported.
 */
(() => {
  "use strict";

  const VERSION = "retired-1.0.0";

  function relationship() {
    const app = window.AriCircleApp || window.Ari?.circle || null;
    const store = app?.modules?.CircleStore || null;
    const snapshot = store?.getState?.() || null;
    const context = store?.get?.("context") || snapshot?.context || null;
    const connection = store?.get?.("connection") || snapshot?.connection || null;

    if (context?.isOwner) return "self";
    if (!context?.isVisitor) return "unknown";

    const status = String(connection?.status || "none").trim().toLowerCase();
    if (status === "connected") return "friend";
    return status || "none";
  }

  function refresh() {
    window.AriCircleProfileFriends?.refresh?.();
  }

  window.AriCircleProfileSocialFlow = Object.freeze({
    version: VERSION,
    retired: true,
    relationship,
    refresh
  });
})();