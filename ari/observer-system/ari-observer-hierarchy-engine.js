// ari/observer-system/ari-observer-hierarchy-engine.js
// Ari Observer Hierarchy Engine
// Purpose: Debugging mirror for what Ari notices, while obeying Situation Contract.
// V2.0.0

window.Ari = window.Ari || {};

window.Ari.observerHierarchyEngine = {
  version: "2.0.0",

  placeholderSignals: new Set([
    "unclear",
    "unknown",
    "none",
    "none_detected",
    "general",
    "general-priority",
    "general_understanding",
    "unclear_chapter",
    "unclear_regret",
    "unclear_path",
    "continue_observing",
    "prioritize_with_caution",
    "chosen_sacrifice",
    "the other meaningful priority"
  ]),

  analyze(observation = {}) {
    const summary = observation.summary || observation || {};
    const contract = summary.situationContract || {};
    const triage = summary.ariTriage || summary.triage || {};

    const observationLedger =
      summary.observationLedger ||
      summary.rankedLedgerObservations ||
      observation.observationLedger ||
      observation.rankedLedgerObservations ||
      [];

    const contractPrimary =
      summary.situationContractPrimary ||
      contract.primary ||
      triage.primaryLane ||
      summary.triagePrimaryLane ||
      null;

    const contractSupport =
      summary.situationContractSupport ||
      contract.support ||
      triage.supportLanes ||
      [];

    const contractBrief =
      summary.situationContractBrief ||
      contract.brief ||
      triage.briefLanes ||
      [];

    const contractContext =
      summary.situationContractContext ||
      contract.context ||
      triage.contextLanes ||
      [];

    const contractDeferred =
      summary.situationContractDeferred ||
      contract.deferred ||
      triage.deferredLanes ||
      [];

    const contractBlocked =
      summary.situationContractBlocked ||
      contract.blocked ||
      triage.blockedLanes ||
      [];

    const clarity = contract.clarity || summary.clarity || {};
    const risk = contract.risk || summary.risk || {};

    const candidates = this.buildCandidates({
      summary,
      observation,
      observationLedger
    });

    const ranked = this.rankCandidates(this.dedupeCandidates(candidates));

    const classified = ranked.map(candidate =>
      this.classifyCandidate(candidate, {
        contractPrimary,
        contractSupport,
        contractBrief,
        contractContext,
        contractDeferred,
        contractBlocked
      })
    );

    const primaryObservation =
      classified.find(item => item.role === "primary_support") ||
      classified.find(item => item.role === "context_only") ||
      classified.find(item => item.role === "brief_support") ||
      classified[0] ||
      this.defaultCandidate();

    const suppressedObservations = classified.filter(item =>
      ["deferred", "blocked", "suppressed"].includes(item.role)
    );

    const leakRisk = this.detectLeakRisk({
      classified,
      contractPrimary,
      contractDeferred,
      contractBlocked,
      summary
    });

    const shouldAskClarifyingQuestion =
      clarity.needed === true &&
      !!clarity.question &&
      !["safety", "medical_body", "risk_clarification"].includes(contractPrimary);

    return {
      system: "ari-observer-hierarchy-engine",
      version: this.version,

      contractAware: true,
      contractPrimary,
      contractSupport,
      contractBrief,
      contractContext,
      contractDeferred,
      contractBlocked,

      ledgerAvailable: Array.isArray(observationLedger),
      ledgerCount: observationLedger.length || 0,

      primaryObservation: primaryObservation.name,
      primaryCategory: primaryObservation.category,
      primaryRole: primaryObservation.role || "unknown",
      primaryReason: primaryObservation.reason,
      primaryConfidence: primaryObservation.confidence,

      supportingObservations: classified
        .filter(item =>
          ["primary_support", "brief_support", "context_only"].includes(item.role) &&
          item.name !== primaryObservation.name
        )
        .slice(0, 6),

      suppressedObservations,
      knownObservations: classified.filter(item => item.role !== "unknown"),
      unknownObservations: classified.filter(item => item.role === "unknown"),

      leakRisk,

      dominantTension: this.safeSignal(summary.wisdomTension || summary.apparentConflict),
      lifeChapter: this.safeSignal(summary.primaryLifeChapter),

      recommendedExecutiveInstruction:
        this.recommendExecutiveInstruction({
          contractPrimary,
          primaryObservation,
          suppressedObservations,
          leakRisk,
          risk
        }),

      shouldAskClarifyingQuestion,

      recommendedQuestion: shouldAskClarifyingQuestion
        ? clarity.question
        : null,

      rankedObservations: classified,
      rankedUnknowns: classified.filter(item => item.role === "unknown")
    };
  },

  buildCandidates({ summary = {}, observation = {}, observationLedger = [] }) {
    const candidates = [];

    const add = (candidate = {}) => {
      if (!candidate.name) return;

      const normalized = this.normalizeSignal(candidate.name);

      candidates.push({
        name: candidate.name,
        category: candidate.category || "observation",
        source: candidate.source || "unknown",
        weight: candidate.weight || 50,
        confidence: candidate.confidence || 0.7,
        reason: candidate.reason || "Signal detected.",
        isPlaceholder: this.isPlaceholderSignal(normalized),
        evidence: candidate.evidence || null
      });
    };

    if (Array.isArray(observationLedger)) {
      observationLedger.forEach(entry => {
        const name =
          entry.signal ||
          entry.value ||
          entry.type ||
          entry.name ||
          null;

        if (!name) return;

        add({
          name,
          category: this.categoryFromLedger(entry),
          source: "observation_ledger",
          weight: this.weightLedger(entry),
          confidence: this.normalizeConfidence(entry.confidence),
          reason: entry.evidence || entry.reason || "Direct observation ledger signal.",
          evidence: entry
        });
      });
    }

    if (summary.situationContractPrimary || summary.triagePrimaryLane) {
      add({
        name: summary.situationContractPrimary || summary.triagePrimaryLane,
        category: "contract_lane",
        source: "situation_contract",
        weight: 105,
        confidence: 0.98,
        reason: "Situation Contract selected this lane."
      });
    }

    if (summary.primaryHumanNeed) {
      add({
        name: `${summary.primaryHumanNeed}_need`,
        category: "human_need",
        source: "human_needs_network",
        weight: this.weightHumanNeed(summary.primaryHumanNeed),
        confidence: this.normalizeConfidence(summary.primaryHumanNeedScore || 80),
        reason: `Human need detected: ${summary.primaryHumanNeed}.`
      });
    }

    if (summary.primaryLifeChapter) {
      add({
        name: summary.primaryLifeChapter,
        category: "life_chapter",
        source: "life_chapter_engine",
        weight: 74,
        confidence: this.normalizeConfidence(summary.lifeChapterStrength || 70),
        reason: "Life chapter signal detected."
      });
    }

    if (summary.wisdomTension) {
      add({
        name: summary.wisdomTension,
        category: "wisdom",
        source: "wisdom_engine",
        weight: 72,
        confidence: 0.78,
        reason: "Wisdom tension detected."
      });
    }

    if (summary.emotionalClassification) {
      add({
        name: summary.emotionalClassification,
        category: "emotion",
        source: "emotion_engine",
        weight: 65,
        confidence: 0.75,
        reason: "Emotion signal detected."
      });
    }

    if (summary.uncertaintyType) {
      add({
        name: summary.uncertaintyType,
        category: "uncertainty",
        source: "uncertainty_engine",
        weight: 55,
        confidence: this.normalizeConfidence(summary.uncertaintyConfidence || 60),
        reason: "Uncertainty signal detected."
      });
    }

    return candidates;
  },

  classifyCandidate(candidate, contract = {}) {
    const name = this.normalizeSignal(candidate.name);
    const category = this.normalizeSignal(candidate.category);

    const primary = this.normalizeSignal(contract.contractPrimary);
    const support = contract.contractSupport.map(x => this.normalizeSignal(x));
    const brief = contract.contractBrief.map(x => this.normalizeSignal(x));
    const context = contract.contractContext.map(x => this.normalizeSignal(x));
    const deferred = contract.contractDeferred.map(x => this.normalizeSignal(x));
    const blocked = contract.contractBlocked.map(x => this.normalizeSignal(x));

    let role = "support_only";
    let roleReason = "Signal may support the response but cannot lead.";

    if (candidate.isPlaceholder) {
      role = "unknown";
      roleReason = "Placeholder or unclear signal cannot lead.";
    } else if (blocked.includes(name) || blocked.includes(category)) {
      role = "blocked";
      roleReason = "Blocked by Situation Contract.";
    } else if (deferred.includes(name) || deferred.includes(category)) {
      role = "deferred";
      roleReason = "Deferred by Situation Contract.";
    } else if (name === primary || category === primary) {
      role = "primary_support";
      roleReason = "Matches Situation Contract primary lane.";
    } else if (support.includes(name) || support.includes(category)) {
      role = "support_only";
      roleReason = "Allowed as support by Situation Contract.";
    } else if (brief.includes(name) || brief.includes(category)) {
      role = "brief_support";
      roleReason = "Allowed only briefly by Situation Contract.";
    } else if (context.includes(name) || context.includes(category)) {
      role = "context_only";
      roleReason = "Allowed as context only.";
    }

    return {
      ...candidate,
      score: Math.round(candidate.weight * candidate.confidence),
      role,
      roleReason
    };
  },

  detectLeakRisk({ classified = [], contractPrimary, contractDeferred = [], contractBlocked = [], summary = {} }) {
    const risks = [];

    const hasGenericQuestion =
      summary.recommendedRecoveryQuestion ||
      summary.identityRecoveryQuestion ||
      summary.lifeChapterQuestion ||
      summary.valueIntegrationQuestion;

    const primary = this.normalizeSignal(contractPrimary);

    const dangerousForGenericQuestion = [
      "builder",
      "teacher",
      "medical_body",
      "medical_context",
      "safety",
      "risk_clarification",
      "executive_decision"
    ];

    if (hasGenericQuestion && dangerousForGenericQuestion.includes(primary)) {
      risks.push("Generic recovery question may leak despite direct contract lane.");
    }

    classified.forEach(item => {
      if (
        ["life_chapter", "emotion", "wisdom", "uncertainty", "deep_emotion"].includes(item.category) &&
        ["deferred", "blocked"].includes(item.role)
      ) {
        risks.push(`${item.category} signal '${item.name}' is ${item.role} and must not lead language.`);
      }
    });

    if (contractDeferred.includes("life_chapter") || contractBlocked.includes("life_chapter")) {
      risks.push("Life chapter language must not appear unless explicitly allowed by contract.");
    }

    return [...new Set(risks)];
  },

  recommendExecutiveInstruction({ contractPrimary, primaryObservation, suppressedObservations = [], leakRisk = [], risk = {} }) {
    if (risk.override === "safety_emergency" || contractPrimary === "safety") {
      return "Obey safety contract. Suppress all reflective or philosophical language.";
    }

    if (risk.override === "medical_urgent" || contractPrimary === "medical_body") {
      return "Obey medical/body contract. Give calm direct medical next step.";
    }

    if (contractPrimary === "medical_context") {
      return "Lead with medical context and practical next step. Do not escalate unless red flags are present.";
    }

    if (contractPrimary === "builder") {
      return "Lead with build/debug action. Reflection can only support briefly.";
    }

    if (contractPrimary === "teacher") {
      return "Teach directly. Do not ask uncertainty or wisdom questions first.";
    }

    if (contractPrimary === "executive_decision") {
      return "Organize the decision and name the next step.";
    }

    if (leakRisk.length) {
      return "Follow Situation Contract and suppress deferred/blocked signals.";
    }

    return `Support contract primary '${contractPrimary || "unknown"}' without changing the lead.`;
  },

  dedupeCandidates(candidates = []) {
    const map = new Map();

    candidates.forEach(candidate => {
      const key = `${candidate.category}:${candidate.name}`;
      const score = (candidate.weight || 0) * (candidate.confidence || 0);
      const existing = map.get(key);
      const existingScore = existing
        ? (existing.weight || 0) * (existing.confidence || 0)
        : -Infinity;

      if (!existing || score > existingScore) {
        map.set(key, candidate);
      }
    });

    return Array.from(map.values());
  },

  rankCandidates(candidates = []) {
    return candidates
      .map(item => ({
        ...item,
        score: Math.round((item.weight || 0) * (item.confidence || 0))
      }))
      .sort((a, b) => b.score - a.score);
  },

  categoryFromLedger(entry = {}) {
    const type = entry.type || "";
    const value = entry.value || "";

    if (type.includes("body")) return "medical_context";
    if (type.includes("symptom")) return "medical_context";
    if (type.includes("emotion")) return "emotion";
    if (type.includes("building")) return "builder";
    if (type.includes("knowledge")) return "teacher";
    if (type.includes("question")) return "request";
    if (value === "pregnant" || value === "pregnancy") return "medical_context";

    return entry.category || "observation";
  },

  weightLedger(entry = {}) {
    const category = this.categoryFromLedger(entry);

    const weights = {
      safety: 110,
      medical_body: 106,
      medical_context: 96,
      builder: 94,
      teacher: 92,
      request: 88,
      emotion: 70,
      wisdom: 68,
      life_chapter: 55,
      observation: 60
    };

    return weights[category] || 60;
  },

  weightHumanNeed(need = "") {
    const weights = {
      safety: 100,
      security: 94,
      body: 98,
      health: 96,
      execution: 90,
      understanding: 88,
      clarity: 86,
      worth: 76,
      connection: 74,
      wisdom: 70
    };

    return weights[need] || 70;
  },

  normalizeConfidence(value = 0.7) {
    const number = Number(value);

    if (!Number.isFinite(number)) return 0.7;
    if (number > 1) return Math.min(0.99, Math.max(0.1, number / 100));

    return Math.min(0.99, Math.max(0.1, number));
  },

  safeSignal(value) {
    return this.isRealSignal(value) ? value : null;
  },

  normalizeSignal(value = "") {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ");
  },

  isRealSignal(value) {
    if (value === null || value === undefined) return false;

    const text = this.normalizeSignal(value);
    if (!text) return false;

    return !this.placeholderSignals.has(text) &&
      !this.placeholderSignals.has(text.replace(/\s+/g, "_")) &&
      !this.placeholderSignals.has(text.replace(/\s+/g, "-"));
  },

  isPlaceholderSignal(value) {
    return !this.isRealSignal(value);
  },

  defaultCandidate() {
    return {
      name: "general_understanding",
      category: "general",
      source: "default",
      weight: 50,
      confidence: 0.5,
      score: 25,
      role: "unknown",
      reason: "No dominant known observation was detected.",
      roleReason: "Default fallback."
    };
  }
};