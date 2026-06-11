// ari/observer-system/ari-life-signal-extractor.js
// Ari Life Signal Extractor
// Purpose: Detect major life-chapter signals from raw user language.
// V1.0

window.Ari = window.Ari || {};

window.Ari.lifeSignalExtractor = {
  version: "1.0.0",

  extract(message = "", context = {}) {
    const text = String(message || "").toLowerCase();

    const signals = [];

    const add = (name, confidence, evidence = []) => {
      if (signals.some((item) => item.name === name)) return;

      signals.push({
        name,
        confidence,
        evidence
      });
    };

    // Family / fatherhood / pregnancy
    if (
      this.includesAny(text, [
        "daughter",
        "baby",
        "child",
        "kid",
        "father",
        "dad",
        "becoming a father",
        "born soon",
        "pregnant",
        "pregnancy",
        "fiancé",
        "fiance",
        "wife",
        "family"
      ])
    ) {
      add("family_transition", "high", ["family_or_parenthood_language"]);
    }

    if (
      this.includesAny(text, [
        "daughter",
        "baby",
        "becoming a father",
        "dad",
        "father",
        "born soon"
      ])
    ) {
      add("fatherhood_transition", "high", ["fatherhood_language"]);
    }

    // Military / separation / civilian transition
    if (
      this.includesAny(text, [
        "leaving the military",
        "leaving navy",
        "leaving the navy",
        "separating",
        "separation",
        "civilian",
        "veteran",
        "military transition",
        "navy",
        "marine",
        "marines",
        "orders",
        "resignation"
      ])
    ) {
      add("military_transition", "high", ["military_or_separation_language"]);
    }

    // Career / school / PMHNP
    if (
      this.includesAny(text, [
        "career",
        "job",
        "civilian job",
        "applying",
        "school",
        "degree",
        "pmhnp",
        "nurse practitioner",
        "graduate",
        "program",
        "resume",
        "usa jobs",
        "usajobs"
      ])
    ) {
      add("career_transition", "medium", ["career_or_school_language"]);
    }

    // Building / creation / Ari / CalBuddy
    if (
      this.includesAny(text, [
        "building ari",
        "build ari",
        "finish building ari",
        "ari",
        "calbuddy",
        "cal buddy",
        "app",
        "project",
        "code",
        "coding",
        "architecture",
        "component",
        "system",
        "engine"
      ])
    ) {
      add("creative_mission", "high", ["building_or_creation_language"]);
    }

    if (
      this.includesAny(text, [
        "purpose",
        "meaningful",
        "mission",
        "calling",
        "something meaningful",
        "built for",
        "worked for"
      ])
    ) {
      add("purpose_signal", "high", ["purpose_or_meaning_language"]);
    }

    // Rest / capacity / burnout
    if (
      this.includesAny(text, [
        "rest",
        "tired",
        "exhausted",
        "burned out",
        "burnout",
        "overwhelmed",
        "capacity",
        "sleep",
        "slow down",
        "slowing down",
        "take a break"
      ])
    ) {
      add("capacity_pressure", "high", ["rest_or_capacity_language"]);
    }

    // Momentum / urgency / falling behind
    if (
      this.includesAny(text, [
        "momentum",
        "fall behind",
        "falling behind",
        "lose progress",
        "lose momentum",
        "behind",
        "running out of time",
        "too late",
        "every free moment"
      ])
    ) {
      add("achievement_pressure", "high", ["momentum_or_pressure_language"]);
    }

    // Identity shift
    if (
      this.includesAny(text, [
        "who i am",
        "identity",
        "different chapter",
        "new chapter",
        "chapter of life",
        "becoming",
        "changing",
        "transition"
      ])
    ) {
      add("identity_transition", "high", ["identity_or_chapter_language"]);
    }

    // Fear / uncertainty / guilt
    if (
      this.includesAny(text, [
        "scared",
        "afraid",
        "fear",
        "worried",
        "anxious",
        "guilty",
        "guilt",
        "avoid",
        "avoiding",
        "not seeing"
      ])
    ) {
      add("emotional_threat", "medium", ["fear_or_guilt_language"]);
    }

    const primarySignal = this.choosePrimary(signals);

    return {
      signals,
      signalNames: signals.map((item) => item.name),
      primarySignal,
      hasMajorLifeSignal: signals.length > 0,
      source: "ari-life-signal-extractor"
    };
  },

  includesAny(text = "", terms = []) {
    return terms.some((term) => text.includes(term));
  },

  choosePrimary(signals = []) {
    if (!Array.isArray(signals) || signals.length === 0) {
      return null;
    }

    const priority = [
      "fatherhood_transition",
      "family_transition",
      "military_transition",
      "identity_transition",
      "creative_mission",
      "purpose_signal",
      "capacity_pressure",
      "achievement_pressure",
      "career_transition",
      "emotional_threat"
    ];

    return [...signals].sort((a, b) => {
      return priority.indexOf(a.name) - priority.indexOf(b.name);
    })[0];
  }
};