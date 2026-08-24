// ARI XP — Conversation Style automatic compatibility layer.
//
// Keeps the existing V3 preference schema backward-compatible while making
// Automatic the effective default. Explicit Custom selections remain locks.

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const VERSION = "1.0.0";
  const AUTO = "auto";
  const PATHS = [
    ["tone", "Adapt Ari's tone to the current conversation. Auto is not a fixed tone lock."],
    ["directness", "Leave directness adaptive so current-turn instructions and learned conversation personalization can determine how direct Ari should be."],
    ["humor", "Use humor contextually when it naturally fits. Auto is not a fixed humor frequency and must not force jokes."],
    ["profanity", "Use Ari's standard adaptive language. Auto neither requires profanity nor prohibits ordinary contextual language."],
    ["complexity", "Leave explanation complexity adaptive so Ari can match the conversation and learned user preference."],
    ["detail", "Leave response length adaptive so Ari can use current-turn instructions and learned conversation personalization."]
  ];

  function clone(value) {
    try { return structuredClone(value); } catch (_error) {
      try { return JSON.parse(JSON.stringify(value)); } catch (_fallback) { return value; }
    }
  }

  function automaticSnapshot() {
    return {
      language: {
        tone: AUTO,
        directness: AUTO,
        humor: AUTO,
        profanity: AUTO,
        complexity: AUTO,
        detail: AUTO
      }
    };
  }

  function patchContract() {
    const contract = window.AriUserPreferenceContract || window.Ari?.userPreferenceContract;
    if (!contract || contract.__conversationStyleAutoPatched === true) return false;

    const language = contract.categories?.language?.preferences;
    if (!language) return false;

    for (const [key, instruction] of PATHS) {
      const preference = language[key];
      if (!preference?.options) continue;

      preference.options[AUTO] = {
        label: "Auto",
        description: "Let Ari adapt automatically.",
        enforcement: contract.ENFORCEMENT?.ADAPTIVE || "adaptive",
        currentTurnAdjustable: true,
        instruction
      };
      preference.defaultValue = AUTO;
    }

    // Profanity gets a clear hard opt-out. Keep legacy `default` accepted in
    // the contract so old Custom records remain readable.
    if (language.profanity?.options) {
      language.profanity.options.never = {
        label: "Never",
        description: "Do not use profanity.",
        enforcement: contract.ENFORCEMENT?.HARD_OPT_OUT || "hard_opt_out",
        currentTurnAdjustable: false,
        instruction: "Do not use profanity. This is an explicit saved Conversation Style lock."
      };
    }

    contract.runtimeDefaults = automaticSnapshot();
    if (contract.presets?.default) {
      contract.presets.default.label = "Automatic";
      contract.presets.default.description =
        "Lets Ari adapt conversation style automatically unless the user locks a specific setting.";
    }

    // Historical default records stored a complete Natural/Balanced snapshot.
    // When the preset is still `default`, ignore that old snapshot so it cannot
    // masquerade as six manual locks.
    if (typeof contract.resolvePreferences === "function") {
      const originalResolvePreferences = contract.resolvePreferences.bind(contract);
      contract.resolvePreferences = function resolvePreferencesWithAutomaticDefault(input = {}) {
        const next = { ...(input || {}) };
        const preset = String(next.activePreset || "default").trim().toLowerCase();
        if (["default", "auto", "automatic"].includes(preset)) {
          next.activePreset = "default";
          next.persistentOverrides = {};
        }
        return originalResolvePreferences(next);
      };
    }

    Object.defineProperty(contract, "__conversationStyleAutoPatched", {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    });

    return true;
  }

  function patchStore() {
    const store = window.AriUserPreferenceStore || window.Ari?.userPreferenceStore;
    if (!store || store.__conversationStyleAutoPatched === true) return false;

    // Normalize untouched legacy default records into an Auto snapshot for all
    // browser consumers, including the settings controller and Rebirth runtime.
    if (typeof store.normalizeRecord === "function") {
      const originalNormalizeRecord = store.normalizeRecord.bind(store);
      store.normalizeRecord = function normalizeConversationStyleRecord(data = {}) {
        const record = originalNormalizeRecord(data);
        const preset = String(record?.activePreset || "default").trim().toLowerCase();
        if (["default", "auto", "automatic"].includes(preset)) {
          record.preferenceOverrides = automaticSnapshot();
          record.automaticConversationStyle = true;
          record.legacyDefaultTreatedAsAutomatic = true;
        } else {
          record.automaticConversationStyle = false;
          record.legacyDefaultTreatedAsAutomatic = false;
        }
        return record;
      };
    }

    Object.defineProperty(store, "__conversationStyleAutoPatched", {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    });
    return true;
  }

  const ready = patchContract();
  patchStore();

  window.AriConversationStyleAutoContract = {
    version: VERSION,
    source: "ari-conversation-style-auto-contract",
    ready,
    automaticSnapshot: () => clone(automaticSnapshot()),
    patchContract,
    patchStore
  };

  window.Ari.conversationStyleAutoContract = window.AriConversationStyleAutoContract;
})();
