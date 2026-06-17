// ari/memory/ari-memory-candidate-engine.js
// Ari Memory Candidate Engine
// Purpose: Decide what is worth remembering.
// V1.0.0

window.Ari = window.Ari || {};

window.AriMemoryCandidateEngine = {
  version: "1.0.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};

    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const candidates = [];

    // -------- User Preferences --------

    this.addIf(
      candidates,
      this.containsAny(text, ["i prefer", "i like", "i love", "my favorite"]),
      {
        type: "user_preference",
        importance: 8,
        confidence: 0.90,
        claim:
          summary.userMessage ||
          summary.message ||
          ""
      }
    );

    // -------- Long-term Projects --------

    this.addIf(
      candidates,
      this.containsAny(text, [
        "ari rebirth",
        "calbuddy",
        "my app",
        "my project",
        "roadmap"
      ]),
      {
        type: "project_fact",
        importance: 9,
        confidence: 0.95,
        claim:
          summary.userMessage ||
          summary.message ||
          ""
      }
    );

    // -------- Explicit Decisions --------

    this.addIf(
      candidates,
      this.containsAny(text, [
        "we decided",
        "let's use",
        "we will",
        "the plan is",
        "final decision"
      ]),
      {
        type: "prior_decision",
        importance: 9,
        confidence: 0.92,
        claim:
          summary.userMessage ||
          summary.message ||
          ""
      }
    );

    // -------- Stable Relationship Style --------

    this.addIf(
      candidates,
      this.containsAny(text, [
        "be direct",
        "be blunt",
        "challenge me",
        "hold me accountable",
        "don't sugarcoat"
      ]),
      {
        type: "relationship_pattern",
        importance: 8,
        confidence: 0.90,
        claim:
          summary.userMessage ||
          summary.message ||
          ""
      }
    );

    // -------- Never remember transient chatter --------

    const filtered = candidates.filter(
      c => !this.looksTransient(c.claim)
    );

    return {
      memoryCandidateEngineRan: true,
      memoryCandidateEngineVersion: this.version,
      memoryCandidateEngineSource:
        "ari-memory-candidate-engine",

      memoryCandidates: filtered,

      authority: "advisory_only",
      cannotSet: [
        "primaryLane",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse"
      ]
    };
  },

  looksTransient(text = "") {
    const t = this.normalize(text);

    return this.containsAny(t, [
      "hello",
      "hi",
      "thanks",
      "thank you",
      "good morning",
      "good night",
      "how are you",
      "lol",
      "haha",
      "send code",
      "done",
      "okay",
      "ok"
    ]);
  },

  addIf(array, condition, object) {
    if (!condition) return;
    array.push(object);
  },

  containsAny(text = "", list = []) {
    return list.some(term =>
      text.includes(this.normalize(term))
    );
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI MEMORY CANDIDATE ENGINE LOADED:",
  window.AriMemoryCandidateEngine?.version
);