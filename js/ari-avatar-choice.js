/* Ari appearance choice. Saved per account on this device; no model calls. */
(() => {
  "use strict";
  const keyPrefix = "ariAvatarChoice:v1:";
  const sources = (variant) => Object.fromEntries(Array.from({ length: 8 }, (_, i) =>
    [i + 1, `assets/ari/${variant}/thinking_${String(i + 1).padStart(3, "0")}.png`]));
  const presets = {
    female: {
      assets: { heroOpen: "assets/ari/ari-idle-open.png", heroClosed: "assets/ari/ari-idle-closed.png" },
      sequence: { frameNumbers: [1, 2, 4, 5, 6, 7, 8], frameSources: sources("female"), firstFrame: 1,
        holdLowFrame: 7, lastFrame: 8, enterDelay: 240, holdFrame8Delay: 7000, frame7BlinkDelay: 140, exitDelay: 165 }
    },
    male: {
      assets: { heroOpen: "assets/ari/male/idle.jpeg", heroClosed: "assets/ari/male/idle.jpeg" },
      sequence: { frameNumbers: [1, 2, 3, 4, 5, 6, 7, 8], frameSources: sources("male"), firstFrame: 1,
        holdLowFrame: 7, lastFrame: 8, enterDelay: 1100, holdFrame8Delay: 2200, frame7BlinkDelay: 1100,
        exitDelay: 350, cycleWhileHolding: true }
    }
  };
  let variant = "female";
  let userId = null;
  let ready = false;

  function render() {
    document.documentElement.dataset.ariAvatar = variant;
    document.querySelectorAll("[data-ari-avatar-choice]").forEach((input) => {
      input.checked = input.value === variant;
      input.disabled = !ready;
    });
    window.dispatchEvent(new CustomEvent("ari:avatar-changed", { detail: { variant } }));
  }

  function activateUser(id) {
    userId = id || null;
    ready = Boolean(userId);
    variant = "female";
    try { if (ready && localStorage.getItem(keyPrefix + userId) === "male") variant = "male"; } catch {}
    render();
  }

  function select(value) {
    if (!ready || !Object.hasOwn(presets, value)) return false;
    variant = value;
    let saved = true;
    try { localStorage.setItem(keyPrefix + userId, variant); } catch { saved = false; }
    render();
    const status = document.querySelector("[data-ari-avatar-status]");
    if (status) status.textContent = saved
      ? `Ari ${variant} selected. Saved on this device.`
      : `Ari ${variant} selected for this visit. This device could not save the choice.`;
    return true;
  }

  window.AriAvatar = Object.freeze({ getVariant: () => variant, getPreset: () => presets[variant], activateUser, select });
  window.addEventListener("storage", (event) => {
    if (userId && event.key === keyPrefix + userId) activateUser(userId);
  });
  document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll("[data-ari-avatar-choice]").forEach((input) => {
      input.addEventListener("change", () => { if (input.checked) select(input.value); });
    });
    render();
    const auth = window.calbuddySupabase?.auth;
    if (!auth) return;
    // Subscribe before reading the session so a later sign-in/out takes precedence.
    let authChanged = false;
    auth.onAuthStateChange((_event, session) => { authChanged = true; activateUser(session?.user?.id); });
    try {
      const { data, error } = await auth.getSession();
      if (!authChanged && !error) activateUser(data?.session?.user?.id);
    } catch {}
  });
})();
