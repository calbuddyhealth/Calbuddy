// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V7.2.0 — Communication-Plan-Aware Natural Composer

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "7.2.0",

  compose(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};
    const mouth = summary.mouthDirector || {};
    const communicationPlan = summary.communicationPlan || {};
    const reasoning = summary.reasoning || {};
    const conclusion = reasoning.executiveConclusion || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      communicationPlan.primary ||
      mouth.contractPrimary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    let bodyParts = [];

    if (primary === "executive_decision") {
      bodyParts = this.composeExecutiveDecision({
        summary,
        reasoning,
        conclusion,
        language,
        communicationPlan
      });
    } else {
      bodyParts = this.composeDefault({ summary });
    }

    bodyParts = this.cleanParts(bodyParts, language);

    let finalResponse = this.renderByPresentationStyle(
      bodyParts,
      communicationPlan
    );

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

      composerUsedCommunicationPlan: Boolean(communicationPlan),
      composerAllowsCompression: true,
      compressionDirective: mouth.compressionDirective || null,

      composerDebug: {
        primary,
        communicationPlan,
        presentationStyle: communicationPlan.presentationStyle || null,
        useHeadings: communicationPlan.useHeadings ?? null,
        sectionPlan: communicationPlan.sectionPlan || [],
        sentenceRules: communicationPlan.sentenceRules || {},
        usedParts: bodyParts
      }
    };
  },

  composeExecutiveDecision({
    summary = {},
    reasoning = {},
    conclusion = {},
    language = {},
    communicationPlan = {}
  }) {
    const rec = reasoning.recommendation || {};
    const sectionPlan = communicationPlan.sectionPlan || [];
    const sentenceRules = communicationPlan.sentenceRules || {};
    const preserve = communicationPlan.preserve || sectionPlan || [];
    const required = communicationPlan.required || [];
    const userAsked = this.detectUserAsked(summary);

    const maxBullets = sentenceRules.maxBulletsPerSection || 4;

    const known = this.limitList(reasoning.knownFacts || [], maxBullets);

    const inferred = this.limitList([
      ...(reasoning.inferredFacts || []),
      ...(reasoning.assumptions || [])
        .map(a => a.assumption)
        .filter(Boolean)
    ], maxBullets);

    const unknowns = this.limitList(
      reasoning.unknowns || [],
      Math.min(maxBullets, 3)
    );

    const rejected = reasoning.rejectedAlternatives || [];
    const tradeoff = conclusion.keyTradeoff || reasoning.tradeoffs?.[0];
    const regret = reasoning.regretLens || {};
    const nextStep = conclusion.nextStep || rec.alternatives?.[0] || null;

    const recommendation =
      conclusion.recommendation ||
      rec.summary ||
      "protect the highest-cost obligation first and delay optional risks.";

    const parts = [];

    if (this.shouldInclude("recommendation", preserve, required, true)) {
      parts.push(`My recommendation: ${this.lowerFirst(recommendation)}`);
    }

    const wantsKnownInferUnknown =
      userAsked.knownInferUnknown ||
      preserve.includes("known") ||
      preserve.includes("known_facts") ||
      preserve.includes("inferred") ||
      preserve.includes("inferences") ||
      preserve.includes("could_change") ||
      preserve.includes("unknowns");

    if (wantsKnownInferUnknown) {
      const lines = [];

      if (known.length) {
        lines.push(`What we know:\n${this.bullets(known)}`);
      }

      if (inferred.length) {
        lines.push(`What I’m inferring:\n${this.bullets(inferred)}`);
      }

      if (unknowns.length) {
        lines.push(`What could change the answer:\n${this.bullets(unknowns)}`);
      }

      if (lines.length) parts.push(lines.join("\n\n"));
    }

    const why = this.buildNaturalWhy({ conclusion, tradeoff, regret });

    if (
      why &&
      this.shouldIncludeAny(
        ["reason", "key_reason", "tradeoff", "key_tradeoff"],
        preserve,
        required,
        userAsked.why
      )
    ) {
      parts.push(`Why:\n${why}`);
    }

    if (
      rejected.length &&
      this.shouldInclude(
        "rejected_alternatives",
        preserve,
        required,
        userAsked.rejectedAlternatives
      )
    ) {
      parts.push(
        `Why I’d reject the alternatives:\n${this.bullets(
          this.limitList(
            rejected.map(item =>
              `${item.alternative}: ${item.rejectedBecause}`
            ),
            maxBullets
          )
        )}`
      );
    }

    if (
      nextStep &&
      this.shouldInclude("next_step", preserve, required, true)
    ) {
      parts.push(`Next step: ${nextStep}`);
    }

    if (
      communicationPlan.emotionalTouch === "brief" &&
      (language.validationLevel === "light" || language.warmth > 25) &&
      regret.shortTerm
    ) {
      parts.push(
        "This is heavy because every option disappoints someone. That does not mean every obligation has equal claim on you."
      );
    }

    return parts;
  },

  renderByPresentationStyle(parts = [], communicationPlan = {}) {
    const style = communicationPlan.presentationStyle || "structured";

    if (style === "conversation") {
      return parts.join(" ");
    }

    if (style === "mixed") {
      return [
        parts[0],
        parts.slice(1).join("\n")
      ].filter(Boolean).join("\n\n");
    }

    return parts.join("\n\n");
  },

  buildNaturalWhy({ conclusion = {}, tradeoff = null, regret = {} }) {
    const lines = [];

    if (conclusion.framing) lines.push(conclusion.framing);
    if (conclusion.keyReason) lines.push(this.fixAwkwardGrammar(conclusion.keyReason));

    if (tradeoff) {
      lines.push(
        typeof tradeoff === "string"
          ? `The main tradeoff is ${tradeoff}.`
          : `The main tradeoff is ${tradeoff.sideA} versus ${tradeoff.sideB}.`
      );
    }

    if (regret.longTerm) lines.push(regret.longTerm);

    return lines.join(" ");
  },

  composeDefault({ summary = {} }) {
    return [
      summary.directAnswer ||
      summary.teachingAnswer ||
      summary.builderAnswer ||
      summary.medicalAnswer ||
      summary.reasoningRecommendation ||
      "Here’s the practical answer."
    ];
  },

  detectUserAsked(summary = {}) {
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    return {
      knownInferUnknown:
        text.includes("what we know") ||
        text.includes("what you infer") ||
        text.includes("what could change") ||
        text.includes("distinguish") ||
        text.includes("separate"),

      rejectedAlternatives:
        text.includes("rejected alternatives") ||
        text.includes("why you rejected") ||
        text.includes("why id reject") ||
        text.includes("why i d reject"),

      why:
        text.includes("why") ||
        text.includes("explain") ||
        text.includes("reason")
    };
  },

  shouldInclude(key, preserve = [], required = [], fallback = false) {
    if (required.includes(key)) return true;
    if (preserve.includes(key)) return true;
    return Boolean(fallback);
  },

  shouldIncludeAny(keys = [], preserve = [], required = [], fallback = false) {
    return keys.some(key => this.shouldInclude(key, preserve, required, false)) || Boolean(fallback);
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

    let cleaned = text.trim()
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
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
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
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};