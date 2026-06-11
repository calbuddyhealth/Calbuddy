// ari/belief-system/ari-belief-engine.js
// Ari Belief Engine
// Purpose: Infer possible beliefs driving values, identity, conflict, emotion, and decisions.
// V1.0

window.Ari = window.Ari || {};

window.Ari.beliefEngine = {
  version: "1.0.0",

  analyze({
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    insight = {},
    emotionalIntelligence = {},
    meaning = {},
    personModel = {}
  } = {}) {
    const beliefs = [];

    this.detectAchievementBeliefs({
      observation,
      values,
      identity,
      insight,
      meaning,
      beliefs
    });

    this.detectResponsibilityBeliefs({
      values,
      identity,
      emotionalIntelligence,
      personModel,
      beliefs
    });

    this.detectFamilyBeliefs({
      observation,
      values,
      identity,
      emotionalIntelligence,
      meaning,
      beliefs
    });

    this.detectPurposeBeliefs({
      values,
      insight,
      emotionalIntelligence,
      meaning,
      beliefs
    });

    this.detectSafetyBeliefs({
      observation,
      conflicts,
      emotionalIntelligence,
      personModel,
      beliefs
    });

    const primaryBelief = this.choosePrimaryBelief(beliefs);

    return {
      beliefs,
      primaryBelief,
      beliefTheme: primaryBelief?.name || null,
      beliefSummary: primaryBelief
        ? this.createBeliefSummary(primaryBelief)
        : "No strong belief pattern detected.",
      source: "ari-belief-engine"
    };
  },

  addBelief(beliefs = [], belief = {}) {
    const existing = beliefs.find((item) => item.name === belief.name);

    if (existing) {
      existing.score += belief.score || 0;
      existing.evidence = [
        ...new Set([...(existing.evidence || []), ...(belief.evidence || [])])
      ];
      existing.confidence = this.mergeConfidence(
        existing.confidence,
        belief.confidence
      );
      return;
    }

    beliefs.push({
      name: belief.name,
      score: belief.score || 1,
      confidence: belief.confidence || "low",
      evidence: belief.evidence || [],
      description: belief.description || ""
    });
  },

  mergeConfidence(current = "low", incoming = "low") {
    const rank = {
      unknown: 0,
      low: 1,
      medium: 2,
      high: 3
    };

    return rank[incoming] > rank[current] ? incoming : current;
  },

  detectAchievementBeliefs({
    observation = {},
    values = {},
    identity = {},
    insight = {},
    meaning = {},
    beliefs = []
  } = {}) {
    const text = observation.normalizedMessage || "";
    const patterns = observation.humanPatterns || {};
    const patternName = insight.pattern?.name || "";
    const meaningTheme = meaning.theme || "";

    if (
      text.includes("achievement") ||
      text.includes("milestone") ||
      text.includes("fall behind") ||
      text.includes("behind") ||
      patternName === "achievement_before_peace" ||
      patternName === "achievement_to_presence_transition" ||
      meaningTheme === "family_transition"
    ) {
      this.addBelief(beliefs, {
        name: "achievement_creates_security",
        score: 25,
        confidence: "medium",
        evidence: [
          "achievement or milestone language detected",
          "transition toward presence detected"
        ],
        description:
          "The user may believe achievement creates safety, stability, or permission to rest."
      });
    }

    if (
      patterns.competingPriorities ||
      identity.dominantTheme === "identity_overload"
    ) {
      this.addBelief(beliefs, {
        name: "all_important_roles_must_be_maintained",
        score: 20,
        confidence: "medium",
        evidence: [
          "competing priorities detected",
          "identity overload detected"
        ],
        description:
          "The user may believe that every important identity must stay active at full strength."
      });
    }

    if (
      values.values?.includes("growth") &&
      text.includes("slow")
    ) {
      this.addBelief(beliefs, {
        name: "slowing_down_means_falling_behind",
        score: 22,
        confidence: "medium",
        evidence: [
          "growth value detected",
          "slowing down language detected"
        ],
        description:
          "The user may believe slowing down risks losing momentum or falling behind."
      });
    }
  },

  detectResponsibilityBeliefs({
    values = {},
    identity = {},
    emotionalIntelligence = {},
    personModel = {},
    beliefs = []
  } = {}) {
    const dominantValue = values.dominantValue;
    const dominantIdentity = identity.dominantIdentity?.name;
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const primaryRole = personModel.snapshot?.primaryRole;

    if (
      dominantValue === "responsibility" ||
      dominantIdentity === "provider" ||
      primaryRole === "provider"
    ) {
      this.addBelief(beliefs, {
        name: "responsibility_comes_before_rest",
        score: 25,
        confidence: "medium",
        evidence: [
          "responsibility value or provider identity detected"
        ],
        description:
          "The user may believe responsibility should be handled before rest is allowed."
      });
    }

    if (
      rootNeed === "secure_family_presence"
    ) {
      this.addBelief(beliefs, {
        name: "people_depend_on_me_to_be_stable",
        score: 22,
        confidence: "medium",
        evidence: [
          "root need is secure family presence"
        ],
        description:
          "The user may believe others need them to remain steady and reliable."
      });
    }
  },

  detectFamilyBeliefs({
    observation = {},
    values = {},
    identity = {},
    emotionalIntelligence = {},
    meaning = {},
    beliefs = []
  } = {}) {
    const life = observation.lifeTransitions || {};
    const dominantValue = values.dominantValue;
    const dominantIdentity = identity.dominantIdentity?.name;
    const protecting = emotionalIntelligence.protecting?.name;
    const meaningTheme = meaning.theme;

    if (
      life.fatherhood ||
      dominantIdentity === "father" ||
      protecting === "family" ||
      protecting === "future_family"
    ) {
      this.addBelief(beliefs, {
        name: "family_moments_are_irreplaceable",
        score: 30,
        confidence: "high",
        evidence: [
          "fatherhood or family protection detected"
        ],
        description:
          "The user appears to believe family moments cannot simply be recovered later."
      });
    }

    if (
      meaningTheme === "family_transition" ||
      dominantValue === "family"
    ) {
      this.addBelief(beliefs, {
        name: "presence_matters_more_than_performance",
        score: 20,
        confidence: "medium",
        evidence: [
          "family transition or family dominant value detected"
        ],
        description:
          "The user may be moving toward the belief that presence matters more than achievement."
      });
    }
  },

  detectPurposeBeliefs({
    values = {},
    insight = {},
    emotionalIntelligence = {},
    meaning = {},
    beliefs = []
  } = {}) {
    const hiddenConflict = insight.hiddenConflict?.name;
    const underlyingEmotion = emotionalIntelligence.underlyingEmotion?.name;
    const meaningTheme = meaning.theme;

    if (
      values.values?.includes("creation") ||
      hiddenConflict === "family_vs_purpose" ||
      underlyingEmotion === "fear_of_betraying_purpose" ||
      meaningTheme === "family_vs_purpose"
    ) {
      this.addBelief(beliefs, {
        name: "purpose_must_not_be_abandoned",
        score: 25,
        confidence: "medium",
        evidence: [
          "creation value, purpose conflict, or purpose-related fear detected"
        ],
        description:
          "The user may believe meaningful purpose must be protected even when life requires slowing down."
      });
    }

    if (
      underlyingEmotion === "fear_of_betraying_purpose"
    ) {
      this.addBelief(beliefs, {
        name: "delaying_purpose_feels_like_betrayal",
        score: 24,
        confidence: "medium",
        evidence: [
          "underlying emotion is fear of betraying purpose"
        ],
        description:
          "The user may experience delay as abandonment rather than disciplined timing."
      });
    }
  },

  detectSafetyBeliefs({
    observation = {},
    conflicts = {},
    emotionalIntelligence = {},
    personModel = {},
    beliefs = []
  } = {}) {
    const text = observation.normalizedMessage || "";
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const lifeChapter = personModel.lifeChapter?.name;
    const conflictIntensity = conflicts.conflictIntensity;

    if (
      text.includes("uncertain") ||
      text.includes("unknown") ||
      text.includes("what if") ||
      rootNeed === "stability"
    ) {
      this.addBelief(beliefs, {
        name: "certainty_creates_safety",
        score: 18,
        confidence: "medium",
        evidence: [
          "uncertainty or stability need detected"
        ],
        description:
          "The user may feel safer when the future feels structured and predictable."
      });
    }

    if (
      conflictIntensity === "critical" ||
      lifeChapter === "fatherhood_and_transition"
    ) {
      this.addBelief(beliefs, {
        name: "too_much_change_requires_control",
        score: 20,
        confidence: "medium",
        evidence: [
          "critical conflict or major life transition detected"
        ],
        description:
          "The user may respond to major change by seeking control through planning, achievement, or structure."
      });
    }
  },

  choosePrimaryBelief(beliefs = []) {
    if (!Array.isArray(beliefs) || beliefs.length === 0) {
      return null;
    }

    const confidenceWeight = {
      high: 10,
      medium: 5,
      low: 1,
      unknown: 0
    };

    return [...beliefs].sort((a, b) => {
      const scoreA = (a.score || 0) + (confidenceWeight[a.confidence] || 0);
      const scoreB = (b.score || 0) + (confidenceWeight[b.confidence] || 0);
      return scoreB - scoreA;
    })[0];
  },

  createBeliefSummary(belief = {}) {
    const prefix =
      belief.confidence === "high"
        ? ""
        : belief.confidence === "medium"
        ? "Ari could be wrong, but "
        : "This is only a weak signal, but ";

    return `${prefix}the belief pattern may be: ${belief.description}`;
  }
};