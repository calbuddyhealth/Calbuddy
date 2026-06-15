// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V4.0.0
//
// Chain:
// Situation Contract = what to answer
// Human Language Engine = how Ari should sound
// Mouth Director = structure/order
// Composer = writes final response
//
// This version does NOT call old mouth engines.

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "4.0.0",

  compose(input = {}) {
    const summary = input.summary || input || {};

    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};
    const mouth = summary.mouthDirector || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      mouth.contractPrimary ||
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
      Number(mouth.maxBodySections || language.maxBodySections || 3);

    const parts = this.buildParts({
      summary,
      contract,
      language,
      mouth,
      primary,
      responsePattern,
      sectionOrder
    });

    let bodyParts = this.orderParts(parts, sectionOrder, primary);

    bodyParts = this.cleanParts(bodyParts, language);
    bodyParts = bodyParts.slice(0, maxBodySections);

    let opening = this.createOpening({
      summary,
      contract,
      language,
      mouth,
      primary,
      parts: bodyParts
    });

    let closing = this.createClosing({
      summary,
      contract,
      language,
      mouth,
      primary
    });

    opening = this.cleanText(opening, language);
    closing = this.cleanText(closing, language);

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

  buildParts({ summary, contract, language, mouth, primary, responsePattern }) {
    const parts = {};

    parts[primary] = this.primaryText(primary, summary, contract, language);

    if (contract.brief?.includes("emotion")) {
      parts.brief_emotion = this.emotionText(summary, language);
    }

    if (contract.context?.includes("medical_context")) {
      parts.context_medical_context = this.medicalContextText(
  summary,
  language,
  primary
);
    }

    if (contract.deferred?.includes("life_chapter")) {
      parts.defer_life_chapter = null;
    }

    if (contract.deferred?.includes("deep_emotion")) {
      parts.defer_deep_emotion = null;
    }

    return parts;
  },

  primaryText(primary, summary, contract, language) {
    if (primary === "risk_clarification") {
      return (
        contract.clarity?.question ||
        summary.followUpQuestion ||
        "Are you safe right now?"
      );
    }

    if (primary === "safety") {
      return (
        summary.safetyAnswer ||
        "Safety comes first. If there is immediate danger, contact emergency services now."
      );
    }

    if (primary === "medical_body") {
      return (
        summary.medicalAnswer ||
        "This deserves medical attention first. If symptoms are severe, worsening, or involve red flags, get urgent care now."
      );
    }

    if (primary === "medical_context") {
      return (
        summary.medicalAnswer ||
        summary.teachingAnswer ||
        "This sounds medically relevant, but not automatically an emergency based on what you described."
      );
    }

    if (primary === "builder") {
      return (
        summary.builderAnswer ||
        summary.codeAnswer ||
        summary.implementationAnswer ||
        "Here’s the practical fix."
      );
    }

    if (primary === "teacher") {
      return (
        summary.teachingAnswer ||
        summary.knowledgeAnswer ||
        summary.humanTruth ||
        "Here’s the clear explanation."
      );
    }

    if (primary === "executive_decision") {
      return (
        summary.executiveAnswer ||
        summary.actionText ||
        "The priority is to separate what matters first from what can wait."
      );
    }

    if (primary === "emotion") {
      return (
        summary.emotionAnswer ||
        "That sounds genuinely heavy."
      );
    }

    if (primary === "wisdom") {
      return (
        summary.wisdomAnswer ||
        summary.wisdomText ||
        "The wiser move is to name the tradeoff clearly before choosing."
      );
    }

    if (primary === "relationship") {
      return (
        summary.relationshipAnswer ||
        "The relationship piece needs honesty without turning it into a fight."
      );
    }

    if (primary === "family") {
      return (
        summary.familyAnswer ||
        "The family priority needs to be protected before everything else gets loud."
      );
    }

    if (primary === "memory") {
      return (
        summary.memoryAnswer ||
        "Got it."
      );
    }

    return (
      summary.directAnswer ||
      summary.humanTruth ||
      summary.oneLineInsight ||
      "Here’s the practical answer."
    );
  },

  emotionText(summary, language) {
    if ((language.maxValidationSentences || 0) <= 0) return null;

    return (
      summary.briefEmotionText ||
      summary.emotionText ||
      "I get why that would worry you."
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

  createOpening({ language, primary }) {
    if (language.openingStyle === "no_opening") return "";

    if (["builder", "teacher", "risk_clarification", "memory"].includes(primary)) {
      return "";
    }

    if (primary === "medical_context") return "Here’s the practical move.";
    if (primary === "medical_body") return "Your body is the priority here.";
    if (primary === "safety") return "Safety first.";
    if (primary === "executive_decision") return "Let’s organize this clearly.";
    if (primary === "emotion") return "Damn, that sounds heavy.";
    if (primary === "wisdom") return "The real tension is the part to pay attention to.";

    return "";
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

    if (!cleaned) return null;
    if (this.isBanned(cleaned, language)) return null;
    if (this.isSystemText(cleaned)) return null;

    return cleaned;
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

  normalize(text = "") {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
};