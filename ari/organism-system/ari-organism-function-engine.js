// ari/organism-system/ari-organism-function-engine.js
// Ari Organism Function Engine
// Purpose: Help Ari understand basic living-system functions before meaning, identity, wisdom, or advice.
// V1.2
// Fixes:
// - Normalizes curly apostrophes so "haven’t" matches "haven't".
// - Expands detection across food, hydration, sleep, pain, breathing, elimination, temperature, movement, threat, and connection.
// - Adds stronger time-duration detection for sleep deprivation and food/fluid deprivation.
// - Keeps compatibility fields for Core Summary V2.4.

window.Ari = window.Ari || {};

window.AriOrganismFunctionEngine = {
  version: "1.2.0",

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
    const primaryFunctionName = primaryFunction?.name || null;

    return {
      organismEngineRan: true,
      organismEngineSource: "ari-organism-function-engine",
      organismEngineVersion: this.version,

      organismPrimaryFunction: primaryFunctionName,
      organismPrimaryFunctionScore: primaryFunction?.score || 0,
      organismFunctions: functions,
      organismDisruption: disruption,
      organismUrgency: urgency,

      organismNeedsStabilization:
        urgency.level === "critical" ||
        urgency.level === "high" ||
        urgency.level === "moderate" ||
        disruption.hasDisruption,

      organismRecommendedMode: this.getRecommendedMode(primaryFunction, urgency),
      organismRecommendedAction: this.getRecommendedAction(primaryFunction, urgency),

      organismFunction: primaryFunctionName,
      organismNeed: this.mapFunctionToNeed(primaryFunctionName),
      organismNeedBlocked: disruption.hasDisruption,
      organismReason: urgency.reason,
      organismSource: "ari-organism-function-engine"
    };
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  addFunction(functions, name, score, reason) {
    const existing = functions.find((item) => item.name === name);

    if (existing) {
      existing.score += score;
      if (!existing.reasons.includes(reason)) {
        existing.reasons.push(reason);
      }
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

    // 1. ENERGY / FOOD
    if (this.containsAny(text, [
      "hungry",
      "starving",
      "haven't eaten",
      "havent eaten",
      "have not eaten",
      "didn't eat",
      "didnt eat",
      "not eating",
      "can't eat",
      "cant eat",
      "cannot eat",
      "skipped meals",
      "skipped breakfast",
      "skipped lunch",
      "skipped dinner",
      "food",
      "meal",
      "nauseous",
      "nausea",
      "dizzy",
      "lightheaded",
      "blood sugar",
      "low sugar",
      "hypoglycemia",
      "haven't eaten all day",
      "all day without eating"
    ])) {
      this.addFunction(
        functions,
        "energy_intake",
        35,
        "Food, hunger, nausea, dizziness, or not eating suggests energy intake is relevant."
      );
    }

    // 2. HYDRATION / FLUIDS
    if (this.containsAny(text, [
      "thirsty",
      "dehydrated",
      "dry mouth",
      "haven't drank",
      "havent drank",
      "have not drank",
      "haven't had water",
      "havent had water",
      "no water",
      "water",
      "fluids",
      "can't keep fluids down",
      "cant keep fluids down",
      "dark urine",
      "barely peeing",
      "not peeing",
      "very little urine"
    ])) {
      this.addFunction(
        functions,
        "hydration",
        35,
        "Thirst, dehydration, fluids, vomiting, or low urine output signals hydration need."
      );
    }

    // 3. REST / SLEEP / RECOVERY
    if (this.containsAny(text, [
      "tired",
      "exhausted",
      "sleepy",
      "can't sleep",
      "cant sleep",
      "cannot sleep",
      "insomnia",
      "awake all night",
      "no sleep",
      "without sleep",
      "haven't slept",
      "havent slept",
      "have not slept",
      "haven't slept in",
      "been awake",
      "awake for",
      "36 hours",
      "24 hours",
      "48 hours",
      "72 hours",
      "rest",
      "sleep deprived"
    ])) {
      this.addFunction(
        functions,
        "rest_recovery",
        40,
        "Sleep loss, exhaustion, insomnia, or prolonged wakefulness signals rest and recovery need."
      );
    }

    // 4. PAIN / INJURY / TISSUE PROTECTION
    if (this.containsAny(text, [
      "pain",
      "hurts",
      "hurt",
      "ache",
      "aching",
      "cramp",
      "injury",
      "injured",
      "bleeding",
      "swollen",
      "sore",
      "sharp pain",
      "severe pain",
      "worst pain",
      "constant pain",
      "can't move",
      "cant move",
      "sprain",
      "strain",
      "burn",
      "cut",
      "wound"
    ])) {
      this.addFunction(
        functions,
        "injury_protection",
        35,
        "Pain, bleeding, injury, swelling, or impaired movement signals protection and assessment need."
      );
    }

    // 5. VITAL STABILITY / RED FLAGS
    if (this.containsAny(text, [
      "can't breathe",
      "cant breathe",
      "cannot breathe",
      "short of breath",
      "trouble breathing",
      "difficulty breathing",
      "chest pain",
      "faint",
      "fainted",
      "passed out",
      "passing out",
      "stroke",
      "seizure",
      "overdose",
      "confused",
      "confusion",
      "blue lips",
      "severe weakness",
      "one sided weakness",
      "slurred speech"
    ])) {
      this.addFunction(
        functions,
        "vital_stability",
        100,
        "Breathing, chest pain, fainting, confusion, stroke, seizure, or overdose signals urgent vital stability concern."
      );
    }

    // 6. ELIMINATION / WASTE REMOVAL
    if (this.containsAny(text, [
      "diarrhea",
      "constipated",
      "constipation",
      "throwing up",
      "vomiting",
      "vomit",
      "can't poop",
      "cant poop",
      "can't pee",
      "cant pee",
      "painful urination",
      "burning when i pee",
      "blood in urine",
      "blood in stool",
      "black stool",
      "bowel movement",
      "stomach bug"
    ])) {
      this.addFunction(
        functions,
        "waste_elimination",
        32,
        "Vomiting, diarrhea, constipation, urination issues, or abnormal stool/urine signals elimination and fluid balance need."
      );
    }

    // 7. TEMPERATURE / INFECTION BALANCE
    if (this.containsAny(text, [
      "fever",
      "chills",
      "sweating",
      "night sweats",
      "overheating",
      "too hot",
      "too cold",
      "hypothermia",
      "heat exhaustion",
      "heat stroke",
      "infection",
      "flu",
      "covid",
      "high temperature"
    ])) {
      this.addFunction(
        functions,
        "temperature_regulation",
        34,
        "Fever, chills, overheating, infection, or temperature instability signals temperature regulation need."
      );
    }

    // 8. MOVEMENT / MOBILITY
    if (this.containsAny(text, [
      "can't walk",
      "cant walk",
      "cannot walk",
      "limping",
      "weak",
      "weakness",
      "dizzy when standing",
      "falling",
      "fell",
      "balance",
      "can't stand",
      "cant stand",
      "numb",
      "numbness",
      "tingling",
      "paralyzed"
    ])) {
      this.addFunction(
        functions,
        "movement_mobility",
        34,
        "Weakness, falls, numbness, balance issues, or inability to walk/stand signals movement and mobility need."
      );
    }

    // 9. THREAT / NERVOUS SYSTEM REGULATION
    if (this.containsAny(text, [
      "panic",
      "panic attack",
      "anxious",
      "anxiety",
      "overwhelmed",
      "scared",
      "terrified",
      "unsafe",
      "danger",
      "fight or flight",
      "can't calm down",
      "cant calm down",
      "racing heart",
      "heart racing"
    ])) {
      this.addFunction(
        functions,
        "threat_regulation",
        28,
        "Fear, panic, danger, or nervous system activation signals threat regulation need."
      );
    }

    // 10. CONNECTION / ATTACHMENT
    if (this.containsAny(text, [
      "alone",
      "lonely",
      "abandoned",
      "ignored",
      "rejected",
      "nobody cares",
      "no one cares",
      "unseen",
      "unloved",
      "disconnected",
      "isolated"
    ])) {
      this.addFunction(
        functions,
        "connection",
        25,
        "Loneliness, rejection, or isolation signals connection need."
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
      "i cannot eat",
      "too nauseous",
      "haven't eaten all day",
      "havent eaten all day",
      "have not eaten all day",
      "can't keep food down",
      "cant keep food down"
    ])) {
      disruptions.push({
        type: "survival_function_blocked",
        function: "energy_intake",
        reason: "The user recognizes a food/energy need but cannot easily act on it."
      });
    }

    if (this.containsAny(text, [
      "i should drink but",
      "i know i should drink but",
      "i can't drink",
      "i cant drink",
      "can't keep fluids down",
      "cant keep fluids down",
      "haven't had water",
      "havent had water",
      "no water all day"
    ])) {
      disruptions.push({
        type: "hydration_function_blocked",
        function: "hydration",
        reason: "The user recognizes a hydration need but cannot easily act on it."
      });
    }

    if (this.containsAny(text, [
      "i should sleep but",
      "i know i should sleep but",
      "can't sleep",
      "cant sleep",
      "cannot sleep",
      "no sleep",
      "haven't slept",
      "havent slept",
      "have not slept",
      "without sleep"
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
      "cannot stop",
      "even though",
      "i keep doing it",
      "i know it's bad",
      "i know its bad"
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
      "cannot breathe",
      "chest pain",
      "faint",
      "fainted",
      "passed out",
      "stroke",
      "seizure",
      "overdose",
      "blue lips",
      "slurred speech",
      "one sided weakness",
      "severe weakness",
      "confused",
      "confusion"
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
      "have not eaten all day",
      "can't keep food down",
      "cant keep food down",
      "can't keep fluids down",
      "cant keep fluids down",
      "36 hours",
      "48 hours",
      "72 hours",
      "haven't slept in",
      "havent slept in",
      "have not slept in",
      "severe pain",
      "worst pain",
      "high fever",
      "heat stroke"
    ])) {
      return {
        level: "high",
        reason: "A body function may be unstable and should be addressed before interpretation."
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
      waste_elimination:
        "Support fluid balance, monitor severity, and consider medical guidance if symptoms are severe, prolonged, or worsening.",
      temperature_regulation:
        "Support temperature stability and consider medical guidance if fever, chills, or overheating are severe or persistent.",
      movement_mobility:
        "Protect mobility, avoid unsafe movement, and consider medical guidance if weakness, numbness, falls, or inability to walk are present.",
      threat_regulation:
        "Regulate threat first through grounding, safety, and support.",
      connection:
        "Restore connection before analysis."
    };

    return actions[primaryFunction.name] || "Stabilize the basic function first.";
  },

  mapFunctionToNeed(functionName = null) {
    const map = {
      energy_intake: "food",
      hydration: "water",
      rest_recovery: "sleep",
      injury_protection: "pain_protection",
      vital_stability: "vital_safety",
      waste_elimination: "elimination",
      temperature_regulation: "temperature_stability",
      movement_mobility: "mobility",
      threat_regulation: "felt_safety",
      connection: "attachment"
    };

    return map[functionName] || null;
  }
};