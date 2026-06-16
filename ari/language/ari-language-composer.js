// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V7.0.0 — Natural Reasoning Composer

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "7.0.0",

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

    let bodyParts = [];

    if (primary === "executive_decision") {
      bodyParts = this.composeExecutiveDecision({
        reasoning,
        conclusion,
        language,
        mouth,
        summary
      });
    } else {
      bodyParts = this.composeDefault(summary);
    }

    bodyParts = this.cleanParts(bodyParts, language);

    let finalResponse = bodyParts.join("\n\n");
    finalResponse = this.finalPolish(finalResponse, language);

    return {
      languageMode: primary,
      languageOpening: bodyParts[0] || null,
      languageBody: bodyParts.join("\n\n"),
      languageSections: bodyParts,
      languageClosing: null,
      finalResponse,

      composerVersion: this.version,
      source: "ari-language-composer",

      composerAllowsCompression: true,
      compressionDirective: mouth.compressionDirective || null,

      composerDebug: {
        primary,
        responsePattern: mouth.responsePattern || null,
        sectionOrder: mouth.sectionOrder || [],
        humanLanguageTone: language.tone,
        humanLanguageWarmth: language.warmth,
        humanLanguageDirectness: language.directness,
        mouthAuthority: mouth.mouthAuthority,
        compressionDirective: mouth.compressionDirective || null,
        usedParts: bodyParts
      }
    };
  },

  composeExecutiveDecision({ reasoning = {}, conclusion = {}, language = {}, mouth = {}, summary = {} }) {
    const rec = reasoning.recommendation || {};
    const known = reasoning.knownFacts || [];
    const inferred = [
      ...(reasoning.inferredFacts || []),
      ...(reasoning.assumptions || [])
        .map(a => a.assumption)
        .filter(Boolean)
    ];
    const unknowns = reasoning.unknowns || [];
    const rejected = reasoning.rejectedAlternatives || [];
    const tradeoff = conclusion.keyTradeoff || reasoning.tradeoffs?.[0];
    const regret = reasoning.regretLens || {};
    const nextStep = conclusion.nextStep || rec.alternatives?.[0] || null;

    const parts = [];

    const recommendation =
      conclusion.recommendation ||
      rec.summary ||
      "protect the highest-cost obligation first and delay optional risks.";

    parts.push(`My recommendation: ${this.lowerFirst(recommendation)}`);

    const knownTight = this.limitList(known, 4);
    const inferredTight = this.limitList(inferred, 4);
    const unknownTight = this.limitList(unknowns, 3);

    if (knownTight.length || inferredTight.length || unknownTight.length) {
      const lines = [];

      if (knownTight.length) {
        lines.push(`What we know:\n${this.bullets(knownTight)}`);
      }

      if (inferredTight.length) {
        lines.push(`What I’m inferring:\n${this.bullets(inferredTight)}`);
      }

      if (unknownTight.length) {
        lines.push(`What could change the answer:\n${this.bullets(unknownTight)}`);
      }

      parts.push(lines.join("\n\n"));
    }

    const why = this.buildNaturalWhy({
      conclusion,
      tradeoff,
      regret
    });

    if (why) {
      parts.push(`Why:\n${why}`);
    }

    if (rejected.length) {
      parts.push(
        `Why I’d reject the alternatives:\n${this.bullets(
          this.limitList(
            rejected.map(item =>
              `${item.alternative}: ${item.rejectedBecause}`
            ),
            4
          )
        )}`
      );
    }

    if (nextStep) {
      parts.push(`Next step: ${nextStep}`);
    }

    if (
      (language.validationLevel === "light" || language.warmth > 25) &&
      regret.shortTerm
    ) {
      parts.push(
        "This is heavy because every option disappoints someone. That does not mean every obligation has equal claim on you."
      );
    }

    return parts;
  },

  buildNaturalWhy({ conclusion = {}, tradeoff = null, regret = {} }) {
    const lines = [];

    if (conclusion.framing) {
      lines.push(conclusion.framing);
    }

    if (conclusion.keyReason) {
      lines.push(this.fixAwkwardGrammar(conclusion.keyReason));
    }

    if (tradeoff) {
      if (typeof tradeoff === "string") {
        lines.push(`The main tradeoff is ${tradeoff}.`);
      } else {
        lines.push(`The main tradeoff is ${tradeoff.sideA} versus ${tradeoff.sideB}.`);
      }
    }

    if (regret.longTerm) {
      lines.push(regret.longTerm);
    }

    return lines.join(" ");
  },

  composeDefault(summary = {}) {
    return [
      summary.directAnswer ||
      summary.teachingAnswer ||
      summary.builderAnswer ||
      summary.medicalAnswer ||
      summary.reasoningRecommendation ||
      "Here’s the practical answer."
    ];
  },

  bullets(items = []) {
    return items
      .filter(Boolean)
      .map(item => `- ${String(item).trim()}`)
      .join("\n");
  },

  limitList(items = [], max = 4) {
    return (items || []).filter(Boolean).slice(0, max);
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

    cleaned = this.fixAwkwardGrammar(cleaned);

    if (!cleaned) return null;
    if (this.isBanned(cleaned, language)) return null;
    if (this.isSystemText(cleaned)) return null;

    return cleaned;
  },

  fixAwkwardGrammar(text = "") {
    return String(text || "")
      .replace(/\bwife, baby, and household stability matters\b/gi, "wife, baby, and household stability matter")
      .replace(/\bhousehold stability matters first because it is\b/gi, "household stability comes first because it is")
      .replace(/\s+/g, " ")
      .replace(/\n /g, "\n")
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