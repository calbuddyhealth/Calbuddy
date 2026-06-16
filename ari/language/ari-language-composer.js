// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V6.1.0 — Evidence-Based Executive Composer

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "6.1.0",

  compose(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};
    const mouth = summary.mouthDirector || {};
    const reasoning = summary.reasoning || {};
    const conclusion = reasoning.executiveConclusion || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      mouth.contractPrimary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    const maxBodySections =
  Number(mouth.maxBodySections || language.maxBodySections || 6);

const responsePattern =
  mouth.responsePattern ||
  contract.responseShape ||
  "standard";

const sectionOrder =
  mouth.sectionOrder ||
  contract.mouthDirective?.order ||
  [primary];

    let bodyParts = [];

    if (primary === "executive_decision") {
      bodyParts = this.composeExecutiveDecision({ reasoning, conclusion, language });
    } else {
      bodyParts = [
        summary.directAnswer ||
        summary.teachingAnswer ||
        summary.builderAnswer ||
        summary.medicalAnswer ||
        summary.reasoningRecommendation ||
        "Here’s the practical answer."
      ];
    }

    bodyParts = this.cleanParts(bodyParts, language).slice(0, maxBodySections);

    let finalResponse = bodyParts.join("\n\n");
    finalResponse = this.finalPolish(finalResponse, language);

    return {
      languageMode: primary,
      languageOpening: bodyParts[0] || null,
      languageBody: bodyParts.join("\n\n"),
      languageClosing: null,
      finalResponse,

      composerVersion: this.version,
source: "ari-language-composer",

compressionDirective: mouth.compressionDirective || null,
composerAllowsCompression: true,

      composerDebug: {
  primary,
  responsePattern,
  sectionOrder,
  maxBodySections,
  humanLanguageTone: language.tone,
  humanLanguageWarmth: language.warmth,
  humanLanguageDirectness: language.directness,
  mouthAuthority: mouth.mouthAuthority,
  compressionDirective: mouth.compressionDirective || null,
  usedParts: bodyParts
}
    };
  },

  composeExecutiveDecision({ reasoning = {}, conclusion = {}, language = {} }) {
    const rec = reasoning.recommendation || {};
    const known = reasoning.knownFacts || [];
    const inferred = [
      ...(reasoning.inferredFacts || []),
      ...(reasoning.assumptions || []).map(a => a.assumption).filter(Boolean)
    ];
    const unknowns = reasoning.unknowns || [];
    const rejected = reasoning.rejectedAlternatives || [];
    const tradeoff =
  conclusion.keyTradeoff ||
  reasoning.tradeoffs?.[0] ||
  null;
    const regret = reasoning.regretLens || {};

    const parts = [];

    parts.push(
      `My recommendation: ${this.lowerFirst(
        conclusion.recommendation ||
        rec.summary ||
        "protect the highest-cost obligation first and delay optional risks."
      )}`
    );

    if (known.length) {
      parts.push(`What we know:\n${this.bullets(known)}`);
    }

    if (inferred.length) {
      parts.push(`What I’m inferring:\n${this.bullets(inferred)}`);
    }

    if (unknowns.length) {
      parts.push(`What could change the recommendation:\n${this.bullets(unknowns)}`);
    }

    const reasoningLines = [];

    if (conclusion.framing) reasoningLines.push(conclusion.framing);
    if (conclusion.keyReason) reasoningLines.push(conclusion.keyReason);
    if (tradeoff) {
      reasoningLines.push(
        typeof tradeoff === "string"
          ? `The main tradeoff is ${tradeoff}.`
          : `The main tradeoff is ${tradeoff.sideA} versus ${tradeoff.sideB}.`
      );
    }
    if (regret.longTerm) reasoningLines.push(regret.longTerm);

    if (reasoningLines.length) {
      parts.push(reasoningLines.join(" "));
    }

    if (rejected.length) {
      parts.push(
        `Why I’d reject the alternatives:\n${this.bullets(
          rejected.map(item =>
            `${item.alternative}: ${item.rejectedBecause}`
          )
        )}`
      );
    }

    if (conclusion.nextStep || rec.alternatives?.[0]) {
      parts.push(`Next step: ${conclusion.nextStep || rec.alternatives[0]}`);
    }

    if ((language.validationLevel === "light" || language.warmth > 25) && regret.shortTerm) {
      parts.push("This is heavy because every option disappoints someone. That does not mean every obligation has equal claim on you.");
    }

    return parts;
  },

  bullets(items = []) {
    return items
      .filter(Boolean)
      .map(item => `- ${String(item).trim()}`)
      .join("\n");
  },

  cleanParts(parts, language = {}) {
    return (parts || [])
      .filter(Boolean)
      .map(text => this.cleanText(text, language))
      .filter(Boolean);
  },

  cleanText(text, language = {}) {
    if (!text || typeof text !== "string") return null;

    let cleaned = text.trim();

    cleaned = cleaned
      .replace(/^let'?s organize this clearly\.?\s*/i, "")
      .replace(/^here'?s the practical answer\.?\s*/i, "")
      .replace(/^here'?s the practical move\.?\s*/i, "")
      .replace(/^something feels important here\.?\s*/i, "")
      .trim();

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
      "primary human need"
    ].some(term => normalized.includes(term));
  },

  finalPolish(response, language = {}) {
    if (!response) return "";

    let polished = response
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();

    if (language.polish?.preferNaturalContractions !== false) {
      polished = polished
        .replace(/\bdo not\b/gi, "don’t")
        .replace(/\bcan not\b/gi, "can’t")
        .replace(/\bwill not\b/gi, "won’t");
    }

    return polished;
  },

  lowerFirst(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toLowerCase() + text.slice(1);
  },

  normalize(text = "") {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
};