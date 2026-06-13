// ari/meaning/ari-life-chapter-engine.js
// Ari Life Chapter Engine
// Purpose: Detect universal life chapters without overfitting to one person's life.
// V2.0

window.AriLifeChapterEngine = {
  version: "2.0.0",

  detect(input = {}) {
    const summary = input.summary || input || {};

    const rawText = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const signals = this.collectSignals(summary);
    const candidates = [];

    const add = (name, score, reason, question, focus) => {
      if (!name) return;

      const existing = candidates.find(c => c.name === name);

      if (existing) {
        if (reason && !existing.reasons.includes(reason)) {
          existing.score += score;
          existing.reasons.push(reason);
        }
        existing.score = this.cap(existing.score);
        return;
      }

      candidates.push({
        name,
        score: this.cap(score),
        reasons: reason ? [reason] : [],
        question,
        focus
      });
    };

    const domains = this.getUniversalDomains();

    domains.forEach(domain => {
      let score = 0;
      const reasons = [];

      const textHits = domain.text.some(term => rawText.includes(term));
      const signalHits = signals.some(signal =>
        domain.signals.some(term => signal.includes(term))
      );

      if (textHits) {
        score += domain.textWeight;
        reasons.push(`Text matches ${domain.name}.`);
      }

      if (signalHits) {
        score += domain.signalWeight;
        reasons.push(`System signals match ${domain.name}.`);
      }

      if (domain.shouldBoost?.(summary, rawText, signals)) {
        score += domain.boostWeight || 20;
        reasons.push(`Context boost supports ${domain.name}.`);
      }

      if (score > 0) {
        add(
          domain.name,
          score,
          reasons.join(" "),
          domain.question,
          domain.focus
        );
      }
    });

    this.applyTensionChapters(summary, rawText, signals, add);
    this.applyPriorityBoosts(summary, signals, candidates);

    if (candidates.length === 0) {
      add(
        "unclear_chapter",
        50,
        "No clear life chapter was detected.",
        "What feels different about this season of life?",
        "Continue observing before naming the chapter."
      );
    }

    candidates.forEach(c => c.score = this.cap(c.score));
    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];

    return {
      primaryLifeChapter: winner.name,
      lifeChapterStrength: winner.score,
      lifeChapterStatement:
        winner.name === "unclear_chapter"
          ? "Ari does not have enough evidence to identify the life chapter cleanly."
          : `The strongest life chapter appears to be '${winner.name}'.`,
      lifeChapterQuestion: winner.question,
      lifeChapterFocus: winner.focus,

      rankedLifeChapters: candidates.map(c => ({
        name: c.name,
        score: c.score,
        focus: c.focus,
        question: c.question,
        reasons: c.reasons
      })),

      lifeChapterScoreNormalization: {
        maxScore: 120,
        detectedDomains: candidates.map(c => c.name),
        directSignals: signals,
        source: "ari-life-chapter-engine-normalization"
      },

      source: "ari-life-chapter-engine"
    };
  },

  getUniversalDomains() {
    return [
      {
        name: "body_health_chapter",
        textWeight: 90,
        signalWeight: 90,
        boostWeight: 25,
        text: ["pain", "dizzy", "sick", "fever", "sleep", "hungry", "dehydrated", "chest pain", "can't breathe"],
        signals: ["body", "health", "sleep", "food", "hydration", "vital", "pain"],
        question: "What does your body need before anything else?",
        focus: "Stabilize the body before deeper interpretation.",
        shouldBoost: s => s.primaryHumanNeed === "body" || s.salienceLeadOrgan === "safety"
      },
      {
        name: "relationship_rupture_chapter",
        textWeight: 88,
        signalWeight: 82,
        text: ["left me", "broke up", "divorce", "separated", "alone", "lonely", "abandoned", "rejected"],
        signals: ["connection", "attachment", "relationship_rupture", "belonging"],
        question: "What part of this feels most alone right now?",
        focus: "Restore connection, dignity, and emotional stability."
      },
      {
        name: "family_parenthood_chapter",
        textWeight: 86,
        signalWeight: 84,
        text: ["baby", "pregnant", "father", "mother", "parent", "daughter", "son", "child", "family"],
        signals: ["fatherhood", "parenthood", "family_transition", "family"],
        question: "What does your family need from you in this season?",
        focus: "Protect family, presence, and stability."
      },
      {
        name: "career_transition_chapter",
        textWeight: 78,
        signalWeight: 78,
        text: ["job", "career", "interview", "military", "retire", "resign", "promotion", "new role", "work"],
        signals: ["career", "military_transition", "role_transition", "work"],
        question: "What future stability are you trying to protect?",
        focus: "Protect transition, competence, and long-term stability."
      },
      {
        name: "identity_transition_chapter",
        textWeight: 76,
        signalWeight: 82,
        text: ["who am i", "useless", "failure", "not enough", "identity", "lost", "becoming"],
        signals: ["identity", "worth", "self_concept", "role"],
        question: "Which part of your identity feels unstable right now?",
        focus: "Separate worth from performance and let identity adapt."
      },
      {
        name: "capacity_burnout_chapter",
        textWeight: 78,
        signalWeight: 80,
        text: ["overwhelmed", "burned out", "too much", "can't keep up", "exhausted", "breaking"],
        signals: ["capacity", "burnout", "overload", "stress"],
        question: "What demand needs to be reduced first?",
        focus: "Protect capacity before adding more responsibility."
      },
      {
        name: "grief_loss_chapter",
        textWeight: 82,
        signalWeight: 78,
        text: ["died", "death", "loss", "lost", "grief", "miss them", "gone"],
        signals: ["grief", "loss", "mourning"],
        question: "What part of this loss feels hardest to carry?",
        focus: "Honor grief before forcing meaning."
      },
      {
        name: "purpose_mission_chapter",
        textWeight: 70,
        signalWeight: 76,
        text: ["purpose", "mission", "calling", "build", "create", "future", "dream"],
        signals: ["purpose", "mission", "builder", "creative"],
        question: "What future are you trying to create?",
        focus: "Protect purpose without letting it consume the person."
      }
    ];
  },

  applyTensionChapters(summary, rawText, signals, add) {
    const tension = summary.wisdomTension || summary.apparentConflict || null;

    if (
      tension === "presence_vs_achievement" ||
      (rawText.includes("family") && rawText.includes("career"))
    ) {
      add(
        "presence_reordering_chapter",
        72,
        "Presence versus achievement tension detected.",
        "What moment of presence needs protection before achievement gets more attention?",
        "Put irreplaceable moments before replaceable milestones."
      );
    }

    if (
      tension === "worth_vs_performance" ||
      rawText.includes("if i fail") ||
      rawText.includes("useless")
    ) {
      add(
        "worth_separation_chapter",
        84,
        "Worth appears tied to performance.",
        "What would still be true about your worth even if this goes badly?",
        "Separate human worth from outcome."
      );
    }
  },

  applyPriorityBoosts(summary, signals, candidates) {
    const priority = summary.lifePriorityClass;
    const weighted = this.normalize(summary.primaryWeightedLifeSignal || "");

    if (priority !== "major_life_priority" || !weighted) return;

    candidates.forEach(c => {
      if (weighted.includes("father") && c.name === "family_parenthood_chapter") c.score += 24;
      if (weighted.includes("family") && c.name === "family_parenthood_chapter") c.score += 20;
      if (weighted.includes("career") && c.name === "career_transition_chapter") c.score += 20;
      c.score = this.cap(c.score);
    });
  },

  collectSignals(summary = {}) {
    const list = [];

    const push = value => {
      if (!value) return;
      if (typeof value === "string") list.push(this.normalize(value));
      if (Array.isArray(value)) value.forEach(push);
    };

    push(summary.strongestSignal);
    push(summary.primaryLifeSignal);
    push(summary.primaryWeightedLifeSignal);
    push(summary.primaryHumanNeed);
    push(summary.secondaryHumanNeed);
    push(summary.needResponseMode);
    push(summary.rootNeed);
    push(summary.primaryNeed);
    push(summary.dominantValue);
    push(summary.protecting);
    push(summary.highestGood);
    push(summary.wisdomTension);
    push(summary.apparentConflict);
    push(summary.primaryConflict);
    push(summary.dominantIdentity);
    push(summary.personPrimaryRole);
    push(summary.leadIdentity);
    push(summary.resolvedLeadIdentity);
    push(summary.organismNeed);
    push(summary.organismFunction);
    push(summary.organismPrimaryFunction);
    push(summary.lifeSignals);

    if (Array.isArray(summary.rankedSignals)) {
      summary.rankedSignals.forEach(s => push(s.name));
    }

    if (Array.isArray(summary.rankedSalience)) {
      summary.rankedSalience.forEach(s => push(s.name));
    }

    return [...new Set(list.filter(Boolean))];
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  cap(value, max = 120) {
    return Math.min(Number(value || 0), max);
  }
};