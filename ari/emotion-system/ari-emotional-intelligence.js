// ari/emotion-system/ari-emotional-intelligence.js
// Ari Emotional Intelligence
// Purpose: Detect surface emotion, underlying emotion, emotional tension, root need, and what the user is protecting.
// V1.0

window.Ari = window.Ari || {};

window.Ari.emotionalIntelligence = {
  version: "1.0.0",

  analyze({ observation = {}, values = {}, identity = {}, conflicts = {}, executive = {}, insight = {} } = {}) {
    const text = observation.normalizedMessage || "";
    const emotion = observation.emotion || {};
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};

    const surfaceEmotion = this.detectSurfaceEmotion({ text, emotion });
    const underlyingEmotion = this.detectUnderlyingEmotion({
      text,
      life,
      patterns,
      conflicts,
      insight
    });

    const emotionalTension = this.detectEmotionalTension({
      text,
      surfaceEmotion,
      underlyingEmotion,
      values,
      identity
    });

    const rootNeed = this.detectRootNeed({
      text,
      life,
      patterns,
      values,
      conflicts,
      executive
    });

    const protecting = this.detectProtecting({
      text,
      life,
      values,
      identity,
      executive
    });

    const regulation = this.chooseRegulation({
      surfaceEmotion,
      underlyingEmotion,
      emotionalTension,
      rootNeed,
      patterns,
      conflicts
    });

    return {
      surfaceEmotion,
      underlyingEmotion,
      emotionalTension,
      rootNeed,
      protecting,
      regulation,
      source: "ari-emotional-intelligence"
    };
  },

  detectSurfaceEmotion({ text = "", emotion = {} } = {}) {
    const signals = emotion.signals || [];

    if (signals.includes("concern")) {
      return {
        name: "concern",
        confidence: "high",
        description: "The user appears worried or aware that something may be at risk."
      };
    }

    if (signals.includes("stewardship")) {
      return {
        name: "stewardship",
        confidence: "high",
        description: "The user appears focused on responsibility and protecting what matters."
      };
    }

    if (signals.includes("determination")) {
      return {
        name: "determination",
        confidence: "medium",
        description: "The user appears motivated to keep moving forward."
      };
    }

    if (signals.includes("compassion")) {
      return {
        name: "hurt",
        confidence: "medium",
        description: "The user may be expressing emotional pain or vulnerability."
      };
    }

    if (text.includes("excited")) {
      return {
        name: "excitement",
        confidence: "medium",
        description: "The user is expressing positive anticipation."
      };
    }

    if (text.includes("guilty")) {
      return {
        name: "guilt",
        confidence: "high",
        description: "The user appears to feel responsible for possibly falling short."
      };
    }

    if (text.includes("terrified") || text.includes("scared") || text.includes("afraid")) {
      return {
        name: "fear",
        confidence: "high",
        description: "The user appears afraid of a possible outcome."
      };
    }

    if (text.includes("overwhelmed") || text.includes("exhausted") || text.includes("burned out")) {
      return {
        name: "overwhelm",
        confidence: "high",
        description: "The user appears overloaded."
      };
    }

    return {
      name: "curiosity",
      confidence: "low",
      description: "No strong surface emotion detected."
    };
  },

  detectUnderlyingEmotion({ text = "", life = {}, patterns = {}, conflicts = {}, insight = {} } = {}) {
    const primaryConflict = conflicts.primaryConflict?.name || "";
    const hiddenConflict = insight.hiddenConflict?.name || "";

    if (
      text.includes("guilty") ||
      text.includes("not good enough") ||
      text.includes("won't be a good enough father")
    ) {
      return {
        name: "anticipatory_guilt",
        confidence: "high",
        description: "The user may be feeling guilt before the event has even happened."
      };
    }

    if (
      life.fatherhood &&
      (patterns.roleConflict || patterns.competingPriorities)
    ) {
      return {
        name: "fear_of_failing_family",
        confidence: "high",
        description: "The user may fear failing the people who matter most."
      };
    }

    if (
      primaryConflict === "identity_vs_transition" ||
      hiddenConflict === "identity_overload"
    ) {
      return {
        name: "identity_instability",
        confidence: "medium",
        description: "The user may feel unsettled because an old identity is giving way to a new one."
      };
    }

    if (
      patterns.burnoutRisk ||
      text.includes("exhausted") ||
      text.includes("burned out")
    ) {
      return {
        name: "depleted_capacity",
        confidence: "high",
        description: "The user may not just be stressed; they may be running low on capacity."
      };
    }

    if (
      text.includes("behind") ||
      text.includes("fall behind") ||
      text.includes("losing momentum")
    ) {
      return {
        name: "fear_of_falling_behind",
        confidence: "high",
        description: "The user may equate slowing down with losing their future."
      };
    }

    if (
      text.includes("abandon") ||
      text.includes("giving up") ||
      hiddenConflict === "family_vs_purpose"
    ) {
      return {
        name: "fear_of_betraying_purpose",
        confidence: "medium",
        description: "The user may fear that slowing a meaningful mission means betraying it."
      };
    }

    return {
      name: "unclear",
      confidence: "low",
      description: "No clear underlying emotion detected."
    };
  },

  detectEmotionalTension({ text = "", surfaceEmotion = {}, underlyingEmotion = {}, values = {}, identity = {} } = {}) {
    const tensions = [];

    if (
      text.includes("part of me") ||
      text.includes("another part of me")
    ) {
      tensions.push({
        name: "internal_parts_conflict",
        description: "Different parts of the user appear to want different things."
      });
    }

    if (
      values.values?.includes("family") &&
      values.values?.includes("growth")
    ) {
      tensions.push({
        name: "family_vs_growth",
        description: "The user may feel pulled between family presence and personal growth."
      });
    }

    if (
      values.values?.includes("family") &&
      values.values?.includes("creation")
    ) {
      tensions.push({
        name: "family_vs_creation",
        description: "The user may feel pulled between family presence and creative purpose."
      });
    }

    if (
      identity.identityConflicts?.includes("father_vs_builder")
    ) {
      tensions.push({
        name: "father_vs_builder",
        description: "The father identity and builder identity may both be asking to lead."
      });
    }

    if (
      surfaceEmotion.name !== "curiosity" &&
      underlyingEmotion.name !== "unclear" &&
      surfaceEmotion.name !== underlyingEmotion.name
    ) {
      tensions.push({
        name: `${surfaceEmotion.name}_over_${underlyingEmotion.name}`,
        description: "The visible emotion may be covering a deeper emotional concern."
      });
    }

    return {
      items: tensions,
      level:
        tensions.length >= 3
          ? "high"
          : tensions.length >= 1
          ? "moderate"
          : "low"
    };
  },

  detectRootNeed({ text = "", life = {}, patterns = {}, values = {}, conflicts = {}, executive = {} } = {}) {
    if (life.fatherhood || values.dominantValue === "family") {
      return {
        name: "secure_family_presence",
        description: "The user may need reassurance that family presence is being protected."
      };
    }

    if (patterns.burnoutRisk || executive.primaryPriority?.name === "capacity-protection") {
      return {
        name: "recovery_and_capacity",
        description: "The user may need reduced load and protected recovery."
      };
    }

    if (conflicts.conflictIntensity === "critical") {
      return {
        name: "clarity_and_prioritization",
        description: "The user may need help reducing competing demands into one clear priority."
      };
    }

    if (values.values?.includes("stability")) {
      return {
        name: "stability",
        description: "The user may need steadiness before adding more ambition."
      };
    }

    return {
      name: "understanding",
      description: "The user may need more understanding before action."
    };
  },

  detectProtecting({ text = "", life = {}, values = {}, identity = {}, executive = {} } = {}) {
    if (life.fatherhood || identity.dominantIdentity?.name === "father") {
      return {
        name: "future_family",
        description: "The user appears to be protecting their future family."
      };
    }

    if (values.values?.includes("creation") || text.includes("ari")) {
      return {
        name: "creative_purpose",
        description: "The user appears to be protecting a meaningful creative mission."
      };
    }

    if (values.values?.includes("growth") || text.includes("pmhnp")) {
      return {
        name: "future_self",
        description: "The user appears to be protecting their future growth."
      };
    }

    if (executive.primaryPriority?.name) {
      return {
        name: executive.primaryPriority.name,
        description: `The user appears to be protecting ${executive.primaryPriority.name}.`
      };
    }

    return {
      name: "meaning",
      description: "The user appears to be protecting something meaningful."
    };
  },

  chooseRegulation({ surfaceEmotion = {}, underlyingEmotion = {}, emotionalTension = {}, rootNeed = {}, patterns = {}, conflicts = {} } = {}) {
    if (
      surfaceEmotion.name === "overwhelm" ||
      underlyingEmotion.name === "depleted_capacity" ||
      patterns.burnoutRisk
    ) {
      return {
        strategy: "reduce_load",
        languageGuidance:
          "Use short sentences. Reduce cognitive load. Do not over-explain."
      };
    }

    if (
      underlyingEmotion.name === "anticipatory_guilt" ||
      underlyingEmotion.name === "fear_of_failing_family"
    ) {
      return {
        strategy: "normalize_and_ground",
        languageGuidance:
          "Normalize the fear, separate love from guilt, and give one grounding next step."
      };
    }

    if (emotionalTension.level === "high") {
      return {
        strategy: "name_the_tension",
        languageGuidance:
          "Name both sides of the tension without forcing a premature answer."
      };
    }

    if (conflicts.conflictIntensity === "critical") {
      return {
        strategy: "slow_down_and_prioritize",
        languageGuidance:
          "Slow the user down, name what is at stake, then identify one priority."
      };
    }

    return {
      strategy: "reflect_and_clarify",
      languageGuidance:
        "Reflect the emotional meaning and clarify the next wise move."
    };
  }
};