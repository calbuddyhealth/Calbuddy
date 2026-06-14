// ari/needs/ari-need-engine.js
// Ari Human Needs Network
// Purpose: Identify the user's active human needs before Ari chooses wisdom, meaning, emotion, identity, or action.
// V2.3
// Universal Need Network

window.Ari = window.Ari || {};

window.Ari.needEngine = {
  version: "2.3.0",

  evaluate(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.normalizedMessage ||
      summary.input ||
      ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .trim();

const domainLead = summary.domainLead || null;
const domainMode = summary.domainMode || null;
const domainPermissions = summary.domainPermissions || {};

    const needs = [];

    const organismPrimaryFunction = summary.organismPrimaryFunction || null;
    const organismNeedsStabilization = Boolean(summary.organismNeedsStabilization);
    const organismUrgency = summary.organismUrgency || {};
    const organismUrgencyLevel = organismUrgency.level || null;
    const organismDisruption = summary.organismDisruption || {};
    const organismHasDisruption = Boolean(organismDisruption.hasDisruption);

    const bodyOrganismFunctions = [
      "energy_intake",
      "hydration",
      "rest_recovery",
      "injury_protection",
      "vital_stability",
      "waste_elimination",
      "temperature_regulation",
      "movement_mobility"
    ];

    const relationalOrganismFunctions = ["connection"];

    const isBodyOrganism = bodyOrganismFunctions.includes(organismPrimaryFunction);
    const isRelationalOrganism = relationalOrganismFunctions.includes(organismPrimaryFunction);

    const has = (phrases = []) => phrases.some((p) => text.includes(p));

    const add = (name, score, reason, leadOrgan, responseMode) => {
      const existing = needs.find((need) => need.name === name);

      if (existing) {
        existing.score = Math.max(existing.score, score);
        if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
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

    // 0. TRUE BODY ORGANISM OVERRIDE
    if (
      isBodyOrganism &&
      (
        organismNeedsStabilization ||
        organismUrgencyLevel === "critical" ||
        organismUrgencyLevel === "high" ||
        organismUrgencyLevel === "moderate"
      )
    ) {
      add(
        "body",
        organismUrgencyLevel === "critical" ? 100 : 98,
        `Organism function need detected: '${organismPrimaryFunction}' may need stabilization before interpretation.`,
        "safety",
        organismUrgencyLevel === "critical" ? "urgent_safety" : "stabilize_body_first"
      );
    }

    // 1. BODY
    if (
      has([
        "haven't slept", "havent slept", "have not slept", "can't sleep", "cant sleep",
        "no sleep", "insomnia", "awake all night", "sleep deprived",
        "hungry", "starving", "haven't eaten", "havent eaten", "have not eaten",
        "didn't eat", "didnt eat", "can't eat", "cant eat", "cannot eat",
        "nauseous", "nausea", "dizzy", "lightheaded", "blood sugar",
        "dehydrated", "thirsty", "dry mouth", "dark urine",
        "exhausted", "fatigued", "severe pain", "worst pain", "sharp pain",
        "constant pain", "fainted", "passed out", "vomiting", "diarrhea",
        "fever", "chills", "can't walk", "cant walk", "numbness", "weakness"
      ])
    ) {
      add(
        "body",
        100,
        "Body-level need detected: sleep, food, hydration, nausea, dizziness, pain, elimination, fever, energy, or physical stability.",
        "safety",
        "stabilize_body_first"
      );
    }

    // 2. SAFETY / SECURITY
    if (
      has([
        "unsafe", "danger", "emergency", "can't breathe", "cant breathe",
        "short of breath", "chest pain", "stroke", "seizure", "overdose",
        "bleeding", "hurt myself", "kill myself", "suicidal",
        "scared for my safety", "panic", "abuse", "threatened",
        "homeless", "evicted", "rent", "money", "bills", "debt",
        "job", "career", "housing", "insurance", "legal", "court",
        "custody", "pregnant", "pregnancy"
      ])
    ) {
      add(
        "security",
        96,
        "Security need detected: safety, health, money, housing, legal stability, responsibility, or protection.",
        "executive",
        "protect_security"
      );
    }

    // 3. CONNECTION / ATTACHMENT
    if (
      isRelationalOrganism ||
      has([
        "alone", "lonely", "nobody cares", "no one cares", "left out",
        "ignored", "abandoned", "unloved", "disconnected", "rejected",
        "wife left", "husband left", "girlfriend left", "boyfriend left",
        "left me", "broke up", "breakup", "divorce", "separated",
        "relationship", "friend", "family", "partner", "miss them"
      ])
    ) {
      add(
        "connection",
        90,
        "Connection need detected: belonging, love, attachment, relationship repair, or being seen.",
        "emotion",
        "restore_connection"
      );
    }

    // 4. WORTH / DIGNITY
    if (
      has([
        "nobody respects me", "no one respects me", "disrespected",
        "worthless", "not good enough", "i failed", "failure",
        "embarrassed", "ashamed", "humiliated", "look down on me",
        "useless", "stupid", "incompetent", "i don't matter",
        "i do not matter", "loser", "pathetic"
      ])
    ) {
      add(
        "worth",
        88,
        "Worth need detected: dignity, respect, competence, confidence, or self-value.",
        "emotion",
        "restore_dignity"
      );
    }

    // 5. IDENTITY
    if (
      has([
        "who am i", "identity", "role", "become", "becoming",
        "father", "mother", "parent", "husband", "wife", "leader",
        "nurse", "marine", "teacher", "student", "developer",
        "builder", "protector", "provider", "artist", "creator"
      ])
    ) {
      add(
        "identity",
        84,
        "Identity need detected: role, self-concept, transition, or who the user is becoming.",
        "identity",
        "clarify_identity"
      );
    }

    // 6. AUTONOMY
    if (
      has([
        "trapped", "stuck", "forced", "controlled", "no choice",
        "can't choose", "cant choose", "not allowed", "pressure",
        "they want me to", "i don't want to", "i do not want to"
      ])
    ) {
      add(
        "autonomy",
        82,
        "Autonomy need detected: agency, freedom, consent, choice, or self-direction.",
        "executive",
        "restore_agency"
      );
    }

    // 7. COMPETENCE / MASTERY
    if (
      has([
        "can't do this", "cant do this", "i don't know how",
        "i do not know how", "confused", "overwhelmed", "unprepared",
        "interview", "exam", "test", "performance", "skill",
        "learn", "practice", "improve", "mistake"
      ])
    ) {
      add(
        "competence",
        80,
        "Competence need detected: ability, preparation, learning, performance, or confidence in action.",
        "executive",
        "build_capability"
      );
    }

    // 8. CLARITY
    if (
      has([
        "confused", "unclear", "i don't understand", "i do not understand",
        "what does this mean", "what's going on", "whats going on",
        "explain", "help me understand", "not sure", "uncertain"
      ])
    ) {
      add(
        "clarity",
        78,
        "Clarity need detected: understanding, orientation, explanation, or reducing confusion.",
        "observer",
        "clarify_understanding"
      );
    }

    // 9. PURPOSE / MEANING
    if (
      has([
        "meaning", "purpose", "what am i supposed to do", "why am i here",
        "mission", "calling", "legacy", "contribution", "impact",
        "what is my life", "what should i do with my life"
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

    // 10. GRIEF / LOSS
    if (
      has([
        "died", "death", "lost someone", "grief", "grieving",
        "mourning", "miss them", "gone forever", "can't get them back",
        "cant get them back", "funeral"
      ])
    ) {
      add(
        "grief",
        86,
        "Grief need detected: loss, mourning, love, memory, or emotional processing.",
        "emotion",
        "hold_grief"
      );
    }

    // 11. REPAIR
    if (
      has([
        "apologize", "sorry", "make it right", "repair",
        "fix this relationship", "forgive", "forgiveness",
        "i hurt them", "they hurt me", "betrayed", "trust"
      ])
    ) {
      add(
        "repair",
        82,
        "Repair need detected: apology, forgiveness, trust, honesty, or relational repair.",
        "wisdom",
        "repair_or_boundary"
      );
    }

    // 12. WISDOM / TRADEOFF
    if (
      has([
        "what should i do", "should i", "wise", "wisdom",
        "right thing", "wrong thing", "tradeoff", "balance",
        "priority", "prioritize", "what matters most",
        "what good should lead", "uncomfortable truth",
        "what am i avoiding"
      ])
    ) {
      add(
        "wisdom",
        76,
        "Wisdom need detected: tradeoff, priority, values, or choosing what should lead.",
        "wisdom",
        "choose_what_leads"
      );
    }

    // 13. BODY OVERRIDE / SELF-REGULATION DISRUPTION
    if (
      organismHasDisruption ||
      has([
        "i should eat but", "i know i should eat but",
        "i should sleep but", "i know i should sleep but",
        "i know but", "i should but",
        "can't stop worrying", "cant stop worrying",
        "too anxious to eat", "too stressed to eat",
        "too nauseous to eat", "i can't make myself eat",
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
        "Self-regulation disruption detected: the user may know the basic need but cannot easily follow it.",
        "executive",
        "restore_basic_function"
      );
    }

        // 14. DOMAIN GOVERNOR PERMISSION CORRECTIONS
    const teachingDomainActive =
      domainLead === "knowledge_teaching_domain" ||
      domainMode === "teach_clearly" ||
      domainPermissions.teaching === true ||
      summary.shouldPreferTeaching === true;

    if (teachingDomainActive) {
      needs.length = 0;

      add(
        "understanding",
        95,
        "Teaching domain detected by Universal Domain Governor. Explanation should lead instead of emotional, identity, or life-chapter interpretation.",
        "teacher",
        "teach_clearly"
      );
    }

    if (domainPermissions.lifeChapter === false || summary.shouldBlockLifeChapter) {
      needs.forEach((need) => {
        if (need.leadOrgan === "meaning") {
          need.score = Math.min(need.score, 50);
          need.reasons.push("Life-chapter interpretation reduced by Universal Domain Governor.");
        }
      });
    }

    if (domainPermissions.emotionRecovery === false || summary.shouldBlockEmotionRecovery) {
      needs.forEach((need) => {
        if (need.leadOrgan === "emotion" && need.name !== "connection" && need.name !== "grief") {
          need.score = Math.min(need.score, 50);
          need.reasons.push("Emotion recovery reduced by Universal Domain Governor.");
        }
      });
    }

    if (
      domainLead === "body_domain" ||
      domainMode === "stabilize_body_first" ||
      domainPermissions.body === true ||
      summary.shouldPreferBodyStabilization === true
    ) {
      add(
        "body",
        100,
        "Body domain detected by Universal Domain Governor. Stabilization should lead.",
        "safety",
        "stabilize_body_first"
      );
    }

    if (!needs.length) {
      add(
        "understanding",
        55,
        "No strong need detected. Defaulting to understanding.",
        "observer",
        "seek_clarity"
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