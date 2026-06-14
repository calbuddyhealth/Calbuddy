// ari/safety/ari-safety-context-gate.js
// Ari Safety Context Gate
// Purpose: Detect true safety/medical urgency from context, not single words.
// V1.0.0

window.Ari = window.Ari || {};

window.AriSafetyContextGate = {
  version: "1.0.0",

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
      riskLevel: "none", // none | context | unclear | moderate | high | critical
      riskType: "none",  // none | safety | medical | violence | abuse | substance
      followUpNeeded: false,
      followUpType: null,
      followUpQuestion: null,

      evidence: [],
      reasons: [],

      shouldStopNormalResponse: false,
      shouldUseSafetyResponse: false,
      shouldUseMedicalResponse: false,
      shouldAskRiskClarification: false
    };

    const context = this.getContext(text, observations);

    this.checkActiveSelfHarm(text, context, gate);
    this.checkViolenceRisk(text, context, gate);
    this.checkMedicalUrgency(text, context, gate);
    this.checkAbuseDanger(text, context, gate);
    this.checkAmbiguousRisk(text, context, gate);
    this.checkContextOnly(text, context, gate);

    return gate;
  },

  getContext(text, observations = []) {
    const has = (terms) => terms.some(term => this.hasPhrase(text, term));

    return {
      historical: has([
        "yesterday", "last week", "last month", "two weeks ago",
        "years ago", "last year", "history of", "used to"
      ]),

      current: has([
        "now", "right now", "currently", "today", "tonight",
        "this morning", "this afternoon", "happening now"
      ]),

      future: has([
        "tomorrow", "next week", "next month", "soon", "tonight",
        "planning to", "going to"
      ]),

      self: /\b(i|me|my|myself)\b/.test(text),

      closeOther: /\b(my wife|my husband|my partner|my girlfriend|my boyfriend|my dad|my mom|my child|my baby|my son|my daughter)\b/.test(text),

      fictionalOrReference: has([
        "suicide squad", "suicide boys", "$uicideboy$", "song", "movie",
        "band", "album", "character", "book", "quote", "lyrics", "game"
      ]),

      questionAboutTopic:
        /^(what is|what are|who is|explain|define|have you heard|do you know|is .* about)\b/.test(text),

      bodyContextOnly: has([
        "pregnant", "pregnancy", "abortion", "miscarriage",
        "stroke last year", "history of stroke", "had a stroke",
        "surgery", "diagnosis"
      ]),

      bodySymptoms: has([
        "severe pain", "chest pain", "trouble breathing", "can't breathe",
        "cant breathe", "shortness of breath", "fainting", "passed out",
        "seizure", "stroke symptoms", "weakness", "numbness",
        "bleeding", "heavy bleeding", "fever", "dehydrated",
        "contractions", "fluid leakage", "decreased fetal movement"
      ]),

      selfHarmLanguage: has([
        "kill myself", "hurt myself", "self harm", "self-harm",
        "end my life", "take my life", "can't stay safe", "cant stay safe",
        "suicide"
      ]),

      selfHarmIntent: has([
        "i am going to kill myself",
        "i'm going to kill myself",
        "i will kill myself",
        "i want to kill myself",
        "i'm going to end my life",
        "i am going to end my life",
        "i can't stay safe",
        "i cant stay safe"
      ]),

      ambiguousCollapse: has([
        "i give up", "i can't do this", "i cant do this",
        "i don't want to be here", "i dont want to be here",
        "nothing is working", "i'm done", "im done"
      ]),

      violenceLanguage: has([
        "hurt someone", "kill someone", "attack", "shoot", "stab",
        "weapon", "gun", "knife"
      ]),

      overdoseLanguage: has([
        "overdose", "took a bunch of pills", "took too many pills",
        "too much medication", "poison"
      ]),

      abuseDangerLanguage: has([
        "abuse", "assault", "threatened me", "threatening me",
        "unsafe at home", "violence at home"
      ]),

      observations
    };
  },

  checkActiveSelfHarm(text, context, gate) {
    if (context.fictionalOrReference || context.questionAboutTopic) return;

    if (context.selfHarmIntent) {
      this.escalate(gate, {
        override: "safety_emergency",
        riskLevel: "critical",
        riskType: "safety",
        evidence: "active self-harm intent language",
        reason: "User appears to describe active self-harm intent or inability to stay safe."
      });
      return;
    }

    if (context.selfHarmLanguage && context.current && !context.historical) {
      this.clarify(gate, {
        riskLevel: "unclear",
        riskType: "safety",
        evidence: "current self-harm-related language without enough intent detail",
        question: "Are you safe right now, or are you using that phrase to describe feeling overwhelmed?"
      });
    }
  },

  checkViolenceRisk(text, context, gate) {
    if (context.fictionalOrReference || context.questionAboutTopic) return;

    if (context.violenceLanguage && context.current) {
      this.clarify(gate, {
        riskLevel: "unclear",
        riskType: "violence",
        evidence: "possible violence language",
        question: "Is anyone in immediate danger right now?"
      });
    }
  },

  checkMedicalUrgency(text, context, gate) {
    if (context.bodySymptoms && !context.historical) {
      this.escalate(gate, {
        override: "medical_urgent",
        riskLevel: "high",
        riskType: "medical",
        evidence: "active medical red-flag symptom language",
        reason: "User appears to describe current or potentially active medical red-flag symptoms."
      });
    }

    if (context.overdoseLanguage && !context.historical) {
      this.escalate(gate, {
        override: "medical_urgent",
        riskLevel: "critical",
        riskType: "substance",
        evidence: "possible overdose or poisoning language",
        reason: "Possible overdose/poisoning language should be treated as urgent unless clearly historical or fictional."
      });
    }
  },

  checkAbuseDanger(text, context, gate) {
    if (context.abuseDangerLanguage && context.current) {
      this.clarify(gate, {
        riskLevel: "unclear",
        riskType: "abuse",
        evidence: "possible current abuse/danger language",
        question: "Are you in immediate danger right now?"
      });
    }
  },

  checkAmbiguousRisk(text, context, gate) {
    if (gate.override) return;
    if (context.fictionalOrReference || context.questionAboutTopic) return;

    if (context.ambiguousCollapse) {
      this.clarify(gate, {
        riskLevel: "unclear",
        riskType: "safety",
        evidence: "ambiguous collapse/distress language",
        question: "Are you safe right now, or are you saying you feel overwhelmed?"
      });
    }
  },

  checkContextOnly(text, context, gate) {
    if (gate.override || gate.followUpNeeded) return;

    if (context.fictionalOrReference || context.questionAboutTopic) {
      gate.riskLevel = "none";
      gate.riskType = "none";
      gate.reasons.push("Risk language appears to be fictional, educational, quoted, or referential.");
      return;
    }

    if (context.bodyContextOnly && !context.bodySymptoms) {
      gate.riskLevel = "context";
      gate.riskType = "medical";
      gate.reasons.push("Medical/body term appears to be context only, not an active emergency.");
    }

    if (context.historical && !context.current && !context.bodySymptoms) {
      gate.riskLevel = gate.riskLevel === "none" ? "context" : gate.riskLevel;
      gate.reasons.push("Past-time language suggests history/context rather than active emergency.");
    }
  },

  escalate(gate, data = {}) {
    const priority = {
      none: 0,
      context: 1,
      unclear: 2,
      moderate: 3,
      high: 4,
      critical: 5
    };

    if (priority[data.riskLevel] < priority[gate.riskLevel]) return;

    gate.override = data.override;
    gate.riskLevel = data.riskLevel || gate.riskLevel;
    gate.riskType = data.riskType || gate.riskType;
    gate.followUpNeeded = false;
    gate.followUpType = null;
    gate.followUpQuestion = null;
    gate.shouldStopNormalResponse = true;
    gate.shouldUseSafetyResponse = data.riskType === "safety" || data.riskType === "violence";
    gate.shouldUseMedicalResponse = data.riskType === "medical" || data.riskType === "substance";
    gate.shouldAskRiskClarification = false;

    if (data.evidence) gate.evidence.push(data.evidence);
    if (data.reason) gate.reasons.push(data.reason);
  },

  clarify(gate, data = {}) {
    if (gate.override) return;

    gate.override = "clarify_risk";
    gate.riskLevel = data.riskLevel || "unclear";
    gate.riskType = data.riskType || "safety";
    gate.followUpNeeded = true;
    gate.followUpType = "risk_clarification";
    gate.followUpQuestion =
      data.question || "Are you safe right now, or is this more about feeling overwhelmed?";
    gate.shouldStopNormalResponse = false;
    gate.shouldUseSafetyResponse = false;
    gate.shouldUseMedicalResponse = false;
    gate.shouldAskRiskClarification = true;

    if (data.evidence) gate.evidence.push(data.evidence);
    gate.reasons.push("Risk language is ambiguous, so Ari should ask one clarifying safety question instead of escalating.");
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