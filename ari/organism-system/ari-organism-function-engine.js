// ari/organism-system/ari-organism-function-engine.js
// Ari Organism Function Engine
// Purpose: Help Ari understand basic living-system functions before meaning, identity, wisdom, or advice.
// V1.0

window.Ari = window.Ari || {};

window.AriOrganismFunctionEngine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const functions = this.detectFunctions(text);
    const disruption = this.detectDisruption(text, functions);
    const urgency = this.detectUrgency(text, functions, disruption);

    const primaryFunction = this.getPrimaryFunction(functions);

    return {
      organismEngineRan: true,
      organismEngineSource: "ari-organism-function-engine",
      organismEngineVersion: this.version,

      organismPrimaryFunction: primaryFunction?.name || null,
      organismPrimaryFunctionScore: primaryFunction?.score || 0,
      organismFunctions: functions,
      organismDisruption: disruption,
      organismUrgency: urgency,

      organismNeedsStabilization:
        urgency.level === "high" ||
        urgency.level === "moderate" ||
        disruption.hasDisruption,

      organismRecommendedMode: this.getRecommendedMode(primaryFunction, urgency),
      organismRecommendedAction: this.getRecommendedAction(primaryFunction, urgency)
    };
  },

  normalize(text = "") {
    return String(text || "").toLowerCase().trim();
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  addFunction(functions, name, score, reason) {
    const existing = functions.find((item) => item.name === name);

    if (existing) {
      existing.score += score;
      existing.reasons.push(reason);
      return;
    }

    functions.push({
      name,
      score,
      reasons: [reason]
    });
  },

  detectFunctions(text) {
    const functions = [];

    if (this.containsAny(text, [
      "hungry",
      "haven't eaten",
      "havent eaten",
      "didn't eat",
      "didnt eat",
      "not eating",
      "can't eat",
      "cant eat",
      "food",
      "meal",
      "nauseous",
      "nausea",
      "dizzy",
      "lightheaded",
      "blood sugar"
    ])) {
      this.addFunction(
        functions,
        "energy_intake",
        35,
        "Food, hunger, nausea, dizziness, or not eating suggests energy intake is relevant."
      );
    }

    if (this.containsAny(text, [
      "thirsty",
      "dehydrated",
      "dry mouth",
      "haven't drank",
      "havent drank",
      "haven't had water",
      "water",
      "fluids",
      "dark urine"
    ])) {
      this.addFunction(
        functions,
        "hydration",
        35,
        "Thirst, dehydration, fluids, or water signals hydration need."
      );
    }

    if (this.containsAny(text, [
      "tired",
      "exhausted",
      "sleepy",
      "can't sleep",
      "cant sleep",
      "insomnia",
      "awake all night",
      "no sleep",
      "rest"
    ])) {
      this.addFunction(
        functions,
        "rest_recovery",
        30,
        "Sleep, exhaustion, or recovery signals rest need."
      );
    }

    if (this.containsAny(text, [
      "pain",
      "hurts",
      "ache",
      "cramp",
      "injury",
      "bleeding",
      "swollen",
      "sore"
    ])) {
      this.addFunction(
        functions,
        "injury_protection",
        35,
        "Pain or injury signals protection and assessment need."
      );
    }

    if (this.containsAny(text, [
      "can't breathe",
      "cant breathe",
      "short of breath",
      "chest pain",
      "faint",
      "passed out",
      "stroke",
      "seizure"
    ])) {
      this.addFunction(
        functions,
        "vital_stability",
        100,
        "Breathing, chest pain, fainting, stroke, or seizure signals urgent vital stability concern."
      );
    }

    if (this.containsAny(text, [
      "panic",
      "anxious",
      "anxiety",
      "overwhelmed",
      "scared",
      "unsafe",
      "danger"
    ])) {
      this.addFunction(
        functions,
        "threat_regulation",
        25,
        "Fear, panic, or danger signals threat regulation need."
      );
    }

    if (this.containsAny(text, [
      "alone",
      "lonely",
      "abandoned",
      "ignored",
      "rejected",
      "nobody cares"
    ])) {
      this.addFunction(
        functions,
        "connection",
        25,
        "Loneliness or rejection signals connection need."
      );
    }

    return functions.sort((a, b) => b.score - a.score);
  },

  detectDisruption(text, functions = []) {
    const disruptions = [];

    if (this.containsAny(text, [
      "i should eat but",
      "i know i should eat but",
      "i can't eat",
      "i cant eat",
      "too nauseous",
      "haven't eaten all day",
      "havent eaten all day"
    ])) {
      disruptions.push({
        type: "survival_function_blocked",
        function: "energy_intake",
        reason: "The user recognizes a body need but cannot easily act on it."
      });
    }

    if (this.containsAny(text, [
      "i should sleep but",
      "i know i should sleep but",
      "can't sleep",
      "cant sleep",
      "no sleep"
    ])) {
      disruptions.push({
        type: "recovery_function_blocked",
        function: "rest_recovery",
        reason: "The user recognizes a rest need but cannot easily act on it."
      });
    }

    if (this.containsAny(text, [
      "i know but",
      "i should but",
      "can't stop",
      "cant stop",
      "even though"
    ])) {
      disruptions.push({
        type: "cognition_overriding_body",
        function: "self_regulation",
        reason: "Thinking, worry, fear, or conflict may be overriding a basic body signal."
      });
    }

    return {
      hasDisruption: disruptions.length > 0,
      disruptions
    };
  },

  detectUrgency(text, functions = [], disruption = {}) {
    if (this.containsAny(text, [
      "can't breathe",
      "cant breathe",
      "chest pain",
      "faint",
      "passed out",
      "stroke",
      "seizure",
      "overdose"
    ])) {
      return {
        level: "critical",
        reason: "Possible urgent medical red flag."
      };
    }

    if (this.containsAny(text, [
      "dizzy",
      "lightheaded",
      "nauseous",
      "nausea",
      "haven't eaten all day",
      "havent eaten all day",
      "can't keep food down",
      "cant keep food down"
    ])) {
      return {
        level: "high",
        reason: "Dizziness, nausea, or not eating all day can affect body stability."
      };
    }

    if (disruption.hasDisruption) {
      return {
        level: "moderate",
        reason: "A basic organism function appears blocked or overridden."
      };
    }

    if (functions.length > 0) {
      return {
        level: "mild",
        reason: "A basic organism function is relevant."
      };
    }

    return {
      level: "none",
      reason: "No basic organism function signal detected."
    };
  },

  getPrimaryFunction(functions = []) {
    return functions[0] || null;
  },

  getRecommendedMode(primaryFunction = null, urgency = {}) {
    if (urgency.level === "critical") return "urgent_safety";
    if (urgency.level === "high") return "stabilize_body_first";
    if (urgency.level === "moderate") return "restore_basic_function";
    if (!primaryFunction) return "no_organism_signal";
    return `support_${primaryFunction.name}`;
  },

  getRecommendedAction(primaryFunction = null, urgency = {}) {
    if (urgency.level === "critical") {
      return "Seek urgent help or emergency evaluation now.";
    }

    if (!primaryFunction) {
      return "No organism-level action needed.";
    }

    const actions = {
      energy_intake:
        "Start with a small, tolerable intake step before deeper interpretation.",
      hydration:
        "Start with fluids or hydration support before deeper interpretation.",
      rest_recovery:
        "Protect rest and recovery before adding more demands.",
      injury_protection:
        "Assess pain, protect the injured area, and consider medical guidance if severe or worsening.",
      vital_stability:
        "Prioritize immediate safety and urgent medical support.",
      threat_regulation:
        "Regulate threat first through grounding, safety, and support.",
      connection:
        "Restore connection before analysis."
    };

    return actions[primaryFunction.name] || "Stabilize the basic function first.";
  }
};