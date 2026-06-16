// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V5.0.0 — Structured Reasoning Composer

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "5.0.0",

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

    const responsePattern =
      mouth.responsePattern ||
      contract.responseShape ||
      "standard";

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
      mouth,
      reasoning,
      primary,
      responsePattern,
      sectionOrder
    });

    let bodyParts = this.orderParts(parts, sectionOrder, primary);
    bodyParts = this.cleanParts(bodyParts, language);
    bodyParts = bodyParts.slice(0, maxBodySections);

    let opening = this.createOpening({
      summary,
      reasoning,
      language,
      primary
    });

    let closing = this.createClosing({
      summary,
      contract,
      mouth,
      language,
      primary
    });

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
        responsePattern,
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

    if (contract.deferred?.includes("life_chapter")) {
      parts.defer_life_chapter = null;
    }

    if (contract.deferred?.includes("deep_emotion")) {
      parts.defer_deep_emotion = null;
    }

    return parts;
  },

  primaryText(primary, summary, contract, language, reasoning = {}) {
    if (primary === "risk_clarification") {
      return (
        contract.clarity?.question ||
        summary.followUpQuestion ||
        "Are you safe right now?"
      );
    }

    if (primary === "executive_decision") {
      return (
        this.composeExecutiveDecision(summary, reasoning) ||
        summary.executiveAnswer ||
        summary.actionText ||
        summary.reasoningAnswer ||
        "Separate what is urgent, what is important, and what can safely wait."
      );
    }

    if (primary === "builder") {
      return (
        this.composeBuilder(summary, reasoning) ||
        summary.builderAnswer ||
        summary.codeAnswer ||
        summary.implementationAnswer ||
        summary.reasoningAnswer ||
        "Start with the specific failing file, function, or error message."
      );
    }

    if (primary === "teacher") {
      return (
        this.composeTeacher(summary, reasoning) ||
        summary.teachingAnswer ||
        summary.knowledgeAnswer ||
        summary.humanTruth ||
        summary.reasoningAnswer ||
        "The simplest way to understand it is to start with the core idea."
      );
    }

    if (primary === "medical_body") {
      return (
        summary.medicalAnswer ||
        summary.reasoningAnswer ||
        "If symptoms are severe, worsening, or involve red flags, get urgent care now."
      );
    }

    if (primary === "medical_context") {
      return (
        this.composeMedicalContext(summary, reasoning) ||
        summary.medicalAnswer ||
        summary.teachingAnswer ||
        summary.reasoningAnswer ||
        "This sounds medically relevant, but not automatically an emergency based on what you described."
      );
    }

    if (primary === "safety") {
      return (
        summary.safetyAnswer ||
        summary.reasoningAnswer ||
        "If there is immediate danger, contact emergency services now."
      );
    }

    if (primary === "emotion") {
      return (
        summary.emotionAnswer ||
        summary.reasoningAnswer ||
        "That sounds heavy."
      );
    }

    if (primary === "wisdom") {
      return (
        summary.wisdomAnswer ||
        summary.wisdomText ||
        summary.reasoningAnswer ||
        "The wiser move is to name the tradeoff clearly before choosing."
      );
    }

    if (primary === "relationship") {
      return (
        summary.relationshipAnswer ||
        summary.reasoningAnswer ||
        "The relationship piece needs honesty without turning it into a fight."
      );
    }

    if (primary === "family") {
      return (
        summary.familyAnswer ||
        summary.reasoningAnswer ||
        "The family priority needs to be protected before everything else gets loud."
      );
    }

    if (primary === "memory") {
      return summary.memoryAnswer || summary.reasoningAnswer || "Got it.";
    }

    return (
      summary.directAnswer ||
      summary.humanTruth ||
      summary.oneLineInsight ||
      summary.reasoningAnswer ||
      "Here’s the practical answer."
    );
  },

  composeExecutiveDecision(summary, reasoning = {}) {
    const rec = reasoning.recommendation || {};
    const priorityStack = reasoning.priorityStack || [];
    const delayOrDecline = reasoning.delayOrDecline || [];
    const tradeoffs = reasoning.tradeoffs || [];
    const counterfactuals = reasoning.counterfactuals || [];
    const regret = reasoning.regretLens || {};

    if (!rec.summary && !priorityStack.length && !tradeoffs.length) return null;

    const lines = [];

    if (priorityStack.length) {
      const first = priorityStack[0];
      lines.push(
        `The first priority is ${first.label || this.humanizePriority(first.priority)} because ${this.lowerFirst(first.reason)}.`
      );
    } else if (rec.summary) {
      lines.push(rec.summary);
    }

    if (delayOrDecline.length) {
  lines.push(
    `What I would decline or delay: ${delayOrDecline
      .map(item => item.recommendation || item.item)
      .filter(Boolean)
      .join(" ")}`
  );
}

    if (counterfactuals.length) {
      const strongest = counterfactuals[0];
      lines.push(
        `If you choose "${strongest.option}", the upside is ${this.joinList(strongest.benefits)}. The cost is ${this.joinList(strongest.costs)}.`
      );
    }

    if (tradeoffs.length) {
      const tradeoff = tradeoffs[0];
      lines.push(
        `The central tradeoff is ${tradeoff.sideA} versus ${tradeoff.sideB}`
      );
    }

    if (rec.alternatives?.length) {
      lines.push(`The practical next step is: ${rec.alternatives[0]}`);
    }

    if (regret.longTerm) {
      lines.push(regret.longTerm);
    }

    return lines.filter(Boolean).join("\n\n");
  },

  composeBuilder(summary, reasoning = {}) {
    const rec = reasoning.recommendation || {};
    if (rec.summary) return rec.summary;
    return null;
  },

  composeTeacher(summary, reasoning = {}) {
    const rec = reasoning.recommendation || {};
    if (rec.summary) return rec.summary;
    return null;
  },

  composeMedicalContext(summary, reasoning = {}) {
    const rec = reasoning.recommendation || {};
    if (rec.summary) return rec.summary;
    return null;
  },

  createOpening({ summary, reasoning = {}, language, primary }) {
    if (language.openingStyle === "no_opening") return "";

    const text = summary.normalizedMessage || "";
    const priorityStack = reasoning.priorityStack || [];
    const tradeoff = reasoning.tradeoffs?.[0];

    if (["risk_clarification", "memory", "builder", "teacher", "emotion"].includes(primary)) {
      return "";
    }

    if (primary === "safety") {
      return "The immediate priority is safety.";
    }

    if (primary === "medical_body") {
      return "The body concern comes first here.";
    }

    if (primary === "medical_context") {
      if (text.includes("stable now") || text.includes("monitored") || text.includes("evaluated")) {
        return "Based on what you described, the medical piece matters, but it does not need to hijack the whole decision.";
      }
      return "Based on what you described, handle the medical piece calmly and practically.";
    }

    if (primary === "executive_decision") {
      if (priorityStack.length) {
        return `The decision starts with ${priorityStack[0].label || this.humanizePriority(priorityStack[0].priority)}.`;
      }

      if (tradeoff?.sideA && tradeoff?.sideB) {
        return "The decision is really about which cost is harder to reverse.";
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

    return (
      summary.briefEmotionText ||
      summary.emotionText ||
      "I get why that would feel heavy."
    );
  },

  medicalContextText(summary, language, primary = null) {
    if (primary !== "medical_context" && primary !== "medical_body") {
      return null;
    }

    return (
      summary.medicalContextText ||
      "Watch for red flags, and use medical support sooner rather than trying to tough it out."
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

    return banned.some(phrase =>
      normalized.includes(this.normalize(phrase))
    );
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