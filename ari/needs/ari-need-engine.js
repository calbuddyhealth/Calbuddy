// ari/needs/ari-need-engine.js
// Ari Human Needs Network
// Purpose: Identify the user's active human needs before Ari chooses wisdom, meaning, emotion, identity, or action.
// Replaces Maslow-style hierarchy with Ari's need network.
// V2.0

window.Ari = window.Ari || {};

window.Ari.needEngine = {
  version: "2.0.0",

  evaluate(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.normalizedMessage ||
      summary.input ||
      ""
    ).toLowerCase();

    const needs = [];

    const add = (name, score, reason, leadOrgan, responseMode) => {
      const existing = needs.find((need) => need.name === name);

      if (existing) {
        existing.score = Math.max(existing.score, score);
        existing.reasons.push(reason);
        return;
      }

      needs.push({
        name,
        score,
        reasons: [reason],
        leadOrgan,
        responseMode
      });
    };

    const has = (phrases = []) => phrases.some((p) => text.includes(p));

    // 1. BODY
    // Sleep, food, pain, hydration, exhaustion, body stability.
    if (
      has([
        "haven't slept",
        "have not slept",
        "can't sleep",
        "cannot sleep",
        "hungry",
        "starving",
        "dehydrated",
        "can't eat",
        "cannot eat",
        "exhausted",
        "severe pain",
        "worst pain",
        "sharp pain",
        "constant pain",
        "dizzy",
        "fainted",
        "passed out"
      ])
    ) {
      add(
        "body",
        100,
        "Body-level need detected: sleep, food, hydration, pain, energy, or physical stability.",
        "safety",
        "stabilize_body_first"
      );
    }

    // 2. SECURITY
    // Protection, medical danger, money, shelter, stability, predictability.
    if (
      has([
        "unsafe",
        "danger",
        "emergency",
        "pregnant",
        "severe pain",
        "bleeding",
        "hurt myself",
        "kill myself",
        "suicidal",
        "scared for my safety",
        "panic",
        "rent",
        "money",
        "bills",
        "job",
        "career",
        "housing",
        "insurance",
        "debt",
        "provider",
        "responsibility",
        "family needs",
        "baby coming",
        "pregnancy",
        "marriage"
      ])
    ) {
      add(
        "security",
        96,
        "Security need detected: safety, health, money, responsibility, stability, or protection.",
        "executive",
        "protect_security"
      );
    }

    // 3. CONNECTION
    // Belonging, love, attachment, family, being seen.
    if (
      has([
        "alone",
        "lonely",
        "nobody cares",
        "no one cares",
        "left out",
        "ignored",
        "abandoned",
        "unloved",
        "disconnected",
        "my family needs me",
        "family needs more of me",
        "relationship",
        "wife",
        "fiance",
        "fiancé",
        "girlfriend",
        "baby",
        "daughter",
        "son"
      ])
    ) {
      add(
        "connection",
        90,
        "Connection need detected: belonging, love, family, attachment, or being seen.",
        "emotion",
        "restore_connection"
      );
    }

    // 4. WORTH
    // Respect, dignity, competence, confidence, validation, self-worth.
    if (
      has([
        "nobody respects me",
        "no one respects me",
        "disrespected",
        "worthless",
        "not good enough",
        "i failed",
        "failure",
        "embarrassed",
        "ashamed",
        "humiliated",
        "look down on me",
        "useless",
        "stupid",
        "incompetent",
        "i don't matter",
        "i do not matter"
      ])
    ) {
      add(
        "worth",
        88,
        "Worth need detected: respect, dignity, competence, confidence, or self-value.",
        "emotion",
        "restore_dignity"
      );
    }

    // 5. IDENTITY
    // Who am I becoming? Role, self-concept, life transition.
    if (
      has([
        "who am i",
        "become",
        "becoming",
        "better father",
        "better mother",
        "better husband",
        "better wife",
        "better leader",
        "better nurse",
        "identity",
        "role",
        "father",
        "mother",
        "husband",
        "wife",
        "leader",
        "nurse",
        "marine",
        "builder",
        "developer",
        "protector"
      ])
    ) {
      add(
        "identity",
        84,
        "Identity need detected: role, self-concept, or who the user is becoming.",
        "identity",
        "clarify_identity"
      );
    }

    // 6. PURPOSE
    // Meaning, mission, calling, legacy, contribution.
    if (
      has([
        "meaning",
        "purpose",
        "what am i supposed to do",
        "why am i here",
        "mission",
        "calling",
        "legacy",
        "build something great",
        "contribution",
        "impact",
        "what is my life",
        "what should i do with my life"
      ])
    ) {
      add(
        "purpose",
        80,
        "Purpose need detected: meaning, mission, contribution, or legacy.",
        "meaning",
        "clarify_purpose"
      );
    }

    // 7. WISDOM
    // Integration, tradeoffs, what should lead, values in conflict.
    if (
      has([
        "what should i do",
        "should i",
        "wise",
        "wisdom",
        "right thing",
        "wrong thing",
        "tradeoff",
        "balance",
        "priority",
        "prioritize",
        "what matters most",
        "what good should lead",
        "uncomfortable truth",
        "what am i avoiding"
      ])
    ) {
      add(
        "wisdom",
        76,
        "Wisdom need detected: tradeoff, priority, integration, or values in conflict.",
        "wisdom",
        "choose_what_leads"
      );
    }

    if (!needs.length) {
      add(
        "understanding",
        55,
        "No strong need detected. Defaulting to understanding.",
        "observer",
        "continue_observing"
      );
    }

    needs.sort((a, b) => b.score - a.score);

    const primaryNeed = needs[0];
    const secondaryNeed = needs[1] || null;

    const needsMap = needs.reduce((map, need) => {
      map[need.name] = need.score;
      return map;
    }, {});

    return {
      needEngineRan: true,
      needEngineSource: "ari-human-needs-network",
      needEngineVersion: this.version,

      primaryHumanNeed: primaryNeed.name,
      primaryHumanNeedScore: primaryNeed.score,
      primaryHumanNeedReason: primaryNeed.reasons.join(" "),

      secondaryHumanNeed: secondaryNeed ? secondaryNeed.name : null,
      secondaryHumanNeedScore: secondaryNeed ? secondaryNeed.score : null,
      secondaryHumanNeedReason: secondaryNeed
        ? secondaryNeed.reasons.join(" ")
        : null,

      needRecommendedLeadOrgan: primaryNeed.leadOrgan,
      needResponseMode: primaryNeed.responseMode,

      humanNeedsMap: needsMap,
      rankedHumanNeeds: needs
    };
  }
};