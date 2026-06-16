// ari/language/ari-response-compressor.js
// Purpose: Compress final response without changing meaning or contract.
// V1.3.0 — Selective compressor, composer-safe

window.Ari = window.Ari || {};

window.AriResponseCompressor = {
  version: "1.3.0",

  compress(input = {}) {
    const summary = input.summary || input || {};
    const text = summary.finalResponse || "";

    const directive =
      summary.mouthDirector?.compressionDirective ||
      summary.compressionDirective ||
      {};

    if (!text.trim()) {
      return this.result("");
    }

    if (directive.enabled === false) {
      return this.result(text, {
        responseCompressorSkipped: true,
        responseCompressorSkipReason: "compression disabled by directive"
      });
    }

    const primary =
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    // Do not undo smart composer wording.
    if (summary.composerUsedLexicalGrounding) {
      return this.result(text, {
        responseCompressorSkipped: true,
        responseCompressorSkipReason: "composer already applied lexical grounding"
      });
    }

    // Do not compress safety/body/emotion unless explicitly allowed.
    if (
      primary === "safety" ||
      primary === "medical_body" ||
      primary === "emotion" ||
      primary === "risk_clarification"
    ) {
      return this.result(text, {
        responseCompressorSkipped: true,
        responseCompressorSkipReason: "protected lane"
      });
    }

    // If already short, leave it alone.
    if (this.wordCount(text) <= 95 && this.sectionCount(text) <= 3) {
      return this.result(text, {
        responseCompressorSkipped: true,
        responseCompressorSkipReason: "response already within budget"
      });
    }

    let compressed = text.trim();

    compressed = this.removeSystemLeaks(compressed);
    compressed = this.removeRepeatedSentences(compressed);
    compressed = this.removeGenericEmotionalCloser(compressed, summary);

    if (primary === "executive_decision") {
      compressed = this.compressExecutiveDecision(compressed, summary);
    } else {
      compressed = this.keepBestSentences(compressed, 5);
    }

    compressed = this.finalClean(compressed);

    return this.result(compressed);
  },

  compressExecutiveDecision(text = "", summary = {}) {
    // Important:
    // Only rebuild from reasoning if composer did NOT already create grounded wording.
    // This avoids reverting to abstract phrases like "time-sensitive financial goal."

    const reasoning = summary.reasoning || {};
    const conclusion = reasoning.executiveConclusion || {};

    const rec =
      conclusion.recommendation ||
      reasoning.recommendation?.summary ||
      null;

    const next =
      conclusion.nextStep ||
      reasoning.caseModel?.nextAction ||
      reasoning.recommendation?.alternatives?.[0] ||
      null;

    const reason =
      conclusion.keyReason ||
      reasoning.coreJudgment ||
      null;

    if (rec && next) {
      const pieces = [
        `My recommendation: ${this.upperFirst(rec)}`,
        reason ? `Why: ${this.cleanReason(reason)}` : null,
        `Next step: ${this.upperFirst(next)}`
      ].filter(Boolean);

      return pieces.join("\n\n");
    }

    return this.keepBestSentences(text, 4);
  },

  cleanReason(reason = "") {
    return String(reason || "")
      .replace(/^the deciding factor is\s+/i, "")
      .replace(/\bthe time-sensitive goal comes first because\s+/i, "")
      .replace(/\bthe time sensitive goal comes first because\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  keepBestSentences(text = "", max = 4) {
    const sentences = this.splitSentences(text);
    return sentences.slice(0, max).join(" ");
  },

  removeRepeatedSentences(text = "") {
    const sentences = this.splitSentences(text);
    const seen = new Set();
    const output = [];

    sentences.forEach(sentence => {
      const key = this.normalize(sentence);

      if (!key) return;

      const simplified = key
        .replace(/the deciding factor is/g, "")
        .replace(/comes first because/g, "")
        .replace(/should be protected first/g, "")
        .replace(/near term deadlines reduce flexibility/g, "deadline priority")
        .trim();

      if (seen.has(key) || seen.has(simplified)) return;

      seen.add(key);
      seen.add(simplified);
      output.push(sentence.trim());
    });

    return output.join(" ");
  },

  removeGenericEmotionalCloser(text = "", summary = {}) {
    const validation =
      summary.humanLanguageProfile?.validationLevel ||
      summary.situationContract?.communicationProfile?.validationLevel ||
      "none";

    if (validation === "none") {
      return text
        .replace(/This is heavy because every option disappoints someone\.?/gi, "")
        .replace(/That does not mean every obligation has equal claim on you\.?/gi, "")
        .trim();
    }

    return text;
  },

  removeSystemLeaks(text = "") {
    return String(text || "")
      .replace(/\bSituation Contract\b/gi, "")
      .replace(/\bMouth Director\b/gi, "")
      .replace(/\bLead Organ\b/gi, "")
      .replace(/\bSalience\b/gi, "")
      .replace(/\bObserver Hierarchy\b/gi, "")
      .replace(/Answer the primary lane directly\.?/gi, "")
      .replace(/Here’s the practical answer\.?/gi, "")
      .replace(/Here's the practical answer\.?/gi, "")
      .trim();
  },

  splitSentences(text = "") {
    return String(text || "")
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  },

  wordCount(text = "") {
    return String(text || "")
      .split(/\s+/)
      .filter(Boolean)
      .length;
  },

  sectionCount(text = "") {
    return String(text || "")
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean)
      .length;
  },

  finalClean(text = "") {
    return String(text || "")
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();
  },

  result(finalResponse = "", extra = {}) {
    return {
      responseCompressorRan: true,
      responseCompressorVersion: this.version,
      responseCompressorSource: "ari-response-compressor",
      compressedResponse: finalResponse,
      finalResponse,
      ...extra
    };
  },

  upperFirst(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log("ARI RESPONSE COMPRESSOR LOADED:", window.AriResponseCompressor?.version);