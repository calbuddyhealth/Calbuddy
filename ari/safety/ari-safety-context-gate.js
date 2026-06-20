// ari/safety/ari-safety-context-gate.js
// Ari Safety Context Gate
// Purpose: Detect true safety/medical urgency from context, not single words.
// V2.1.1
// Upgrades:
// - Signal detection separated from risk decision.
// - Adds negation detection: no bleeding, denies bleeding, not bleeding.
// - Adds advisory/elevated/urgent/critical scoring.
// - Prevents pregnancy/body terms from auto-escalating.
// - Keeps same public output fields so pipeline does not need new files.

window.Ari = window.Ari || {};

window.AriSafetyContextGate = {
  version: "2.1.1",

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
      primaryRisk: null,
risks: [],
      followUpNeeded: false,
      followUpType: null,
      followUpQuestion: null,
      safetyAuthority: "safety_gate_final",
allowSafetyOverride: false,
allowMedicalOverride: false,
allowRiskClarification: false,
safetyApprovedNormalFlow: true,
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
        decision: "none",
        riskRanking: [],
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
gate.debug.riskRanking = scored.risks || [];
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
  let confidence = 40;
  const risks = [];
  const globalReasons = [];

  const addRisk = ({ points, type, subtype, ev, reason }) => {
    if (!points || !type) return;

    const existing = risks.find(r => r.type === type && r.subtype === subtype);

    if (existing) {
      existing.score += points;
      if (ev) existing.evidence.push(ev);
      if (reason) existing.reasons.push(reason);
      return;
    }

    risks.push({
      type,
      subtype: subtype || type,
      score: points,
      level: "none",
      evidence: ev ? [ev] : [],
      reasons: reason ? [reason] : []
    });
  };

  if (context.fictionalOrReference || context.educational) {
    confidence += 20;
    globalReasons.push("Risk language appears fictional, educational, quoted, or referential.");
  }

  if (context.historical && !context.current) {
    confidence += 10;
    globalReasons.push("Past-time language suggests context rather than active emergency.");
  }

  if (context.stabilizedOrResolved && !context.unresolvedOrWorsening) {
    confidence += 20;
    globalReasons.push("High-risk language appears evaluated, stabilized, resolved, or already under care.");
  }

  if ((context.current && !context.stabilizedOrResolved) || context.closeOther || context.self) {
    confidence += 15;
  }

  if (signals.selfHarmIntent.present) {
    addRisk({
      points: 100,
      type: "self_harm",
      subtype: "active_intent",
      ev: signals.selfHarmIntent.evidence,
      reason: "Active self-harm intent or inability to stay safe detected."
    });
  } else if (signals.selfHarmLanguage.present && context.current) {
    addRisk({
      points: 55,
      type: "self_harm",
      subtype: "self_harm_language",
      ev: signals.selfHarmLanguage.evidence,
      reason: "Current self-harm-related language needs clarification."
    });
  }

  if (signals.overdose.present) {
    addRisk({
      points: 95,
      type: "poisoning_overdose",
      subtype: "possible_overdose_or_poisoning",
      ev: signals.overdose.evidence,
      reason: "Possible overdose or poisoning language detected."
    });
  }

  if (signals.violence.present && context.current) {
    addRisk({
      points: 65,
      type: "violence_to_others",
      subtype: "possible_current_violence",
      ev: signals.violence.evidence,
      reason: "Possible current violence risk language detected."
    });
  }

  if (signals.abuseDanger.present && context.current) {
    addRisk({
      points: 55,
      type: "abuse_or_domestic_danger",
      subtype: "possible_current_abuse_danger",
      ev: signals.abuseDanger.evidence,
      reason: "Possible current abuse or danger language detected."
    });
  }

  if (signals.chestPain.present) {
    addRisk({
      points: 70,
      type: "medical",
      subtype: "chest_pain",
      ev: signals.chestPain.evidence,
      reason: "Chest pain can indicate urgent medical risk."
    });
  }

  if (signals.breathingTrouble.present) {
    addRisk({
      points: 75,
      type: "medical",
      subtype: "breathing_trouble",
      ev: signals.breathingTrouble.evidence,
      reason: "Breathing difficulty can indicate urgent medical risk."
    });
  }

  if (signals.fainting.present) {
    addRisk({
      points: 65,
      type: "medical",
      subtype: "fainting",
      ev: signals.fainting.evidence,
      reason: "Fainting/loss of consciousness can indicate urgent medical risk."
    });
  }

  if (signals.seizure.present) {
    addRisk({
      points: 75,
      type: "medical",
      subtype: "seizure",
      ev: signals.seizure.evidence,
      reason: "Seizure language can indicate urgent medical risk."
    });
  }

  if (signals.strokeSymptoms.present) {
    addRisk({
      points: 80,
      type: "medical",
      subtype: "stroke_symptoms",
      ev: signals.strokeSymptoms.evidence,
      reason: "Stroke-like symptoms can indicate urgent medical risk."
    });
  }

  if (signals.pregnancyRedFlag.present) {
    addRisk({
      points: 75,
      type: "medical",
      subtype: "pregnancy_red_flag",
      ev: signals.pregnancyRedFlag.evidence,
      reason: "Pregnancy red-flag symptom detected."
    });
  }

  if (signals.pregnant.present) {
    addRisk({
      points: 12,
      type: "medical",
      subtype: "pregnancy_context",
      ev: signals.pregnant.evidence,
      reason: "Pregnancy is medically relevant context."
    });
  }

  if (signals.rectalPain.present) {
    addRisk({
      points: 18,
      type: "medical",
      subtype: "rectal_pain",
      ev: signals.rectalPain.evidence,
      reason: "Rectal pain is a body symptom but not automatically an emergency."
    });
  } else if (signals.pain.present) {
    addRisk({
      points: 18,
      type: "medical",
      subtype: "pain",
      ev: signals.pain.evidence,
      reason: "Pain is a body symptom but needs severity/context."
    });
  }

  if (signals.bleeding.present) {
    addRisk({
      points: 35,
      type: "medical",
      subtype: "bleeding",
      ev: signals.bleeding.evidence,
      reason: "Bleeding is a medical risk signal."
    });
  }

  if (signals.fever.present) {
    addRisk({
      points: 25,
      type: "medical",
      subtype: "fever",
      ev: signals.fever.evidence,
      reason: "Fever may increase medical concern."
    });
  }

  if (signals.dehydration.present) {
    addRisk({
      points: 35,
      type: "medical",
      subtype: "dehydration",
      ev: signals.dehydration.evidence,
      reason: "Dehydration can increase medical concern."
    });
  }

  const contextPenalty =
    (context.fictionalOrReference || context.educational ? 50 : 0) +
    (context.historical && !context.current ? 25 : 0) +
    (context.stabilizedOrResolved && !context.unresolvedOrWorsening ? 60 : 0) +
    ((signals.negatedSignals || []).length * 12);

  risks.forEach(risk => {
    risk.score = Math.max(0, Math.min(100, risk.score - contextPenalty));
    risk.level = this.levelFromScore(risk.score);
  });

  const priority = {
    critical: 5,
    high: 4,
    moderate: 3,
    context: 2,
    none: 1
  };

  const typePriority = {
    immediate_physical_danger: 100,
    self_harm: 95,
    violence_to_others: 90,
    poisoning_overdose: 88,
    medical: 85,
    child_or_dependent_safety: 82,
    abuse_or_domestic_danger: 75,
    driving_or_unsafe_operation: 70,
    environmental_danger: 68
  };

  risks.sort((a, b) => {
    const levelDiff = (priority[b.level] || 0) - (priority[a.level] || 0);
    if (levelDiff) return levelDiff;

    const typeDiff = (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
    if (typeDiff) return typeDiff;

    return b.score - a.score;
  });

  const primaryRisk = risks[0] || null;

  const score = primaryRisk?.score || 0;
  const riskLevel = primaryRisk?.level || "none";
  const riskType = primaryRisk?.type || "none";

  let decision = "none";
  let override = null;

  if (riskLevel === "critical") {
  decision = "critical";
  override = "emergency";
} else if (riskLevel === "high") {
  decision = "urgent";
  override = "urgent";
} else if (riskLevel === "moderate") {
  decision = "elevated";
  override = "clarify_risk";
} else if (riskLevel === "context") {
  decision = "advisory";
  override = null;
  }

  if (signals.negatedSignals.length) {
    globalReasons.push(`Negated risk signals detected: ${signals.negatedSignals.join(", ")}.`);
  }

  if (context.worryOrDecision) {
    confidence += 8;
    globalReasons.push("User is asking for decision support around possible risk.");
  }

  confidence = Math.max(0, Math.min(100, confidence));

  return {
    score,
    confidence,
    decision,
    riskLevel,
    riskType,
    override,
    evidence: primaryRisk?.evidence || [],
    reasons: [...(primaryRisk?.reasons || []), ...globalReasons],
    risks,
    primaryRisk
  };
},

levelFromScore(score = 0) {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "moderate";
  if (score >= 15) return "context";
  return "none";
},

  applyDecision(gate, scored) {
    gate.riskLevel = scored.riskLevel || "none";
    gate.riskType = scored.riskType || "none";
    gate.primaryRisk = scored.primaryRisk || null;
gate.risks = scored.risks || [];
    gate.evidence.push(...scored.evidence);
    gate.reasons.push(...scored.reasons);
gate.allowSafetyOverride = false;
gate.allowMedicalOverride = false;
gate.allowRiskClarification = false;
gate.safetyApprovedNormalFlow = true;
    
    if (scored.override === "emergency") {
  gate.override = "emergency";
  gate.shouldStopNormalResponse = true;
  gate.safetyApprovedNormalFlow = false;

  if (
  scored.primaryRisk?.type === "medical" ||
  scored.primaryRisk?.type === "poisoning_overdose"
) {
    gate.shouldUseMedicalResponse = true;
    gate.allowMedicalOverride = true;
  } else {
    gate.shouldUseSafetyResponse = true;
    gate.allowSafetyOverride = true;
  }

  return;
}
    if (scored.override === "urgent") {
  gate.override = "urgent";
  gate.shouldStopNormalResponse = true;
  gate.safetyApprovedNormalFlow = false;

  if (
    scored.primaryRisk?.type === "medical" ||
    scored.primaryRisk?.type === "poisoning_overdose"
  ) {
    gate.shouldUseMedicalResponse = true;
    gate.allowMedicalOverride = true;
  } else {
    gate.shouldUseSafetyResponse = true;
    gate.allowSafetyOverride = true;
  }

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
gate.allowRiskClarification = true;
gate.safetyApprovedNormalFlow = false;
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
      gate.allowSafetyOverride = false;
gate.allowMedicalOverride = false;
gate.allowRiskClarification = false;
gate.safetyApprovedNormalFlow = true;
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