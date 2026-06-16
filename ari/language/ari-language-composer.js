// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V6.0.0 — Contract-Aware Structured Renderer

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "6.0.0",

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
      reasoning.primary ||
      "general_understanding";

    let finalResponse = "";

    if (primary === "executive_decision") {
      finalResponse = this.renderExecutiveDecision({
        summary,
        contract,
        language,
        reasoning,
        conclusion
      });
    } else {
      finalResponse = this.renderStandard({
        summary,
        contract,
        language,
        reasoning,
        primary
      });
    }

    finalResponse = this.finalPolish(finalResponse, language);

    return {
      languageMode: primary,
      languageOpening: null,
      languageBody: finalResponse,
      languageClosing: null,
      finalResponse,

      composerVersion: this.version,
      source: "ari-language-composer",

      composerDebug: {
        primary,
        usedExecutiveConclusion: Boolean(conclusion?.recommendation),
        usedKnownInferredUnknown: Boolean(
          reasoning.knownFacts?.length ||
          reasoning.inferredFacts?.length ||
          reasoning.unknowns?.length
        ),
        contractRules: contract.responseRules || [],
        blocked: contract.blocked || []
      }
    };
  },

  renderExecutiveDecision({ summary, contract, language, reasoning, conclusion }) {
    const wantsEvidenceSplit = this.userAskedForEvidenceSplit(summary);
    const wantsRejectedAlternatives = this.userAskedForRejectedAlternatives(summary);

    const sections = [];

    sections.push(
      this.renderRecommendation(reasoning, conclusion)
    );

    if (wantsEvidenceSplit) {
      sections.push(this.renderKnownFacts(reasoning));
      sections.push(this.renderInferences(reasoning));
      sections.push(this.renderUncertainty(reasoning, conclusion));
    }

    sections.push(this.renderReasoning(reasoning, conclusion));

    if (wantsRejectedAlternatives || reasoning.rejectedAlternatives?.length) {
      sections.push(this.renderRejectedAlternatives(reasoning));
    }

    sections.push(this.renderNextStep(reasoning, conclusion));

    if (language.validationLevel === "light") {
      sections.push("This is heavy because every option disappoints someone. That does not mean every obligation has equal claim on you.");
    }

    return sections
      .filter(Boolean)
      .map(section => this.cleanText(section, language))
      .filter(Boolean)
      .join("\n\n");
  },

  renderRecommendation(reasoning = {}, conclusion = {}) {
    const rec =
      conclusion.recommendation ||
      reasoning.recommendation?.summary ||
      null;

    if (!rec) return null;

    return `My recommendation: ${this.lowerFirst(rec)}`;
  },

  renderKnownFacts(reasoning = {}) {
    const facts = reasoning.knownFacts || [];
    if (!facts.length) return null;

    return `What we know:\n${facts.map(item => `- ${item}`).join("\n")}`;
  },

  renderInferences(reasoning = {}) {
    const inferred = reasoning.inferredFacts || [];
    const assumptions = reasoning.assumptions || [];

    const lines = [
      ...inferred,
      ...assumptions.map(a => a.assumption).filter(Boolean)
    ];

    if (!lines.length) return null;

    return `What I’m inferring:\n${[...new Set(lines)].map(item => `- ${item}`).join("\n")}`;
  },

  renderUncertainty(reasoning = {}, conclusion = {}) {
    const unknowns = reasoning.unknowns || [];
    const uncertainty = conclusion.uncertainty;

    const lines = [
      uncertainty,
      ...unknowns
    ].filter(Boolean);

    if (!lines.length) return null;

    return `What could change the recommendation:\n${[...new Set(lines)].map(item => `- ${item}`).join("\n")}`;
  },

  renderReasoning(reasoning = {}, conclusion = {}) {
    const parts = [];

    if (conclusion.framing) {
      parts.push(conclusion.framing);
    }

    if (conclusion.keyReason) {
      parts.push(conclusion.keyReason);
    }

    if (conclusion.keyTradeoff) {
      parts.push(`The main tradeoff is ${conclusion.keyTradeoff}.`);
    }

    if (reasoning.regretLens?.longTerm) {
      parts.push(reasoning.regretLens.longTerm);
    }

    if (!parts.length && reasoning.recommendation?.rationale?.length) {
      parts.push(...reasoning.recommendation.rationale);
    }

    if (!parts.length) return null;

    return parts.join(" ");
  },

  renderRejectedAlternatives(reasoning = {}) {
    const rejected = reasoning.rejectedAlternatives || [];
    if (!rejected.length) return null;

    return `Why I’d reject the alternatives:\n${rejected
      .map(item => `- ${item.alternative}: ${this.lowerFirst(item.rejectedBecause || "")}`)
      .join("\n")}`;
  },

  renderNextStep(reasoning = {}, conclusion = {}) {
    const next =
      conclusion.nextStep ||
      reasoning.recommendation?.alternatives?.[0] ||
      null;

    if (!next) return null;

    return `Next step: ${next}`;
  },

  renderStandard({ summary, reasoning, primary }) {
    if (primary === "risk_clarification") {
      return summary.followUpQuestion || "Are you safe right now?";
    }

    if (primary === "safety") {
      return summary.safetyAnswer || "Safety comes first. If there is immediate danger, contact emergency services now.";
    }

    if (primary === "medical_body") {
      return summary.medicalAnswer || "The body concern comes first here. If symptoms are severe, worsening, or involve red flags, get urgent care now.";
    }

    if (primary === "teacher") {
      return summary.teachingAnswer || summary.knowledgeAnswer || "Here’s the clear explanation.";
    }

    if (primary === "builder") {
      return summary.builderAnswer || summary.codeAnswer || summary.implementationAnswer || "Here’s the practical fix.";
    }

    return (
      summary.directAnswer ||
      summary.humanTruth ||
      reasoning.recommendation?.summary ||
      "Here’s the practical answer."
    );
  },

  userAskedForEvidenceSplit(summary = {}) {
    const text = this.getText(summary);
    return (
      text.includes("what you know") ||
      text.includes("what you're inferring") ||
      text.includes("what you’re inferring") ||
      text.includes("without assuming facts") ||
      text.includes("distinguish between")
    );
  },

  userAskedForRejectedAlternatives(summary = {}) {
    const text = this.getText(summary);
    return (
      text.includes("rejected the alternatives") ||
      text.includes("why you rejected") ||
      text.includes("why reject") ||
      text.includes("alternatives")
    );
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
      "primary human need"
    ].some(term => normalized.includes(term));
  },

  finalPolish(response, language = {}) {
    if (!response) return "";

    let polished = response
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/\bdon’t\b/g, "don’t")
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

  getText(summary = {}) {
    return String(
      summary.normalizedMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase();
  },

  normalize(text = "") {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
};