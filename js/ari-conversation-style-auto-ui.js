// ARI XP — Conversation Style automatic UI enhancement.
// Runs before the existing preference settings controller so the controller
// discovers Auto as the canonical HTML default without duplicating form logic.

(() => {
  "use strict";

  const AUTO_DESCRIPTIONS = {
    "language.tone": "Let Ari adapt tone to the conversation.",
    "language.directness": "Let Ari learn how direct to be with you.",
    "language.humor": "Let Ari use humor when it naturally fits.",
    "language.profanity": "Let Ari use her standard adaptive language.",
    "language.complexity": "Let Ari adapt how simple or advanced explanations should be.",
    "language.detail": "Let Ari learn how much detail works best for you."
  };

  function makeAutoOption(path, description) {
    const label = document.createElement("label");
    label.className = "ari-preference-option ari-preference-option--auto";
    label.innerHTML = `
      <input
        type="radio"
        name="${path}"
        value="auto"
        data-path="${path}"
        data-default="true"
        checked
      />
      <span class="ari-preference-option__content">
        <span class="ari-preference-option__label">Auto</span>
        <span class="ari-preference-option__description">${description}</span>
      </span>
    `;
    return label;
  }

  function replaceText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  function enhance() {
    const root = document.getElementById("ari-preference-settings");
    if (!root || root.dataset.conversationStyleAutoUi === "true") return false;

    document.title = "Conversation Style | ARI XP";
    replaceText(".ari-preference-settings__eyebrow", "CONVERSATION STYLE");
    replaceText(
      "#ari-preference-settings-title",
      "Let Ari adapt automatically—or lock what you want."
    );
    replaceText(
      ".ari-preference-settings__subtitle",
      "Automatic is the default. Ari learns how you prefer to communicate and adapts over time. Choose a specific option only when you want to lock that part of Ari's conversation style."
    );

    for (const [path, description] of Object.entries(AUTO_DESCRIPTIONS)) {
      const group = root.querySelector(`fieldset[data-preference-group="${path}"]`);
      const options = group?.querySelector(".ari-preference-options");
      if (!group || !options) continue;

      for (const input of options.querySelectorAll('input[type="radio"][data-default="true"]')) {
        input.removeAttribute("data-default");
        input.checked = false;
      }

      const existingAuto = options.querySelector(`input[data-path="${path}"][value="auto"]`);
      if (!existingAuto) {
        options.prepend(makeAutoOption(path, description));
      } else {
        existingAuto.dataset.default = "true";
        existingAuto.checked = true;
      }
    }

    // Replace the ambiguous legacy profanity Default option with a clear hard
    // opt-out in the UI. The compatibility contract still accepts legacy
    // `default` values from older saved Custom profiles.
    const profanityGroup = root.querySelector('fieldset[data-preference-group="language.profanity"]');
    const legacyProfanity = profanityGroup?.querySelector('input[value="default"]');
    if (legacyProfanity) {
      const option = legacyProfanity.closest("label");
      legacyProfanity.value = "never";
      const title = option?.querySelector(".ari-preference-option__label");
      const description = option?.querySelector(".ari-preference-option__description");
      if (title) title.textContent = "Never";
      if (description) description.textContent = "Do not use profanity.";
    }

    const blunt = root.querySelector('input[data-path="language.directness"][value="blunt"]');
    const bluntLabel = blunt?.closest("label")?.querySelector(".ari-preference-option__label");
    if (bluntLabel) bluntLabel.textContent = "Direct";

    replaceText(
      ".ari-preference-settings__scope-note",
      "Automatic personalization changes only how Ari communicates and explains information. It does not change Ari's reasoning, factual conclusions, safety decisions, available tools, memory retrieval, or the subjects Ari can discuss."
    );
    replaceText("#ari-preference-reset", "Reset to Automatic");
    replaceText("#ari-preference-save", "Save style");

    root.dataset.conversationStyleAutoUi = "true";
    return true;
  }

  const ready = enhance();
  window.AriConversationStyleAutoUI = {
    version: "1.0.0",
    source: "ari-conversation-style-auto-ui",
    ready,
    enhance
  };
})();
