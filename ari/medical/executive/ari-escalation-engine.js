// ari/medical/executive/ari-escalation-engine.js
// Purpose: Determine escalation level from clinical signals.
// V1.0.0 — Escalation Engine / Safety First / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.executive = window.Ari.medical.executive || {};

window.Ari.medical.executive.escalationEngine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const room = input.room || input.situationRoom || {};
    const text = this.normalize(
      input.text ||
      input.userMessage ||
      input.message ||
      input.input ||
      room.chiefComplaint ||
      JSON.stringify(room || "")
    );

    const signals = this.detectSignals(text, room);
    const level = this.escalationLevel(signals);
    const actions = this.actionsFor(level, signals);

    return {
      engine: "ari-escalation-engine",
      version: this.version,
      activated: level !== "routine",
      escalationLevel: level,
      priority: this.priorityFor(level),
      signals,
      actions,
      rationale: this.rationaleFor(level, signals),
      advisoryOnly: true
    };
  },

  writeToRoom(room = {}, input = {}) {
    const result = this.evaluate({
      ...input,
      room
    });

    const situationRoom = window.Ari.medical.executive?.situationRoom;

    if (!situationRoom?.write) return room;

    result.actions.forEach(actionId => {
      const section =
        actionId === "ACTION-CALL-RAPID-RESPONSE"
          ? "nursingActions"
          : "providerActions";

      situationRoom.write(room, {
        section,
        engine: "ari-escalation-engine",
        type: "escalation_action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: result.rationale
      });
    });

    situationRoom.write(room, {
      section: "risks",
      engine: "ari-escalation-engine",
      type: "escalation_level",
      value: result.escalationLevel,
      confidence: "medium",
      priority: result.priority,
      rationale: result.rationale
    });

    return room;
  },

  detectSignals(text = "", room = {}) {
    const combined = this.normalize(
      [
        text,
        JSON.stringify(room || {})
      ].join(" ")
    );

    return {
      airway: this.hasAny(combined, [
        "airway",
        "stridor",
        "drooling",
        "throat swelling",
        "swollen tongue"
      ]),

      breathing: this.hasAny(combined, [
        "trouble breathing",
        "difficulty breathing",
        "shortness of breath",
        "blue lips",
        "cyanosis",
        "hypoxia",
        "oxygen low",
        "spo2 low"
      ]),

      circulation: this.hasAny(combined, [
        "hypotension",
        "low blood pressure",
        "shock",
        "bp 82",
        "bp 80",
        "map low"
      ]),

      neurologic: this.hasAny(combined, [
        "facial droop",
        "slurred speech",
        "one sided weakness",
        "seizure",
        "unresponsive",
        "new confusion"
      ]),

      sepsis: this.hasAny(combined, [
        "sepsis",
        "septic",
        "lactate elevated",
        "rising lactate",
        "bacteremia",
        "fever hypotension",
        "febrile hypotension"
      ]),

      anaphylaxis: this.hasAny(combined, [
        "anaphylaxis",
        "hives trouble breathing",
        "swollen lips",
        "swollen tongue",
        "throat swelling"
      ]),

      chestPain: this.hasAny(combined, [
        "chest pain",
        "pressure in chest",
        "crushing chest pain"
      ]),

      selfHarm: this.hasAny(combined, [
        "suicidal",
        "kill myself",
        "self harm",
        "overdose"
      ]),

      rapidResponseAlreadySuggested: this.hasAny(combined, [
        "ACTION-CALL-RAPID-RESPONSE",
        "ACT-EMERG-RRT-0001"
      ]),

      sepsisBundleSuggested: this.hasAny(combined, [
        "ACTION-START-SEPSIS-BUNDLE",
        "ACT-EMERG-SEPSIS-0001"
      ])
    };
  },

  escalationLevel(signals = {}) {
    if (
      signals.airway ||
      signals.breathing ||
      signals.circulation ||
      signals.anaphylaxis ||
      signals.rapidResponseAlreadySuggested
    ) {
      return "rapid_response";
    }

    if (
      signals.neurologic ||
      signals.chestPain ||
      signals.selfHarm
    ) {
      return "emergency";
    }

    if (
      signals.sepsis ||
      signals.sepsisBundleSuggested
    ) {
      return "urgent";
    }

    return "routine";
  },

  actionsFor(level = "routine", signals = {}) {
    const actions = new Set();

    if (level === "rapid_response") {
      actions.add("ACTION-CALL-RAPID-RESPONSE");
      actions.add("ACTION-NOTIFY-PROVIDER");
    }

    if (level === "emergency") {
      actions.add("ACTION-NOTIFY-PROVIDER");
    }

    if (signals.sepsis || signals.sepsisBundleSuggested) {
      actions.add("ACTION-START-SEPSIS-BUNDLE");
      actions.add("ACTION-NOTIFY-PROVIDER");
    }

    return [...actions];
  },

  priorityFor(level = "routine") {
    if (level === "rapid_response") return "critical";
    if (level === "emergency") return "critical";
    if (level === "urgent") return "high";
    if (level === "same_day") return "moderate";
    return "routine";
  },

  rationaleFor(level = "routine", signals = {}) {
    const rationale = [];

    if (signals.airway) rationale.push("Airway warning signs detected.");
    if (signals.breathing) rationale.push("Breathing or oxygenation concern detected.");
    if (signals.circulation) rationale.push("Circulation/hemodynamic instability concern detected.");
    if (signals.anaphylaxis) rationale.push("Possible severe allergic reaction detected.");
    if (signals.neurologic) rationale.push("Possible neurologic emergency detected.");
    if (signals.chestPain) rationale.push("Chest pain requires urgent evaluation.");
    if (signals.selfHarm) rationale.push("Possible self-harm or overdose risk detected.");
    if (signals.sepsis) rationale.push("Possible sepsis signal detected.");
    if (signals.sepsisBundleSuggested) rationale.push("Sepsis bundle action already suggested by another engine.");

    if (!rationale.length) rationale.push("No escalation signal detected.");

    return rationale;
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  hasAny(text = "", terms = []) {
    const clean = this.normalize(text);
    return terms.some(term => clean.includes(this.normalize(term)));
  }
};

window.AriEscalationEngine =
  window.Ari.medical.executive.escalationEngine;

console.log(
  "ARI ESCALATION ENGINE LOADED:",
  window.Ari.medical.executive.escalationEngine.version
);