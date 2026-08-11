/* ARI Rebirth — Support ARI v1.0.0 */

(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const config = window.ARI_SUPPORT_CONFIG || {};
    const button = document.getElementById("donationButton");
    const unavailable = document.getElementById("donationUnavailable");
    const url = String(config.donationUrl || "").trim();

    if (!/^https:\/\//i.test(url)) return;
    button.href = url;
    button.textContent = `Continue with ${config.providerName || "secure provider"}`;
    button.hidden = false;
    unavailable.hidden = true;
  });
})();
