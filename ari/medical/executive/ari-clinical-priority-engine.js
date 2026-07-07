// ari/medical/executive/ari-clinical-priority-engine.js
// Purpose: Order Ari Medical concerns by clinical priority.
// V1.0.0 — Clinical Priority Engine / What Comes First

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.executive = window.Ari.medical.executive || {};

window.Ari.medical.executive.priorityEngine = {
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

    const priorities = this.buildPriorities(text, room);

    return {
      engine: "ari-clinical-priority-engine",
      version: this.version,
      priorities,
      topPriority: priorities[0] || null,
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

    result.priorities.forEach(priority => {
      situationRoom.write(room, {
        section: "evidence",
        engine: "ari-clinical-priority-engine",
        type: "clinical_priority",
        value: priority.id,
        confidence: priority.confidence,
        priority: priority.priority,
        rationale: priority.rationale
      });
    });

    return room;
  },

  buildPriorities(text = "", room = {}) {
    const combined = this.normalize([
      text,
      JSON.stringify(room || {})
    ].join(" "));

    const priorities = [];

    this.addIf(priorities, {
      id: "PRIORITY-AIRWAY",
      label: "Airway",
      priority: "critical",
      order: 1,
      confidence: "medium",
      triggers: ["airway", "stridor", "drooling", "throat swelling", "swollen tongue"],
      text: combined,
      rationale: ["Airway concerns come first."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-BREATHING",
      label: "Breathing",
      priority: "critical",
      order: 2,
      confidence: "medium",
      triggers: ["trouble breathing", "shortness of breath", "hypoxia", "blue lips", "cyanosis"],
      text: combined,
      rationale: ["Breathing or oxygenation concerns require immediate attention."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-CIRCULATION",
      label: "Circulation",
      priority: "critical",
      order: 3,
      confidence: "medium",
      triggers: ["shock", "hypotension", "low blood pressure", "map low"],
      text: combined,
      rationale: ["Hemodynamic instability comes before routine diagnostic reasoning."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-NEURO",
      label: "Neurologic emergency",
      priority: "critical",
      order: 4,
      confidence: "medium",
      triggers: ["stroke", "facial droop", "slurred speech", "one sided weakness", "seizure", "unresponsive"],
      text: combined,
      rationale: ["Possible neurologic emergencies are time-sensitive."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-SEPSIS",
      label: "Sepsis / shock risk",
      priority: "high",
      order: 5,
      confidence: "medium",
      triggers: ["sepsis", "septic", "lactate", "bacteremia", "fever hypotension"],
      text: combined,
      rationale: ["Sepsis signals require rapid evaluation and treatment prioritization."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-INFECTION-CONTROL",
      label: "Infection control",
      priority: "high",
      order: 6,
      confidence: "medium",
      triggers: [
        "precaution-airborne",
        "precaution-droplet",
        "precaution-contact",
        "tuberculosis",
        "measles",
        "meningococcus",
        "c diff"
      ],
      text: combined,
      rationale: ["Transmission risk should be addressed early to protect others."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-MEDICATION-SAFETY",
      label: "Medication safety",
      priority: "moderate",
      order: 7,
      confidence: "medium",
      triggers: [
        "allergy",
        "drug interaction",
        "renal dosing",
        "hepatic",
        "toxicity",
        "overdose",
        "contraindication"
      ],
      text: combined,
      rationale: ["Medication safety can change the plan and should be checked before recommendations."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-MONITORING",
      label: "Monitoring",
      priority: "moderate",
      order: 8,
      confidence: "medium",
      triggers: [
        "monitoring",
        "renal function",
        "lactate",
        "oxygen",
        "vitals",
        "mental status",
        "cbc",
        "ck"
      ],
      text: combined,
      rationale: ["Monitoring helps detect deterioration and treatment toxicity."]
    });

    this.addIf(priorities, {
      id: "PRIORITY-MISSING-INFO",
      label: "Missing information",
      priority: "routine",
      order: 9,
      confidence: "medium",
      triggers: [
        "uncertainty",
        "missing",
        "question",
        "needs more info"
      ],
      text: combined,
      rationale: ["Missing key information should be clarified before narrowing the plan."]
    });

    if (!priorities.length) {
      priorities.push({
        id: "PRIORITY-ROUTINE-ASSESSMENT",
        label: "Routine assessment",
        priority: "routine",
        order: 99,
        confidence: "low",
        rationale: ["No high-priority signal detected."]
      });
    }

    return priorities.sort((a, b) => a.order - b.order);
  },

  addIf(list = [], config = {}) {
    if (this.hasAny(config.text, config.triggers)) {
      list.push({
        id: config.id,
        label: config.label,
        priority: config.priority,
        order: config.order,
        confidence: config.confidence,
        rationale: config.rationale
      });
    }
  },

  hasAny(text = "", terms = []) {
    const clean = this.normalize(text);
    return terms.some(term => clean.includes(this.normalize(term)));
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
  }
};

window.AriClinicalPriorityEngine =
  window.Ari.medical.executive.priorityEngine;

console.log(
  "ARI CLINICAL PRIORITY ENGINE LOADED:",
  window.Ari.medical.executive.priorityEngine.version
);