// ARI CIRCLE — Buddies discovery UI v1.0.0
(() => {
  "use strict";

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
  });
})();
