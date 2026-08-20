/* ARI XP — owner-only account links v1.0.0 */
(() => {
  "use strict";

  async function revealOwnerLinks() {
    const links = Array.from(document.querySelectorAll("[data-owner-only-link]"));
    if (!links.length) return;

    try {
      const client = window.calbuddySupabase || window.supabaseClient;
      if (!client?.rpc) return;
      const { data, error } = await client.rpc("is_ari_admin");
      if (error || data !== true) return;
      for (const link of links) link.hidden = false;
    } catch {
      // Owner controls fail closed. Direct navigation is also server protected.
    }
  }

  window.addEventListener("DOMContentLoaded", revealOwnerLinks, { once: true });
})();
