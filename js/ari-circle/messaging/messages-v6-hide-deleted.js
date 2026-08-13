/* =============================================================
   ARI CIRCLE — MESSAGES V6 DELETED MESSAGE DISPLAY
   Version: 1.0.0
   Purpose:
   - Keep backend soft-delete/tombstone behavior for integrity.
   - Completely remove deleted message bubbles from the user-facing
     thread after the thread is rendered or refreshed.
============================================================= */
(() => {
  "use strict";

  const style = document.createElement("style");
  style.id = "ariMessagesHideDeletedStyle";
  style.textContent = `
    #threadMessages .circle-message-row.is-deleted {
      display: none !important;
    }
  `;
  document.head.append(style);
})();
