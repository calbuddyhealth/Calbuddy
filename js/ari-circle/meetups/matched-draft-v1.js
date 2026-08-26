/* =============================================================
   ARI CIRCLE — MATCHED MEETUP DRAFT V1
   Consumes a one-time same-session draft from Circle V6 and prefills the
   canonical Meet Up host form. This helper never creates a meetup itself.
============================================================= */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const STORAGE_KEY = "ariCircleMatchedMeetupDraftV1";
  const MAX_AGE_MS = 15 * 60 * 1000;
  const ACTIVITY = new Set([
    "walking", "gym", "running", "hiking", "sports", "cycling", "yoga",
    "coffee", "food", "community", "volunteer", "other"
  ]);
  const GUEST_OPTIONS = [1, 2, 3, 5, 7, 11, 19, 29, 49];

  const $ = (id) => document.getElementById(id);
  const clean = (value, max = 1000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 120));
  }

  function removeDraftParam() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("draft");
      history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {}
  }

  function consumeDraft() {
    try {
      if (new URLSearchParams(window.location.search).get("draft") !== "matched") return null;
      const raw = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      removeDraftParam();
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (!draft || draft.version !== 1 || draft.source !== "ari_circle_intent_bundle_v1") return null;
      const createdAt = new Date(draft.createdAt).getTime();
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > MAX_AGE_MS) return null;
      if (!isUuid(draft.intentId)) return null;
      return draft;
    } catch {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      return null;
    }
  }

  function safeActivity(value) {
    const activity = clean(value, 40).toLowerCase();
    return ACTIVITY.has(activity) ? activity : "other";
  }

  function safeStart(value) {
    const requested = new Date(value);
    const minimum = new Date(Date.now() + 15 * 60 * 1000);
    if (!Number.isFinite(requested.getTime()) || requested < minimum) return minimum;
    return requested;
  }

  function localDateTimeValue(value) {
    const date = safeStart(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function nearestGuestOption(value) {
    const requested = Math.max(1, Math.min(49, Number(value) || 3));
    return GUEST_OPTIONS.find((option) => option >= requested) || 49;
  }

  function safeDuration(value) {
    const allowed = [30, 60, 90, 120, 180, 240];
    const requested = Number(value) || 60;
    return allowed.includes(requested) ? requested : 60;
  }

  function setValue(id, value) {
    const node = $(id);
    if (!node) return;
    node.value = value;
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function renderDraftNotice(draft) {
    const form = $("hostMeetupForm");
    if (!form || form.querySelector("[data-ari-matched-draft-notice]")) return;

    const notice = document.createElement("section");
    notice.className = "circle-v5-form-note";
    notice.dataset.ariMatchedDraftNotice = VERSION;

    const strong = document.createElement("strong");
    strong.textContent = "ARI matched this plan.";
    const copy = document.createElement("span");
    copy.textContent = " Review every field before publishing. Nobody has been invited or added automatically.";
    notice.append(strong, copy);

    const people = Array.isArray(draft.people) ? draft.people.slice(0, 3) : [];
    if (people.length) {
      const peopleLine = document.createElement("div");
      peopleLine.style.marginTop = "8px";
      const label = document.createElement("span");
      label.textContent = "Compatible people: ";
      peopleLine.append(label);

      people.forEach((person, index) => {
        const handle = clean(person?.handle, 80).replace(/^@+/, "");
        const name = clean(person?.displayName || handle, 80) || "Circle member";
        const link = document.createElement("a");
        link.href = handle ? `ari-circle.html?handle=${encodeURIComponent(handle)}` : "ari-circle.html";
        link.textContent = name;
        if (index) peopleLine.append(document.createTextNode(" · "));
        peopleLine.append(link);
      });
      notice.append(peopleLine);
    }

    form.insertBefore(notice, form.firstElementChild?.nextSibling || form.firstChild);
  }

  function applyDraft(draft) {
    const title = clean(draft.title, 90);
    const area = clean(draft.area, 100);
    const activity = safeActivity(draft.activity);

    setValue("meetupFormTitle", title);
    setValue("meetupFormStarts", localDateTimeValue(draft.startsAt));
    setValue("meetupFormArea", area);
    setValue("meetupFormGuestSpots", String(nearestGuestOption(draft.guestSpots)));
    setValue("meetupFormDuration", String(safeDuration(draft.durationMinutes)));
    setValue("meetupFormJoinMode", "approval");

    const activitySelect = $("meetupFormActivity");
    if (activitySelect) {
      activitySelect.value = activity;
      activitySelect.dataset.manual = "true";
    }

    const kicker = document.querySelector("#hostMeetupDialog .circle-v5-hero__kicker");
    if (kicker) kicker.textContent = "ARI MATCHED PLAN · HOST";
    renderDraftNotice(draft);

    const dialog = $("hostMeetupDialog");
    if (typeof dialog?.showModal === "function" && !dialog.open) dialog.showModal();
  }

  async function waitForCanonicalForm(timeout = 10000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const ready = Boolean(
        window.AriCircleMeetupsV5
        && $("meetupPage")?.hidden === false
        && $("hostMeetupForm")
        && $("meetupFormStarts")?.min
      );
      if (ready) return true;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    return false;
  }

  async function boot() {
    const draft = consumeDraft();
    if (!draft) return;
    if (!(await waitForCanonicalForm())) return;
    applyDraft(draft);
  }

  window.AriCircleMatchedMeetupDraftV1 = Object.freeze({
    version: VERSION,
    storageKey: STORAGE_KEY
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
