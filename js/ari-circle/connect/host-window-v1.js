/* ARI Circle Host Window V1 — expose and enforce the 60-day meetup scheduling window. */
(() => {
  "use strict";

  const VERSION = "1.1.0";
  const MAX_DAYS_AHEAD = 60;
  const WINDOW_MS = MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  const DESTINATION_MODULE_SRC = "js/ari-circle/connect/destination-anchor-v2.js?v=2.0.0";
  const $ = (id) => document.getElementById(id);

  let cutoff = null;

  function localDateTimeValue(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  function cutoffLabel(date) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function setSubmitBlocked(blocked) {
    const button = $("createMeetupSubmit");
    if (!button) return;

    if (blocked) {
      button.dataset.startWindowDisabled = "true";
      button.disabled = true;
      return;
    }

    if (button.dataset.startWindowDisabled === "true") {
      delete button.dataset.startWindowDisabled;
      if (button.dataset.permanentDisabled !== "true") button.disabled = false;
    }
  }

  function validate() {
    const input = $("meetupFormStarts");
    const error = $("meetupStartWindowError");
    if (!input || !cutoff) return true;

    const value = input.value ? new Date(input.value) : null;
    const tooLate = Boolean(value && !Number.isNaN(value.getTime()) && value.getTime() > cutoff.getTime());
    const message = tooLate ? "Choose a date within the next 60 days." : "";

    input.setCustomValidity(message);
    if (tooLate) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    if (error) error.hidden = !tooLate;
    setSubmitBlocked(tooLate);

    return !tooLate;
  }

  function refreshWindow() {
    const input = $("meetupFormStarts");
    const note = $("meetupStartWindowNote");
    if (!input) return;

    cutoff = new Date(Date.now() + WINDOW_MS);
    input.max = localDateTimeValue(cutoff);
    if (note) {
      note.textContent = `Events can be scheduled up to ${MAX_DAYS_AHEAD} days ahead. Latest: ${cutoffLabel(cutoff)}.`;
    }
    validate();
  }

  function blockOutOfWindowSubmit(event) {
    if (validate()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const input = $("meetupFormStarts");
    input?.focus({ preventScroll: true });
    input?.scrollIntoView({ block: "center", behavior: "smooth" });
    input?.reportValidity?.();
  }

  function ensureDestinationModule() {
    if (window.AriCircleHikingDestinationV2) return;
    if (document.querySelector('script[data-ari-circle-hiking-destination="v2"]')) return;

    const script = document.createElement("script");
    script.src = DESTINATION_MODULE_SRC;
    script.async = true;
    script.dataset.ariCircleHikingDestination = "v2";
    script.addEventListener("error", () => {
      console.warn("Circle hiking destination helper could not load.");
    }, { once: true });
    document.head.appendChild(script);
  }

  function init() {
    const input = $("meetupFormStarts");
    const form = $("hostMeetupForm");
    const dialog = $("hostMeetupDialog");
    if (!input || !form) return;

    ensureDestinationModule();
    refreshWindow();
    input.addEventListener("input", validate);
    input.addEventListener("change", validate);
    input.addEventListener("invalid", validate);
    form.addEventListener("submit", blockOutOfWindowSubmit, true);

    if (dialog && "MutationObserver" in window) {
      const observer = new MutationObserver((records) => {
        if (records.some((record) => record.attributeName === "open") && dialog.open) {
          refreshWindow();
          ensureDestinationModule();
        }
      });
      observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    }
  }

  window.AriCircleHostWindowV1 = Object.freeze({
    version: VERSION,
    maxDaysAhead: MAX_DAYS_AHEAD,
    refresh: refreshWindow,
    validate
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
