/* ARI XP — Support ARI v2.0.0 */

(() => {
  "use strict";

  function connectSupportMethod(id, provider = {}) {
    const link = document.getElementById(id);
    if (!link) return;

    const url = String(provider.url || "").trim();
    const handle = String(provider.handle || "").trim();

    if (!/^https:\/\//i.test(url)) {
      link.hidden = true;
      return;
    }

    link.href = url;
    link.hidden = false;

    const handleNode = link.querySelector("[data-support-handle]");
    if (handleNode && handle) handleNode.textContent = handle;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const config = window.ARI_SUPPORT_CONFIG || {};

    connectSupportMethod("cashAppSupportButton", config.cashApp);
    connectSupportMethod("venmoSupportButton", config.venmo);

    const methods = document.getElementById("supportMethods");
    const unavailable = document.getElementById("supportUnavailable");
    const visibleMethods = methods
      ? [...methods.querySelectorAll(".ari-support-method")].filter((item) => !item.hidden)
      : [];

    if (methods) methods.hidden = visibleMethods.length === 0;
    if (unavailable) unavailable.hidden = visibleMethods.length > 0;
  });
})();
