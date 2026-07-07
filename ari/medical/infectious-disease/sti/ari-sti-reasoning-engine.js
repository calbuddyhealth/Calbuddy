// ari/medical/infectious-disease/sti/ari-sti-reasoning-engine.js
// Purpose: Detect STI-related concerns and write STI reasoning context to Situation Room.
// V1.0.0 — STI Reasoning Engine / Advisory Only

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};
window.Ari.medical.infectiousDisease =
  window.Ari.medical.infectiousDisease || {};
window.Ari.medical.infectiousDisease.sti =
  window.Ari.medical.infectiousDisease.sti || {};

window.Ari.medical.infectiousDisease.sti.reasoningEngine = {
  version: "1.0.0",

  evaluate(input = {}) {
    const room = input.room || input.situationRoom || {};
    const registry = window.Ari.medical.infectiousDisease.sti.registry;

    if (!registry?.search) {
      return this.empty("STI Registry not loaded.");
    }

    const text = this.normalize(
      [
        input.text,
        input.userMessage,
        input.message,
        input.input,
        room.chiefComplaint,
        JSON.stringify(room || {})
      ]
        .filter(Boolean)
        .join(" ")
    );

    const activated = this.shouldActivate(text);
    const matches = activated ? registry.search(text) : [];

    return {
      engine: "ari-sti-reasoning-engine",
      version: this.version,
      activated,
      matches,
      suspectedSTIs: matches.map(entry => ({
        id: entry.id,
        umkoId: entry.umkoId,
        name: entry.name,
        category: entry.category
      })),
      syndromes: this.collect(matches, "syndromes"),
      questions: this.collect(matches, "followUpQuestions"),
      patientEducation: this.collect(matches, "patientEducation"),
      monitoring: this.collect(matches, "monitoring"),
      reportable: matches.filter(entry => entry.reportability?.potentiallyReportable),
      actions: this.actionsFor(matches),
      priority: this.priorityFor(matches, text),
      rationale: this.rationaleFor(matches, text),
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

    result.suspectedSTIs.forEach(sti => {
      situationRoom.write(room, {
        section: "suspectedDiseases",
        engine: "ari-sti-reasoning-engine",
        type: "suspected_sti",
        value: sti.name,
        umkoId: sti.umkoId,
        confidence: "medium",
        priority: result.priority,
        rationale: result.rationale
      });
    });

    result.syndromes.forEach(syndrome => {
      situationRoom.write(room, {
        section: "suspectedDiseases",
        engine: "ari-sti-reasoning-engine",
        type: "sti_syndrome",
        value: syndrome,
        confidence: "medium",
        priority: result.priority,
        rationale: ["STI syndrome matched from STI Registry."]
      });
    });

    result.questions.forEach(question => {
      situationRoom.write(room, {
        section: "questions",
        engine: "ari-sti-reasoning-engine",
        type: "sti_follow_up",
        value: question,
        confidence: "medium",
        priority: "routine",
        rationale: ["Needed to clarify STI testing, exposure site, pregnancy status, symptoms, or partner management."]
      });
    });

    result.patientEducation.forEach(education => {
      situationRoom.write(room, {
        section: "patientEducation",
        engine: "ari-sti-reasoning-engine",
        type: "sti_education",
        value: education,
        confidence: "medium",
        priority: "routine",
        rationale: ["Patient education from STI Registry."]
      });
    });

    result.monitoring.forEach(monitorId => {
      situationRoom.write(room, {
        section: "monitoring",
        engine: "ari-sti-reasoning-engine",
        type: "monitoring_request",
        value: monitorId,
        monitorId,
        confidence: "medium",
        priority: "routine",
        rationale: ["Monitoring linked from STI Registry."]
      });
    });

    result.actions.forEach(actionId => {
      situationRoom.write(room, {
        section: "providerActions",
        engine: "ari-sti-reasoning-engine",
        type: "sti_action",
        value: actionId,
        actionId,
        confidence: "medium",
        priority: result.priority,
        rationale: ["STI context may require public-health, partner-management, or clinician workflow."]
      });
    });

    return room;
  },

  shouldActivate(text = "") {
    return this.hasAny(text, [
      "sti",
      "std",
      "sexually transmitted",
      "chlamydia",
      "gonorrhea",
      "syphilis",
      "hiv",
      "herpes",
      "hsv",
      "hpv",
      "trich",
      "genital wart",
      "genital sore",
      "genital ulcer",
      "discharge",
      "urethral discharge",
      "burning when peeing",
      "dysuria after sex",
      "pelvic pain after sex",
      "testicular pain",
      "rectal pain",
      "proctitis",
      "cervicitis",
      "urethritis",
      "pid",
      "partner tested positive"
    ]);
  },

  actionsFor(matches = []) {
    const actions = new Set();

    matches.forEach(entry => {
      if (entry.reportability?.potentiallyReportable) {
        actions.add("ACTION-NOTIFY-PUBLIC-HEALTH");
      }
    });

    return [...actions];
  },

  priorityFor(matches = [], text = "") {
    if (
      this.hasAny(text, [
        "pregnant",
        "pregnancy",
        "pelvic pain",
        "fever pelvic pain",
        "joint pain rash",
        "vision changes",
        "neurologic symptoms",
        "positive hiv",
        "hiv exposure"
      ])
    ) {
      return "high";
    }

    if (matches.some(entry => entry.id === "syphilis" || entry.id === "hiv_sti_context")) {
      return "moderate";
    }

    return matches.length ? "moderate" : "routine";
  },

  rationaleFor(matches = [], text = "") {
    const reasons = [];

    if (!matches.length) {
      reasons.push("STI-related language detected, but no specific STI registry match found.");
      return reasons;
    }

    matches.forEach(entry => {
      reasons.push(`Matched STI Registry entry: ${entry.name}.`);
    });

    if (this.hasAny(text, ["pregnant", "pregnancy"])) {
      reasons.push("Pregnancy changes STI treatment and follow-up considerations.");
    }

    if (this.hasAny(text, ["pelvic pain", "fever pelvic pain"])) {
      reasons.push("Pelvic pain may suggest PID or complicated STI syndrome.");
    }

    if (this.hasAny(text, ["joint pain", "rash"])) {
      reasons.push("Joint pain or rash can suggest disseminated infection in some STI contexts.");
    }

    if (this.hasAny(text, ["hiv exposure", "needle stick", "needlestick", "sexual exposure"])) {
      reasons.push("Potential HIV exposure may require time-sensitive PEP workflow.");
    }

    return reasons;
  },

  collect(entries = [], field = "") {
    return [
      ...new Set(
        entries.flatMap(entry => entry[field] || [])
      )
    ];
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
  },

  empty(error = "") {
    return {
      engine: "ari-sti-reasoning-engine",
      version: this.version,
      activated: false,
      matches: [],
      suspectedSTIs: [],
      syndromes: [],
      questions: [],
      patientEducation: [],
      monitoring: [],
      reportable: [],
      actions: [],
      priority: "routine",
      rationale: [],
      error,
      advisoryOnly: true
    };
  }
};

window.AriSTIReasoningEngine =
  window.Ari.medical.infectiousDisease.sti.reasoningEngine;

console.log(
  "ARI STI REASONING ENGINE LOADED:",
  window.Ari.medical.infectiousDisease.sti.reasoningEngine.version
);