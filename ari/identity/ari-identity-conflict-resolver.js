// ari/identity/ari-identity-conflict-resolver.js
// Ari Identity Conflict Resolver
// Purpose: Resolve tension when multiple identities/roles are active.
// V1.1
// Fixes:
// - Prevents weak clarity signals from forcing planner as lead during uncertainty.
// - Lets observer lead when Ari has no hypothesis and no evidence.
// - Avoids self-support bugs like planner supporting planner.
// - Adds uncertainty-aware identity resolution.

window.AriIdentityConflictResolver = {
  resolve(input = {}) {
    const summary = input.summary || input || {};

    const leadIdentity = summary.leadIdentity || null;

    const supportingIdentities = Array.isArray(summary.supportingIdentities)
      ? summary.supportingIdentities
      : [];

    const rankedIdentities = Array.isArray(summary.rankedIdentities)
      ? summary.rankedIdentities
      : [];

    const wisdomTension = summary.wisdomTension || null;
    const highestGood = summary.highestGood || null;
    const wisdomLeadingGood = summary.wisdomLeadingGood || null;
    const primaryPriority = summary.primaryPriority || null;
    const dominantValue = summary.dominantValue || null;
    const primaryLifeSignal = summary.primaryLifeSignal || null;
    const lifePriorityClass = summary.lifePriorityClass || "none";
    const rootNeed = summary.rootNeed || summary.primaryNeed || null;
    const primaryEmotion = summary.primaryEmotion || summary.surfaceEmotion || null;

    const uncertaintyType = summary.uncertaintyType || null;
    const shouldContinueObserving = Boolean(summary.shouldContinueObserving);
    const hypothesis = summary.hypothesis || null;
    const evidenceStrength = summary.evidenceStrength || "none";
    const primaryLifeChapter = summary.primaryLifeChapter || null;

    const noEvidence =
      !evidenceStrength ||
      evidenceStrength === "none" ||
      evidenceStrength === "unknown";

    const hardUncertainty =
      shouldContinueObserving ||
      uncertaintyType === "missing_information" ||
      uncertaintyType === "understanding_uncertainty" ||
      (!hypothesis && noEvidence);

    const identities = rankedIdentities.length
      ? rankedIdentities
      : [
          leadIdentity
            ? {
                name: leadIdentity,
                score: summary.leadIdentityScore || 70,
                protects: summary.leadIdentityProtects || [],
                motivations: summary.leadIdentityMotivations || []
              }
            : null,
          ...supportingIdentities
        ].filter(Boolean);

    function cleanSupport(lead, support) {
      if (!support || support === lead) return null;
      return support;
    }

    function identityExists(name) {
      return identities.some(item => item.name === name);
    }

    function getIdentityScore(name) {
      const found = identities.find(item => item.name === name);
      return Number(found?.score || 0);
    }

    // Hard uncertainty override.
    // If Ari does not have evidence yet, no identity should pretend to lead.
    if (hardUncertainty) {
      const observerExists = identityExists("observer");
      const plannerScore = getIdentityScore("planner");
      const observerScore = getIdentityScore("observer");

      const usePlannerOnlyIfStrong =
        plannerScore >= 70 &&
        plannerScore >= observerScore + 20 &&
        uncertaintyType !== "missing_information";

      return {
        identityConflictDetected: false,
        conflictType: "uncertainty_identity_pause",

        resolvedLeadIdentity: usePlannerOnlyIfStrong
          ? "planner"
          : observerExists
            ? "observer"
            : "observer",

        resolvedSupportingIdentity: usePlannerOnlyIfStrong
          ? "observer"
          : identityExists("planner")
            ? "planner"
            : null,

        resolutionMode: "continue_observing",
        resolutionReason:
          "Ari does not have enough evidence yet, so identity leadership should pause. Observer should lead until the situation becomes clearer.",
        identityConflictQuestion:
          summary.recommendedRecoveryQuestion ||
          "What information feels most missing right now?",

        competingIdentities: identities.map(item => ({
          name: item.name,
          score: item.score,
          protects: item.protects || [],
          motivations: item.motivations || []
        })),

        source: "ari-identity-conflict-resolver"
      };
    }

    if (identities.length === 0) {
      return {
        identityConflictDetected: false,
        resolvedLeadIdentity: "observer",
        resolvedSupportingIdentity: null,
        conflictType: "none_detected",
        resolutionMode: "continue_observing",
        resolutionReason: "No active identity conflict was detected.",
        identityConflictQuestion: "What do you need to understand before choosing a direction?",
        competingIdentities: [],
        source: "ari-identity-conflict-resolver"
      };
    }

    const sorted = [...identities].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    const first = sorted[0];
    const second = sorted[1] || null;

    const closeScore =
      second && Math.abs((first.score || 0) - (second.score || 0)) <= 10;

    let conflictDetected = Boolean(second && closeScore);
    let conflictType = conflictDetected
      ? "identity_leadership_tension"
      : "none_detected";

    let resolvedLead = first.name;
    let resolvedSupport = second ? second.name : null;

    let resolutionMode = conflictDetected
      ? "seasonal_ordering"
      : "single_identity_lead";

    let reason = conflictDetected
      ? `${first.name} and ${second.name} are both active and close in priority.`
      : `${first.name} is clearly leading.`;

    let question = "Which identity should lead this moment?";

    function sortedIdentityExists(name) {
      return sorted.some(item => item.name === name);
    }

    function setResolution(
      lead,
      support,
      mode,
      why,
      q,
      type = "identity_leadership_tension"
    ) {
      resolvedLead = lead || "observer";
      resolvedSupport = cleanSupport(resolvedLead, support);
      resolutionMode = mode;
      reason = why;
      question = q;
      conflictType = type;
      conflictDetected = true;
    }

    // Fatherhood / family should strongly lead during major family transitions.
    if (
      primaryLifeSignal === "fatherhood_transition" ||
      primaryLifeSignal === "family_transition" ||
      lifePriorityClass === "major_life_priority"
    ) {
      if (sortedIdentityExists("father")) {
        setResolution(
          "father",
          sortedIdentityExists("builder") ? "builder" : "family-protector",
          "protect_major_life_chapter",
          "A major family or fatherhood transition is active, so fatherhood should lead while other identities stay alive in support.",
          "What kind of father does this season require before anything else gets more attention?",
          "major_life_chapter_priority"
        );
      } else if (sortedIdentityExists("family-protector")) {
        setResolution(
          "family-protector",
          sortedIdentityExists("builder") ? "builder" : "present-self",
          "protect_major_life_chapter",
          "A major family transition is active, so family protection should lead while other identities support.",
          "What does protecting your family require before adding more goals?",
          "major_life_chapter_priority"
        );
      }
    }

    // Presence vs achievement
    if (wisdomTension === "presence_vs_achievement") {
      setResolution(
        sortedIdentityExists("present-self") ? "present-self" : "family-protector",
        sortedIdentityExists("builder") ? "builder" : "planner",
        "presence_before_achievement",
        "Presence and achievement are both meaningful, but presence contains moments that cannot be recovered later.",
        "What moment of presence needs protection before achievement gets more attention?",
        "presence_achievement_tension"
      );
    }

    // Family vs purpose
    if (wisdomTension === "family_vs_purpose") {
      setResolution(
        sortedIdentityExists("family-protector") ? "family-protector" : "father",
        sortedIdentityExists("builder") ? "builder" : "creator",
        "family_leads_purpose_supports",
        "Family and purpose are both meaningful, but purpose should serve love instead of competing with it.",
        "How can your purpose stay alive without competing with your family?",
        "family_purpose_tension"
      );
    }

    // Creation priority
    if (
      primaryPriority === "creation" ||
      dominantValue === "creation" ||
      wisdomLeadingGood === "sustainable_purpose" ||
      primaryLifeChapter === "builder_development" ||
      primaryLifeChapter === "creative_mission_chapter"
    ) {
      if (sortedIdentityExists("builder")) {
        setResolution(
          "builder",
          sortedIdentityExists("family-protector") ? "family-protector" : "steward",
          "sustainable_creation",
          "Creation appears important, but it should move at a sustainable pace instead of consuming the whole system.",
          "What rhythm would keep your purpose alive without overextending you?",
          "creation_sustainability_tension"
        );
      }
    }

    // Stewardship correction: responsibility is not automatically fear.
    if (
      primaryEmotion === "stewardship" ||
      primaryEmotion === "responsibility" ||
      rootNeed === "stability"
    ) {
      if (sortedIdentityExists("steward")) {
        setResolution(
          "steward",
          resolvedLead === "steward" ? resolvedSupport : resolvedLead,
          "stewardship_leads",
          "The emotional tone suggests stewardship, not fear. Ari should treat this as careful responsibility unless stronger evidence says otherwise.",
          "What has been entrusted to you that needs careful stewardship right now?",
          "stewardship_priority"
        );
      }
    }

    // Highest good: protect family
    if (highestGood === "protect_family" || wisdomLeadingGood === "family") {
      if (sortedIdentityExists("family-protector") || sortedIdentityExists("father")) {
        setResolution(
          sortedIdentityExists("father") ? "father" : "family-protector",
          sortedIdentityExists("builder") ? "builder" : "steward",
          "family_first",
          "The highest good points toward protecting family, so family identity should lead.",
          "What does family need from you before your other identities get more attention?",
          "family_priority"
        );
      }
    }

    // Highest good: protect clarity
    // Important: clarity should NOT force planner during uncertainty.
    // It can only resolve toward planner when there is a hypothesis or evidence.
    if (
      !hardUncertainty &&
      (highestGood === "protect_clarity" || wisdomLeadingGood === "clarity")
    ) {
      if (sortedIdentityExists("planner") || sortedIdentityExists("observer")) {
        const plannerScore = getIdentityScore("planner");
        const observerScore = getIdentityScore("observer");

        const clarityLead =
          plannerScore >= 60 && plannerScore >= observerScore
            ? "planner"
            : "observer";

        setResolution(
          clarityLead,
          cleanSupport(
            clarityLead,
            clarityLead === "planner" && sortedIdentityExists("observer")
              ? "observer"
              : resolvedLead
          ),
          "clarity_before_action",
          "The highest good points toward clarity, so Ari should avoid forcing action too early.",
          "What would enough clarity look like before moving forward?",
          "clarity_priority"
        );
      }
    }

    resolvedSupport = cleanSupport(resolvedLead, resolvedSupport);

    return {
      identityConflictDetected: conflictDetected,
      conflictType,

      resolvedLeadIdentity: resolvedLead,
      resolvedSupportingIdentity: resolvedSupport,

      resolutionMode,
      resolutionReason: reason,
      identityConflictQuestion: question,

      competingIdentities: sorted.map(item => ({
        name: item.name,
        score: item.score,
        protects: item.protects || [],
        motivations: item.motivations || []
      })),

      source: "ari-identity-conflict-resolver"
    };
  }
};