// ARI XP — Goals account-age policy v1.0.0
// Teens use protected account DOB as the only Goals age source.
// Adults keep the existing editable Goals age behavior.
(() => {
  "use strict";

  const SOURCE_KEY = "calbuddyAgeSource";
  const AGE_KEY = "calbuddyAge";
  const MINOR_SOURCE = "account_minor";
  let accountState = null;
  let transitionHoldUntil = 0;
  let started = false;

  function ageForDob(value, now = new Date()) {
    const text = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const [year, month, day] = text.split("-").map(Number);
    const birth = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isFinite(birth.getTime()) || birth > now) return null;
    let age = now.getUTCFullYear() - year;
    const monthDelta = now.getUTCMonth() + 1 - month;
    if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < day)) age -= 1;
    return Number.isFinite(age) && age >= 0 && age <= 120 ? age : null;
  }

  function ensureNote(input, locked) {
    if (!input?.parentElement) return;
    let note = document.getElementById("ariGoalsProtectedAgeNote");
    if (!locked) {
      note?.remove();
      return;
    }
    if (!note) {
      note = document.createElement("p");
      note.id = "ariGoalsProtectedAgeNote";
      note.className = "ari-field-note";
      input.insertAdjacentElement("afterend", note);
    }
    note.textContent = "Based on your protected account birthday. Age is read-only while Teen Safety is active.";
  }

  function apply() {
    const input = document.getElementById("age");
    if (!input || !accountState) return;

    const age = ageForDob(accountState.date_of_birth);
    const active = String(accountState.status || "active") === "active";
    const teen = active && Number.isFinite(age) && age >= 13 && age < 18;

    if (teen) {
      input.value = String(age);
      input.readOnly = true;
      input.setAttribute("aria-readonly", "true");
      input.dataset.accountAgeLocked = "true";
      input.title = "Teen Safety: age is based on your protected account birthday.";
      localStorage.setItem(AGE_KEY, String(age));
      localStorage.setItem(SOURCE_KEY, MINOR_SOURCE);
      ensureNote(input, true);
      window.calculateGoals?.();
      return;
    }

    const transitioningFromMinor = localStorage.getItem(SOURCE_KEY) === MINOR_SOURCE || Date.now() < transitionHoldUntil;
    if (active && Number.isFinite(age) && age >= 18 && transitioningFromMinor) {
      if (!transitionHoldUntil) transitionHoldUntil = Date.now() + 1800;
      input.value = String(age);
      localStorage.setItem(AGE_KEY, String(age));
      localStorage.setItem(SOURCE_KEY, "adult_editable");
      window.calculateGoals?.();
    }

    input.readOnly = false;
    input.removeAttribute("aria-readonly");
    delete input.dataset.accountAgeLocked;
    input.removeAttribute("title");
    ensureNote(input, false);
  }

  async function loadAccountState() {
    const client = window.calbuddySupabase;
    if (!client?.auth?.getSession) return null;
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return null;

    const { data, error } = await client
      .from("ari_account_state")
      .select("status,date_of_birth")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.warn("Goals protected age unavailable:", error.message);
      return null;
    }
    return data || null;
  }

  async function start() {
    if (started) return;
    started = true;
    accountState = await loadAccountState();
    if (!accountState) return;

    // Goals has its own asynchronous profile hydration. Re-apply during that
    // short window so a stale editable profile age cannot overwrite teen DOB.
    [0, 80, 220, 600, 1200, 1900].forEach((delay) => window.setTimeout(apply, delay));
    window.addEventListener("focus", apply);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) apply();
    });
  }

  window.AriGoalsAgePolicy = Object.freeze({ version: "1.0.0", ageForDob, apply, start });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();