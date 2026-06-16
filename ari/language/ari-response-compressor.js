// ari/language/ari-response-compressor.js
// Purpose: Compress final response without changing meaning or contract.
// V1.1.0 — Contract-aware compression

window.Ari = window.Ari || {};

window.AriResponseCompressor = {
  version: "1.1.0",

  compress(input = {}) {
    const summary = input.summary || input || {};
    const text = summary.finalResponse || "";
    const directive =
      summary.mouthDirector?.compressionDirective ||
      summary.compressionDirective ||
      {};

    if (!text.trim()) {
      return {
        responseCompressorRan: true,
        responseCompressorVersion: this.version,
        responseCompressorSource: "ari-response-compressor",
        compressedResponse: "",
        finalResponse: ""
      };
    }

    if (directive.enabled === false) {
      return {
        responseCompressorRan: true,
        responseCompressorVersion: this.version,
        responseCompressorSource: "ari-response-compressor",
        compressedResponse: text,
        finalResponse: text
      };
    }

    const maxSections = Number(directive.maxSections || 6);
    const maxBullets = Number(directive.maxBulletsPerSection || 4);
    const preserve = directive.preserve || [];

    let sections = text
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean);

    sections = this.removeDuplicateSections(sections);
    sections = this.capBullets(sections, maxBullets);
    sections = this.removeWeakRepeats(sections, preserve);
    sections = this.keepMostImportantSections(sections, maxSections, preserve);

    const compressedResponse = sections.join("\n\n").trim();

    return {
      responseCompressorRan: true,
      responseCompressorVersion: this.version,
      responseCompressorSource: "ari-response-compressor",
      compressedResponse,
      finalResponse: compressedResponse
    };
  },

  keepMostImportantSections(sections = [], maxSections = 6, preserve = []) {
    if (sections.length <= maxSections) return sections;

    const scored = sections.map((section, index) => ({
      section,
      index,
      score: this.sectionScore(section, preserve)
    }));

    return scored
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, maxSections)
      .sort((a, b) => a.index - b.index)
      .map(item => item.section);
  },

  sectionScore(section = "", preserve = []) {
    const t = this.normalize(section);
    let score = 0;

    if (t.startsWith("my recommendation")) score += 100;
    if (t.includes("what we know")) score += 90;
    if (t.includes("what i m inferring") || t.includes("what i’m inferring")) score += 80;
    if (t.includes("what could change")) score += 85;
    if (t.includes("why i d reject") || t.includes("why i’d reject")) score += 80;
    if (t.includes("next step")) score += 75;
    if (t.includes("main tradeoff")) score += 60;
    if (t.includes("regret risk")) score += 50;

    preserve.forEach(key => {
      if (t.includes(this.normalize(key))) score += 25;
    });

    return score;
  },

  removeDuplicateSections(sections = []) {
    const seen = new Set();

    return sections.filter(section => {
      const key = this.normalize(section);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  capBullets(sections = [], maxBullets = 4) {
    return sections.map(section => {
      const lines = section.split("\n");
      const header = lines.find(line => !/^[-*•]\s+/.test(line.trim()));
      const bullets = lines.filter(line => /^[-*•]\s+/.test(line.trim()));

      if (bullets.length <= maxBullets) return section;

      return [header, ...bullets.slice(0, maxBullets)]
        .filter(Boolean)
        .join("\n");
    });
  },

  removeWeakRepeats(sections = [], preserve = []) {
    const themes = new Set();
    const output = [];

    sections.forEach(section => {
      const key = this.themeKey(section);

      if (key && themes.has(key) && !this.shouldPreserveTheme(key, preserve)) {
        return;
      }

      if (key) themes.add(key);
      output.push(section);
    });

    return output;
  },

  shouldPreserveTheme(key, preserve = []) {
    return preserve.some(item =>
      this.normalize(item).includes(this.normalize(key))
    );
  },

  themeKey(text = "") {
    const t = this.normalize(text);

    if (t.includes("my recommendation")) return "recommendation";
    if (t.includes("what we know")) return "known";
    if (t.includes("inferring")) return "inferred";
    if (t.includes("what could change")) return "unknowns";
    if (t.includes("why i d reject") || t.includes("why i’d reject")) return "rejected_alternatives";
    if (t.includes("next step")) return "next_step";

    return null;
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};