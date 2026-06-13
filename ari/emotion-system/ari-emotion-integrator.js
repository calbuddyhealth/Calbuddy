// ari/emotion-system/ari-emotion-integrator.js
// Ari Emotion Integrator
// Purpose: Integrate Ari's emotion systems into one emotional decision.
// V1.0

window.Ari = window.Ari || {};

window.Ari.emotionIntegrator = {
  version: "1.0.0",

  integrate(input = {}) {
    const summary = input.summary || input || {};

    const emotionalIntelligence = summary.emotionalIntelligence || {};
    const underlyingEmotion = summary.underlyingEmotion || {};
    const stewardshipFear = summary.stewardshipFear || {};
    const lifeChapter = summary.lifeChapter || {};
    const identityPriority = summary.identityPriority || {};

    const primaryLifeChapter =
      summary.primaryLifeChapter ||
      lifeChapter.primaryLifeChapter ||
      null;

    const leadIdentity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      identityPriority.leadIdentity ||
      null;

    const surfaceEmotion =
      emotionalIntelligence.surfaceEmotion?.name ||
      summary.surfaceEmotion ||
      summary.primaryEmotion ||
      null;

    const underlying =
      underlyingEmotion.primaryUnderlyingEmotion?.name ||
      summary.underlyingEmotionDepth ||
      summary.underlyingEmotion ||
      null;

    const emotionalClassification =
      stewardshipFear.emotionalClassification ||
      emotionalIntelligence.emotionalClassification ||
      summary.emotionalClassification ||
      "unclear";

    const rootNeed =
      emotionalIntelligence.rootNeed?.name ||
      summary.rootNeed ||
      summary.primaryHumanNeed ||
      null;

    const protecting =
      emotionalIntelligence.protecting?.name ||
      summary.protecting ||
      null;

    const integratedValue =
      emotionalIntelligence.integratedValue ||
      summary.integratedValue ||
      protecting ||
      rootNeed ||
      null;

    const candidates = [];

    const add = (name, score, reason, mode, style = {}) => {
      if (!name) return;

      const existing = candidates.find(c => c.name === name);

      if (existing) {
        existing.score = Math.max(existing.score, score);
        existing.reasons.push(reason);
        return;
      }

      candidates.push({
        name,
        score,
        reasons: reason ? [reason] : [],
        mode,
        style
      });
    };

    if (
      emotionalClassification === "body_stabilization" ||
      rootNeed === "body_stabilization" ||
      primaryLifeChapter === "body_health_chapter"
    ) {
      add(
        "body_stabilization",
        120,
        "Body stabilization must lead before emotional interpretation.",
        "stabilize_body_first",
        {
          warmth: "calm",
          directness: "high",
          depth: "low",
          pace: "slow",
          questionStyle: "minimal"
        }
      );
    }

    if (
      emotionalClassification === "connection_pain" ||
      rootNeed === "connection" ||
      primaryLifeChapter === "relationship_rupture_chapter" ||
      underlying === "fear_of_being_unwanted"
    ) {
      add(
        "connection_pain",
        105,
        "Connection pain or relationship rupture is emotionally central.",
        "restore_connection",
        {
          warmth: "high",
          directness: "low",
          depth: "medium",
          pace: "slow",
          questionStyle: "gentle"
        }
      );
    }

    if (
      emotionalClassification === "worth_pain" ||
      rootNeed === "worth" ||
      underlying === "fear_of_not_being_enough"
    ) {
      add(
        "worth_pain",
        100,
        "Worth or shame pain is emotionally central.",
        "restore_dignity",
        {
          warmth: "high",
          directness: "medium",
          depth: "medium",
          pace: "slow",
          questionStyle: "dignity-restoring"
        }
      );
    }

    if (
      emotionalClassification === "grief" ||
      rootNeed === "honored_grief" ||
      primaryLifeChapter === "grief_loss_chapter" ||
      underlying === "love_with_nowhere_to_go"
    ) {
      add(
        "grief",
        100,
        "Grief or loss is emotionally central.",
        "honor_grief",
        {
          warmth: "high",
          directness: "low",
          depth: "medium",
          pace: "slow",
          questionStyle: "honoring"
        }
      );
    }

    if (
      emotionalClassification === "meaning_loss" ||
      rootNeed === "meaning" ||
      primaryLifeChapter === "meaning_crisis_chapter" ||
      underlying === "loss_of_meaning"
    ) {
      add(
        "meaning_loss",
        98,
        "Meaning loss is emotionally central.",
        "restore_meaning",
        {
          warmth: "medium",
          directness: "low",
          depth: "medium",
          pace: "slow",
          questionStyle: "meaning-restoring"
        }
      );
    }

    if (
      emotionalClassification === "capacity_overload" ||
      rootNeed === "recovery_and_capacity" ||
      primaryLifeChapter === "capacity_burnout_chapter" ||
      underlying === "fear_of_collapse_if_capacity_is_ignored"
    ) {
      add(
        "capacity_overload",
        96,
        "Capacity overload or burnout is emotionally central.",
        "reduce_load",
        {
          warmth: "medium",
          directness: "high",
          depth: "low",
          pace: "slow",
          questionStyle: "one-step"
        }
      );
    }

    if (
      emotionalClassification === "stewardship" ||
      leadIdentity === "steward" ||
      primaryLifeChapter === "stewardship_chapter" ||
      protecting === "responsibility"
    ) {
      add(
        "stewardship",
        92,
        "Responsibility, care, or stewardship is emotionally central.",
        "support_stewardship",
        {
          warmth: "medium",
          directness: "medium",
          depth: "medium",
          pace: "steady",
          questionStyle: "responsibility-focused"
        }
      );
    }

    if (
      primaryLifeChapter === "uncertainty_transition_chapter" ||
      rootNeed === "clarity" ||
      underlying === "fear_of_wrong_direction"
    ) {
      add(
        "uncertainty",
        90,
        "Uncertainty or fear of wrong direction is emotionally central.",
        "create_clarity",
        {
          warmth: "medium",
          directness: "medium",
          depth: "low",
          pace: "steady",
          questionStyle: "clarifying"
        }
      );
    }

    if (
      primaryLifeChapter === "recovery_rebuilding_chapter" ||
      underlying === "fear_rebuilding_will_not_work" ||
      leadIdentity === "rebuilding-self"
    ) {
      add(
        "recovery",
        88,
        "Recovery or rebuilding is emotionally central.",
        "support_rebuilding",
        {
          warmth: "high",
          directness: "medium",
          depth: "medium",
          pace: "slow",
          questionStyle: "rebuilding"
        }
      );
    }

    if (
      primaryLifeChapter === "family_parenthood_chapter" ||
      leadIdentity === "family-protector" ||
      underlying === "fear_of_failing_family" ||
      underlying === "fear_of_missing_irreplaceable_moments"
    ) {
      add(
        "family_stewardship",
        88,
        "Family protection, parenthood, or presence is emotionally central.",
        "protect_family_presence",
        {
          warmth: "medium",
          directness: "medium",
          depth: "medium",
          pace: "steady",
          questionStyle: "family-presence"
        }
      );
    }

    if (
      primaryLifeChapter === "purpose_mission_chapter" ||
      leadIdentity === "purpose-bearer" ||
      underlying === "fear_of_betraying_purpose"
    ) {
      add(
        "purpose_protection",
        84,
        "Purpose or mission protection is emotionally central.",
        "protect_purpose_without_overextension",
        {
          warmth: "medium",
          directness: "medium",
          depth: "medium",
          pace: "steady",
          questionStyle: "purpose"
        }
      );
    }

    if (surfaceEmotion && surfaceEmotion !== "curiosity") {
      add(
        surfaceEmotion,
        70,
        `Surface emotion '${surfaceEmotion}' is active.`,
        "reflect_surface_emotion",
        {
          warmth: "medium",
          directness: "medium",
          depth: "low",
          pace: "steady",
          questionStyle: "simple"
        }
      );
    }

    if (candidates.length === 0) {
      add(
        "curiosity",
        50,
        "No dominant emotional integration signal was found.",
        "reflect_and_clarify",
        {
          warmth: "medium",
          directness: "medium",
          depth: "low",
          pace: "steady",
          questionStyle: "clarifying"
        }
      );
    }

    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];

    return {
      emotionIntegrationRan: true,
      emotionIntegrationVersion: this.version,

      integratedEmotion: winner.name,
      integratedEmotionScore: winner.score,
      integratedEmotionMode: winner.mode,
      integratedEmotionStyle: winner.style,
      integratedEmotionReason: winner.reasons.join(" "),

      primaryEmotion:
        winner.name === "body_stabilization"
          ? "body_alarm"
          : winner.name,

      emotionalClassification:
        emotionalClassification === "unclear"
          ? winner.name
          : emotionalClassification,

      rootNeed,
      protecting,
      integratedValue,

      recommendedEmotionResponseMode: winner.mode,
      communicationStyle: winner.style,

      rankedIntegratedEmotions: candidates.map(c => ({
        name: c.name,
        score: c.score,
        mode: c.mode,
        style: c.style,
        reasons: c.reasons
      })),

      source: "ari-emotion-integrator"
    };
  }
};