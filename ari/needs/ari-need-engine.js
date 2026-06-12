// ari/needs/ari-need-engine.js
// Ari Human Needs Network
// Purpose: Identify the user's active human needs before Ari chooses wisdom, meaning, emotion, identity, or action.
// Replaces Maslow-style hierarchy with Ari's need network.
// V2.1
// Fixes:
// - Adds organism-function awareness.
// - Detects when basic survival functions are blocked.
// - Strengthens body need detection for food, nausea, dizziness, hydration, sleep, pain.
// - Allows humans to go against their own living functions through worry, fear, shame, conflict, or cognition.
// - Sends body/security needs to safety before meaning, wisdom, or identity.

window.Ari = window.Ari || {};

window.Ari.needEngine = {
  version: "2.1.0",

  evaluate(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.normalizedMessage ||
      summary.input ||
      ""
    ).toLowerCase();

    const needs = [];

    const organismPrimaryFunction = summary.organismPrimaryFunction || null;
    const organismNeedsStabilization = Boolean(summary.organismNeedsStabilization);
    const organismUrgency = summary.organismUrgency || {};
    const organismUrgencyLevel = organismUrgency.level || null;
    const organismDisruption = summary.organismDisruption || {};
    const organismHasDisruption = Boolean(organismDisruption.hasDisruption);

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

    // 0. ORGANISM FUNCTION OVERRIDE
    // Basic living functions must be understood before abstract interpretation.
    if (
      organismNeedsStabilization ||
      organismUrgencyLevel === "critical" ||
      organismUrgencyLevel === "high" ||
      organismUrgencyLevel === "moderate"
    ) {
      add(
        "body",
        organismUrgencyLevel === "critical" ? 100 : 98,
        `Organism function need detected: '${organismPrimaryFunction || "unknown"}' may need stabilization before interpretation.`,
        "safety",
        organismUrgencyLevel === "critical"
          ? "urgent_safety"
          : "stabilize_body_first"
      );
    }

    // 1. BODY
    // Sleep, food, pain, hydration, exhaustion, nausea, dizziness, body stability.
    if (
      has([
        "haven't slept",
        "have not slept",
        "can't sleep",
        "cannot sleep",
        "no sleep",
        "insomnia",
        "hungry",
        "starving",
        "haven't eaten",
        "have not eaten",
        "havent eaten",
        "didn't eat",
        "didnt eat",
        "haven't eaten all day",
        "havent eaten all day",
        "can't eat",
        "cannot eat",
        "cant eat",
        "too nauseous",
        "nauseous",
        "nausea",
        "dizzy",
        "lightheaded",
        "blood sugar",
        "dehydrated",
        "thirsty",
        "dry mouth",
        "dark urine",
        "exhausted",
        "fatigued",
        "severe pain",
        "worst pain",
        "sharp pain",
        "constant pain",
        "fainted",
        "passed out"
      ])
    ) {
      add(
        "body",
        100,
        "Body-level need detected: sleep, food, hydration, nausea, dizziness, pain, energy, or physical stability.",
        "safety",
        "stabilize_body_first"
      );
    }

    // 1.5 BODY OVERRIDE / SELF-REGULATION DISRUPTION
    // Humans can know what keeps them alive and still be unable to act on it.
    if (
      has([
        "i should eat but",
        "i know i should eat but",
        "i should sleep but",
        "i know i should sleep but",
        "i know but",
        "i should but",
        "can't stop worrying",
        "cant stop worrying",
        "too anxious to eat",
        "too stressed to eat",
        "too nauseous to eat",
        "i can't make myself eat",
        "i cant make myself eat"
      ])
    ) {
      add(
        "body",
        100,
        "Body need is being overridden or blocked by cognition, fear, nausea, stress, or emotional conflict.",
        "safety",
        "stabilize_body_first"
      );

      add(
        "security",
        90,
        "Self-regulation disruption detected: the user may know the survival need but cannot easily follow it.",
        "executive",
        "restore_basic_function"
      );
    }

    // 2. SECURITY
    // Protection, medical danger, money, shelter, stability, predictability.
    if (
      has([
        "unsafe",
        "danger",
        "emergency",
        "can't breathe",
        "cannot breathe",
        "cant breathe",
        "short of breath",
        "chest pain",
        "stroke",
        "seizure",
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