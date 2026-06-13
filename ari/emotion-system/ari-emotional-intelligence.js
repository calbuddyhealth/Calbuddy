// ari/emotion-system/ari-emotional-intelligence.js
// Ari Emotional Intelligence
// Purpose: Detect surface emotion, underlying emotion, emotional tension, root need,
// what the user is protecting, regulation, and communication style.
// V2.0

window.Ari = window.Ari || {};

window.Ari.emotionalIntelligence = {
  version: "2.0.0",

  analyze({
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    executive = {},
    insight = {},
    wisdom = {},
    lifeChapter = {},
    identityPriority = {},
    organism = {}
  } = {}) {
    const text = String(observation.normalizedMessage || observation.message || "").toLowerCase();
    const emotion = observation.emotion || {};
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};

    const surfaceEmotion = this.detectSurfaceEmotion({ text, emotion, organism });
    const underlyingEmotion = this.detectUnderlyingEmotion({
      text,
      life,
      patterns,
      conflicts,
      insight,
      wisdom,
      lifeChapter,
      identityPriority
    });

    const emotionalTension = this.detectEmotionalTension({
      text,
      surfaceEmotion,
      underlyingEmotion,
      values,
      identity,
      conflicts,
      wisdom
    });

    const rootNeed = this.detectRootNeed({
      text,
      life,
      patterns,
      values,
      conflicts,
      executive,
      lifeChapter,
      organism
    });

    const protecting = this.detectProtecting({
      text,
      life,
      values,
      identity,
      executive,
      wisdom,
      lifeChapter,
      identityPriority
    });

    const emotionalClassification = this.determineEmotionalClassification({
      surfaceEmotion,
      underlyingEmotion,
      rootNeed,
      protecting,
      values,
      conflicts,
      wisdom,
      lifeChapter
    });

    const primaryEmotion = this.determinePrimaryEmotion({
      surfaceEmotion,
      underlyingEmotion,
      emotionalClassification
    });

    const integratedValue = this.determineIntegratedValue({
      rootNeed,
      protecting,
      values,
      wisdom,
      lifeChapter,
      emotionalClassification
    });

    const regulation = this.chooseRegulation({
      surfaceEmotion,
      underlyingEmotion,
      emotionalTension,
      rootNeed,
      patterns,
      conflicts,
      emotionalClassification,
      organism
    });

    const communicationStyle = this.chooseCommunicationStyle({
      primaryEmotion,
      emotionalClassification,
      rootNeed,
      regulation,
      emotionalTension
    });

    return {
      surfaceEmotion,
      underlyingEmotion,
      emotionalTension,
      rootNeed,
      protecting,
      regulation,

      primaryEmotion,
      integratedValue,
      emotionalClassification,
      communicationStyle,

      emotionEngineVersion: this.version,
      source: "ari-emotional-intelligence"
    };
  },

  has(text = "", phrases = []) {
    return phrases.some(p => text.includes(p));
  },

  detectSurfaceEmotion({ text = "", emotion = {}, organism = {} } = {}) {
    const signals = emotion.signals || [];

    if (
      organism.organismNeedsStabilization ||
      this.has(text, ["pain", "dizzy", "sick", "can't breathe", "chest pain", "severe pain"])
    ) {
      return {
        name: "body_alarm",
        confidence: "high",
        description: "The user's body or safety system may need attention before emotional interpretation."
      };
    }

    if (signals.includes("stewardship")) {
      return {
        name: "stewardship",
        confidence: "high",
        description: "The user appears focused on responsibility and protecting what matters."
      };
    }

    if (signals.includes("concern")) {
      return {
        name: "concern",
        confidence: "high",
        description: "The user appears worried or aware that something may be at risk."
      };
    }

    if (signals.includes("compassion")) {
      return {
        name: "hurt",
        confidence: "medium",
        description: "The user may be expressing emotional pain or vulnerability."
      };
    }

    if (signals.includes("determination")) {
      return {
        name: "determination",
        confidence: "medium",
        description: "The user appears motivated to keep moving forward."
      };
    }

    if (this.has(text, ["lonely", "alone", "abandoned", "left me", "rejected", "ignored"])) {
      return {
        name: "loneliness",
        confidence: "high",
        description: "The user appears to feel disconnected, abandoned, or emotionally alone."
      };
    }

    if (this.has(text, ["ashamed", "embarrassed", "humiliated", "worthless", "not good enough"])) {
      return {
        name: "shame",
        confidence: "high",
        description: "The user appears to feel exposed, inadequate, or diminished."
      };
    }

    if (this.has(text, ["guilty", "my fault", "i failed", "let them down"])) {
      return {
        name: "guilt",
        confidence: "high",
        description: "The user appears to feel responsible for possibly falling short."
      };
    }

    if (this.has(text, ["terrified", "scared", "afraid", "panic", "worried"])) {
      return {
        name: "fear",
        confidence: "high",
        description: "The user appears afraid of a possible outcome."
      };
    }

    if (this.has(text, ["overwhelmed", "exhausted", "burned out", "too much", "can't keep up"])) {
      return {
        name: "overwhelm",
        confidence: "high",
        description: "The user appears overloaded or near capacity."
      };
    }

    if (this.has(text, ["grief", "miss them", "died", "death", "gone", "lost someone"])) {
      return {
        name: "grief",
        confidence: "high",
        description: "The user appears to be carrying loss."
      };
    }

    if (this.has(text, ["what's the point", "nothing matters", "meaningless", "empty", "why bother"])) {
      return {
        name: "meaning_loss",
        confidence: "high",
        description: "The user appears disconnected from meaning or motivation."
      };
    }

    if (this.has(text, ["excited", "happy", "proud", "i did it", "passed"])) {
      return {
        name: "positive_activation",
        confidence: "medium",
        description: "The user is expressing positive emotional energy."
      };
    }

    return {
      name: "curiosity",
      confidence: "low",
      description: "No strong surface emotion detected."
    };
  },

  detectUnderlyingEmotion({
    text = "",
    life = {},
    patterns = {},
    conflicts = {},
    insight = {},
    wisdom = {},
    lifeChapter = {},
    identityPriority = {}
  } = {}) {
    const primaryConflict = conflicts.primaryConflict?.name || "";
    const hiddenConflict = insight.hiddenConflict?.name || "";
    const chapter = lifeChapter.primaryLifeChapter || "";
    const leadIdentity = identityPriority.leadIdentity || "";

    if (this.has(text, ["alone", "lonely", "abandoned", "rejected", "left me", "ignored"])) {
      return {
        name: "fear_of_being_unwanted",
        confidence: "high",
        description: "The deeper emotion may be fear of not mattering or not being chosen."
      };
    }

    if (this.has(text, ["ashamed", "worthless", "not good enough", "failure", "useless"])) {
      return {
        name: "fear_of_not_being_enough",
        confidence: "high",
        description: "The deeper emotion may be fear that failure says something permanent about worth."
      };
    }

    if (this.has(text, ["guilty", "let them down", "my fault", "failed them"])) {
      return {
        name: "anticipatory_guilt",
        confidence: "high",
        description: "The user may be feeling guilt before the event has even fully happened."
      };
    }

    if (
      life.fatherhood ||
      chapter === "family_parenthood_chapter" ||
      leadIdentity === "family-protector"
    ) {
      return {
        name: "fear_of_failing_family",
        confidence: "high",
        description: "The user may fear failing the people who matter most."
      };
    }

    if (
      patterns.burnoutRisk ||
      chapter === "capacity_burnout_chapter" ||
      this.has(text, ["exhausted", "burned out", "too much", "can't keep up"])
    ) {
      return {
        name: "depleted_capacity",
        confidence: "high",
        description: "The user may not just be stressed; they may be running low on capacity."
      };
    }

    if (
      chapter === "meaning_crisis_chapter" ||
      this.has(text, ["nothing matters", "meaningless", "empty", "why bother"])
    ) {
      return {
        name: "loss_of_meaning",
        confidence: "high",
        description: "The user may be disconnected from the meaning that used to organize effort."
      };
    }

    if (
      chapter === "uncertainty_transition_chapter" ||
      this.has(text, ["don't know", "uncertain", "can't decide", "stuck between", "which path"])
    ) {
      return {
        name: "fear_of_wrong_direction",
        confidence: "medium",
        description: "The user may fear choosing wrong or moving without enough clarity."
      };
    }

    if (
      chapter === "recovery_rebuilding_chapter" ||
      this.has(text, ["starting over", "rebuild", "fresh start", "second chance"])
    ) {
      return {
        name: "fear_rebuilding_will_not_work",
        confidence: "medium",
        description: "The user may be afraid that trying again will not be enough."
      };
    }

    if (
      chapter === "grief_loss_chapter" ||
      this.has(text, ["grief", "died", "death", "miss them", "gone"])
    ) {
      return {
        name: "love_with_nowhere_to_go",
        confidence: "high",
        description: "Grief may be love that no longer has the same place to land."
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
      hiddenConflict === "family_vs_purpose" ||
      wisdom.wisdomTension?.name === "family_vs_purpose"
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

  detectEmotionalTension({ text = "", surfaceEmotion = {}, underlyingEmotion = {}, values = {}, identity = {}, conflicts = {}, wisdom = {} } = {}) {
    const tensions = [];

    if (this.has(text, ["part of me", "another part of me", "one part of me"])) {
      tensions.push({
        name: "internal_parts_conflict",
        description: "Different parts of the user appear to want different things."
      });
    }

    if (values.values?.includes("family") && values.values?.includes("growth")) {
      tensions.push({
        name: "family_vs_growth",
        description: "The user may feel pulled between family presence and personal growth."
      });
    }

    if (values.values?.includes("family") && values.values?.includes("creation")) {
      tensions.push({
        name: "family_vs_creation",
        description: "The user may feel pulled between family presence and creative purpose."
      });
    }

    if (conflicts.primaryConflict?.name) {
      tensions.push({
        name: conflicts.primaryConflict.name,
        description: "A known conflict appears emotionally active."
      });
    }

    if (wisdom.wisdomTension?.name) {
      tensions.push({
        name: wisdom.wisdomTension.name,
        description: "A wisdom tension appears emotionally active."
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
      level: tensions.length >= 3 ? "high" : tensions.length >= 1 ? "moderate" : "low"
    };
  },

  detectRootNeed({ text = "", life = {}, patterns = {}, values = {}, conflicts = {}, executive = {}, lifeChapter = {}, organism = {} } = {}) {
    const chapter = lifeChapter.primaryLifeChapter || "";

    if (organism.organismNeedsStabilization || chapter === "body_health_chapter") {
      return {
        name: "body_stabilization",
        description: "The user may need body stabilization before emotional interpretation."
      };
    }

    if (chapter === "relationship_rupture_chapter") {
      return {
        name: "connection",
        description: "The user may need connection, reassurance, or relational grounding."
      };
    }

    if (life.fatherhood || values.dominantValue === "family" || chapter === "family_parenthood_chapter") {
      return {
        name: "secure_family_presence",
        description: "The user may need reassurance that family presence is being protected."
      };
    }

    if (patterns.burnoutRisk || executive.primaryPriority?.name === "capacity-protection" || chapter === "capacity_burnout_chapter") {
      return {
        name: "recovery_and_capacity",
        description: "The user may need reduced load and protected recovery."
      };
    }

    if (chapter === "uncertainty_transition_chapter") {
      return {
        name: "clarity",
        description: "The user may need enough clarity to move without requiring perfect certainty."
      };
    }

    if (chapter === "meaning_crisis_chapter") {
      return {
        name: "meaning",
        description: "The user may need reconnection to meaning before being pushed toward goals."
      };
    }

    if (chapter === "grief_loss_chapter") {
      return {
        name: "honored_grief",
        description: "The user may need grief to be honored before meaning is forced."
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

  detectProtecting({ text = "", life = {}, values = {}, identity = {}, executive = {}, wisdom = {}, lifeChapter = {}, identityPriority = {} } = {}) {
    const chapter = lifeChapter.primaryLifeChapter || "";
    const leadIdentity = identityPriority.leadIdentity || identity.dominantIdentity?.name || "";

    if (chapter === "body_health_chapter") {
      return { name: "body", description: "The user appears to be protecting body stability." };
    }

    if (chapter === "relationship_rupture_chapter") {
      return { name: "connection", description: "The user appears to be protecting connection and dignity." };
    }

    if (life.fatherhood || leadIdentity === "family-protector" || chapter === "family_parenthood_chapter") {
      return { name: "family", description: "The user appears to be protecting family and presence." };
    }

    if (chapter === "stewardship_chapter" || leadIdentity === "steward") {
      return { name: "responsibility", description: "The user appears to be protecting what has been entrusted to them." };
    }

    if (chapter === "capacity_burnout_chapter") {
      return { name: "capacity", description: "The user appears to be protecting energy, recovery, and follow-through." };
    }

    if (chapter === "meaning_crisis_chapter") {
      return { name: "meaning", description: "The user appears to be protecting meaning or a reason to continue." };
    }

    if (values.values?.includes("creation") || text.includes("ari")) {
      return { name: "creative_purpose", description: "The user appears to be protecting a meaningful creative mission." };
    }

    if (values.values?.includes("growth")) {
      return { name: "future_self", description: "The user appears to be protecting their future growth." };
    }

    if (executive.primaryPriority?.name) {
      return {
        name: executive.primaryPriority.name,
        description: `The user appears to be protecting ${executive.primaryPriority.name}.`
      };
    }

    if (wisdom.highestGood) {
      return {
        name: wisdom.highestGood,
        description: `The user appears to be protecting ${wisdom.highestGood}.`
      };
    }

    return {
      name: "meaning",
      description: "The user appears to be protecting something meaningful."
    };
  },

  determinePrimaryEmotion({ surfaceEmotion = {}, underlyingEmotion = {}, emotionalClassification = "unclear" } = {}) {
    if (emotionalClassification === "stewardship") return "stewardship";
    if (surfaceEmotion.name && surfaceEmotion.name !== "curiosity") return surfaceEmotion.name;
    if (underlyingEmotion.name && underlyingEmotion.name !== "unclear") return underlyingEmotion.name;
    return "curiosity";
  },

  determineIntegratedValue({ rootNeed = {}, protecting = {}, values = {}, wisdom = {}, lifeChapter = {}, emotionalClassification = "unclear" } = {}) {
    if (wisdom.highestGood) return wisdom.highestGood;
    if (protecting.name) return protecting.name;
    if (values.dominantValue) return values.dominantValue;
    if (rootNeed.name) return rootNeed.name;
    if (emotionalClassification === "stewardship") return "responsibility";
    if (lifeChapter.primaryLifeChapter === "meaning_crisis_chapter") return "meaning";
    return "understanding";
  },

  determineEmotionalClassification({ surfaceEmotion = {}, underlyingEmotion = {}, rootNeed = {}, protecting = {}, values = {}, conflicts = {}, wisdom = {}, lifeChapter = {} } = {}) {
    const chapter = lifeChapter.primaryLifeChapter || "";

    if (surfaceEmotion.name === "body_alarm" || rootNeed.name === "body_stabilization") return "body_stabilization";
    if (surfaceEmotion.name === "loneliness" || chapter === "relationship_rupture_chapter") return "connection_pain";
    if (surfaceEmotion.name === "shame" || underlyingEmotion.name === "fear_of_not_being_enough") return "worth_pain";
    if (surfaceEmotion.name === "grief" || chapter === "grief_loss_chapter") return "grief";
    if (surfaceEmotion.name === "meaning_loss" || chapter === "meaning_crisis_chapter") return "meaning_loss";
    if (surfaceEmotion.name === "overwhelm" || rootNeed.name === "recovery_and_capacity") return "capacity_overload";

    if (
      surfaceEmotion.name === "stewardship" ||
      protecting.name === "responsibility" ||
      values.values?.includes("responsibility") ||
      wisdom.highestGood === "protect_family"
    ) {
      return "stewardship";
    }

    if (surfaceEmotion.name === "fear") return "fear";
    if (surfaceEmotion.name === "guilt") return "guilt";
    if (surfaceEmotion.name === "positive_activation") return "positive_activation";

    if (conflicts.conflictIntensity === "critical") return "high_conflict";

    return "unclear";
  },

  chooseRegulation({ surfaceEmotion = {}, underlyingEmotion = {}, emotionalTension = {}, rootNeed = {}, patterns = {}, conflicts = {}, emotionalClassification = "unclear", organism = {} } = {}) {
    if (
      organism.organismNeedsStabilization ||
      emotionalClassification === "body_stabilization"
    ) {
      return {
        strategy: "stabilize_body_first",
        languageGuidance:
          "Use calm, practical language. Do not interpret emotionally until the body is stabilized."
      };
    }

    if (
      surfaceEmotion.name === "overwhelm" ||
      underlyingEmotion.name === "depleted_capacity" ||
      emotionalClassification === "capacity_overload" ||
      patterns.burnoutRisk
    ) {
      return {
        strategy: "reduce_load",
        languageGuidance:
          "Use short sentences. Reduce cognitive load. Do not over-explain."
      };
    }

    if (emotionalClassification === "connection_pain") {
      return {
        strategy: "restore_connection",
        languageGuidance:
          "Lead with warmth. Do not over-question. Reflect loneliness without making it the whole truth."
      };
    }

    if (emotionalClassification === "worth_pain") {
      return {
        strategy: "restore_dignity",
        languageGuidance:
          "Protect dignity. Separate worth from outcome. Avoid lectures."
      };
    }

    if (emotionalClassification === "grief") {
      return {
        strategy: "honor_grief",
        languageGuidance:
          "Honor loss. Do not rush meaning, fixing, or action."
      };
    }

    if (emotionalClassification === "meaning_loss") {
      return {
        strategy: "restore_meaning",
        languageGuidance:
          "Move gently. Restore connection to meaning before pushing motivation."
      };
    }

    if (emotionalClassification === "stewardship") {
      return {
        strategy: "support_stewardship",
        languageGuidance:
          "Treat responsibility as meaningful. Do not mislabel it as fear too quickly."
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
  },

  chooseCommunicationStyle({ primaryEmotion = "curiosity", emotionalClassification = "unclear", rootNeed = {}, regulation = {}, emotionalTension = {} } = {}) {
    if (regulation.strategy === "stabilize_body_first") {
      return {
        warmth: "calm",
        directness: "high",
        depth: "low",
        pace: "slow",
        questionStyle: "minimal"
      };
    }

    if (emotionalClassification === "connection_pain") {
      return {
        warmth: "high",
        directness: "low",
        depth: "medium",
        pace: "slow",
        questionStyle: "gentle"
      };
    }

    if (emotionalClassification === "worth_pain") {
      return {
        warmth: "high",
        directness: "medium",
        depth: "medium",
        pace: "slow",
        questionStyle: "dignity-restoring"
      };
    }

    if (emotionalClassification === "capacity_overload") {
      return {
        warmth: "medium",
        directness: "high",
        depth: "low",
        pace: "slow",
        questionStyle: "one-step"
      };
    }

    if (emotionalClassification === "stewardship") {
      return {
        warmth: "medium",
        directness: "medium",
        depth: "medium",
        pace: "steady",
        questionStyle: "responsibility-focused"
      };
    }

    if (emotionalTension.level === "high") {
      return {
        warmth: "medium",
        directness: "medium",
        depth: "high",
        pace: "slow",
        questionStyle: "tension-clarifying"
      };
    }

    return {
      warmth: "medium",
      directness: "medium",
      depth: "medium",
      pace: "steady",
      questionStyle: "clarifying"
    };
  }
};