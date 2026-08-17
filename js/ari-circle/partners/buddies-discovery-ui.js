// ARI CIRCLE — Buddies discovery UI v1.1.0
(() => {
  "use strict";

  let teenMode = false;
  let observer = null;

  // Compatibility bridge for partner-finder's age-mode renderer.
  ["partnerSafetyTitle", "partnerSafetyText"].forEach((id) => {
    if (document.getElementById(id)) return;
    const node = document.createElement(id === "partnerSafetyTitle" ? "strong" : "span");
    node.id = id;
    node.hidden = true;
    node.setAttribute("aria-hidden", "true");
    document.body.appendChild(node);
  });

  function client() {
    return window.calbuddySupabase || window.supabaseClient || null;
  }

  function openPrivacy() {
    const dialog = document.getElementById("privacyDialog");
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function toggleMore(button) {
    const extras = [...document.querySelectorAll(".buddy-extra-activity")];
    const willOpen = extras.some((item) => item.hidden);
    extras.forEach((item) => { item.hidden = !willOpen; });
    const icon = button.querySelector("span");
    if (icon) icon.textContent = willOpen ? "−" : "＋";
    button.lastChild.textContent = willOpen ? " Less" : " More";
    if (willOpen) extras[0]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }

  function hideTeenLocationArtifacts(root = document) {
    if (!teenMode) return;

    root.querySelectorAll?.(".partner-meta-pill").forEach((pill) => {
      if (pill.textContent.trim().startsWith("📍")) pill.hidden = true;
    });

    root.querySelectorAll?.(".partner-invite-card__copy span").forEach((line) => {
      line.textContent = line.textContent.replace(/\s*·\s*Teen Circle\s*$/i, " · Teen Circle");
    });
  }

  function applyTeenLayout() {
    teenMode = true;

    const searchForm = document.getElementById("partnerSearchForm");
    if (searchForm) searchForm.hidden = true;

    const searchInput = document.getElementById("partnerAreaSearch");
    if (searchInput) {
      searchInput.value = "";
      searchInput.disabled = true;
    }

    const areaInput = document.getElementById("intentArea");
    if (areaInput) {
      areaInput.value = "Teen Circle";
      areaInput.required = false;
      const field = areaInput.closest(".partner-field");
      if (field) field.hidden = true;
    }

    const discoveryKicker = document.querySelector(".partner-discover .partner-kicker");
    if (discoveryKicker) discoveryKicker.textContent = "TEEN CIRCLE";

    const discoveryTitle = document.getElementById("discoverTitle");
    if (discoveryTitle) discoveryTitle.textContent = "Find people with the same interests";

    const oneOnOne = document.querySelector('input[name="intentMode"][value="one_on_one"]');
    if (oneOnOne) {
      oneOnOne.disabled = true;
      const label = oneOnOne.closest("label");
      if (label) label.hidden = true;
    }

    const group = document.querySelector('input[name="intentMode"][value="group"]');
    if (group) {
      group.checked = true;
      const labelText = group.closest("label")?.querySelector("span");
      if (labelText) labelText.textContent = "Teen Circle";
    }

    const note = document.getElementById("intentNote");
    if (note) note.placeholder = "Share the interest, not your location or contact info.";

    const teenNote = document.getElementById("teenIntentNote");
    if (teenNote) {
      teenNote.hidden = false;
      teenNote.textContent = "Teen Buddies matches by shared interests, not location. Keep conversations in ARI Circle; exact locations, private meetup plans, phone numbers, email addresses, links, and off-app handles are blocked.";
    }

    hideTeenLocationArtifacts();

    if (!observer) {
      observer = new MutationObserver((records) => {
        if (!teenMode) return;
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) hideTeenLocationArtifacts(node);
          });
        });
      });
      [document.getElementById("partnerList"), document.getElementById("inviteList"), document.getElementById("ownListingCard")]
        .filter(Boolean)
        .forEach((node) => observer.observe(node, { childList: true, subtree: true }));
    }
  }

  function applyAdultLayout() {
    teenMode = false;
    const searchForm = document.getElementById("partnerSearchForm");
    if (searchForm) searchForm.hidden = false;

    const searchInput = document.getElementById("partnerAreaSearch");
    if (searchInput) searchInput.disabled = false;

    const areaInput = document.getElementById("intentArea");
    if (areaInput) {
      areaInput.required = true;
      const field = areaInput.closest(".partner-field");
      if (field) field.hidden = false;
    }
  }

  async function refreshAgeMode() {
    const supabase = client();
    if (!supabase?.rpc) return;
    try {
      const { data, error } = await supabase.rpc("ari_circle_my_age_state");
      if (error || !data?.verified) return;
      if (data.age_band === "teen") applyTeenLayout();
      else applyAdultLayout();
    } catch (error) {
      console.warn("Buddies age-aware UI unavailable:", error?.message || error);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("[data-more-activities]")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleMore(event.currentTarget);
    });

    document.getElementById("buddyPrivacyButton")?.addEventListener("click", openPrivacy);

    document.querySelectorAll("[data-close-dialog='privacyDialog']").forEach((button) => {
      button.addEventListener("click", () => document.getElementById("privacyDialog")?.close());
    });

    document.getElementById("ageForm")?.addEventListener("submit", () => {
      window.setTimeout(refreshAgeMode, 450);
    });

    window.setTimeout(refreshAgeMode, 0);
    window.setTimeout(refreshAgeMode, 500);
  });
})();
