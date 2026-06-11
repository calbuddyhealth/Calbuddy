// ari-language-insight-builder.js
// Purpose: Speak about patterns, conflicts, hypotheses, and tradeoffs.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageInsightBuilder = {
  version: "1.0.0",

  build(analysis = {}) {
    const lines = [];

    const insight = analysis.insight || {};

    const pattern = insight.pattern?.name;
    const hiddenConflict = insight.hiddenConflict?.name;
    const tradeoff = insight.tradeoff?.name;
    const hypothesis = insight.hypothesis;
    const counterHypothesis = insight.counterHypothesis;
    const oneLineInsight = insight.oneLineInsight;

    if (pattern) {
      lines.push(this.humanizePattern(pattern));
    }

    if (hiddenConflict) {
      lines.push(this.humanizeConflict(hiddenConflict));
    }

    if (tradeoff) {
      lines.push(this.humanizeTradeoff(tradeoff));
    }

    if (oneLineInsight) {
      lines.push(oneLineInsight);
    }

    if (hypothesis?.explanation) {
      lines.push(
        `I could be wrong, but ${this.lowercaseFirst(
          hypothesis.explanation
        )}`
      );
    }

    if (counterHypothesis?.explanation) {
      lines.push(
        `Another possibility is that ${this.lowercaseFirst(
          counterHypothesis.explanation
        )}`
      );
    }

    return lines.filter(Boolean);
  },

  humanizePattern(name = "") {
    const map = {
      achievement_before_presence:
        "Ari may be noticing a pattern where achievement feels like it must come before presence.",

      achievement_before_peace:
        "Ari may be noticing a pattern where peace keeps getting delayed until the next achievement.",

      too_many_primary_roles:
        "Ari may be noticing that too many meaningful roles are trying to be primary at the same time.",

      responsibility_before_recovery:
        "Ari may be noticing a pattern where responsibility keeps arriving before recovery."
    };

    return (
      map[name] ||
      `Ari may be noticing a pattern around ${name.replaceAll("_", " ")}.`
    );
  },

  humanizeConflict(name = "") {
    const map = {
      provider_vs_presence:
        "The deeper conflict may not be family versus work. It may be providing versus being present.",

      family_vs_purpose:
        "The deeper conflict may be family versus purpose.",

      identity_vs_transition:
        "The deeper conflict may be an old identity resisting a new chapter.",

      growth_vs_stability:
        "The deeper conflict may be growth versus stability."
    };

    return (
      map[name] ||
      `The deeper conflict may be ${name.replaceAll("_", " ")}.`
    );
  },

  humanizeTradeoff(name = "") {
    const map = {
      presence_vs_acceleration:
        "The real tradeoff may be presence versus acceleration.",

      growth_vs_stability:
        "The real tradeoff may be growth versus stability.",

      family_presence_vs_creation:
        "The real tradeoff may be family presence versus creation."
    };

    return (
      map[name] ||
      `The tradeoff may be ${name.replaceAll("_", " ")}.`
    );
  },

  lowercaseFirst(text = "") {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
};