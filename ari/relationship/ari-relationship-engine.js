// ari/relationship/ari-relationship-engine.js
// Ari Relationship Engine
// Purpose: Build advisory user relationship/style context.
// V1.0.0

window.Ari = window.Ari || {};

window.AriRelationshipEngine = {
  version: "1.0.0",

  async evaluate(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const storedProfile = await this.loadProfile(summary);
    const signals = this.detectRelationshipSignals(text, summary);

    const relationshipProfile = this.mergeProfile(storedProfile, signals);

    return {
      relationshipEngineRan: true,
      relationshipEngineVersion: this.version,
      relationshipEngineSource: "ari-relationship-engine",

      relationshipProfile,
      relationshipSignals: signals,

      preferredCommunicationStyle: relationshipProfile.communicationStyle,
      preferredDepth: relationshipProfile.depth,
      collaborationMode: relationshipProfile.collaborationMode,
      challengeTolerance: relationshipProfile.challengeTolerance,

      authority: "advisory_style_context_only",
      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation"
      ]
    };
  },

  async loadProfile(summary = {}) {
    try {
      if (
        window.AriMemoryStore &&
        typeof window.AriMemoryStore.loadRelationshipProfile === "function"
      ) {
        const result = await window.AriMemoryStore.loadRelationshipProfile(summary);
        return result?.relationshipProfile || {};
      }
    } catch (error) {
      console.warn("AriRelationshipEngine profile load failed:", error);
    }

    return window.Ari.relationshipProfile || {};
  },

  detectRelationshipSignals(text = "", summary = {}) {
    const signals = [];

    if (this.hasAny(text, ["send code", "full code", "where do i place", "exactly where"])) {
      signals.push({
        type: "implementation_preference",
        value: "code_first_exact_placement",
        strength: 0.9,
        evidence: "User asks for exact code or placement."
      });
    }

    if (this.hasAny(text, ["roadmap", "plan", "build order", "what next"])) {
      signals.push({
        type: "collaboration_preference",
        value: "stepwise_architectural_planning",
        strength: 0.86,
        evidence: "User prefers staged build plans."
      });
    }

    if (this.hasAny(text, ["be blunt", "be direct", "don't sugarcoat", "hold me accountable"])) {
      signals.push({
        type: "tone_preference",
        value: "direct_accountable",
        strength: 0.9,
        evidence: "User requests direct accountability."
      });
    }

    if (this.hasAny(text, ["will it interfere", "will it break", "authority", "pipeline"])) {
      signals.push({
        type: "architecture_concern",
        value: "protect_pipeline_boundaries",
        strength: 0.88,
        evidence: "User is concerned about interference and authority."
      });
    }

    if (this.hasAny(text, ["ari rebirth", "calbuddy", "supabase", "memory", "relationship"])) {
      signals.push({
        type: "project_context",
        value: "long_term_ai_app_architecture",
        strength: 0.82,
        evidence: "User is working on long-term Ari/CalBuddy architecture."
      });
    }

    return signals;
  },

  mergeProfile(stored = {}, signals = []) {
    const profile = {
      communicationStyle: stored.communicationStyle || "direct_warm_practical",
      depth: stored.depth || "high",
      collaborationMode: stored.collaborationMode || "co_designer",
      challengeTolerance: stored.challengeTolerance || "medium_high",
      technicalComfort: stored.technicalComfort || "growing_builder",
      preferredFormat: stored.preferredFormat || "step_by_step_with_code",
      trustLevel: stored.trustLevel || "developing",
      activeProjects: Array.isArray(stored.activeProjects)
        ? [...stored.activeProjects]
        : [],
      stablePreferences: {
        ...(stored.stablePreferences || {})
      },
      reasons: Array.isArray(stored.reasons) ? [...stored.reasons] : []
    };

    signals.forEach(signal => {
      if (signal.type === "implementation_preference") {
        profile.preferredFormat = "exact_code_and_placement";
        profile.stablePreferences.codePlacement = "show_exact_location";
      }

      if (signal.type === "collaboration_preference") {
        profile.collaborationMode = "stepwise_co_designer";
        profile.stablePreferences.planning = "roadmap_first_then_code";
      }

      if (signal.type === "tone_preference") {
        profile.communicationStyle = "direct_accountable_warm";
        profile.challengeTolerance = "high";
        profile.stablePreferences.accountability = "welcomed";
      }

      if (signal.type === "architecture_concern") {
        profile.stablePreferences.architecture = "protect_pipeline_boundaries";
      }

      if (signal.type === "project_context") {
        this.addUnique(profile.activeProjects, "Ari Rebirth");
      }

      this.addUnique(profile.reasons, signal.evidence);
    });

    window.Ari.relationshipProfile = profile;

    return profile;
  },

  addUnique(list = [], value = "") {
    if (!value || list.includes(value)) return;
    list.push(value);
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(String(term).toLowerCase()));
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI RELATIONSHIP ENGINE LOADED:",
  window.AriRelationshipEngine?.version
);