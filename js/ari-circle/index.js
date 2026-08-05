// js/ari-circle/index.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Single entry point for ari-circle.html
// - Own page boot order
// - Import ARI Circle modules as they are created
// - Prevent feature modules from initializing themselves twice
//
// IMPORTANT:
// Keep this file small.
// Business logic belongs in the domain modules under js/ari-circle/.

const VERSION = "1.0.0";
const SOURCE = "ari-circle/index";

const AriCircleApp = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    initializing: false,
    error: null
  },

  dom: {
    root: null,
    status: null,
    statusText: null
  },

  async init() {
    if (this.state.initialized || this.state.initializing) {
      return;
    }

    this.state.initializing = true;
    this.cacheDom();

    try {
      this.setStatus("Loading ARI Circle...");

      /*
       * =========================================================
       * MODULE BOOT PATH
       * =========================================================
       *
       * We will add modules here in dependency order as we build:
       *
       * 1. core/circle-context.js
       * 2. core/circle-store.js
       * 3. core/circle-events.js
       *
       * 4. profile/profile-controller.js
       * 5. profile/profile-renderer.js
       * 6. profile/profile-editor.js
       *
       * 7. connections/connections-controller.js
       * 8. connections/connection-requests.js
       * 9. connections/top-circle.js
       *
       * 10. comments/leave-some-love.js
       *
       * 11. messaging/messages-controller.js
       * 12. messaging/conversations.js
       * 13. messaging/message-requests.js
       *
       * 14. presence/presence-controller.js
       * 15. media/profile-media.js
       * 16. notifications/circle-notifications.js
       *
       * 17. data/circle-api.js
       * 18. data/circle-realtime.js
       *
       * For now this entry point only boots the page shell.
       * We will replace the placeholder section below with real
       * imports as each module is created.
       */

      this.revealPage();

      this.state.initialized = true;
      this.state.error = null;

      this.setStatus("", { hide: true });

      console.log("ARI CIRCLE READY", this.getDiagnostics());
    } catch (error) {
      this.state.error = error;

      console.error(
        "ARI CIRCLE BOOT FAILED",
        error
      );

      this.setStatus(
        "ARI Circle could not load. Please try again."
      );
    } finally {
      this.state.initializing = false;
    }
  },

  cacheDom() {
    this.dom.root =
      document.getElementById("ari-circle");

    this.dom.status =
      document.getElementById("circle-page-status");

    this.dom.statusText =
      document.getElementById("circle-page-status-text");
  },

  revealPage() {
    if (!this.dom.root) {
      throw new Error(
        'ARI Circle root "#ari-circle" was not found.'
      );
    }

    this.dom.root.hidden = false;
  },

  setStatus(message, options = {}) {
    const { hide = false } = options;

    if (this.dom.statusText) {
      this.dom.statusText.textContent =
        message || "";
    }

    if (this.dom.status) {
      this.dom.status.hidden = Boolean(hide);
    }
  },

  getDiagnostics() {
    return {
      ready: this.state.initialized,
      initializing: this.state.initializing,
      source: this.source,
      version: this.version,
      error: this.state.error
        ? String(this.state.error?.message || this.state.error)
        : null
    };
  }
};

window.Ari = window.Ari || {};
window.Ari.circle = AriCircleApp;

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => AriCircleApp.init(),
    { once: true }
  );
} else {
  AriCircleApp.init();
}

export { AriCircleApp };
export default AriCircleApp;
