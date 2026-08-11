// ari/memory/ari-memory-candidate-engine.js
// Ari Memory Candidate Engine
// Purpose: Decide what is worth remembering.
// V1.2.0 — Durable-event filter with explicit sensitive-data exclusions

window.Ari = window.Ari || {};

window.AriMemoryCandidateEngine = {
  version: "1.2.0",

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

    if (
      !text ||
      this.looksTransient(text) ||
      this.containsSensitiveCredential(text) ||
      this.looksLikeCodeOrFilePayload(rawText)
    ) {
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
      "i prefer", "my favorite", "i always prefer", "i never want",
      "i hate", "i don't like", "i do not like", "i dislike"
    ]), {
      type: "user_preference",
      importance: 8,
      confidence: 0.9,
      claim: rawText,
      reason: "User shared a stable preference."
    });

    this.addIf(candidates, this.containsAny(text, [
      "my app", "my project", "our app", "our project",
      "i'm building", "i am building", "we're building",
      "we are building", "our roadmap", "the project uses"
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
      "my goal is", "i'm working toward", "i am working toward",
      "i want to achieve", "i plan to", "i'm training for",
      "i am training for", "i'm building", "i am building"
    ]), {
      type: "ongoing_goal",
      importance: 9,
      confidence: 0.9,
      claim: rawText,
      reason: "User shared an ongoing goal or commitment."
    });

    this.addIf(candidates, this.containsAny(text, [
      "my birthday is", "our anniversary is", "i got married",
      "i'm getting married", "i am getting married", "i moved to",
      "i started a new job", "i graduated", "i had a baby",
      "my partner", "my husband", "my wife", "my son", "my daughter"
    ]), {
      type: "important_life_event",
      importance: 9,
      confidence: 0.88,
      claim: rawText,
      reason: "User shared a potentially important life event or relationship."
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

  containsSensitiveCredential(text = "") {
    const value = this.normalize(text);

    return (
      /\b(password|passcode|security code|one[- ]time code|otp|pin number|cvv|cvc)\b/i.test(value) ||
      /\b(api key|access token|refresh token|private key|secret key|github token|service role key)\b/i.test(value) ||
      /\b(social security|ssn|tax id|passport number|driver'?s license number)\b/i.test(value) ||
      /\b(credit card|debit card|card number|routing number|bank account number)\b/i.test(value) ||
      /\b(?:\d[ -]*?){13,19}\b/.test(value) ||
      /\b\d{3}-\d{2}-\d{4}\b/.test(value)
    );
  },

  looksLikeCodeOrFilePayload(text = "") {
    const value = String(text || "");
    if (value.length > 1200 && !this.isExplicitMemoryRequest(value)) return true;

    const codeSignals = [
      "<!doctype html", "<script", "function ", "const ", "let ",
      "import ", "export default", "create table", "alter table"
    ];

    return codeSignals.filter(signal => value.toLowerCase().includes(signal)).length >= 2;
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
