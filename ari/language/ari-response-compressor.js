// ari/language/ari-response-compressor.js
// Purpose: Compress final response without changing meaning or contract.
// V1.0.0

window.Ari = window.Ari || {};

window.AriResponseCompressor = {
  version: "1.0.0",

  compress(input = {}) {
    const summary = input.summary || input || {};
    const text = summary.finalResponse || "";

    if (!text.trim()) return { compressedResponse: "" };

    let sections = text
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean);

    sections = this.removeDuplicateSections(sections);
    sections = this.capBullets(sections, 5);
    sections = this.removeWeakRepeats(sections);

    const compressedResponse = sections.join("\n\n").trim();

    return {
      responseCompressorRan: true,
      responseCompressorVersion: this.version,
      responseCompressorSource: "ari-response-compressor",
      compressedResponse,
      finalResponse: compressedResponse
    };
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

  capBullets(sections = [], maxBullets = 5) {
    return sections.map(section => {
      const lines = section.split("\n");

      const bulletLines = lines.filter(line =>
        /^[-*•]\s+/.test(line.trim())
      );

      if (bulletLines.length <= maxBullets) return section;

      const header = lines.find(line => !/^[-*•]\s+/.test(line.trim()));
      const kept = bulletLines.slice(0, maxBullets);

      return [header, ...kept].filter(Boolean).join("\n");
    });
  },

  removeWeakRepeats(sections = []) {
    const themes = new Set();
    const output = [];

    sections.forEach(section => {
      const key = this.themeKey(section);

      if (key && themes.has(key)) return;

      if (key) themes.add(key);
      output.push(section);
    });

    return output;
  },

  themeKey(text = "") {
    const t = this.normalize(text);

    if (t.includes("household stability") || t.includes("wife baby")) {
      return "household_stability";
    }

    if (t.includes("accept") && t.includes("role") && t.includes("immediately")) {
      return "reject_immediate_role";
    }

    if (t.includes("optional financial") || t.includes("co sign") || t.includes("lend")) {
      return "optional_financial_risk";
    }

    if (t.includes("next step") || t.includes("ask whether")) {
      return "next_step";
    }

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