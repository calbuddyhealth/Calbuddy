/* =============================================================
   ARI CIRCLE — BUDDIES LISTING REMOVE
   Version: 1.0.0
   - Adds a clear Remove action beside Edit on the user's active listing.
   - Uses protected Supabase RPC; users can remove only their own listing.
============================================================= */
(() => {
  "use strict";

  const STYLE_ID = "ari-buddy-listing-remove-style";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .partner-own-listing-actions{
        display:flex;
        align-items:center;
        gap:14px;
        flex:0 0 auto;
      }
      .partner-remove-listing{
        appearance:none;
        border:0;
        background:transparent;
        color:#d94856;
        font:inherit;
        font-size:.82rem;
        font-weight:800;
        padding:8px 2px;
        cursor:pointer;
      }
      .partner-remove-listing:disabled{
        opacity:.45;
        cursor:default;
      }
      @media(max-width:520px){
        .partner-own-listing-actions{gap:12px}
        .partner-remove-listing{font-size:.78rem}
      }
    `;
    document.head.appendChild(style);
  }

  function getClient() {
    return window.calbuddySupabase || window.supabaseClient || null;
  }

  function getToast() {
    return document.getElementById("partnerToast");
  }

  function toast(message, duration = 2600) {
    const host = getToast();
    if (!host) return;
    host.textContent = message;
    host.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { host.hidden = true; }, duration);
  }

  async function removeListing(button) {
    const client = getClient();
    if (!client || button.disabled) return;

    const confirmed = window.confirm(
      "Remove your Buddy listing? You will stop appearing in Buddy searches until you create a new listing."
    );
    if (!confirmed) return;

    button.disabled = true;
    const original = button.textContent;
    button.textContent = "Removing…";

    try {
      const { data, error } = await client.rpc("ari_circle_remove_partner_intent", {
        requested_intent_id: null
      });
      if (error) throw error;

      const removed = Number(data) || 0;
      document.getElementById("ownListingSection")?.setAttribute("hidden", "");
      toast(removed > 0 ? "Buddy listing removed." : "Your Buddy listing is already removed.");

      if (window.AriCirclePartnerFinder?.refresh) {
        await window.AriCirclePartnerFinder.refresh();
      }
    } catch (error) {
      console.error("Buddy listing removal failed:", error);
      toast(error?.message || "Could not remove your listing.", 4200);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function install() {
    ensureStyle();

    const edit = document.getElementById("editIntentButton");
    if (!edit || document.getElementById("removeIntentButton")) return;

    let actions = edit.parentElement?.querySelector(".partner-own-listing-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "partner-own-listing-actions";
      edit.parentNode.insertBefore(actions, edit);
      actions.appendChild(edit);
    }

    const remove = document.createElement("button");
    remove.id = "removeIntentButton";
    remove.type = "button";
    remove.className = "partner-remove-listing";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove Buddy listing");
    remove.addEventListener("click", () => removeListing(remove));
    actions.appendChild(remove);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
