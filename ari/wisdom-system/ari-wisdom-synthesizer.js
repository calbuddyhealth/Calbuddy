// ari/wisdom-system/ari-wisdom-synthesizer.js
// Ari Wisdom Synthesizer
// Purpose: Merge insight, wisdom, consequences, and principles.
// V1.0

window.Ari = window.Ari || {};

window.Ari.wisdomSynthesizer = {
  version: "1.0.0",

  synthesize({
    insight = {},
    wisdom = {},
    wisdomResolution = {},
    consequences = {},
    personModel = {},
    beliefModel = {}
  } = {}) {

    const principles =
      window.Ari.wisdomLibrary?.findRelevant({
        theme: personModel.lifeChapter?.name,
        tension: wisdom.wisdomTension,
        belief: beliefModel.primaryBelief?.name,
        role: personModel.snapshot?.primaryRole
      }) || [];

    const principleStatements =
      principles.map(p => p.statement);

    let synthesis =
      wisdom.wisdomResolvedStatement ||
      wisdom.wisdomStatement ||
      insight.oneLineInsight ||
      "Wisdom requires more observation.";

    if (
      consequences.primaryConsequence
    ) {
      synthesis +=
        ` Long-term consequence: ${consequences.primaryConsequence}`;
    }

    return {
      synthesis,
      principles,
      principleStatements,

      primaryPrinciple:
        principles[0]?.statement || null,

      archetype:
        principles[0]?.archetype || null,

      source: "ari-wisdom-synthesizer"
    };
  }
};