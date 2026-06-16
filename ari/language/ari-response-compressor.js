// ari/language/ari-response-compressor.js
// Purpose: Compress final response without changing meaning or contract.
// V1.2.0 — Sentence-aware contract compression

window.Ari = window.Ari || {};

window.AriResponseCompressor = {
  version: "1.2.0",

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
      return this.result(text);
    }

    const primary =
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    let compressed = text.trim();

    compressed = this.removeSystemLeaks(compressed);
    compressed = this.removeRepeatedSentences(compressed);
    compressed = this.removeGenericEmotionalCloser(compressed, summary);

    if (primary === "executive_decision") {
      compressed = this.compressExecutiveDecision(compressed, summary);
    }

    compressed = this.finalClean(compressed);

    return this.result(compressed);
  },

  compressExecutiveDecision(text = "", summary = {}) {
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

      // remove near duplicate “comes first because…” repeats
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

  finalClean(text = "") {
    return String(text || "")
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();
  },

  result(finalResponse = "") {
    return {
      responseCompressorRan: true,
      responseCompressorVersion: this.version,
      responseCompressorSource: "ari-response-compressor",
      compressedResponse: finalResponse,
      finalResponse
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