// ari/language/ari-wisdom-principle-engine.js
// Ari Wisdom Principle Engine
// Purpose: Generate compressed wisdom principles from conflicts,
// life chapters, values, highest goods, identities, and emotions.
// V2.1
// Universalized:
// - Removes narrow father/family-only wisdom bias.
// - Adds broad human wisdom tensions.
// - Supports safety, body, dignity, connection, grief, repair, autonomy,
//   responsibility, rest, purpose, boundaries, honesty, growth, and trust.
// - Respects Mouth Director wisdom permission.
// - Avoids wisdom filler when wisdom is not allowed.

window.AriWisdomPrincipleEngine = {
  version: "2.1.0",

  distill(summary = {}) {
    const result = this.generateDetailed(summary);
    if (!result?.principle) return null;
    return result;
  },

  generate(summary = {}) {
    return this.generateDetailed(summary)?.principle || null;
  },

  compose(summary = {}) {
    return this.generateDetailed(summary);
  },

  run(summary = {}) {
    return this.generateDetailed(summary);
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
      wisdom: winner.text,
      text: winner.text,
      line: winner.text,

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

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .trim();
  },

  readContext(summary = {}) {
    return {
      mode:
        summary.synthesisMode ||
        summary.salienceMode ||
        summary.needResponseMode ||
        null,

      responseIntent: summary.responseIntent || null,

      responseShape: summary.responseShape || null,

      primaryHumanNeed: summary.primaryHumanNeed || null,
      secondaryHumanNeed: summary.secondaryHumanNeed || null,

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

      organismUrgencyLevel:
        summary.organismUrgency?.level ||
        summary.organismUrgencyLevel ||
        null,

      organismFunction:
        summary.organismPrimaryFunction ||
        summary.organismFunction ||
        null,

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
      secondaryHumanNeed,
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
      wisdomStatement,
      organismUrgencyLevel,
      organismFunction
    } = context;

    const normalizedConflict = this.normalize(conflict);
    const normalizedChapter = this.normalize(chapter);
    const normalizedNeed = this.normalize(primaryHumanNeed);
    const normalizedSecondaryNeed = this.normalize(secondaryHumanNeed);
    const normalizedIdentity = this.normalize(leadIdentity);
    const normalizedValue = this.normalize(integratedValue || highestGood);
    const normalizedEmotion = this.normalize(emotionalClassification);
    const normalizedRegret = this.normalize(likelyRegret);
    const normalizedSignal = this.normalize(strongestSignal);

    // SAFETY / BODY

    if (
      mode === "safety_override" ||
      mode === "stabilize_body_first" ||
      responseIntent === "protect_safety" ||
      responseIntent === "stabilize_organism_function" ||
      normalizedNeed === "security" ||
      normalizedNeed === "body" ||
      organismUrgencyLevel === "critical" ||
      organismUrgencyLevel === "high"
    ) {
      add(make({
        text: "When safety is active, wisdom starts with stabilization, not interpretation.",
        score: 100,
        priority: 100,
        wisdomType: "safety_first",
        patternUsed: "safety_body_security",
        confidence: "high",
        avoid: ["avoid_analysis_first", "avoid_abstract_meaning"],
        reason: "safety_or_body_active"
      }));
    }

    if (
      organismFunction === "rest_recovery" ||
      normalizedConflict === "responsibility_vs_rest" ||
      normalizedNeed === "rest"
    ) {
      add(make({
        text: "Rest is not a failure of responsibility. Sometimes it is what responsibility requires.",
        score: 94,
        priority: 92,
        wisdomType: "rest_responsibility",
        patternUsed: "responsibility_vs_rest",
        confidence: "high",
        avoid: ["avoid_shaming_rest", "avoid_productivity_moralizing"],
        reason: "rest_recovery_or_responsibility_vs_rest"
      }));
    }

    // CONNECTION / DIGNITY / GRIEF

    if (
      mode === "restore_dignity" ||
      responseIntent === "protect_dignity" ||
      normalizedNeed === "worth" ||
      normalizedNeed === "esteem"
    ) {
      add(make({
        text: "The danger is letting another person’s behavior become the measure of who you are.",
        score: 96,
        priority: 94,
        wisdomType: "dignity_protection",
        patternUsed: "restore_dignity_worth",
        confidence: "high",
        avoid: ["do_not_overexplain", "avoid_moralizing"],
        reason: "restore_dignity_worth"
      }));
    }

    if (
      mode === "emotional_connection" ||
      mode === "restore_connection" ||
      responseIntent === "offer_connection" ||
      normalizedNeed === "connection" ||
      normalizedNeed === "belonging"
    ) {
      add(make({
        text: "Loneliness should be listened to, but not allowed to testify as the whole truth.",
        score: 94,
        priority: 92,
        wisdomType: "connection_grounding",
        patternUsed: "emotional_connection",
        confidence: "high",
        avoid: ["avoid_false_reassurance", "avoid_fixing_too_fast"],
        reason: "connection_need"
      }));
    }

    if (
      normalizedChapter === "relationship_rupture_chapter" ||
      normalizedConflict === "love_vs_loss" ||
      normalizedEmotion === "grief" ||
      normalizedNeed === "grief"
    ) {
      add(make({
        text: "Grief is not proof that life is over. It is proof that something mattered.",
        score: 92,
        priority: 90,
        wisdomType: "grief_meaning",
        patternUsed: "grief_loss",
        confidence: "high",
        avoid: ["avoid_rushing_grief", "avoid_false_closure"],
        reason: "grief_or_relationship_rupture"
      }));
    }

    if (
      normalizedConflict === "forgiveness_vs_boundaries" ||
      normalizedConflict === "repair_vs_self_protection"
    ) {
      add(make({
        text: "Forgiveness does not require removing the boundary that keeps you safe.",
        score: 94,
        priority: 92,
        wisdomType: "forgiveness_boundaries",
        patternUsed: "forgiveness_vs_boundaries",
        confidence: "high",
        avoid: ["avoid_forced_forgiveness", "avoid_boundary_shame"],
        reason: "forgiveness_vs_boundaries"
      }));
    }

    // UNIVERSAL WISDOM TENSIONS

    if (
      normalizedConflict === "safety_vs_freedom" ||
      normalizedConflict === "security_vs_autonomy"
    ) {
      add(make({
        text: "Freedom matters, but it should not require abandoning the ground that keeps you safe.",
        score: 92,
        priority: 88,
        wisdomType: "safety_freedom_balance",
        patternUsed: "safety_vs_freedom",
        confidence: "high",
        avoid: ["avoid_control_framing", "avoid_reckless_freedom"],
        reason: "safety_vs_freedom"
      }));
    }

    if (
      normalizedConflict === "honesty_vs_comfort" ||
      normalizedConflict === "truth_vs_peace"
    ) {
      add(make({
        text: "Comfort bought by avoiding the truth usually becomes more expensive later.",
        score: 92,
        priority: 88,
        wisdomType: "honesty_comfort",
        patternUsed: "honesty_vs_comfort",
        confidence: "high",
        avoid: ["avoid_cruel_honesty", "avoid_people_pleasing"],
        reason: "honesty_vs_comfort"
      }));
    }

    if (
      normalizedConflict === "loyalty_vs_self_respect" ||
      normalizedConflict === "belonging_vs_dignity"
    ) {
      add(make({
        text: "Loyalty is not meant to require the surrender of self-respect.",
        score: 95,
        priority: 92,
        wisdomType: "loyalty_self_respect",
        patternUsed: "loyalty_vs_self_respect",
        confidence: "high",
        avoid: ["avoid_shaming_loyalty", "avoid_self_abandonment"],
        reason: "loyalty_vs_self_respect"
      }));
    }

    if (
      normalizedConflict === "acceptance_vs_change" ||
      normalizedConflict === "surrender_vs_action"
    ) {
      add(make({
        text: "Acceptance is not giving up. It is seeing clearly enough to choose the next honest move.",
        score: 91,
        priority: 86,
        wisdomType: "acceptance_change",
        patternUsed: "acceptance_vs_change",
        confidence: "high",
        avoid: ["avoid_passivity", "avoid_forced_positivity"],
        reason: "acceptance_vs_change"
      }));
    }

    if (
      normalizedConflict === "control_vs_trust" ||
      normalizedConflict === "certainty_vs_trust"
    ) {
      add(make({
        text: "Control tries to remove uncertainty. Trust learns how to move without needing all of it gone.",
        score: 91,
        priority: 86,
        wisdomType: "control_trust",
        patternUsed: "control_vs_trust",
        confidence: "medium",
        avoid: ["avoid_naive_trust", "avoid_control_shame"],
        reason: "control_vs_trust"
      }));
    }

    if (
      normalizedConflict === "certainty_vs_growth" ||
      normalizedConflict === "comfort_zone_vs_growth"
    ) {
      add(make({
        text: "Growth does not require perfect certainty. It requires enough safety to take the next honest step.",
        score: 90,
        priority: 84,
        wisdomType: "secure_growth",
        patternUsed: "certainty_vs_growth",
        confidence: "medium",
        avoid: ["avoid_reckless_growth", "avoid_stagnation_shame"],
        reason: "certainty_vs_growth"
      }));
    }

    if (
      normalizedConflict === "short_term_relief_vs_long_term_good" ||
      normalizedConflict === "relief_vs_repair"
    ) {
      add(make({
        text: "Relief can quiet the moment. Repair changes what keeps creating the pain.",
        score: 91,
        priority: 86,
        wisdomType: "relief_repair",
        patternUsed: "short_term_relief_vs_long_term_good",
        confidence: "high",
        avoid: ["avoid_shaming_coping", "avoid_quick_fix"],
        reason: "short_term_relief_vs_long_term_good"
      }));
    }

    if (
      normalizedConflict === "self_vs_others" ||
      normalizedConflict === "care_for_others_vs_self_care"
    ) {
      add(make({
        text: "Caring for others should not require disappearing from your own life.",
        score: 92,
        priority: 88,
        wisdomType: "self_others_balance",
        patternUsed: "self_vs_others",
        confidence: "high",
        avoid: ["avoid_selfishness_frame", "avoid_martyrdom"],
        reason: "self_vs_others"
      }));
    }

    if (
      normalizedConflict === "duty_vs_desire" ||
      normalizedConflict === "responsibility_vs_freedom"
    ) {
      add(make({
        text: "Duty should guide desire, not erase it. Desire should inform duty, not overthrow it.",
        score: 88,
        priority: 82,
        wisdomType: "duty_desire_integration",
        patternUsed: "duty_vs_desire",
        confidence: "medium",
        avoid: ["avoid_rigid_duty", "avoid_impulsivity"],
        reason: "duty_vs_desire"
      }));
    }

    if (
      normalizedConflict === "purpose_vs_security" ||
      normalizedConflict === "calling_vs_stability"
    ) {
      add(make({
        text: "Do not abandon your future for comfort, but do not abandon your life for ambition.",
        score: 89,
        priority: 84,
        wisdomType: "security_purpose_balance",
        patternUsed: "purpose_vs_security",
        confidence: "medium",
        avoid: ["avoid_extreme_either_or"],
        reason: "purpose_vs_security"
      }));
    }

    if (
      normalizedConflict === "growth_vs_stability" ||
      normalizedConflict === "change_vs_stability"
    ) {
      add(make({
        text: "Growth is powerful, but timing is wisdom.",
        score: 87,
        priority: 80,
        wisdomType: "seasonal_pacing",
        patternUsed: "growth_vs_stability",
        confidence: "medium",
        avoid: ["avoid_stagnation_framing"],
        reason: "growth_vs_stability"
      }));
    }

    // RELATIONSHIP / FAMILY / PRESENCE, KEPT BUT NOT DOMINANT BY DEFAULT

    if (
      normalizedConflict === "presence_vs_achievement" ||
      normalizedConflict === "ambition_vs_presence"
    ) {
      add(make({
        text: "The danger is not ambition. The danger is letting ambition consume what it was supposed to protect.",
        score: 90,
        priority: 84,
        wisdomType: "ambition_ordering",
        patternUsed: "presence_vs_achievement",
        confidence: "high",
        avoid: ["avoid_false_binary", "avoid_shaming_achievement"],
        reason: "presence_vs_achievement"
      }));
    }

    if (
      normalizedConflict === "family_vs_creation" ||
      normalizedConflict === "family_vs_purpose"
    ) {
      add(make({
        text: "The goal is not to abandon purpose. The goal is to keep purpose in its proper place.",
        score: 89,
        priority: 82,
        wisdomType: "purpose_ordering",
        patternUsed: "family_vs_purpose",
        confidence: "high",
        avoid: ["avoid_killing_builder_identity", "avoid_shaming_creation"],
        reason: "family_vs_purpose"
      }));
    }

    if (
      normalizedChapter === "fatherhood_transition" ||
      normalizedIdentity === "father"
    ) {
      add(make({
        text: "A good parent does not only build a future. They become present inside it.",
        score: 88,
        priority: 80,
        wisdomType: "parent_presence",
        patternUsed: "parenthood_transition",
        confidence: "medium",
        avoid: ["avoid_perfectionism", "avoid_guilt"],
        reason: "parenthood_transition"
      }));
    }

    if (
      normalizedChapter === "family_transition" ||
      normalizedValue === "protect_family" ||
      normalizedValue === "family"
    ) {
      add(make({
        text: "The people you love should not become the price of what you build.",
        score: 88,
        priority: 80,
        wisdomType: "family_protection",
        patternUsed: "family_transition",
        confidence: "medium",
        avoid: ["avoid_false_binary", "avoid_shaming_ambition"],
        reason: "family_transition"
      }));
    }

    // VALUES / IDENTITY / PURPOSE

    if (
      normalizedValue === "meaningful_presence" ||
      normalizedValue === "presence"
    ) {
      add(make({
        text: "Achievement should create a life worth being present for, not replace presence itself.",
        score: 89,
        priority: 82,
        wisdomType: "meaningful_presence",
        patternUsed: "meaningful_presence",
        confidence: "high",
        avoid: ["avoid_false_binary"],
        reason: "meaningful_presence"
      }));
    }

    if (
      normalizedValue === "integrity" ||
      normalizedConflict === "success_vs_integrity"
    ) {
      add(make({
        text: "Success that requires betraying your integrity is already charging too high a price.",
        score: 92,
        priority: 88,
        wisdomType: "integrity_protection",
        patternUsed: "success_vs_integrity",
        confidence: "high",
        avoid: ["avoid_moral_grandstanding"],
        reason: "integrity_or_success_vs_integrity"
      }));
    }

    if (
      normalizedIdentity === "builder" ||
      normalizedIdentity === "creator"
    ) {
      add(make({
        text: "Build slowly enough that you still recognize the life you are building for.",
        score: 86,
        priority: 76,
        wisdomType: "builder_pacing",
        patternUsed: "builder_identity",
        confidence: "medium",
        avoid: ["avoid_killing_builder_identity"],
        reason: "builder_identity"
      }));
    }

    if (
      normalizedIdentity === "steward" ||
      normalizedEmotion === "stewardship" ||
      normalizedEmotion === "responsibility"
    ) {
      add(make({
        text: "Stewardship asks what must be protected, not merely what can be gained.",
        score: 88,
        priority: 82,
        wisdomType: "stewardship",
        patternUsed: "stewardship",
        confidence: "medium",
        avoid: ["avoid_calling_it_fear_too_fast"],
        reason: "stewardship"
      }));
    }

    if (
      normalizedIdentity === "caregiver" ||
      normalizedIdentity === "protector" ||
      normalizedNeed === "caregiving"
    ) {
      add(make({
        text: "Protection is not only doing more. Sometimes it is knowing what must not be lost.",
        score: 88,
        priority: 82,
        wisdomType: "caregiver_protector",
        patternUsed: "caregiver_protector_identity",
        confidence: "medium",
        avoid: ["avoid_martyrdom", "avoid_overfunctioning"],
        reason: "caregiver_or_protector_identity"
      }));
    }

    if (
      normalizedNeed === "identity" ||
      normalizedSecondaryNeed === "identity" ||
      dominantTheme === "identity_overload"
    ) {
      add(make({
        text: "When many parts of you are speaking, wisdom decides which one should lead.",
        score: 87,
        priority: 80,
        wisdomType: "identity_ordering",
        patternUsed: "identity_overload",
        confidence: "medium",
        avoid: ["avoid_calling_responsibility_bad"],
        reason: "identity_need_or_overload"
      }));
    }

    if (
      normalizedNeed === "purpose" ||
      normalizedValue === "purpose" ||
      normalizedValue === "meaning"
    ) {
      add(make({
        text: "Purpose should give life direction, not permission to abandon the life it is meant to serve.",
        score: 88,
        priority: 80,
        wisdomType: "purpose_integration",
        patternUsed: "purpose_need",
        confidence: "medium",
        avoid: ["avoid_purpose_shaming", "avoid_empty_inspiration"],
        reason: "purpose_need_or_value"
      }));
    }

    // REGRET / LONG-TERM

    if (
      normalizedRegret.includes("missing_irreplaceable") ||
      normalizedRegret === "missing_irreplaceable_presence"
    ) {
      add(make({
        text: "The likely regret is not failing to do enough. It is missing what could not be recovered.",
        score: 88,
        priority: 78,
        wisdomType: "regret_prevention",
        patternUsed: "missing_irreplaceable_presence",
        confidence: "medium",
        avoid: ["avoid_fearmongering", "avoid_guilt"],
        reason: "missing_irreplaceable_presence"
      }));
    }

    if (longTermPriority) {
      add(make({
        text: "The wise move is the one your future self is least likely to resent.",
        score: 78,
        priority: 68,
        wisdomType: "future_self_alignment",
        patternUsed: "long_term_priority",
        confidence: "low",
        avoid: ["avoid_generic_future_self_advice"],
        reason: "long_term_priority"
      }));
    }

    // EMOTION-SPECIFIC WISDOM

    if (
      strongestSignalCategory === "underlying_emotion" &&
      normalizedSignal.includes("fear")
    ) {
      add(make({
        text: "Fear is not always weakness. Sometimes it is a signal that something important needs protection.",
        score: 84,
        priority: 74,
        wisdomType: "fear_as_protection_signal",
        patternUsed: "underlying_fear",
        confidence: "medium",
        avoid: ["avoid_shame", "avoid_fear_obedience"],
        reason: "underlying_fear"
      }));
    }

    if (normalizedEmotion === "anger") {
      add(make({
        text: "Anger often points to a boundary, but it should not be allowed to become the whole strategy.",
        score: 84,
        priority: 74,
        wisdomType: "anger_boundary",
        patternUsed: "anger",
        confidence: "medium",
        avoid: ["avoid_invalidating_anger", "avoid_reactivity"],
        reason: "anger"
      }));
    }

    if (normalizedEmotion === "shame") {
      add(make({
        text: "Shame tells you to hide. Wisdom asks what needs repair without declaring you beyond repair.",
        score: 88,
        priority: 82,
        wisdomType: "shame_repair",
        patternUsed: "shame",
        confidence: "high",
        avoid: ["avoid_shame_spiral", "avoid_over_reassurance"],
        reason: "shame"
      }));
    }

    // EXISTING WISDOM FALLBACKS

    if (wisdomPrinciple) {
      add(make({
        text: wisdomPrinciple,
        score: 70,
        priority: 60,
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
        score: 58,
        priority: 50,
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