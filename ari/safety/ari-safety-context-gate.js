// ari/safety/ari-safety-context-gate.js
// Ari Safety Context Gate
// Purpose: Detect true safety/medical urgency from context, not single words.
// V2.0.0
// Upgrades:
// - Signal detection separated from risk decision.
// - Adds negation detection: no bleeding, denies bleeding, not bleeding.
// - Adds advisory/elevated/urgent/critical scoring.
// - Prevents pregnancy/body terms from auto-escalating.
// - Keeps same public output fields so pipeline does not need new files.

window.Ari = window.Ari || {};

window.AriSafetyContextGate = {
  version: "2.0.0",

  evaluate(input = {}) {
    const summary = input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const text = this.normalize(rawText);
    const observations = summary.observations || summary.observationLedger || [];

    const gate = {
      safetyContextGateRan: true,
      safetyContextGateVersion: this.version,
      source: "ari-safety-context-gate",

      override: null,
      riskLevel: "none",
      riskType: "none",
      followUpNeeded: false,
      followUpType: null,
      followUpQuestion: null,

      evidence: [],
      reasons: [],

      shouldStopNormalResponse: false,
      shouldUseSafetyResponse: false,
      shouldUseMedicalResponse: false,
      shouldAskRiskClarification: false,

      debug: {
        signals: {},
        negatedSignals: [],
        context: {},
        riskScore: 0,
        confidence: 0,
        decision: "none"
      }
    };

    const context = this.getContext(text, observations);
    const signals = this.getSignals(text);
    const scored = this.scoreRisk(text, context, signals);

    gate.debug.context = context;
    gate.debug.signals = signals;
    gate.debug.negatedSignals = signals.negatedSignals || [];
    gate.debug.riskScore = scored.score;
    gate.debug.confidence = scored.confidence;
    gate.debug.decision = scored.decision;

    this.applyDecision(gate, scored);

    return gate;
  },

  getSignals(text = "") {
    const signal = (name, terms = []) => {
      const matched = terms.find(term => this.hasPhrase(text, term));
      const negated = matched ? this.isNegated(text, matched) : false;

      return {
        present: !!matched && !negated,
        rawPresent: !!matched,
        negated,
        evidence: matched || null
      };
    };

    const signals = {
      selfHarmIntent: signal("selfHarmIntent", [
        "i am going to kill myself",
        "i'm going to kill myself",
        "i will kill myself",
        "i want to kill myself",
        "i'm going to end my life",
        "i am going to end my life",
        "i can't stay safe",
        "i cant stay safe"
      ]),

      selfHarmLanguage: signal("selfHarmLanguage", [
        "kill myself",
        "hurt myself",
        "self harm",
        "self-harm",
        "end my life",
        "take my life",
        "can't stay safe",
        "cant stay safe",
        "suicide"
      ]),

      overdose: signal("overdose", [
        "overdose",
        "took a bunch of pills",
        "took too many pills",
        "too much medication",
        "poison"
      ]),

      violence: signal("violence", [
        "hurt someone",
        "kill someone",
        "attack",
        "shoot",
        "stab",
        "weapon",
        "gun",
        "knife"
      ]),

      abuseDanger: signal("abuseDanger", [
        "unsafe at home",
        "violence at home",
        "threatened me",
        "threatening me",
        "assault",
        "abuse"
      ]),

      pregnant: signal("pregnant", [
        "pregnant",
        "pregnancy"
      ]),

      rectalPain: signal("rectalPain", [
        "rectal pain",
        "butt pain",
        "anus pain",
        "hemorrhoid pain"
      ]),

      pain: signal("pain", [
        "severe pain",
        "bad pain",
        "pain"
      ]),

      chestPain: signal("chestPain", [
        "chest pain",
        "chest pressure"
      ]),

      breathingTrouble: signal("breathingTrouble", [
        "trouble breathing",
        "can't breathe",
        "cant breathe",
        "shortness of breath"
      ]),

      fainting: signal("fainting", [
        "fainting",
        "passed out",
        "lost consciousness"
      ]),

      seizure: signal("seizure", [
        "seizure"
      ]),

      strokeSymptoms: signal("strokeSymptoms", [
        "stroke symptoms",
        "face drooping",
        "one sided weakness",
        "slurred speech",
        "weakness",
        "numbness"
      ]),

      bleeding: signal("bleeding", [
        "heavy bleeding",
        "bleeding",
        "blood"
      ]),

      fever: signal("fever", [
        "fever",
        "high fever"
      ]),

      dehydration: signal("dehydration", [
        "dehydrated",
        "can't keep fluids down",
        "cant keep fluids down"
      ]),

      pregnancyRedFlag: signal("pregnancyRedFlag", [
        "contractions",
        "fluid leakage",
        "decreased fetal movement",
        "severe abdominal pain",
        "vaginal bleeding"
      ])
    };

    signals.negatedSignals = Object.entries(signals)
      .filter(([key, value]) => value && value.negated)
      .map(([key]) => key);

    return signals;
  },

  getContext(text, observations = []) {
  const has = terms => terms.some(term => this.hasPhrase(text, term));

  return {
    historical: has([
      "yesterday",
      "last week",
      "last month",
      "two weeks ago",
      "years ago",
      "last year",
      "history of",
      "used to",
      "was admitted",
      "was monitored",
      "was evaluated",
      "after decreased fetal movement",
      "after monitoring",
      "committed suicide",
"died by suicide",
"attempted suicide",
"suicide attempt",
"went to the hospital",
"was hospitalized",
"was taken to the hospital"
    ]),

    stabilizedOrResolved: has([
      "stable now",
      "she's stable now",
      "he's stable now",
      "im stable now",
      "i'm stable now",
      "already evaluated",
      "already checked",
      "already seen",
      "already admitted",
      "already monitored",
      "being monitored",
      "was monitored",
      "was admitted",
      "was evaluated",
      "doctor said",
      "doctor says",
      "cleared",
      "discharged",
      "resolved",
      "improving",
      "better now",
      "no longer happening",
      "not happening anymore",
      "symptoms stopped",
      "they said she is okay",
      "they said she's okay",
      "they said he is okay",
      "they said he's okay",
      "went to the hospital",
"was hospitalized",
"was taken to the hospital",
"got help",
"got treatment",
"is safe now",
"safe now",
"they are safe now",
"he is safe now",
"she is safe now"
    ]),

    unresolvedOrWorsening: has([
      "right now",
      "currently",
      "still happening",
      "still having",
      "getting worse",
      "worsening",
      "rapidly worsening",
      "not improving",
      "hasn't stopped",
      "has not stopped",
      "won't stop",
      "cant stop",
      "can't stop",
      "no doctor yet",
      "haven't been seen",
      "have not been seen",
      "not evaluated",
      "not checked",
      "refuses care",
      "might do it again",
"will do it again",
"talking about doing it again",
"has a plan",
"has access to",
"has a weapon",
"won't answer",
"missing",
"can't reach him",
"can't reach her",
"not safe now",
"is not safe now",
"unsafe now"
    ]),

    current: has([
      "now",
      "right now",
      "currently",
      "today",
      "tonight",
      "this morning",
      "this afternoon",
      "happening now",
      "having",
      "has been having"
    ]),

    future: has([
      "tomorrow",
      "next week",
      "next month",
      "soon",
      "planning to",
      "going to"
    ]),

    self: /\b(i|me|my|myself)\b/.test(text),

    closeOther: /\b(my wife|my husband|my partner|my girlfriend|my boyfriend|my fiancé|my fiance|my dad|my mom|my child|my baby|my son|my daughter)\b/.test(text),

    fictionalOrReference: has([
      "suicide squad",
      "suicide boys",
      "$uicideboy$",
      "song",
      "movie",
      "band",
      "album",
      "character",
      "book",
      "quote",
      "lyrics",
      "game"
    ]),

    educational:
      /^(what is|what are|who is|explain|define|have you heard|do you know|is .* about)\b/.test(text),

    worryOrDecision: has([
      "worried",
      "concerned",
      "should i",
      "what should",
      "do i need",
      "is this serious"
    ]),

    observations
  };
},

  scoreRisk(text, context, signals) {
    let score = 0;
    let confidence = 40;
    let riskType = "none";
    const evidence = [];
    const reasons = [];

    const add = (points, type, ev, reason) => {
      score += points;
      riskType = type || riskType;
      if (ev) evidence.push(ev);
      if (reason) reasons.push(reason);
    };

    if (context.fictionalOrReference || context.educational) {
      score -= 50;
      confidence += 20;
      reasons.push("Risk language appears fictional, educational, quoted, or referential.");
    }

    if (context.historical && !context.current) {
      score -= 25;
      confidence += 10;
      reasons.push("Past-time language suggests context rather than active emergency.");
    }

if (context.stabilizedOrResolved && !context.unresolvedOrWorsening) {
  score -= 60;
  confidence += 20;
  reasons.push(
    "High-risk language appears medically evaluated, stabilized, resolved, or already under care."
  );
}

    if ((context.current && !context.stabilizedOrResolved) || context.closeOther || context.self) {
  confidence += 15;
}

    if (signals.selfHarmIntent.present) {
      add(100, "safety", signals.selfHarmIntent.evidence, "Active self-harm intent or inability to stay safe detected.");
    } else if (signals.selfHarmLanguage.present && context.current) {
      add(55, "safety", signals.selfHarmLanguage.evidence, "Current self-harm-related language needs clarification.");
    }

    if (signals.overdose.present) {
      add(95, "substance", signals.overdose.evidence, "Possible overdose or poisoning language detected.");
    }

    if (signals.violence.present && context.current) {
      add(65, "violence", signals.violence.evidence, "Possible current violence risk language detected.");
    }

    if (signals.abuseDanger.present && context.current) {
      add(55, "abuse", signals.abuseDanger.evidence, "Possible current abuse or danger language detected.");
    }

    if (signals.chestPain.present) add(70, "medical", signals.chestPain.evidence, "Chest pain can indicate urgent medical risk.");
    if (signals.breathingTrouble.present) add(75, "medical", signals.breathingTrouble.evidence, "Breathing difficulty can indicate urgent medical risk.");
    if (signals.fainting.present) add(65, "medical", signals.fainting.evidence, "Fainting/loss of consciousness can indicate urgent medical risk.");
    if (signals.seizure.present) add(75, "medical", signals.seizure.evidence, "Seizure language can indicate urgent medical risk.");
    if (signals.strokeSymptoms.present) add(80, "medical", signals.strokeSymptoms.evidence, "Stroke-like symptoms can indicate urgent medical risk.");
    if (signals.pregnancyRedFlag.present) add(75, "medical", signals.pregnancyRedFlag.evidence, "Pregnancy red-flag symptom detected.");

    if (signals.pregnant.present) {
      add(12, "medical", signals.pregnant.evidence, "Pregnancy is medically relevant context.");
    }

    if (signals.rectalPain.present) {
      add(18, "medical", signals.rectalPain.evidence, "Rectal pain is a body symptom but not automatically an emergency.");
    } else if (signals.pain.present) {
      add(18, "medical", signals.pain.evidence, "Pain is a body symptom but needs severity/context.");
    }

    if (signals.bleeding.present) {
      add(35, "medical", signals.bleeding.evidence, "Bleeding is a medical risk signal.");
    }

    if (signals.fever.present) add(25, "medical", signals.fever.evidence, "Fever may increase medical concern.");
    if (signals.dehydration.present) add(35, "medical", signals.dehydration.evidence, "Dehydration can increase medical concern.");

    if (signals.negatedSignals.length) {
      score -= signals.negatedSignals.length * 12;
      reasons.push(`Negated risk signals detected: ${signals.negatedSignals.join(", ")}.`);
    }

    if (context.worryOrDecision) {
      confidence += 8;
      reasons.push("User is asking for decision support around possible risk.");
    }

    score = Math.max(0, Math.min(100, score));
    confidence = Math.max(0, Math.min(100, confidence));

    let decision = "none";
    let riskLevel = "none";
    let override = null;

    if (score >= 90) {
      decision = "critical";
      riskLevel = "critical";
      override = riskType === "safety" || riskType === "violence" ? "safety_emergency" : "medical_urgent";
    } else if (score >= 70) {
      decision = "urgent";
      riskLevel = "high";
      override = riskType === "medical" || riskType === "substance" ? "medical_urgent" : "clarify_risk";
    } else if (score >= 45) {
      decision = "elevated";
      riskLevel = "moderate";
      override = "clarify_risk";
    } else if (score >= 15) {
      decision = "advisory";
      riskLevel = "context";
      override = null;
    }

    return {
      score,
      confidence,
      decision,
      riskLevel,
      riskType,
      override,
      evidence,
      reasons
    };
  },

  applyDecision(gate, scored) {
    gate.riskLevel = scored.riskLevel || "none";
    gate.riskType = scored.riskType || "none";
    gate.evidence.push(...scored.evidence);
    gate.reasons.push(...scored.reasons);

    if (scored.override === "safety_emergency") {
      gate.override = "safety_emergency";
      gate.shouldStopNormalResponse = true;
      gate.shouldUseSafetyResponse = true;
      gate.shouldUseMedicalResponse = false;
      gate.shouldAskRiskClarification = false;
      return;
    }

    if (scored.override === "medical_urgent") {
      gate.override = "medical_urgent";
      gate.shouldStopNormalResponse = true;
      gate.shouldUseSafetyResponse = false;
      gate.shouldUseMedicalResponse = true;
      gate.shouldAskRiskClarification = false;
      return;
    }

    if (scored.override === "clarify_risk") {
      gate.override = "clarify_risk";
      gate.followUpNeeded = true;
      gate.followUpType = "risk_clarification";
      gate.shouldStopNormalResponse = false;
      gate.shouldUseSafetyResponse = false;
      gate.shouldUseMedicalResponse = false;
      gate.shouldAskRiskClarification = true;

      if (scored.riskType === "medical") {
        gate.followUpQuestion = "Is she having severe pain, heavy bleeding, fainting, fever, trouble breathing, or anything rapidly worsening right now?";
      } else {
        gate.followUpQuestion = "Is anyone in immediate danger right now?";
      }

      gate.reasons.push("Risk is elevated but not certain, so Ari should ask one clarifying question instead of over-escalating.");
      return;
    }

    if (scored.decision === "advisory") {
      gate.override = null;
      gate.shouldStopNormalResponse = false;
      gate.shouldUseSafetyResponse = false;
      gate.shouldUseMedicalResponse = false;
      gate.shouldAskRiskClarification = false;
      gate.reasons.push("Medical/safety context detected, but not enough for urgent override.");
    }
  },

  isNegated(text = "", phrase = "") {
    if (!phrase) return false;

    const escaped = this.escapeRegex(phrase);

    const negationPattern = new RegExp(
      `\\b(no|not|without|denies|denied|isn't|isnt|wasn't|wasnt|aren't|arent|never)\\s+(?:\\w+\\s+){0,3}${escaped}\\b`,
      "i"
    );

    return negationPattern.test(text);
  },

  hasPhrase(text, phrase) {
    const escaped = this.escapeRegex(phrase);
    return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};