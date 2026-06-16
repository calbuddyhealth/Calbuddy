// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V5.1.0 — Natural Response Composer

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "5.1.0",

  compose(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};
    const mouth = summary.mouthDirector || {};
    const reasoning = summary.reasoning || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      mouth.contractPrimary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    const sectionOrder =
      mouth.sectionOrder ||
      contract.mouthDirective?.order ||
      [primary];

    const maxBodySections =
      Number(mouth.maxBodySections || language.maxBodySections || 4);

    const parts = this.buildParts({
      summary,
      contract,
      language,
      reasoning,
      primary
    });

    let bodyParts = this.orderParts(parts, sectionOrder, primary);
    bodyParts = this.cleanParts(bodyParts, language);
    bodyParts = bodyParts.slice(0, maxBodySections);

    let opening = this.createOpening({ summary, reasoning, language, primary });
    let closing = this.createClosing({ summary, contract, mouth, language, primary });

    opening = this.cleanText(opening, language);
    closing = this.cleanText(closing, language);

    if (
      opening &&
      bodyParts.length &&
      this.normalize(opening) === this.normalize(bodyParts[0])
    ) {
      opening = "";
    }

    let finalResponse = this.joinResponse(opening, bodyParts, closing);
    finalResponse = this.finalPolish(finalResponse, language);

    return {
      languageMode: primary,
      languageOpening: opening || null,
      languageBody: bodyParts.join("\n\n"),
      languageClosing: closing || null,
      finalResponse,

      composerVersion: this.version,
      source: "ari-language-composer",

      composerDebug: {
        primary,
        sectionOrder,
        maxBodySections,
        humanLanguageTone: language.tone,
        humanLanguageWarmth: language.warmth,
        humanLanguageDirectness: language.directness,
        mouthAuthority: mouth.mouthAuthority,
        usedParts: bodyParts
      }
    };
  },

  buildParts({ summary, contract, language, reasoning, primary }) {
    const parts = {};

    parts[primary] = this.primaryText(primary, summary, contract, language, reasoning);

    if (contract.brief?.includes("emotion")) {
      parts.brief_emotion = this.emotionText(summary, language);
    }

    if (contract.context?.includes("medical_context")) {
      parts.context_medical_context = this.medicalContextText(summary, language, primary);
    }

    parts.defer_life_chapter = null;
    parts.defer_deep_emotion = null;

    return parts;
  },

  primaryText(primary, summary, contract, language, reasoning = {}) {
    if (primary === "risk_clarification") {
      return contract.clarity?.question || summary.followUpQuestion || "Are you safe right now?";
    }

    if (primary === "executive_decision") {
      return (
        this.composeExecutiveDecision(summary, reasoning) ||
        summary.executiveAnswer ||
        summary.actionText ||
        "Separate what is urgent, what is important, and what can safely wait."
      );
    }

    if (primary === "builder") {
      return (
        summary.builderAnswer ||
        summary.codeAnswer ||
        summary.implementationAnswer ||
        "Start with the specific failing file, function, or error message."
      );
    }

    if (primary === "teacher") {
      return (
        summary.teachingAnswer ||
        summary.knowledgeAnswer ||
        summary.humanTruth ||
        "The simplest way to understand it is to start with the core idea."
      );
    }

    if (primary === "medical_body") {
      return (
        summary.medicalAnswer ||
        "If symptoms are severe, worsening, or involve red flags, get urgent care now."
      );
    }

    if (primary === "medical_context") {
      return (
        summary.medicalAnswer ||
        "This sounds medically relevant, but not automatically an emergency based on what you described."
      );
    }

    if (primary === "safety") {
      return summary.safetyAnswer || "If there is immediate danger, contact emergency services now.";
    }

    if (primary === "emotion") {
      return summary.emotionAnswer || "That sounds heavy.";
    }

    if (primary === "wisdom") {
      return summary.wisdomAnswer || summary.wisdomText || "The wiser move is to name the tradeoff clearly before choosing.";
    }

    if (primary === "relationship") {
      return summary.relationshipAnswer || "The relationship piece needs honesty without turning it into a fight.";
    }

    if (primary === "family") {
      return summary.familyAnswer || "The family priority needs to be protected before everything else gets loud.";
    }

    if (primary === "memory") {
      return summary.memoryAnswer || "Got it.";
    }

    return (
      summary.directAnswer ||
      summary.humanTruth ||
      summary.oneLineInsight ||
      "Here’s the practical answer."
    );
  },

  composeExecutiveDecision(summary, reasoning = {}) {
    const rec = reasoning.recommendation || {};
    const priorities = reasoning.priorityStack || [];
    const delayOrDecline = reasoning.delayOrDecline || [];
    const tradeoffs = reasoning.tradeoffs || [];
    const counterfactuals = reasoning.counterfactuals || [];
    const regret = reasoning.regretLens || {};
    const missing = reasoning.missingInformation || [];

    if (!rec.summary && !priorities.length && !tradeoffs.length) return null;

    const lines = [];

    const first = priorities[0];
    if (first) {
      lines.push(
        `I’d anchor the decision around ${first.label || this.humanizePriority(first.priority)} first. ${this.capitalize(first.reason)}.`
      );
    } else if (rec.summary) {
      lines.push(rec.summary);
    }

    if (delayOrDecline.length) {
      const declineLines = delayOrDecline
        .map(item => item.recommendation || item.item)
        .filter(Boolean);

      if (declineLines.length) {
        lines.push(declineLines.join(" "));
      }
    }

    const promotionOption = counterfactuals.find(item =>
      this.normalize(item.option).includes("accept the promotion")
    );

    if (promotionOption) {
      lines.push(
        `For the promotion, I wouldn’t give an automatic yes. It has real upside — ${this.joinList(promotionOption.benefits)} — but the cost is also real: ${this.joinList(promotionOption.costs)}.`
      );
    }

    const mainTradeoff = tradeoffs[0];
    if (mainTradeoff) {
      lines.push(
        `The hard balance is between ${mainTradeoff.sideA} and ${mainTradeoff.sideB}.`
      );
    }

    if (rec.alternatives?.length) {
      lines.push(`A practical next move would be to ${this.lowerFirst(rec.alternatives[0])}`);
    }

    if (missing.length) {
      lines.push(
        `The one thing that could change the answer is ${this.lowerFirst(missing[0].item)}`
      );
    }

    if (regret.longTerm) {
      lines.push(regret.longTerm);
    }

    return lines.filter(Boolean).join("\n\n");
  },

  createOpening({ summary, reasoning = {}, language, primary }) {
    if (language.openingStyle === "no_opening") return "";

    const text = summary.normalizedMessage || "";
    const priorities = reasoning.priorityStack || [];
    const tradeoff = reasoning.tradeoffs?.[0];

    if (["risk_clarification", "memory", "builder", "teacher", "emotion"].includes(primary)) {
      return "";
    }

    if (primary === "safety") return "The immediate priority is safety.";
    if (primary === "medical_body") return "The body concern comes first here.";

    if (primary === "medical_context") {
      if (text.includes("stable now") || text.includes("monitored") || text.includes("evaluated")) {
        return "Based on what you described, the medical piece matters, but it does not need to take over the whole answer.";
      }
      return "Based on what you described, handle the medical piece calmly and practically.";
    }

    if (primary === "executive_decision") {
      if (priorities.length || tradeoff) {
        return "This gets clearer once you separate the obligation you cannot afford to fail from the ones you can delay, negotiate, or decline.";
      }

      return "The first step is deciding what cannot safely be postponed.";
    }

    if (primary === "wisdom") {
      return "The real tension is between what feels urgent now and what will still matter later.";
    }

    if (primary === "relationship") {
      return "The core issue is how to protect the relationship without losing honesty.";
    }

    if (primary === "family") {
      return "The family priority needs to lead before everything else gets louder.";
    }

    return "";
  },

  emotionText(summary, language) {
    if ((language.maxValidationSentences || 0) <= 0) return null;
    return summary.briefEmotionText || summary.emotionText || "I get why that would feel heavy.";
  },

  medicalContextText(summary, language, primary = null) {
    if (primary !== "medical_context" && primary !== "medical_body") return null;

    return (
      summary.medicalContextText ||
      "If new red flags show up or anything worsens, medical care moves back to the front."
    );
  },

  orderParts(parts, sectionOrder, primary) {
    const ordered = [];

    sectionOrder.forEach(key => {
      if (parts[key]) ordered.push(parts[key]);
    });

    if (!ordered.length && parts[primary]) {
      ordered.push(parts[primary]);
    }

    return ordered;
  },

  createClosing({ contract, mouth, language, primary }) {
    if (primary === "risk_clarification") return null;

    if (contract.clarity?.needed) {
      return contract.clarity.question || mouth.contractClosing || null;
    }

    if (language.closingStyle === "none") return null;

    return null;
  },

  cleanParts(parts, language) {
    return parts
      .filter(Boolean)
      .map(text => this.cleanText(text, language))
      .filter(Boolean)
      .filter(text => !this.isBanned(text, language))
      .filter(text => !this.isSystemText(text));
  },

  cleanText(text, language = {}) {
    if (!text || typeof text !== "string") return null;

    let cleaned = text.trim();
    cleaned = this.removeStockOpening(cleaned);

    if (!cleaned) return null;
    if (this.isBanned(cleaned, language)) return null;
    if (this.isSystemText(cleaned)) return null;

    return cleaned;
  },

  removeStockOpening(text = "") {
    return String(text || "")
      .replace(/^let'?s organize this clearly\.?\s*/i, "")
      .replace(/^here'?s the practical answer\.?\s*/i, "")
      .replace(/^here'?s the practical move\.?\s*/i, "")
      .replace(/^here'?s the practical fix\.?\s*/i, "")
      .replace(/^here'?s the clear explanation\.?\s*/i, "")
      .replace(/^something feels important here\.?\s*/i, "")
      .replace(/^this sounds bigger than a simple decision\.?\s*/i, "")
      .trim();
  },

  isBanned(text, language = {}) {
    const normalized = this.normalize(text);
    const banned = language.bannedPhrases || [];
    return banned.some(phrase => normalized.includes(this.normalize(phrase)));
  },

  isSystemText(text = "") {
    const normalized = this.normalize(text);

    return [
      "situation contract",
      "mouth director",
      "human language engine",
      "lead organ",
      "salience",
      "observer hierarchy",
      "ari should",
      "response intent",
      "primary human need"
    ].some(term => normalized.includes(term));
  },

  finalPolish(response, language = {}) {
    if (!response) return "";

    let polished = response
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/\s+\./g, ".")
      .trim();

    if (language.polish?.preferNaturalContractions) {
      polished = polished
        .replace(/\bdo not\b/gi, "don’t")
        .replace(/\bcan not\b/gi, "can’t")
        .replace(/\bwill not\b/gi, "won’t");
    }

    return polished;
  },

  joinResponse(opening, bodyParts, closing) {
    return [
      opening,
      ...(bodyParts || []),
      closing
    ]
      .filter(part => typeof part === "string" && part.trim())
      .join("\n\n");
  },

  humanizePriority(value = "") {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  lowerFirst(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toLowerCase() + text.slice(1);
  },

  capitalize(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  joinList(items = []) {
    if (!Array.isArray(items) || !items.length) return "unclear";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  },

  normalize(text = "") {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
};