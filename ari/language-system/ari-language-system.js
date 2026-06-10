// ari/language-system/ari-language-system.js
// Ari Language System
// Purpose: Convert Ari's deep analysis into short, human, useful responses.
// V3.0: Adds question-type routing so insight questions use Insight before Executive.

window.Ari = window.Ari || {};

window.Ari.languageSystem = {
  version: "3.0.0",

  generate(analysis = {}, options = {}) {
    const summary = window.Ari.core
      ? window.Ari.core.createSystemSummary(analysis)
      : {};

    const questionType = analysis.questionType || summary.questionType || "understanding";

    if (questionType === "insight") {
      return this.generateInsightResponse(analysis, summary);
    }

    if (questionType === "emotional") {
      return this.generateEmotionalResponse(analysis, summary);
    }

    const length = options.length || this.chooseLength(analysis);
    const style = options.style || this.chooseStyle(analysis);

    const coreInsight = this.getCoreInsight(analysis, summary);
    const direction = this.getDirection(analysis, summary);
    const nextStep = this.getNextStep(analysis, summary);

    if (length === "brief") {
      return this.briefResponse(coreInsight, direction, nextStep);
    }

    if (length === "deep") {
      return this.deepResponse(coreInsight, direction, nextStep, analysis, summary);
    }

    return this.normalResponse(coreInsight, direction, nextStep, style);
  },

  chooseLength(analysis = {}) {
    const text = analysis.message || "";

    if (text.length < 80) return "brief";

    if (
      text.includes("why") ||
      text.includes("what am i actually") ||
      text.includes("hidden conflict") ||
      text.includes("meaning")
    ) {
      return "deep";
    }

    return "normal";
  },

  chooseStyle(analysis = {}) {
    const emotion = analysis.emotion || {};
    const executive = analysis.executive || {};

    if (executive.executiveDecision) return "steward";

    if (emotion.primaryEmotion === "compassion") return "companion";

    return "clear";
  },

  generateInsightResponse(analysis = {}, summary = {}) {
    const insight = analysis.insight || {};
    const text = String(analysis.message || "").toLowerCase();

    if (
      text.includes("central struggle") ||
      text.includes("summarize the central struggle")
    ) {
      return this.applyWisdomCompression(
        "Your central struggle is trying to honor every important identity at once without accepting that life moves in seasons."
      );
    }

    if (
      text.includes("what pattern") ||
      text.includes("pattern do you see")
    ) {
      if (insight.pattern?.name && insight.pattern.name !== "unclear") {
        return this.applyWisdomCompression(
          `${insight.oneLineInsight || "I see a pattern."}\n\nThe pattern is ${this.humanizeLabel(insight.pattern.name)}.`
        );
      }

      return this.applyWisdomCompression(
        "The pattern is not that life keeps getting harder.\n\nThe pattern is that peace keeps getting placed on the other side of the next achievement."
      );
    }

    if (
      text.includes("what am i avoiding") ||
      text.includes("what am i not seeing") ||
      text.includes("blind spot")
    ) {
      if (insight.avoidance?.name && insight.avoidance.name !== "none_detected") {
        return this.applyWisdomCompression(
          `${insight.oneLineInsight || "There is something you may not want to name yet."}\n\nYou may already know the answer. The hard part is accepting what it costs.`
        );
      }

      return this.applyWisdomCompression(
        "You may not be avoiding the answer.\n\nYou may be avoiding the cost of accepting it."
      );
    }

    if (insight.oneLineInsight) {
      return this.applyWisdomCompression(insight.oneLineInsight);
    }

    return "I think there is something important here, but Ari does not have enough context yet to name it cleanly.";
  },

  generateEmotionalResponse(analysis = {}, summary = {}) {
    const emotion = analysis.emotion || {};
    const primaryEmotion = emotion.primaryEmotion || "concern";

    if (primaryEmotion === "compassion" || primaryEmotion === "concern") {
      return this.applyWisdomCompression(
        "Slow down.\n\nThis is not weakness. This is your system telling you something matters and needs care."
      );
    }

    if (primaryEmotion === "stewardship") {
      return this.applyWisdomCompression(
        "You are trying to protect something important.\n\nBefore you act, name what cannot be replaced."
      );
    }

    return this.applyWisdomCompression(
      "The feeling matters.\n\nDo not ignore it, but do not let it drive alone."
    );
  },

  humanizeLabel(label = "") {
    const labels = {
      too_many_primary_roles: "trying to make too many roles primary at the same time",
      service_without_recovery: "serving without protecting your recovery",
      growth_scattered_across_too_many_paths: "spreading growth across too many demanding paths",
      family_vs_purpose: "protecting family while fearing you are betraying purpose",
      identity_overload: "carrying too many identities at full strength",
      provider_vs_presence: "confusing providing more with being present more",
      chosen_sacrifice: "needing to choose one sacrifice instead of letting life choose it for you"
    };

    return labels[label] || label.replaceAll("_", " ");
  },

  getCoreInsight(analysis = {}, summary = {}) {
    if (summary.primaryPriority === "family") {
      return "For this season, family comes first.";
    }

    if (summary.primaryConflict === "identity_vs_transition") {
      return "The real conflict is not just your goals. It is who gets to become primary next.";
    }

    if (summary.conflictIntensity === "critical") {
      return "You are carrying too many major priorities at the same time.";
    }

    if (summary.dominantValue) {
      return `Your strongest value here appears to be ${summary.dominantValue}.`;
    }

    return "The important thing is to identify what matters most before acting.";
  },

  getDirection(analysis = {}, summary = {}) {
    const executive = analysis.executive || {};

    if (executive.recommendedFocus) {
      return executive.recommendedFocus;
    }

    if (summary.needsExecutiveFunction) {
      return "Do not treat every goal as equal. One has to lead, and the others need to support it.";
    }

    return "Move slowly enough to make a clear decision.";
  },

  getNextStep(analysis = {}, summary = {}) {
    const delay = summary.thingsToDelay || [];

    if (delay.length > 0) {
      return `Put ${this.humanizeLabel(delay[0])} into maintenance mode first.`;
    }

    if (summary.primaryPriority) {
      return `Protect ${this.humanizeLabel(summary.primaryPriority)} this week with one concrete action.`;
    }

    return "Choose one next action instead of trying to solve everything at once.";
  },

  compressInsight(text = "") {
    const replacements = [
      {
        from: "For this season, family comes first.",
        to: "Some opportunities return.\nFamily moments don't."
      },
      {
        from: "Make family the primary focus for this season. Keep other identities alive, but do not let them compete equally.",
        to: "Keep your other ambitions alive.\nJust don't let them sit in the driver's seat."
      },
      {
        from: "The move is simple: Protect family this week with one concrete action.",
        to: "This week, protect one family moment on purpose."
      },
      {
        from: "The tradeoff is that something meaningful may need to slow down so something irreplaceable can be protected.",
        to: "The tradeoff is simple:\nSomething meaningful may need to slow down so something irreplaceable can be protected."
      },
      {
        from: "You are carrying too many major priorities at the same time.",
        to: "You are carrying too many futures at once."
      },
      {
        from: "Do not treat every goal as equal. One has to lead, and the others need to support it.",
        to: "Not every goal gets to be first.\nOne leads. The others support."
      },
      {
        from: "Put career-acceleration into maintenance mode first.",
        to: "Slow the career sprint first."
      },
      {
        from: "Put nonessential-expansion into maintenance mode first.",
        to: "Stop adding extra battles first."
      },
      {
        from: "Put creation-scaling into maintenance mode first.",
        to: "Keep creating, but stop scaling for now."
      }
    ];

    let result = text;

    replacements.forEach((rule) => {
      result = result.replace(rule.from, rule.to);
    });

    return result;
  },

  applyWisdomCompression(response = "") {
    return this.compressInsight(response).trim();
  },

  briefResponse(coreInsight, direction, nextStep) {
    const response = [
      coreInsight,
      "",
      direction,
      "",
      `Next step: ${nextStep}`
    ].join("\n");

    return this.applyWisdomCompression(response);
  },

  normalResponse(coreInsight, direction, nextStep, style = "clear") {
    const response = [
      coreInsight,
      "",
      direction,
      "",
      `The move is simple: ${nextStep}`
    ].join("\n");

    return this.applyWisdomCompression(response);
  },

  deepResponse(coreInsight, direction, nextStep, analysis = {}, summary = {}) {
    const response = [
      coreInsight,
      "",
      direction,
      "",
      "The tradeoff is that something meaningful may need to slow down so something irreplaceable can be protected.",
      "",
      `Next step: ${nextStep}`
    ].join("\n");

    return this.applyWisdomCompression(response);
  }
};