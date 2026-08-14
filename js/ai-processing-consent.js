/* =====================================================
   ARI XP
   File: js/ai-processing-consent.js
   Version: 1.0.0
   Purpose:
   Require explicit user permission before ARI sends personal
   data to OpenAI for third-party AI processing.
===================================================== */

(() => {
  "use strict";

  const CONSENT_VERSION = "1";
  const CONSENT_KEY = "ari_ai_processing_consent";
  const VERSION_KEY = "ari_ai_processing_consent_version";
  const GRANTED_AT_KEY = "ari_ai_processing_consented_at";
  const DECLINED_AT_KEY = "ari_ai_processing_declined_at";

  const state = {
    initialized: false,
    allowed: false,
    user: null,
    dialog: null
  };

  const $ = (id) => document.getElementById(id);

  function client() {
    return (
      window.calbuddySupabase ||
      window.supabaseClient ||
      window.CalBuddy?.supabase ||
      null
    );
  }

  function hasCurrentConsent(user) {
    const metadata = user?.user_metadata || {};
    return (
      metadata[CONSENT_KEY] === true &&
      String(metadata[VERSION_KEY] || "") === CONSENT_VERSION
    );
  }

  function lockComposer() {
    const input = $("ariInput");
    const send = $("ariSendBtn");

    if (input) {
      input.disabled = true;
      input.setAttribute("aria-disabled", "true");
      input.dataset.aiConsentLocked = "true";
      input.placeholder = "AI processing permission required";
    }

    if (send) {
      send.disabled = true;
      send.setAttribute("aria-disabled", "true");
      send.dataset.aiConsentLocked = "true";
    }
  }

  function unlockComposer() {
    const input = $("ariInput");
    const send = $("ariSendBtn");

    if (input) {
      input.disabled = false;
      input.removeAttribute("aria-disabled");
      delete input.dataset.aiConsentLocked;
      input.placeholder = "What are you working on?";
    }

    if (send) {
      send.disabled = false;
      send.removeAttribute("aria-disabled");
      delete send.dataset.aiConsentLocked;
    }
  }

  function installStyles() {
    if ($("ariAiConsentStyles")) return;

    const style = document.createElement("style");
    style.id = "ariAiConsentStyles";
    style.textContent = `
      #ariAiConsentDialog {
        width: min(92vw, 520px);
        max-width: 520px;
        border: 1px solid rgba(48, 107, 255, .18);
        border-radius: 28px;
        padding: 0;
        color: #10192b;
        background: rgba(252, 253, 255, .98);
        box-shadow: 0 28px 90px rgba(18, 39, 90, .24);
      }
      #ariAiConsentDialog::backdrop {
        background: rgba(9, 17, 34, .50);
        backdrop-filter: blur(10px);
      }
      .ari-ai-consent-card { padding: 28px; }
      .ari-ai-consent-kicker {
        margin: 0 0 10px;
        font: 800 11px/1.2 Orbitron, system-ui, sans-serif;
        letter-spacing: .16em;
        color: #345bda;
      }
      .ari-ai-consent-card h2 {
        margin: 0;
        font: 800 25px/1.15 Inter, system-ui, sans-serif;
      }
      .ari-ai-consent-card p {
        margin: 14px 0 0;
        font: 500 15px/1.55 Inter, system-ui, sans-serif;
        color: #46536a;
      }
      .ari-ai-consent-list {
        margin: 18px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }
      .ari-ai-consent-list li {
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(69, 112, 255, .06);
        font: 600 13px/1.4 Inter, system-ui, sans-serif;
        color: #34415a;
      }
      .ari-ai-consent-actions {
        display: grid;
        gap: 10px;
        margin-top: 22px;
      }
      .ari-ai-consent-allow,
      .ari-ai-consent-later {
        min-height: 50px;
        border-radius: 16px;
        font: 800 13px/1 Inter, system-ui, sans-serif;
        cursor: pointer;
      }
      .ari-ai-consent-allow {
        border: 0;
        color: #fff;
        background: linear-gradient(135deg, #2457ff, #6849ff);
      }
      .ari-ai-consent-later {
        border: 1px solid rgba(32, 57, 110, .15);
        color: #26334d;
        background: #fff;
      }
      .ari-ai-consent-links {
        margin-top: 15px;
        text-align: center;
        font: 600 12px/1.4 Inter, system-ui, sans-serif;
      }
      .ari-ai-consent-links a { color: #345bda; }
    `;
    document.head.appendChild(style);
  }

  function ensureDialog() {
    if (state.dialog) return state.dialog;

    installStyles();

    const dialog = document.createElement("dialog");
    dialog.id = "ariAiConsentDialog";
    dialog.setAttribute("aria-labelledby", "ariAiConsentTitle");
    dialog.innerHTML = `
      <div class="ari-ai-consent-card">
        <p class="ari-ai-consent-kicker">AI PROCESSING</p>
        <h2 id="ariAiConsentTitle">Before you talk with ARI</h2>
        <p>
          ARI XP uses <strong>OpenAI</strong> to generate AI responses. When you send a message,
          ARI XP may send the message, recent conversation context, and relevant information
          from your ARI XP profile or memory to OpenAI when needed to answer you.
        </p>
        <ul class="ari-ai-consent-list">
          <li>Only information needed for the AI request is sent.</li>
          <li>You can decline and continue using non-AI parts of ARI XP.</li>
          <li>You can change this permission later from Privacy &amp; Ari Memory.</li>
        </ul>
        <div class="ari-ai-consent-actions">
          <button class="ari-ai-consent-allow" id="ariAiConsentAllow" type="button">Allow AI processing</button>
          <button class="ari-ai-consent-later" id="ariAiConsentLater" type="button">Not now</button>
        </div>
        <div class="ari-ai-consent-links">
          <a href="privacy.html">Read the Privacy Notice</a>
        </div>
      </div>
    `;

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
    });

    document.body.appendChild(dialog);

    $("ariAiConsentAllow")?.addEventListener("click", grantConsent);
    $("ariAiConsentLater")?.addEventListener("click", declineConsent);

    state.dialog = dialog;
    return dialog;
  }

  function showConsent() {
    const dialog = ensureDialog();
    if (!dialog.open && typeof dialog.showModal === "function") {
      dialog.showModal();
    }
  }

  async function writeMetadata(values) {
    const supabase = client();
    if (!supabase?.auth?.updateUser) {
      throw new Error("ARI account service is unavailable.");
    }

    const metadata = {
      ...(state.user?.user_metadata || {}),
      ...values
    };

    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });

    if (error) throw error;

    state.user = data?.user || {
      ...(state.user || {}),
      user_metadata: metadata
    };

    return state.user;
  }

  async function grantConsent() {
    const button = $("ariAiConsentAllow");
    if (button) button.disabled = true;

    try {
      await writeMetadata({
        [CONSENT_KEY]: true,
        [VERSION_KEY]: CONSENT_VERSION,
        [GRANTED_AT_KEY]: new Date().toISOString(),
        [DECLINED_AT_KEY]: null
      });

      state.allowed = true;
      unlockComposer();
      state.dialog?.close?.();
      window.dispatchEvent(
        new CustomEvent("ari:ai-processing-consent", {
          detail: { allowed: true, version: CONSENT_VERSION }
        })
      );
      $("ariInput")?.focus?.();
    } catch (error) {
      console.error("ARI AI consent save failed:", error);
      if (button) button.disabled = false;
      window.alert("ARI XP could not save your AI processing choice. Please try again.");
    }
  }

  async function declineConsent() {
    const button = $("ariAiConsentLater");
    if (button) button.disabled = true;

    try {
      await writeMetadata({
        [CONSENT_KEY]: false,
        [VERSION_KEY]: CONSENT_VERSION,
        [DECLINED_AT_KEY]: new Date().toISOString()
      });
    } catch (error) {
      console.warn("ARI AI consent decline could not be saved:", error);
    } finally {
      if (button) button.disabled = false;
      state.allowed = false;
      lockComposer();
      state.dialog?.close?.();
    }
  }

  async function revokeConsent() {
    await writeMetadata({
      [CONSENT_KEY]: false,
      [VERSION_KEY]: CONSENT_VERSION,
      [DECLINED_AT_KEY]: new Date().toISOString()
    });

    state.allowed = false;
    lockComposer();

    window.dispatchEvent(
      new CustomEvent("ari:ai-processing-consent", {
        detail: { allowed: false, version: CONSENT_VERSION }
      })
    );
  }

  async function init() {
    if (state.initialized) return;
    state.initialized = true;

    lockComposer();

    const supabase = client();
    if (!supabase?.auth?.getSession) return;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      state.user = data?.session?.user || null;
      state.allowed = hasCurrentConsent(state.user);

      if (state.allowed) {
        unlockComposer();
      } else {
        showConsent();
      }
    } catch (error) {
      console.error("ARI AI consent initialization failed:", error);
      lockComposer();
    }
  }

  window.AriAIConsent = Object.freeze({
    version: "1.0.0",
    consentVersion: CONSENT_VERSION,
    isAllowed: () => state.allowed === true,
    show: showConsent,
    revoke: revokeConsent,
    refresh: init
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
