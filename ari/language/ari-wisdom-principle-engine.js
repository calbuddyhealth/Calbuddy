// ari/language/ari-wisdom-principle-engine.js
// Ari Wisdom Principle Engine
// Purpose: Generate compressed wisdom principles from conflicts,
// life chapters, values, highest goods, identities, and emotions.
// V2.0
// Upgrade:
// - Template-driven + mode-driven.
// - Returns metadata: wisdomType, patternUsed, confidence, avoid.
// - Respects Mouth Director wisdom permission.
// - Scores multiple wisdom patterns.
// - Avoids generic wisdom filler when wisdom is not allowed.

window.AriWisdomPrincipleEngine = {
  distill(summary = {}) {
    const result = this.generateDetailed(summary);

    if (!result?.principle) return null;

    return result;
  },

  generate(summary = {}) {
    return this.generateDetailed(summary)?.principle || null;
  },

  generateDetailed(summary = {}) {
    if (!this.allowsWisdom(summary)) return null;

    const context = this.readContext(summary);
    const candidates = this.getCandidates(context);

    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.priority - a.priority;
    });

    const winner = candidates[0];

    return {
      principle: winner.text,
      wisdomType: winner.wisdomType,
      patternUsed: winner.patternUsed,
      confidence: winner.confidence,
      avoid: winner.avoid || [],
      reasons: winner.reasons || [],
      source: "ari-wisdom-principle-engine"
    };
  },

  allowsWisdom(summary = {}) {
    const director = summary.mouthDirector || {};

    return (
      summary.mouthAllows?.wisdom !== false &&
      director.allowWisdom !== false &&
      summary.allowWisdom !== false
    );
  },

  readContext(summary = {}) {
    return {
      mode:
        summary.synthesisMode ||
        summary.salienceMode ||
        summary.needResponseMode ||
        null,

      responseIntent: summary.responseIntent || null,

      primaryHumanNeed: summary.primaryHumanNeed || null,

      conflict:
        summary.primaryConflict ||
        summary.apparentConflict ||
        summary.wisdomTension ||
        null,

      chapter: summary.primaryLifeChapter || null,
      highestGood: summary.highestGood || null,

      leadIdentity:
        summary.resolvedLeadIdentity ||
        summary.leadIdentity ||
        summary.dominantIdentity ||
        null,

      emotionalClassification:
        summary.emotionalClassification ||
        summary.primaryEmotion ||
        summary.surfaceEmotion ||
        null,

      strongestSignalCategory: summary.strongestSignalCategory || null,
      strongestSignal: summary.strongestSignal || null,

      integratedValue: summary.integratedValue || null,
      longTermPriority: summary.longTermPriority || null,

      likelyRegret:
        summary.regretType ||
        summary.likelyRegret ||
        null,

      dominantTheme: summary.dominantTheme || null,

      wisdomPrinciple: summary.wisdomPrinciple || null,
      wisdomStatement: summary.wisdomStatement || null,

      confidence:
        summary.wisdomConfidence ||
        summary.calibratedConfidence ||
        summary.metaConfidence ||
        "unknown"
    };
  },

  getCandidates(context = {}) {
    const candidates = [];

    const add = (candidate) => {
      if (!candidate?.text) return;

      const existing = candidates.find(item => item.text === candidate.text);

      if (existing) {
        existing.score = Math.max(existing.score, candidate.score);
        existing.priority = Math.max(existing.priority, candidate.priority);
        existing.reasons = Array.from(
          new Set([...(existing.reasons || []), ...(candidate.reasons || [])])
        );
        return;
      }

      candidates.push(candidate);
    };

    const make = ({
      text,
      score,
      priority = 50,
      wisdomType,
      patternUsed,
      confidence = "medium",
      avoid = [],
      reason = ""
    }) => ({
      text,
      score,
      priority,
      wisdomType,
      patternUsed,
      confidence,
      avoid,
      reasons: reason ? [reason] : []
    });

    const {
      mode,
      responseIntent,
      primaryHumanNeed,
      conflict,
      chapter,
      highestGood,
      leadIdentity,
      emotionalClassification,
      strongestSignalCategory,
      strongestSignal,
      integratedValue,
      longTermPriority,
      likelyRegret,
      dominantTheme,
      wisdomPrinciple,
      wisdomStatement
    } = context;

    if (
      mode === "restore_dignity" ||
      responseIntent === "protect_dignity" ||
      primaryHumanNeed === "worth"
    ) {
      add(make({
        text: "The danger is letting another person’s behavior become the measure of who you are.",
        score: 92,
        priority: 90,
        wisdomType: "dignity_protection",
        patternUsed: "restore_dignity_worth",
        confidence: "high",
        avoid: ["do_not_overexplain", "avoid_moralizing"],
        reason: "restore_dignity_worth"
      }));
    }

    if (
      mode === "emotional_connection" ||
      responseIntent === "offer_connection" ||
      primaryHumanNeed === "connection"
    ) {
      add(make({
        text: "Loneliness should be listened to, but not allowed to testify as the whole truth.",
        score: 90,
        priority: 88,
        wisdomType: "connection_grounding",
        patternUsed: "emotional_connection",
        confidence: "medium",
        avoid: ["avoid_false_reassurance", "avoid_fixing_too_fast"],
        reason: "emotional_connection"
      }));
    }

    if (
      mode === "safety_override" ||
      responseIntent === "protect_safety" ||
      primaryHumanNeed === "security" ||
      primaryHumanNeed === "body"
    ) {
      add(make({
        text: "When safety is active, wisdom starts with stabilization, not interpretation.",
        score: 100,
        priority: 100,
        wisdomType: "safety_first",
        patternUsed: "safety_body_security",
        confidence: "high",
        avoid: ["avoid_analysis_first", "avoid_abstract_meaning"],
        reason: "safety_override"
      }));
    }

    if (chapter === "fatherhood_transition") {
      add(make({
        text: "Protect what cannot be replaced before chasing what can return.",
        score: 94,
        priority: 92,
        wisdomType: "irreversible_presence",
        patternUsed: "fatherhood_transition",
        confidence: "high",
        avoid: ["avoid_guilt", "avoid_perfectionism"],
        reason: "fatherhood_transition"
      }));

      add(make({
        text: "A good father does not only build a future. He becomes present inside it.",
        score: 92,
        priority: 90,
        wisdomType: "father_presence",
        patternUsed: "fatherhood_transition",
        confidence: "high",
        avoid: ["avoid_pressure"],
        reason: "fatherhood_transition"
      }));
    }

    if (chapter === "family_transition" || highestGood === "protect_family") {
      add(make({
        text: "The people you love should never become the price of what you build.",
        score: 96,
        priority: 95,
        wisdomType: "family_protection",
        patternUsed: "protect_family",
        confidence: "high",
        avoid: ["avoid_false_binary", "avoid_shaming_ambition"],
        reason: "protect_family"
      }));

      add(make({
        text: "Family is not something to return to after the work is done. It is part of what the work is for.",
        score: 92,
        priority: 90,
        wisdomType: "family_as_purpose",
        patternUsed: "family_transition",
        confidence: "high",
        avoid: ["avoid_work_vs_family_cliche"],
        reason: "family_transition"
      }));
    }

    if (
      conflict === "presence_vs_achievement" ||
      conflict === "ambition_vs_presence"
    ) {
      add(make({
        text: "Achievement can wait. Some moments cannot.",
        score: 93,
        priority: 90,
        wisdomType: "irreversible_moments",
        patternUsed: "presence_vs_achievement",
        confidence: "high",
        avoid: ["avoid_shaming_achievement"],
        reason: "presence_vs_achievement"
      }));

      add(make({
        text: "The danger is not ambition. The danger is letting ambition consume what it was supposed to protect.",
        score: 91,
        priority: 89,
        wisdomType: "ambition_ordering",
        patternUsed: "presence_vs_achievement",
        confidence: "high",
        avoid: ["avoid_false_binary"],
        reason: "presence_vs_achievement"
      }));
    }

    if (
      conflict === "family_vs_creation" ||
      conflict === "family_vs_purpose"
    ) {
      add(make({
        text: "The goal is not to abandon purpose. The goal is to keep purpose in its proper place.",
        score: 90,
        priority: 86,
        wisdomType: "purpose_ordering",
        patternUsed: "family_vs_creation",
        confidence: "high",
        avoid: ["avoid_killing_builder_identity"],
        reason: "family_vs_creation"
      }));

      add(make({
        text: "Do not make your family compete equally with something that can wait.",
        score: 91,
        priority: 88,
        wisdomType: "priority_protection",
        patternUsed: "family_vs_creation",
        confidence: "high",
        avoid: ["avoid_shaming_creation"],
        reason: "family_vs_creation"
      }));
    }

    if (conflict === "growth_vs_stability") {
      add(make({
        text: "Growth is powerful, but timing is wisdom.",
        score: 86,
        priority: 80,
        wisdomType: "seasonal_pacing",
        patternUsed: "growth_vs_stability",
        confidence: "medium",
        avoid: ["avoid_stagnation_framing"],
        reason: "growth_vs_stability"
      }));
    }

    if (conflict === "purpose_vs_security") {
      add(make({
        text: "Do not abandon your future for comfort, but do not abandon your life for ambition.",
        score: 88,
        priority: 82,
        wisdomType: "security_purpose_balance",
        patternUsed: "purpose_vs_security",
        confidence: "medium",
        avoid: ["avoid_extreme_either_or"],
        reason: "purpose_vs_security"
      }));
    }

    if (integratedValue === "meaningful_presence") {
      add(make({
        text: "Achievement should create a life worth being present for, not replace presence itself.",
        score: 91,
        priority: 88,
        wisdomType: "meaningful_presence",
        patternUsed: "meaningful_presence",
        confidence: "high",
        avoid: ["avoid_false_binary"],
        reason: "meaningful_presence"
      }));
    }

    if (longTermPriority === "presence") {
      add(make({
        text: "Protect presence now, because some moments do not wait for you to become ready.",
        score: 92,
        priority: 90,
        wisdomType: "presence_priority",
        patternUsed: "long_term_presence",
        confidence: "high",
        avoid: ["avoid_guilt"],
        reason: "longTermPriority_presence"
      }));
    }

    if (
      likelyRegret === "missing_irreplaceable_presence" ||
      String(likelyRegret).includes("Missing irreplaceable")
    ) {
      add(make({
        text: "The likely regret is not failing to build enough. It is missing what could not be rebuilt.",
        score: 90,
        priority: 86,
        wisdomType: "regret_prevention",
        patternUsed: "missing_irreplaceable_presence",
        confidence: "high",
        avoid: ["avoid_fearmongering"],
        reason: "missing_irreplaceable_presence"
      }));
    }

    if (leadIdentity === "father") {
      add(make({
        text: "A good father does not only build a future. He becomes present inside it.",
        score: 94,
        priority: 92,
        wisdomType: "father_identity",
        patternUsed: "father_identity",
        confidence: "high",
        avoid: ["avoid_perfectionism"],
        reason: "father_identity"
      }));
    }

    if (leadIdentity === "family-protector") {
      add(make({
        text: "Protection is not only provision. Sometimes protection means presence.",
        score: 93,
        priority: 90,
        wisdomType: "protector_identity",
        patternUsed: "family_protector_identity",
        confidence: "high",
        avoid: ["avoid_provider_only_frame"],
        reason: "family_protector_identity"
      }));
    }

    if (leadIdentity === "builder") {
      add(make({
        text: "Build slowly enough that you still recognize the life you are building for.",
        score: 87,
        priority: 82,
        wisdomType: "builder_pacing",
        patternUsed: "builder_identity",
        confidence: "medium",
        avoid: ["avoid_killing_builder_identity"],
        reason: "builder_identity"
      }));
    }

    if (leadIdentity === "steward" || emotionalClassification === "stewardship") {
      add(make({
        text: "Stewardship asks what must be protected, not merely what can be gained.",
        score: 87,
        priority: 82,
        wisdomType: "stewardship",
        patternUsed: "stewardship",
        confidence: "medium",
        avoid: ["avoid_calling_it_fear_too_fast"],
        reason: "stewardship"
      }));
    }

    if (
      strongestSignalCategory === "underlying_emotion" &&
      strongestSignal === "fear_of_missing_irreplaceable_moments"
    ) {
      add(make({
        text: "Fear is not always weakness. Sometimes it is love noticing what time can take.",
        score: 89,
        priority: 84,
        wisdomType: "fear_as_love_signal",
        patternUsed: "fear_of_missing_irreplaceable_moments",
        confidence: "medium",
        avoid: ["avoid_shame"],
        reason: "fear_of_missing_irreplaceable_moments"
      }));
    }

    if (dominantTheme === "identity_overload") {
      add(make({
        text: "When everything is important, wisdom decides what goes first.",
        score: 86,
        priority: 80,
        wisdomType: "priority_ordering",
        patternUsed: "identity_overload",
        confidence: "medium",
        avoid: ["avoid_calling_responsibility_bad"],
        reason: "identity_overload"
      }));
    }

    if (wisdomPrinciple) {
      add(make({
        text: wisdomPrinciple,
        score: 72,
        priority: 65,
        wisdomType: "existing_principle",
        patternUsed: "existing_wisdom_principle",
        confidence: "low",
        avoid: ["avoid_overusing_generic_wisdom"],
        reason: "existing_wisdom_principle"
      }));
    }

    if (wisdomStatement) {
      add(make({
        text: wisdomStatement,
        score: 60,
        priority: 55,
        wisdomType: "existing_statement",
        patternUsed: "existing_wisdom_statement",
        confidence: "low",
        avoid: ["avoid_long_wisdom_dump"],
        reason: "existing_wisdom_statement"
      }));
    }

    return candidates;
  }
};