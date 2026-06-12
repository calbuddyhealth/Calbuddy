// ari/language/ari-wisdom-principle-engine.js
// Ari Wisdom Principle Engine
// Purpose: Generate compressed wisdom principles from conflicts,
// life chapters, values, highest goods, identities, and emotions.
// V1.2
// Fixes:
// - Scores multiple wisdom candidates instead of first-match wins.
// - Better balances chapter, conflict, highestGood, identity, and emotion.
// - Keeps distill() for AriLanguageComposer compatibility.
// - Returns { principle } object.
// - Keeps generate() for backward compatibility.

window.AriWisdomPrincipleEngine = {
  distill(summary = {}) {
    const principle = this.generate(summary);

    if (!principle) return null;

    return {
      principle,
      source: "ari-wisdom-principle-engine"
    };
  },

  generate(summary = {}) {
    const candidates = this.getCandidates(summary);

    if (!candidates.length) {
      return (
        summary.wisdomPrinciple ||
        summary.wisdomStatement ||
        null
      );
    }

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.priority - a.priority;
    });

    return candidates[0].text;
  },

  getCandidates(summary = {}) {
    const candidates = [];

    const conflict =
      summary.primaryConflict ||
      summary.apparentConflict ||
      summary.wisdomTension ||
      null;

    const chapter = summary.primaryLifeChapter || null;

    const highestGood = summary.highestGood || null;

    const leadIdentity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

    const emotionalClassification =
      summary.emotionalClassification ||
      summary.primaryEmotion ||
      summary.surfaceEmotion ||
      null;

    const strongestSignalCategory =
      summary.strongestSignalCategory ||
      null;

    const strongestSignal =
      summary.strongestSignal ||
      null;

    const integratedValue =
      summary.integratedValue ||
      null;

    const longTermPriority =
      summary.longTermPriority ||
      null;

    const likelyRegret =
      summary.regretType ||
      summary.likelyRegret ||
      null;

    const addCandidate = (text, score, priority = 50, reason = "") => {
      if (!text) return;

      const existing = candidates.find(item => item.text === text);

      if (existing) {
        existing.score = Math.max(existing.score, score);
        existing.priority = Math.max(existing.priority, priority);
        if (reason && !existing.reasons.includes(reason)) {
          existing.reasons.push(reason);
        }
        return;
      }

      candidates.push({
        text,
        score,
        priority,
        reasons: reason ? [reason] : []
      });
    };

    // Life chapter candidates

    if (chapter === "fatherhood_transition") {
      addCandidate(
        "Protect what cannot be replaced before chasing what can return.",
        92,
        90,
        "fatherhood_transition"
      );

      addCandidate(
        "A good father does not only build a future. He becomes present inside it.",
        88,
        86,
        "fatherhood_transition"
      );
    }

    if (chapter === "family_transition") {
      addCandidate(
        "The people you love should never become the price of what you build.",
        94,
        92,
        "family_transition"
      );

      addCandidate(
        "Family is not something to return to after the work is done. It is part of what the work is for.",
        90,
        88,
        "family_transition"
      );
    }

    if (chapter === "presence_reordering_chapter") {
      addCandidate(
        "Put irreplaceable moments before replaceable milestones.",
        90,
        86,
        "presence_reordering_chapter"
      );
    }

    if (chapter === "purpose_chapter") {
      addCandidate(
        "Purpose should deepen your life, not pull you out of it.",
        86,
        82,
        "purpose_chapter"
      );
    }

    if (chapter === "builder_development") {
      addCandidate(
        "Build slowly enough that you still recognize the life you are building for.",
        86,
        82,
        "builder_development"
      );
    }

    if (chapter === "identity_transition") {
      addCandidate(
        "A healthy identity adapts when life changes chapters.",
        84,
        80,
        "identity_transition"
      );
    }

    // Conflict candidates

    if (
      conflict === "presence_vs_achievement" ||
      conflict === "ambition_vs_presence"
    ) {
      addCandidate(
        "Achievement can wait. Some moments cannot.",
        91,
        88,
        "presence_vs_achievement"
      );

      addCandidate(
        "Do not let achievement consume the moments that cannot be recovered later.",
        89,
        86,
        "presence_vs_achievement"
      );
    }

    if (
      conflict === "family_vs_creation" ||
      conflict === "family_vs_purpose"
    ) {
      addCandidate(
        "The goal is not to abandon purpose. The goal is to keep purpose in its proper place.",
        87,
        82,
        "family_vs_creation"
      );

      addCandidate(
        "Do not make your family compete equally with something that can wait.",
        88,
        84,
        "family_vs_creation"
      );
    }

    if (conflict === "growth_vs_stability") {
      addCandidate(
        "Growth is powerful, but timing is wisdom.",
        84,
        78,
        "growth_vs_stability"
      );
    }

    if (conflict === "purpose_vs_security") {
      addCandidate(
        "Do not abandon your future for comfort, but do not abandon your life for ambition.",
        86,
        80,
        "purpose_vs_security"
      );
    }

    // Highest good / value candidates

    if (highestGood === "protect_family") {
      addCandidate(
        "The people you love should never become the price of what you build.",
        96,
        95,
        "protect_family"
      );
    }

    if (integratedValue === "meaningful_presence") {
      addCandidate(
        "Achievement should create a life worth being present for, not replace presence itself.",
        90,
        86,
        "meaningful_presence"
      );
    }

    if (longTermPriority === "presence") {
      addCandidate(
        "Protect presence now, because some moments do not wait for you to become ready.",
        91,
        88,
        "longTermPriority_presence"
      );
    }

    if (
      likelyRegret === "missing_irreplaceable_presence" ||
      String(likelyRegret).includes("Missing irreplaceable")
    ) {
      addCandidate(
        "The likely regret is not failing to build enough. It is missing what could not be rebuilt.",
        89,
        84,
        "missing_irreplaceable_presence"
      );
    }

    // Identity candidates

    if (leadIdentity === "father") {
      addCandidate(
        "A good father does not only build a future. He becomes present inside it.",
        93,
        92,
        "father_identity"
      );
    }

    if (leadIdentity === "family-protector") {
      addCandidate(
        "Protection is not only provision. Sometimes protection means presence.",
        92,
        90,
        "family_protector_identity"
      );
    }

    if (leadIdentity === "builder") {
      addCandidate(
        "Build slowly enough that you still recognize the life you are building for.",
        86,
        82,
        "builder_identity"
      );
    }

    if (leadIdentity === "steward") {
      addCandidate(
        "Stewardship asks what must be protected, not merely what can be gained.",
        84,
        80,
        "steward_identity"
      );
    }

    // Emotion candidates

    if (emotionalClassification === "stewardship") {
      addCandidate(
        "Stewardship asks what must be protected, not merely what can be gained.",
        84,
        80,
        "stewardship_emotion"
      );
    }

    if (
      strongestSignalCategory === "underlying_emotion" &&
      strongestSignal === "fear_of_missing_irreplaceable_moments"
    ) {
      addCandidate(
        "Fear is not always weakness. Sometimes it is your love noticing what time can take.",
        88,
        83,
        "fear_of_missing_irreplaceable_moments"
      );
    }

    // General wisdom fallback candidates

    if (summary.dominantTheme === "identity_overload") {
      addCandidate(
        "When everything is important, wisdom decides what goes first.",
        82,
        76,
        "identity_overload"
      );
    }

    if (summary.wisdomPrinciple) {
      addCandidate(
        summary.wisdomPrinciple,
        78,
        70,
        "existing_wisdom_principle"
      );
    }

    if (summary.wisdomStatement) {
      addCandidate(
        summary.wisdomStatement,
        65,
        60,
        "existing_wisdom_statement"
      );
    }

    return candidates;
  }
};