// ari/language/ari-blueprint-writer.js
// Purpose: Fast reusable local drafts from expression blueprints.
// V1.0.0 — Blueprint Families / Local Drafts / AI-Safe Handoff

window.Ari = window.Ari || {};

window.AriBlueprintWriter = {
  version: "1.0.0",

  write(input = {}) {
    const packet = input.composerPacket || input.packet || input || {};
    const question = String(packet.userQuestion || "").trim();

    if (!packet?.ready || !question) {
      return this.returnDraft("", "blueprint_packet_missing", false);
    }

    const blueprint = this.resolveBlueprint(packet);
    if (!blueprint) {
      return this.returnDraft("", "no_matching_blueprint", false);
    }

    const draft = this.renderDraft({ packet, blueprint, question });

    if (!draft) {
      return this.returnDraft("", "blueprint_no_local_draft", false, blueprint);
    }

    return this.returnDraft(
      draft,
      `blueprint_${blueprint.id}`,
      true,
      blueprint
    );
  },

  resolveBlueprint(packet = {}) {
    const id =
      packet.blueprintHint ||
      packet.expressionPlan?.blueprintId ||
      packet.mouthDirective?.blueprintHint ||
      "general_direct_response";

    return this.blueprints[id] || this.blueprints.general_direct_response;
  },

  renderDraft({ packet = {}, blueprint = {}, question = "" } = {}) {
    const terms = packet.evidence?.lexicalGrounding?.preferredTerms || {};
    const component = terms.composerComponent?.short || terms.thingToFix?.short || "that";
    const bodyProblem = terms.bodyProblem?.short || "that pain";
    const decision = terms.decisionOption?.short || terms.centralTradeoff?.short || "the choice";

    switch (blueprint.id) {
      case "emotion_presence_grounding":
        return "Yeah, I hear you. Don’t try to solve the whole thing from this mood. Do one stabilizing move first: stand up, drink some water, and take 5–10 minutes away from the screen. Then come back and choose the next step with a clearer head.";

      case "emotion_balance_repair":
        return "Yeah — this is one of those moments where the thing itself may not be the enemy, but the imbalance is. Your body, mood, and relationship are starting to pay the bill. Do one repair move today: take a 10-minute walk, then say, “You’re right to worry. I’ve been off balance, and I’m going to protect time for my health and for us.”";

      case "decision_tradeoff":
        return `The real issue is the tradeoff, not just ${decision}. Separate it into two questions: what matters most right now, and what can wait without causing damage. My move would be: pick the option that protects the highest-priority thing first, then make the next step small enough to actually do.`;

      case "builder_direct_help":
        return `Yes — for ${component}, keep it practical: identify the exact file, make one contained patch, then test the timing/output before changing anything else. Don’t merge three more ideas into this until the current path is stable.`;

      case "knowledge_clear_explanation":
        return "Yes. The simplest way to think about it is: answer the direct question first, then explain only enough to make the answer usable. Don’t turn every answer into a lecture.";

      case "relationship_repair_clarity":
        return "The move is not to win the argument. It is to lower the temperature and repair trust. Say the true thing plainly, own your part without over-apologizing, and ask for one concrete next step you both can actually do.";

      case "medical_context_calm_guidance":
        return `For ${bodyProblem}, treat it seriously but don’t panic. Start with the safest simple step: monitor severity, avoid anything that worsens it, and contact a clinician if it is severe, worsening, unusual, or comes with red flags.`;

      case "memory_direct_acknowledgment":
        return "Got it. I’ll keep that in mind.";

      case "wisdom_principle_then_step":
        return "The principle is simple: don’t let urgency pretend to be importance. Pick the next move that protects what matters long term, not just what feels loud right now.";

      case "safety_urgent_support":
        return "Pause everything else and focus on immediate safety. Get away from the danger if you can, contact emergency help or a trusted person nearby, and do not handle this alone.";

      default:
        return "Yes. The clean move is to answer the current question directly, keep it specific, and give one useful next step instead of overcomplicating it.";
    }
  },

  blueprints: {
    emotion_presence_grounding: {
      id: "emotion_presence_grounding",
      strategy: "present",
      responseGoal: "stabilize",
      pacing: "slow",
      empathy: "high",
      directness: "medium",
      warmth: "high",
      bluntness: "low",
      structure: ["acknowledge", "reflect_pattern", "one_grounding_step", "steady_close"],
      openingMove: "acknowledge_emotion",
      coreMove: "stabilize_before_solving",
      closingStyle: "quiet_confidence",
      questionStyle: "none",
      askLimit: 0,
      validateEmotion: true,
      challengeThinking: false,
      teachConcept: false,
      actionCount: 1,
      adviceStyle: "one_step",
      explanationDepth: "low",
      exampleAllowed: false,
      optimism: "quiet",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: true
    },

    emotion_balance_repair: {
      id: "emotion_balance_repair",
      strategy: "repair",
      responseGoal: "restore_balance",
      pacing: "slow",
      empathy: "high",
      directness: "medium",
      warmth: "high",
      bluntness: "medium",
      structure: ["acknowledge", "name_pattern", "one_repair_step", "steady_close"],
      openingMove: "name_emotional_load",
      coreMove: "protect_relationship_and_body",
      closingStyle: "grounded",
      questionStyle: "none",
      askLimit: 0,
      validateEmotion: true,
      challengeThinking: true,
      teachConcept: false,
      actionCount: 1,
      adviceStyle: "repair_step",
      explanationDepth: "low",
      exampleAllowed: true,
      optimism: "quiet",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: false
    },

    decision_tradeoff: {
      id: "decision_tradeoff",
      strategy: "organize",
      responseGoal: "choose_next_step",
      pacing: "medium",
      empathy: "medium",
      directness: "high",
      warmth: "medium",
      bluntness: "medium",
      structure: ["name_tradeoff", "separate_options", "recommend_next_step"],
      openingMove: "name_tradeoff",
      coreMove: "prioritize",
      closingStyle: "clear_next_step",
      questionStyle: "optional",
      askLimit: 1,
      validateEmotion: false,
      challengeThinking: true,
      teachConcept: false,
      actionCount: 1,
      adviceStyle: "recommendation",
      explanationDepth: "medium",
      exampleAllowed: true,
      optimism: "realistic",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: true
    },

    builder_direct_help: {
      id: "builder_direct_help",
      strategy: "build",
      responseGoal: "fix_or_patch",
      pacing: "fast",
      empathy: "low",
      directness: "high",
      warmth: "low",
      bluntness: "medium",
      structure: ["diagnose", "patch", "test"],
      openingMove: "skip_fluff",
      coreMove: "specific_fix",
      closingStyle: "test_instruction",
      questionStyle: "only_if_needed",
      askLimit: 1,
      validateEmotion: false,
      challengeThinking: false,
      teachConcept: true,
      actionCount: 2,
      adviceStyle: "steps",
      explanationDepth: "medium",
      exampleAllowed: true,
      optimism: "practical",
      humorAllowed: true,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "technical_plain",
      aiAllowed: true
    },

    knowledge_clear_explanation: {
      id: "knowledge_clear_explanation",
      strategy: "explain",
      responseGoal: "understand",
      pacing: "medium",
      empathy: "low",
      directness: "high",
      warmth: "medium",
      bluntness: "low",
      structure: ["direct_answer", "brief_explanation", "example"],
      openingMove: "answer_first",
      coreMove: "plain_explanation",
      closingStyle: "optional_example",
      questionStyle: "none",
      askLimit: 0,
      validateEmotion: false,
      challengeThinking: false,
      teachConcept: true,
      actionCount: 0,
      adviceStyle: "explain",
      explanationDepth: "medium",
      exampleAllowed: true,
      optimism: "neutral",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: true
    },

    relationship_repair_clarity: {
      id: "relationship_repair_clarity",
      strategy: "repair",
      responseGoal: "reduce_conflict",
      pacing: "slow",
      empathy: "high",
      directness: "medium",
      warmth: "high",
      bluntness: "low",
      structure: ["name_truth", "own_part", "repair_step"],
      openingMove: "name_relationship_truth",
      coreMove: "repair_trust",
      closingStyle: "calm_next_step",
      questionStyle: "optional",
      askLimit: 1,
      validateEmotion: true,
      challengeThinking: true,
      teachConcept: false,
      actionCount: 1,
      adviceStyle: "repair_step",
      explanationDepth: "low",
      exampleAllowed: true,
      optimism: "quiet",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: true
    },

    medical_context_calm_guidance: {
      id: "medical_context_calm_guidance",
      strategy: "guide",
      responseGoal: "safe_next_step",
      pacing: "calm",
      empathy: "medium",
      directness: "high",
      warmth: "medium",
      bluntness: "medium",
      structure: ["calm_boundary", "likely_next_step", "red_flags"],
      openingMove: "medical_first",
      coreMove: "safe_guidance",
      closingStyle: "red_flags",
      questionStyle: "only_if_needed",
      askLimit: 1,
      validateEmotion: true,
      challengeThinking: false,
      teachConcept: true,
      actionCount: 1,
      adviceStyle: "safety_first",
      explanationDepth: "medium",
      exampleAllowed: false,
      optimism: "careful",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "medical",
      medicalBoundary: true,
      legalBoundary: false,
      uncertaintyStyle: "careful",
      aiAllowed: true
    },

    safety_urgent_support: {
      id: "safety_urgent_support",
      strategy: "protect",
      responseGoal: "immediate_safety",
      pacing: "fast",
      empathy: "medium",
      directness: "maximum",
      warmth: "medium",
      bluntness: "high",
      structure: ["safety_first", "direct_action", "support"],
      openingMove: "urgent_direct",
      coreMove: "protect_now",
      closingStyle: "supportive",
      questionStyle: "minimal",
      askLimit: 1,
      validateEmotion: false,
      challengeThinking: false,
      teachConcept: false,
      actionCount: 1,
      adviceStyle: "urgent_step",
      explanationDepth: "low",
      exampleAllowed: false,
      optimism: "grounded",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "urgent",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "direct",
      aiAllowed: false
    },

    memory_direct_acknowledgment: {
      id: "memory_direct_acknowledgment",
      strategy: "acknowledge",
      responseGoal: "confirm",
      pacing: "fast",
      empathy: "low",
      directness: "high",
      warmth: "medium",
      bluntness: "low",
      structure: ["acknowledge"],
      openingMove: "confirm",
      coreMove: "store_or_acknowledge",
      closingStyle: "none",
      questionStyle: "none",
      askLimit: 0,
      validateEmotion: false,
      challengeThinking: false,
      teachConcept: false,
      actionCount: 0,
      adviceStyle: "none",
      explanationDepth: "none",
      exampleAllowed: false,
      optimism: "neutral",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: false
    },

    wisdom_principle_then_step: {
      id: "wisdom_principle_then_step",
      strategy: "principle",
      responseGoal: "clarify_values",
      pacing: "measured",
      empathy: "medium",
      directness: "high",
      warmth: "medium",
      bluntness: "medium",
      structure: ["principle", "application", "next_step"],
      openingMove: "principle_first",
      coreMove: "clarify_choice",
      closingStyle: "choice_point",
      questionStyle: "optional",
      askLimit: 1,
      validateEmotion: false,
      challengeThinking: true,
      teachConcept: true,
      actionCount: 1,
      adviceStyle: "principle_then_step",
      explanationDepth: "medium",
      exampleAllowed: true,
      optimism: "realistic",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: true
    },

    general_direct_response: {
      id: "general_direct_response",
      strategy: "answer",
      responseGoal: "help",
      pacing: "medium",
      empathy: "medium",
      directness: "high",
      warmth: "medium",
      bluntness: "low",
      structure: ["answer", "brief_reason", "next_step"],
      openingMove: "answer_first",
      coreMove: "be_useful",
      closingStyle: "optional",
      questionStyle: "none",
      askLimit: 0,
      validateEmotion: false,
      challengeThinking: false,
      teachConcept: false,
      actionCount: 1,
      adviceStyle: "direct",
      explanationDepth: "medium",
      exampleAllowed: true,
      optimism: "neutral",
      humorAllowed: false,
      profanityAllowed: false,
      safetyMode: "normal",
      medicalBoundary: false,
      legalBoundary: false,
      uncertaintyStyle: "plain",
      aiAllowed: true
    }
  },

  returnDraft(text = "", reason = "fallback", usedBlueprint = false, blueprint = null) {
    const draft = String(text || "").trim();

    return {
      blueprintWriterRan: true,
      blueprintWriterUsedBlueprint: usedBlueprint === true,
      blueprintWriterSource: "ari-blueprint-writer",
      blueprintWriterVersion: this.version,
      blueprintWriterReason: reason,
      blueprint: blueprint || null,
      blueprintId: blueprint?.id || null,
      draft,
      blueprintWriterDraft: draft
    };
  }
};

console.log("ARI BLUEPRINT WRITER LOADED:", window.AriBlueprintWriter.version);