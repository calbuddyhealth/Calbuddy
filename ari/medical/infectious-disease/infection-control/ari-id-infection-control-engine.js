// ari/medical/infectious-disease/infection-control/ari-id-infection-control-engine.js
// Purpose: Infer infection-control precautions, PPE, room needs, reporting, and actions.
// V1.0.0 — Infectious Disease Infection Control Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.infectionControl =
  window.Ari.medical.infectiousDisease.infectionControl || {};

window.Ari.medical.infectiousDisease.infectionControl.engine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const room = input.room || input.situationRoom || {};
    const text = this.normalize(
      input.text ||
      input.userMessage ||
      input.message ||
      room.chiefComplaint ||
      ""
    );

    const signals = this.detectSignals(text, room);
    const precautionIds = this.selectPrecautions(signals);
    const precautions = this.expandPrecautions(precautionIds);
    const actions = this.selectActions(signals, precautionIds);

    return {
      engine: "ari-id-infection-control-engine",
      version: this.version,
      activated: precautionIds.length > 0,
      signals,
      precautionIds,
      precautions,
      actions,
      priority: this.priorityFor(signals, precautionIds),
      reasoning: this.reasoningFor(signals, precautionIds),
      advisoryOnly: true
    };
  },

  writeToRoom(room = {}, packet = {}) {
    const result = this.evaluate({
      ...packet,
      room
    });

    const situationRoom = window.Ari.medical.executive?.situationRoom;

    if (!situationRoom?.write) return room;

    result.precautionIds.forEach(id => {
      situationRoom.write(room, {
        section: "precautions",
        engine: "ari-id-infection-control-engine",
        type: "precaution",
        value: id,
        actionId: this.actionForPrecaution(id),
        confidence: "medium",
        priority: result.priority,
        rationale: result.reasoning
      });
    });

    result.actions.forEach(actionId => {
      situationRoom.write(room, {
        section: "nursingActions",
        engine: "ari-id-infection-control-engine",
        type: "action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: result.reasoning
      });
    });

    return room;
  },

  detectSignals(text = "", room = {}) {
    const combined = [
      text,
      this.roomText(room)
    ].join(" ");

    return {
      tuberculosis: this.hasAny(combined, ["tuberculosis", "tb", "afb", "acid fast"]),
      measles: this.hasAny(combined, ["measles", "rubeola"]),
      varicella: this.hasAny(combined, ["varicella", "chickenpox", "disseminated shingles"]),
      meningococcus: this.hasAny(combined, ["meningococcus", "meningococcal", "neisseria meningitidis"]),
      influenza: this.hasAny(combined, ["influenza", "flu"]),
      covid: this.hasAny(combined, ["covid", "covid-19", "sars cov 2"]),
      rsv: this.hasAny(combined, ["rsv", "respiratory syncytial"]),
      cDiff: this.hasAny(combined, ["c diff", "c. diff", "clostridioides difficile", "clostridium difficile"]),
      mrsa: this.hasAny(combined, ["mrsa", "methicillin resistant staph"]),
      vre: this.hasAny(combined, ["vre", "vancomycin resistant enterococcus"]),
      drainingWound: this.hasAny(combined, ["draining wound", "uncontained drainage", "wound drainage"]),
      diarrhea: this.hasAny(combined, ["diarrhea", "watery stool", "loose stool"]),
      immunocompromised: this.hasAny(combined, ["neutropenia", "immunocompromised", "transplant", "chemotherapy"])
    };
  },

  selectPrecautions(signals = {}) {
    const precautions = new Set(["PRECAUTION-STANDARD"]);

    if (signals.tuberculosis || signals.measles) {
      precautions.add("PRECAUTION-AIRBORNE");
    }

    if (signals.varicella) {
      precautions.add("PRECAUTION-AIRBORNE");
      precautions.add("PRECAUTION-CONTACT");
    }

    if (signals.meningococcus || signals.influenza || signals.covid || signals.rsv) {
      precautions.add("PRECAUTION-DROPLET");
    }

    if (signals.covid || signals.rsv || signals.mrsa || signals.vre || signals.drainingWound) {
      precautions.add("PRECAUTION-CONTACT");
    }

    if (signals.cDiff || (signals.diarrhea && signals.recentAntibiotics)) {
      precautions.add("PRECAUTION-CONTACT-ENTERIC");
    }

    if (signals.immunocompromised) {
      precautions.add("PRECAUTION-PROTECTIVE");
    }

    return [...precautions];
  },

  expandPrecautions(ids = []) {
    const registry =
      window.Ari.medical.infectiousDisease.infectionControl.precautionRegistry;

    if (!registry?.find) return ids.map(id => ({ precautionId: id }));

    return ids.map(id => registry.find(id)).filter(Boolean);
  },

  selectActions(signals = {}, precautionIds = []) {
    const actions = new Set();

    precautionIds.forEach(id => {
      const action = this.actionForPrecaution(id);
      if (action) actions.add(action);
    });

    if (
      signals.tuberculosis ||
      signals.measles ||
      signals.varicella ||
      signals.meningococcus ||
      signals.cDiff
    ) {
      actions.add("ACTION-NOTIFY-INFECTION-PREVENTION");
    }

    if (signals.tuberculosis || signals.measles || signals.meningococcus) {
      actions.add("ACTION-NOTIFY-PUBLIC-HEALTH");
    }

    return [...actions];
  },

  actionForPrecaution(id = "") {
    const map = {
      "PRECAUTION-CONTACT": "ACTION-INITIATE-CONTACT-PRECAUTIONS",
      "PRECAUTION-DROPLET": "ACTION-INITIATE-DROPLET-PRECAUTIONS",
      "PRECAUTION-AIRBORNE": "ACTION-INITIATE-AIRBORNE-PRECAUTIONS",
      "PRECAUTION-CONTACT-ENTERIC": "ACTION-INITIATE-CONTACT-PRECAUTIONS",
      "PRECAUTION-STANDARD": null,
      "PRECAUTION-PROTECTIVE": null
    };

    return map[id] || null;
  },

  priorityFor(signals = {}, precautionIds = []) {
    if (signals.tuberculosis || signals.measles || signals.meningococcus) {
      return "critical";
    }

    if (
      precautionIds.includes("PRECAUTION-AIRBORNE") ||
      precautionIds.includes("PRECAUTION-CONTACT-ENTERIC")
    ) {
      return "high";
    }

    if (precautionIds.length > 1) return "high";

    return "routine";
  },

  reasoningFor(signals = {}, precautionIds = []) {
    const reasons = [];

    if (signals.tuberculosis) reasons.push("Possible tuberculosis requires airborne precautions.");
    if (signals.measles) reasons.push("Possible measles requires airborne precautions.");
    if (signals.varicella) reasons.push("Varicella/disseminated shingles may require airborne plus contact precautions.");
    if (signals.meningococcus) reasons.push("Possible meningococcal disease requires droplet precautions and exposure management.");
    if (signals.influenza) reasons.push("Influenza generally requires droplet precautions.");
    if (signals.covid) reasons.push("COVID-19 generally requires respiratory and contact-oriented precautions per local policy.");
    if (signals.rsv) reasons.push("RSV often requires droplet/contact precautions, especially in pediatric or high-risk settings.");
    if (signals.cDiff) reasons.push("C. difficile requires contact-enteric precautions with soap-and-water hand hygiene and sporicidal cleaning.");
    if (signals.mrsa || signals.vre || signals.drainingWound) reasons.push("Resistant organisms or uncontained drainage may require contact precautions.");
    if (signals.immunocompromised) reasons.push("Severe immunocompromise may require protective environment considerations.");

    if (!reasons.length && precautionIds.includes("PRECAUTION-STANDARD")) {
      reasons.push("Standard precautions apply to all patients.");
    }

    return reasons;
  },

  roomText(room = {}) {
    const sections = [
      "suspectedOrganisms",
      "suspectedDiseases",
      "risks",
      "redFlags",
      "symptoms",
      "observations"
    ];

    return sections
      .flatMap(section => Array.isArray(room[section]) ? room[section] : [])
      .map(item => {
        if (typeof item === "string") return item;
        return [
          item.value,
          item.type,
          item.id,
          item.rationale?.join?.(" ")
        ].filter(Boolean).join(" ");
      })
      .join(" ");
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

window.AriIDInfectionControlEngine =
  window.Ari.medical.infectiousDisease.infectionControl.engine;

console.log(
  "ARI ID INFECTION CONTROL ENGINE LOADED:",
  window.Ari.medical.infectiousDisease.infectionControl.engine.version
);