// ari/system/ari-bootstrap.js
// Ari Bootstrap
// Purpose: Safely initialize Ari's architecture modules in the browser.

window.Ari = window.Ari || {};

window.Ari.bootstrap = {
  version: "1.0.0",

  async start() {
    try {
      if (!window.Ari.core) {
        console.warn("Ari core is not available yet.");
        return {
          success: false,
          reason: "Ari core missing"
        };
      }

      await window.Ari.core.init();

      window.Ari.ready = true;

      window.dispatchEvent(
        new CustomEvent("ari:ready", {
          detail: {
            version: this.version,
            readyAt: new Date().toISOString()
          }
        })
      );

      console.log("Ari bootstrap complete.", this.version);

      return {
        success: true,
        version: this.version
      };
    } catch (error) {
      console.error("Ari bootstrap failed:", error);

      window.dispatchEvent(
        new CustomEvent("ari:error", {
          detail: {
            source: "ari-bootstrap",
            message: error.message
          }
        })
      );

      return {
        success: false,
        reason: error.message
      };
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.Ari.bootstrap.start();
});