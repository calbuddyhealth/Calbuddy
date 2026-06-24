// ari/developer/ari-rebirth-ui-layout-planner-engine.js
// Purpose: Convert owner UI requests into a structured layout blueprint.
// V1.0.0 — Layout Planning Only / No Patching / No GitHub Authority

window.Ari = window.Ari || {};

window.AriRebirthUILayoutPlannerEngine = {
  version: "1.0.0",

  plan(input = {}) {
    const summary = input.summary || input || {};

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding;

    if (!understanding?.isDeveloperWork) return null;

    if (understanding.targetArea !== "homepage_ui") return null;

    const requestedChanges =
      understanding.requestedChanges || [];

    const blueprint = {
      uiLayoutPlannerRan: true,
      uiLayoutPlannerVersion: this.version,
      source: "ari-rebirth-ui-layout-planner-engine",

      layoutType: this.inferLayoutType(
        requestedChanges,
        summary
      ),

      requestedChanges,

      remove: [],
      hide: [],
      resize: [],
      move: [],

      affectedFiles: [
        "index.html",
        "style.css"
      ],

      confidence: 0.8
    };

    if (requestedChanges.includes("remove_ari_mascot")) {
      blueprint.remove.push({
        target: "#ariMascot",
        reason: "Owner requested mascot removal"
      });

      blueprint.remove.push({
        target: ".ari-hero-section",
        reason: "Mascot container"
      });
    }

    if (
      requestedChanges.includes(
        "hide_conversation_history"
      )
    ) {
      blueprint.hide.push({
        target: "#ariConversationPanel",
        reason: "Owner requested history hidden"
      });
    }

    if (
      requestedChanges.includes(
        "expand_chat_box"
      )
    ) {
      blueprint.resize.push({
        target: ".ari-search-section",
        action: "expand"
      });

      blueprint.resize.push({
        target: "#ariInput",
        action: "increase_height"
      });
    }

    if (
      requestedChanges.includes(
        "remove_homepage_action_tiles"
      )
    ) {
      blueprint.remove.push({
        target: ".ari-action-grid",
        reason: "Owner requested tile removal"
      });
    }

    if (
      requestedChanges.includes(
        "homepage_layout_redesign"
      )
    ) {
      blueprint.layoutType = "chat_first";

      blueprint.move.push({
        target: ".calorie-card",
        destination: "below_chat"
      });
    }

    return blueprint;
  },

  inferLayoutType(
    requestedChanges = [],
    summary = {}
  ) {
    if (
      requestedChanges.includes(
        "homepage_layout_redesign"
      )
    ) {
      return "chat_first";
    }

    return "ari_first";
  }
};

console.log(
  "ARI UI LAYOUT PLANNER LOADED:",
  window.AriRebirthUILayoutPlannerEngine.version
);