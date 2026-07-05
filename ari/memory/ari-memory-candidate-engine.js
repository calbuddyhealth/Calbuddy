// ari/memory/ari-memory-candidate-engine.js
// Ari Memory Candidate Engine
// Purpose: Decide what is worth remembering.
// V1.1.0 — Detect API / User-Scoped / Supabase-Ready Candidates

window.Ari = window.Ari || {};

window.AriMemoryCandidateEngine = {
  version: "1.1.0",

  detect(input = {}) {
    return this.analyze(input);
  },

  create(input = {}) {
    return this.analyze(input);
  },

  evaluate(input = {}) {
    return this.analyze(input);
  },

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const text = this.normalize(rawText);
    const userId = this.resolveUserId(summary);
    const candidates = [];

    if (!text || this.looksTransient(text)) {
      return this.returnResult([], userId, "no_stable_memory_candidate");
    }

    this.addIf(candidates, this.isExplicitMemoryRequest(text), {
  type: "explicit_memory",
  importance: 10,
  confidence: 0.98,
  claim: this.stripMemoryCommand(rawText),
  reason: "User explicitly asked Ari to remember/store this."
});

    this.addIf(candidates, this.containsAny(text, [
      "i prefer", "i like", "i love", "my favorite", "i hate",
      "i don't like", "i do not like", "i dislike"
    ]), {
      type: "user_preference",
      importance: 8,
      confidence: 0.9,
      claim: rawText,
      reason: "User shared a stable preference."
    });

    this.addIf(candidates, this.containsAny(text, [
      "ari rebirth", "calbuddy", "my app", "my project", "roadmap",
      "supabase", "pipeline", "memory engine"
    ]), {
      type: "project_fact",
      importance: 9,
      confidence: 0.92,
      claim: rawText,
      reason: "User shared information about an ongoing project."
    });

    this.addIf(candidates, this.containsAny(text, [
      "we decided", "let's use", "we will", "the plan is",
      "final decision", "going forward", "from now on"
    ]), {
      type: "prior_decision",
      importance: 9,
      confidence: 0.92,
      claim: rawText,
      reason: "User made or confirmed a durable decision."
    });

    this.addIf(candidates, this.containsAny(text, [
      "be direct", "be blunt", "challenge me", "hold me accountable",
      "don't sugarcoat", "do not sugarcoat"
    ]), {
      type: "relationship_pattern",
      importance: 8,
      confidence: 0.9,
      claim: rawText,
      reason: "User described a preferred assistant interaction style."
    });

    const filtered = this.dedupeCandidates(
      candidates
        .filter(candidate => candidate.claim && !this.looksTransient(candidate.claim))
        .map(candidate => ({
          ...candidate,
          userId,
          displayClaim: this.toUserFacingClaim(candidate.claim),
          source: "ari-memory-candidate-engine",
          createdAt: new Date().toISOString()
        }))
    );

    return this.returnResult(filtered, userId, filtered.length ? "memory_candidates_detected" : "no_stable_memory_candidate");
  },

  resolveUserId(summary = {}) {
    return (
      summary.userId ||
      summary.user?.id ||
      summary.userContext?.id ||
      summary.userContext?.user_id ||
      summary.appContext?.user?.id ||
      summary.appContext?.userContext?.id ||
      summary.profile?.id ||
      summary.profile?.user_id ||
      null
    );
  },

  isExplicitMemoryRequest(text = "") {
    return /\b(remember that|remember this|save this|store this|note that|keep this in memory|add this to memory)\b/i.test(text);
  },

  looksTransient(text = "") {
    const t = this.normalize(text);

    if (!t) return true;

    const transientExact = [
      "hello", "hi", "thanks", "thank you", "good morning",
      "good night", "how are you", "lol", "haha", "done",
      "okay", "ok", "yes", "no"
    ];

    if (transientExact.includes(t)) return true;

    return this.containsAny(t, [
  "send code",
  "replace this file"
]);
  },

  addIf(array, condition, object) {
    if (!condition) return;
    array.push(object);
  },

  dedupeCandidates(candidates = []) {
    const seen = new Set();

    return candidates.filter(candidate => {
      const key = `${candidate.type}:${this.normalize(candidate.claim)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  returnResult(memoryCandidates = [], userId = null, reason = "complete") {
    return {
      memoryCandidateEngineRan: true,
      memoryCandidateEngineVersion: this.version,
      memoryCandidateEngineSource: "ari-memory-candidate-engine",
      memoryCandidates,
      memoryCandidateCount: memoryCandidates.length,
      userId,
      reason,
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

  containsAny(text = "", list = []) {
    return list.some(term => text.includes(this.normalize(term)));
  },

stripMemoryCommand(text = "") {
  return String(text || "")
    .replace(
      /^\s*(remember that|remember this|save this|store this|note that|keep this in memory|add this to memory)\s*/i,
      ""
    )
    .replace(/[.!?]\s*$/, "")
    .trim();
},

toUserFacingClaim(text = "") {
  return String(text || "")
    .replace(/^\s*(remember that|remember this|save this|store this|note that|keep this in memory|add this to memory)\s*/i, "")
    .replace(/\bmy\b/gi, "your")
    .replace(/\bi am\b/gi, "you are")
    .replace(/\bi'm\b/gi, "you’re")
    .replace(/\bi like\b/gi, "you like")
    .replace(/\bi love\b/gi, "you love")
    .replace(/\bi hate\b/gi, "you hate")
    .replace(/[.!?]\s*$/, "")
    .trim();
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