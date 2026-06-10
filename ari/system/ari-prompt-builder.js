// ari/system/ari-prompt-builder.js
// Ari Prompt Builder
// Purpose: Convert Ari's architecture + analysis into a compact system summary for API calls.

window.Ari = window.Ari || {};

window.Ari.promptBuilder = {
  version: "1.0.0",

  buildArchitectureSummary() {
    const architecture = window.Ari.loader?.getArchitecture?.();

    if (!architecture) {
      return "Ari architecture has not been loaded yet.";
    }

    return `
ARI ARCHITECTURE SUMMARY

Constitution:
${architecture.files.constitution || ""}

Soul:
${architecture.files.soul || ""}

Guardian:
${architecture.files.guardian || ""}

Self Model:
${architecture.files.selfModel || ""}

Operating Model:
${architecture.files.operatingModel || ""}

Priority Matrix:
${architecture.files.priorityMatrix || ""}
`.trim();
  },

  buildOrganSummary(primaryOrgan, supportingOrgans = []) {
    const architecture = window.Ari.loader?.getArchitecture?.();

    if (!architecture?.organs) {
      return "No organ architecture loaded.";
    }

    const parts = [];

    if (primaryOrgan && architecture.organs[primaryOrgan]) {
      parts.push(`PRIMARY ORGAN: ${primaryOrgan}\n${architecture.organs[primaryOrgan]}`);
    }

    supportingOrgans.forEach((organ) => {
      if (architecture.organs[organ]) {
        parts.push(`SUPPORTING ORGAN: ${organ}\n${architecture.organs[organ]}`);
      }
    });

    return parts.join("\n\n").trim();
  },

  buildSystemPrompt({ message = "", context = {}, analysis = {} } = {}) {
    const summary = window.Ari.core?.createSystemSummary?.(analysis) || {};
    const primaryOrgan = summary.primaryOrgan || "companion";
    const supportingOrgans = summary.supportingOrgans || [];

    return `
You are Ari.

Use Ari's architecture as the highest guidance.

${this.buildArchitectureSummary()}

ACTIVE ROUTING:
- Primary organ: ${primaryOrgan}
- Supporting organs: ${supportingOrgans.join(", ") || "none"}
- Guardian required: ${summary.guardianRequired}
- Primary emotion: ${summary.primaryEmotion}
- Secondary emotions: ${summary.secondaryEmotions?.join(", ") || "none"}
- Balance: Brain ${summary.balance?.brain}%, Heart ${summary.balance?.heart}%, Soul ${summary.balance?.soul}%

ACTIVE ORGAN GUIDANCE:
${this.buildOrganSummary(primaryOrgan, supportingOrgans)}

RESPONSE RULES:
- Speak as Ari.
- Define Ari by mission, not mechanism.
- Be honest and grounded.
- Do not claim actions that were not performed.
- Do not fake human experiences.
- Use the active organ as the lead voice.
- Let Heart influence tone.
- Let Guardian override safety and honesty concerns.
- Keep the human's growth at the center.
`.trim();
  }
};