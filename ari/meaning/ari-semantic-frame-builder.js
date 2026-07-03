// ari/meaning/ari-semantic-frame-builder.js
// Ari Semantic Frame Builder
// Purpose: Convert current user language into structured conceptual meaning.
// V2.2.0 — Multi-Domain Meaning / Priority Handoff / Planner Ready

window.Ari = window.Ari || {};

window.AriSemanticFrameBuilder = {
  version: "2.2.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const originalText = this.clean(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const normalized = this.normalizeText(originalText);
    const inheritedContext = this.readInheritedContext(summary);

    const features = this.extractUniversalFeatures(normalized, summary);
    const currentTurnFrames = this.generateFramesFromFeatures(features, normalized);
    const functionFrame = this.buildFunctionFrame(summary.conversationFunction || summary);
    const continuityFrame = this.buildContinuityFrame(
      normalized,
      inheritedContext,
      currentTurnFrames[0] || null
    );

    const allFrames = this.rankFrames([
      ...currentTurnFrames,
      functionFrame,
      ...(continuityFrame.isContinuation ? [continuityFrame] : [])
    ]);

    const primaryFrame = this.selectPrimaryFrame(allFrames, normalized, continuityFrame);
    const secondaryFrames = allFrames
      .filter(f => f && f.frameType !== primaryFrame.frameType)
      .slice(0, 8);

    const framePriority = this.buildFramePriority({
      primaryFrame,
      secondaryFrames,
      allFrames,
      features,
      normalized,
      continuityFrame
    });

    const canonicalMeaning = this.buildCanonicalMeaning({
      normalized,
      primaryFrame,
      secondaryFrames,
      continuityFrame,
      inheritedContext,
      summary,
      features,
      framePriority
    });

    const responseCharacteristics = this.buildResponseCharacteristics(
      normalized,
      primaryFrame,
      secondaryFrames,
      continuityFrame,
      summary,
      canonicalMeaning,
      framePriority
    );

    const emotionalOverlay = this.buildEmotionalOverlay(normalized, features);

    const ambiguity = this.buildAmbiguitySignal(
      normalized,
      primaryFrame,
      secondaryFrames,
      continuityFrame,
      summary,
      features
    );

    const handoff = this.buildHandoff({
      normalized,
      primaryFrame,
      secondaryFrames,
      continuityFrame,
      inheritedContext,
      responseCharacteristics,
      ambiguity,
      canonicalMeaning,
      framePriority
    });

    return {
      semanticFrameBuilderRan: true,
      semanticFrameBuilderVersion: this.version,
      semanticFrameSource: "ari-semantic-frame-builder",

      advisoryOnly: true,
      routingAuthority: false,
      composerAuthority: false,
      finalAnswerAuthority: false,

      originalText,
      normalizedText: normalized.text,
      normalization: normalized,

      features,
      currentTurnFrame: currentTurnFrames[0] || this.defaultFrame(normalized),
      currentTurnFrames,
      continuityFrame,
      inheritedContext,

      primaryFrame,
      secondaryFrames,
      allFrames,
      framePriority,

      continuity: {
        isContinuation: continuityFrame.isContinuation,
        referencesPriorContext: continuityFrame.referencesPriorContext,
        referencesPriorArtifact: continuityFrame.referencesPriorArtifact,
        referencesPriorQuestion: continuityFrame.referencesPriorQuestion,
        confidence: continuityFrame.confidence,
        evidence: continuityFrame.evidence
      },

      responseCharacteristics,
      emotionalOverlay,
      ambiguity,
      canonicalMeaning,
      handoff,

      semanticSummary: this.buildSemanticSummary({
        primaryFrame,
        secondaryFrames,
        allFrames,
        normalized,
        continuityFrame,
        responseCharacteristics,
        emotionalOverlay,
        ambiguity,
        framePriority,
        canonicalMeaning
      })
    };
  },

  extractUniversalFeatures(n, summary = {}) {
    const text = n.text;
    const words = text.split(/\s+/).filter(Boolean);
    const conversationFunction = summary.conversationFunction || summary || {};

    const githubFileContext =
      summary.githubFileContext ||
      summary.appContext?.githubFileContext ||
      null;

    const githubEvidenceAvailable =
      !!(
        githubFileContext &&
        githubFileContext.filePath &&
        String(githubFileContext.content || "").trim()
      ) ||
      summary.githubEvidenceAvailable === true ||
      conversationFunction.githubEvidenceAvailable === true ||
      conversationFunction.signalProfile?.githubEvidenceAvailable === true;

    const question =
      n.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(text);

    const developerArtifactFromFunction =
      [
        "developer_artifact_request",
        "artifact_modification_request",
        "artifact_creation_request",
        "artifact_investigation_request"
      ].includes(conversationFunction.primaryFunction) ||
      conversationFunction.developerArtifactRequest === true ||
      conversationFunction.artifactModificationRequest === true ||
      conversationFunction.signalProfile?.developerArtifactRequest === true ||
      conversationFunction.signalProfile?.artifactModificationRequest === true;

    const developerNouns =
      /\b(homepage|home page|layout|button|tile|card|section|component|page|screen|ui|interface|html|css|javascript|js|file|code|function|engine|pipeline|github|vercel|supabase|index\.html|style|class|element|div|container|modal|menu|tab|navbar|dashboard|meter|search bar|input|form|router|planner|frame builder|situation map|triage|contract|composer)\b/.test(text);

    const modificationVerb =
      /\b(remove|delete|hide|get rid of|take off|change|update|replace|rename|move|reorder|resize|make|turn|switch|add|insert|put|place|adjust|fix|clean up|refactor|implement|wire|connect|load|disable|enable|patch|upgrade)\b/.test(text);

    const creationVerb =
      /\b(create|build|make|generate|design|add new|set up|scaffold)\b/.test(text);

    const investigationVerb =
      /\b(debug|inspect|check|find|figure out|why is|why isn't|why does|not working|broken|issue|bug|error|failing|bottleneck|diagnose)\b/.test(text);

    const explicitEditCommand =
      /^(remove|delete|hide|get rid of|take off|change|update|replace|rename|move|reorder|resize|add|insert|put|place|adjust|fix|clean up|refactor|implement|wire|connect|load|disable|enable|patch|upgrade)\b/.test(text) ||
      /\b(can you|please|let's|lets|i want you to|we need to|make it|update it|fix it|change it|replace it|add it|remove it|send entire code|send code)\b/.test(text);

    const asksMetaAboutSystem =
      question &&
      /\b(trigger|detect|classify|route|routing|semantic|keyterm|key term|artifact modification|triage|situation map|frame builder|contract|canonical meaning|planner|pipeline|bottleneck|overlap|authority|priority|handoff)\b/.test(text) &&
      !/\b(update this file|replace this file|send entire code|patch this file)\b/.test(text);

    const artifactModificationRequest =
      !asksMetaAboutSystem &&
      (
        developerArtifactFromFunction ||
        (
          explicitEditCommand &&
          modificationVerb &&
          (developerNouns || githubEvidenceAvailable)
        )
      );

    const artifactCreationRequest =
      !asksMetaAboutSystem &&
      creationVerb &&
      developerNouns;

    const artifactInvestigationRequest =
      !asksMetaAboutSystem &&
      investigationVerb &&
      (developerNouns || githubEvidenceAvailable);

    const developerArtifactRequest =
      !asksMetaAboutSystem &&
      (
        developerArtifactFromFunction ||
        artifactModificationRequest ||
        artifactCreationRequest ||
        artifactInvestigationRequest ||
        (
          githubEvidenceAvailable &&
          (explicitEditCommand || creationVerb || investigationVerb)
        )
      );

    const asksOpinion =
      /\b(what do you think|be honest|honestly|your take|your opinion|am i|should i|would you)\b/.test(text);

    const asksDecision =
      /\b(should i|should we|which|choose|worth it|better|best|recommend|what would you do|what do you think|what should i do|best move|next step|priority|prioritize)\b/.test(text);

    const asksExplanation =
      /\b(explain|why|how does|how do|what does|tell me about|help me understand|what is|what are)\b/.test(text);

    const asksAction =
      developerArtifactRequest ||
      /\b(fix|build|update|replace|send|show|give|make|write|create|implement|review|look at|where do i add|remove|delete|rename|move|change|patch)\b/.test(text);

    const hasProblem =
      /\b(problem|issue|bug|broken|wrong|not working|doesn't work|failed|bottleneck|stuck|confused|hard|trouble|mismatch)\b/.test(text);

    const bodyRisk =
      /\b(pain|bleeding|pregnant|pregnancy|fever|cough|swallow|symptom|doctor|labs|vitals|chest|breathing|diarrhea|faint|seizure|stroke|infection|rash|medication)\b/.test(text);

    const resourcePressure =
      /\b(money|debt|rent|budget|pay|cost|expensive|tight|afford|few thousand|loan|job|time|deadline|overload|burnout|burned out|exhausted)\b/.test(text);

    const relationshipStake =
      /\b(wife|husband|fiance|fiancé|girlfriend|boyfriend|father|mother|dad|mom|baby|child|family|relationship|marriage|partner|spouse)\b/.test(text);

    const identityStake =
      /\b(father|mother|nurse|marine|officer|student|provider|career|identity|who am i|separating|losing myself|responsible|purpose|values)\b/.test(text);

    const emotionExpression =
      n.hasExclamation ||
      n.hasProfanity ||
      /\b(happy|excited|proud|angry|mad|sad|ashamed|scared|overwhelmed|frustrated|relieved|celebrate|deserve|burned out|stressed|snapping|exhausted)\b/.test(text);

    const ariSelfQuestion =
      /\b(your favorite|favorite color|favorite food|who are you|what are you|your purpose|your values|your personality|what do you believe|what do you stand for)\b/.test(text);

    const wisdomSignal =
      /\b(wisdom|meaning|values|principle|right thing|how i'm living|how i am living|life|purpose|responsible|losing myself|change about how)\b/.test(text);

    const currentTurnCompleteness =
      developerArtifactRequest ? "complete" :
      words.length >= 10 ? "complete" :
      words.length >= 4 ? "partial" :
      "fragment";

    return {
      text,
      wordCount: words.length,

      question,
      asksOpinion,
      asksDecision,
      asksExplanation,
      asksAction,

      hasProblem,
      bodyRisk,
      resourcePressure,
      relationshipStake,
      identityStake,
      emotionExpression,
      ariSelfQuestion,
      wisdomSignal,

      githubEvidenceAvailable,
      githubFileContext,
      developerNouns,
      modificationVerb,
      creationVerb,
      investigationVerb,
      explicitEditCommand,
      asksMetaAboutSystem,
      artifactModificationRequest,
      artifactCreationRequest,
      artifactInvestigationRequest,
      developerArtifactRequest,

      currentTurnCompleteness,
      conversationFunction,
      observations: summary.observations || summary.observationLedger || []
    };
  },

  buildCurrentTurnFrameV2(n, summary = {}) {
    const features = this.extractUniversalFeatures(n, summary);
    const frames = this.generateFramesFromFeatures(features, n);
    const ranked = this.rankFrames(frames);
    return ranked[0] || this.defaultFrame(n);
  },

  generateFramesFromFeatures(f, n) {
    const frames = [];

    if (f.asksMetaAboutSystem) {
      this.pushFrame(frames, {
        frameType: "meta_system_question",
        domain: "ari_architecture",
        intent: "explain_system_behavior",
        conversationStyle: "technical_explanation",
        confidence: 94,
        evidence: ["meta/system routing question"]
      });
    }

    if (f.developerArtifactRequest) {
      this.pushFrame(frames, {
        frameType: "developer_artifact_request",
        domain: "developer",
        intent: f.artifactModificationRequest
          ? "modify_existing_artifact"
          : f.artifactCreationRequest
            ? "create_artifact"
            : f.artifactInvestigationRequest
              ? "investigate_artifact"
              : "operate_on_artifact",
        conversationStyle: "artifact_operation",
        confidence: this.cap(90 + (f.githubEvidenceAvailable ? 8 : 0)),
        evidence: [
          "developer artifact request",
          f.githubEvidenceAvailable ? "github file context available" : null,
          f.developerNouns ? "developer target language" : null
        ].filter(Boolean)
      });
    }

    if (f.artifactModificationRequest) {
      this.pushFrame(frames, {
        frameType: "artifact_modification_request",
        domain: "developer",
        intent: "modify_existing_code_or_ui",
        conversationStyle: "code_patch",
        confidence: this.cap(92 + (f.githubEvidenceAvailable ? 8 : 0)),
        evidence: ["modification command"].filter(Boolean)
      });
    }

    if (f.artifactCreationRequest) {
      this.pushFrame(frames, {
        frameType: "artifact_creation_request",
        domain: "developer",
        intent: "create_or_add_code_or_ui",
        conversationStyle: "code_generation",
        confidence: 88,
        evidence: ["creation command", "developer artifact context"]
      });
    }

    if (f.artifactInvestigationRequest) {
      this.pushFrame(frames, {
        frameType: "artifact_investigation_request",
        domain: "developer",
        intent: "diagnose_or_inspect_artifact",
        conversationStyle: "diagnostic",
        confidence: this.cap(86 + (f.githubEvidenceAvailable ? 6 : 0)),
        evidence: ["investigation/debug command", "developer artifact context"]
      });
    }

    if (f.ariSelfQuestion) {
      this.pushFrame(frames, {
        frameType: "ari_self_or_preference_question",
        domain: "ari_self",
        intent: "answer_identity_or_preference",
        conversationStyle: "self_disclosure",
        confidence: 92,
        evidence: ["Ari self/preference question"]
      });
    }

    if (f.asksDecision) {
      this.pushFrame(frames, {
        frameType: "decision_support",
        domain: "choice_or_priority",
        intent: "evaluate_options",
        conversationStyle: "recommendation_request",
        confidence: this.cap(
          76 +
          (f.resourcePressure ? 8 : 0) +
          (f.relationshipStake ? 8 : 0) +
          (f.identityStake ? 6 : 0)
        ),
        evidence: ["choice pressure", "judgment request"]
      });
    }

    if (f.bodyRisk) {
      this.pushFrame(frames, {
        frameType: "medical_or_body_context",
        domain: "health",
        intent: "include_body_context_without_hijacking",
        conversationStyle: "safety_sensitive_context",
        confidence: f.asksDecision || f.resourcePressure ? 64 : 82,
        evidence: ["body/medical context"]
      });
    }

    if (f.relationshipStake) {
      this.pushFrame(frames, {
        frameType: "relationship_or_family_context",
        domain: "relationships",
        intent: "protect_connection_or_dependents",
        conversationStyle: "relational_context",
        confidence: 78,
        evidence: ["relationship/family stake"]
      });
    }

    if (f.identityStake) {
      this.pushFrame(frames, {
        frameType: "identity_or_role",
        domain: "self_concept",
        intent: "understand_role_or_direction",
        conversationStyle: "identity_context",
        confidence: 76,
        evidence: ["identity or role stake"]
      });
    }

    if (f.resourcePressure) {
      this.pushFrame(frames, {
        frameType: "resource_pressure",
        domain: "money_time_energy",
        intent: "protect_limited_resources",
        conversationStyle: "practical_constraint",
        confidence: 76,
        evidence: ["resource constraint"]
      });
    }

    if (f.wisdomSignal) {
      this.pushFrame(frames, {
        frameType: "wisdom_or_values_tension",
        domain: "wisdom_values",
        intent: "clarify_principle_or_life_pattern",
        conversationStyle: "wisdom_reflection",
        confidence: 74,
        evidence: ["wisdom/value/life-pattern signal"]
      });
    }

    if (f.emotionExpression) {
      this.pushFrame(frames, {
        frameType: "emotional_expression",
        domain: "emotion",
        intent: "respond_to_expressed_state",
        conversationStyle: "expressive",
        confidence: 72,
        evidence: ["emotional expression"]
      });
    }

    if (f.asksAction && f.developerNouns && !f.developerArtifactRequest && !f.asksMetaAboutSystem) {
      this.pushFrame(frames, {
        frameType: "collaborative_software_build",
        domain: "ari_architecture",
        intent: "create_or_modify_system_component",
        conversationStyle: "co_creation",
        confidence: this.cap(82 + (f.hasProblem ? 8 : 0)),
        evidence: ["action request", "system/build context"]
      });
    }

    if (f.hasProblem && f.developerNouns && !f.developerArtifactRequest && !f.asksMetaAboutSystem) {
      this.pushFrame(frames, {
        frameType: "debugging_or_root_cause",
        domain: "system_behavior",
        intent: "diagnose_failure_or_mismatch",
        conversationStyle: "diagnostic",
        confidence: 84,
        evidence: ["problem signal", "system/build context"]
      });
    }

    if (f.asksExplanation && !f.asksAction && !f.developerArtifactRequest) {
      this.pushFrame(frames, {
        frameType: "information_seeking",
        domain: "general_understanding",
        intent: "obtain_answer_or_clarification",
        conversationStyle: "question",
        confidence: 80,
        evidence: ["explanation request"]
      });
    }

    if (f.question && !frames.length) {
      this.pushFrame(frames, {
        frameType: "information_seeking",
        domain: "general_understanding",
        intent: "obtain_answer_or_clarification",
        conversationStyle: "question",
        confidence: 76,
        evidence: ["question"]
      });
    }

    if (!frames.length && f.currentTurnCompleteness === "complete") {
      this.pushFrame(frames, {
        frameType: "general_current_turn",
        domain: "general",
        intent: "respond_to_current_statement",
        conversationStyle: "normal",
        confidence: 62,
        evidence: ["complete current turn"]
      });
    }

    return frames;
  },

  selectPrimaryFrame(frames = [], n = {}, continuityFrame = {}) {
    const cleanFrames = frames.filter(Boolean);
    if (!cleanFrames.length) return this.defaultFrame(n);

    const hardDeveloper = cleanFrames.find(f =>
      [
        "artifact_modification_request",
        "developer_artifact_request",
        "artifact_creation_request",
        "artifact_investigation_request"
      ].includes(f.frameType) &&
      f.confidence >= 86
    );

    if (hardDeveloper) return hardDeveloper;

    const metaSystem = cleanFrames.find(f => f.frameType === "meta_system_question");
    if (metaSystem && metaSystem.confidence >= 85) return metaSystem;

    const ariSelf = cleanFrames.find(f => f.frameType === "ari_self_or_preference_question");
    if (ariSelf && cleanFrames.length <= 2) return ariSelf;

    const decision = cleanFrames.find(f => f.frameType === "decision_support");
    const medical = cleanFrames.find(f => f.frameType === "medical_or_body_context");

    if (medical && medical.confidence >= 82 && !decision) return medical;
    if (decision && medical && medical.confidence < 80) return decision;

    return cleanFrames[0];
  },

  buildFramePriority({ primaryFrame, secondaryFrames = [], allFrames = [], features = {}, normalized = {}, continuityFrame = {} }) {
    const priority = [];
    const add = (frame, role = "support") => {
      if (!frame) return;
      if (priority.some(item => item.frameType === frame.frameType)) return;

      priority.push({
        frameType: frame.frameType,
        domain: frame.domain,
        intent: frame.intent,
        role,
        confidence: frame.confidence,
        evidence: frame.evidence || []
      });
    };

    add(primaryFrame, "primary");
    secondaryFrames.forEach(frame => add(frame, "support"));

    const hasMultipleQuestions =
      (normalized.original || "").split("?").filter(Boolean).length >= 2 ||
      (
        features.ariSelfQuestion &&
        allFrames.some(f => f.frameType !== "ari_self_or_preference_question")
      );

    return {
      primary: primaryFrame?.frameType || null,
      ordered: priority,
      hasMultipleFrames: priority.length > 1,
      hasMultipleQuestions,
      shouldPreserveSecondaryFrames: priority.length > 1 || hasMultipleQuestions,
      suggestedPlannerUse:
        priority.length >= 3 || hasMultipleQuestions
          ? "multi_lane_planner_recommended"
          : "single_or_simple_response_ok",
      authority: "semantic_priority_handoff_only"
    };
  },

  buildFunctionFrame(conversationFunction = {}) {
    const primaryFunction =
      conversationFunction.primaryFunction ||
      conversationFunction.function ||
      null;

    if (!primaryFunction || primaryFunction === "unknown") return null;

    const map = {
      developer_artifact_request: ["developer_artifact_request", "developer", "operate_on_artifact", "artifact_operation", 94],
      artifact_modification_request: ["artifact_modification_request", "developer", "modify_existing_code_or_ui", "code_patch", 96],
      artifact_creation_request: ["artifact_creation_request", "developer", "create_or_add_code_or_ui", "code_generation", 90],
      artifact_investigation_request: ["artifact_investigation_request", "developer", "diagnose_or_inspect_artifact", "diagnostic", 90],
      emotional_disclosure: ["emotional_disclosure", "emotion", "receive_and_respond_to_emotion", "emotional_presence", 88],
      direct_question: ["information_seeking", "general_understanding", "obtain_answer_or_clarification", "question", 78],
      correction_or_clarification: ["correction_or_clarification", "conversation_flow", "correct_prior_interpretation", "clarification", 86],
      build_or_debug_request: ["collaborative_software_build", "ari_architecture", "create_or_modify_system_component", "co_creation", 84],
      build_or_debug: ["collaborative_software_build", "ari_architecture", "create_or_modify_system_component", "co_creation", 84],
      memory_or_identity_request: ["ari_self_or_preference_question", "ari_self", "answer_identity_or_preference", "self_disclosure", 90]
    };

    const selected = map[primaryFunction];
    if (!selected) return null;

    return {
      frameType: selected[0],
      domain: selected[1],
      intent: selected[2],
      conversationStyle: selected[3],
      confidence: selected[4],
      evidence: [`conversation_function:${primaryFunction}`],
      advisoryOnly: true,
      source: "conversation_function_engine"
    };
  },

  buildContinuityFrame(n, inherited = {}, currentTurnFrame = {}) {
    const text = n.text;
    const hasThread = inherited.threadAvailable;

    const directQuestion =
      n.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(text);

    const artifactFrame =
      currentTurnFrame &&
      [
        "developer_artifact_request",
        "artifact_modification_request",
        "artifact_creation_request",
        "artifact_investigation_request"
      ].includes(currentTurnFrame.frameType);

    const completeCurrentTurn =
      artifactFrame ||
      n.wordCount >= 10 ||
      (
        directQuestion &&
        currentTurnFrame &&
        currentTurnFrame.confidence >= 70
      );

    const continuationHits = this.findWordHits(text, [
      "next",
      "again",
      "continue",
      "same",
      "previous"
    ]);

    const phraseHits = this.findPhraseHits(text, [
      "do that",
      "send me the code",
      "make the update",
      "update it",
      "like before",
      "where were we",
      "what else",
      "what about it",
      "what about him",
      "what about her"
    ]);

    const pronounHits = this.findWordHits(text, [
      "it",
      "this",
      "that",
      "they",
      "them",
      "him",
      "her",
      "those",
      "these"
    ]);

    const currentTurnHasOwnMeaning =
      completeCurrentTurn &&
      currentTurnFrame &&
      currentTurnFrame.confidence >= 70;

    const isContinuation =
      hasThread &&
      !currentTurnHasOwnMeaning &&
      (
        n.isShortTurn ||
        continuationHits.length > 0 ||
        phraseHits.length > 0 ||
        pronounHits.length > 0
      );

    const evidence = [...continuationHits, ...phraseHits];

    if (hasThread && pronounHits.length && !currentTurnHasOwnMeaning) {
      evidence.push("reference language with active thread");
    }

    if (hasThread && isContinuation) {
      evidence.push("active thread context available");
    }

    return {
      frameType: "continuation",
      domain: "conversation_flow",
      intent: "continue_prior_context",
      conversationStyle: "follow_up",
      isContinuation,
      referencesPriorContext: isContinuation,
      referencesPriorArtifact:
        artifactFrame ||
        this.findWordHits(text, [
          "code",
          "file",
          "engine",
          "module",
          "pipeline",
          "composer",
          "observer",
          "homepage",
          "layout",
          "button",
          "tile"
        ]).length > 0,
      referencesPriorQuestion: this.findPhraseHits(text, [
        "what i asked",
        "my question",
        "what we said",
        "what you said"
      ]).length > 0,
      confidence: isContinuation ? this.cap(65 + evidence.length * 6) : 25,
      evidence,
      advisoryOnly: true
    };
  },

  buildCanonicalMeaning({
    normalized = {},
    primaryFrame = {},
    secondaryFrames = [],
    continuityFrame = {},
    inheritedContext = {},
    summary = {},
    features = {},
    framePriority = {}
  } = {}) {
    const text = normalized.text || "";

    const isQuestion =
      normalized.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(text);

    const isInstruction =
      features.explicitEditCommand === true ||
      /^(remove|delete|hide|change|update|replace|rename|move|add|insert|fix|implement|wire|connect|disable|enable|patch|upgrade)\b/.test(text);

    const developerFrames = [
      "developer_artifact_request",
      "artifact_modification_request",
      "artifact_creation_request",
      "artifact_investigation_request"
    ];

    const isArtifactRequest = developerFrames.includes(primaryFrame.frameType);
    const isMetaQuestion = primaryFrame.frameType === "meta_system_question";

    const requestedOperation =
      isArtifactRequest
        ? primaryFrame.intent
        : isMetaQuestion
          ? "explain"
          : primaryFrame.intent || "respond";

    return {
      enabled: true,
      source: "ari-semantic-frame-builder",
      version: this.version,

      speechAct: isInstruction
        ? "instruction"
        : isQuestion
          ? "question"
          : "statement",

      userGoal: isArtifactRequest
        ? "modify_or_operate_on_artifact"
        : isMetaQuestion
          ? "understand_system_behavior"
          : primaryFrame.intent || "respond",

      requestedOperation,

      targetDomain: primaryFrame.domain || "general",

      targetObject: {
        type: features.developerNouns ? "system_concept" : "unknown",
        name: null,
        filePath: features.githubFileContext?.filePath || null
      },

      artifactAction: {
        isArtifactRequest,
        isModification: primaryFrame.frameType === "artifact_modification_request",
        isCreation: primaryFrame.frameType === "artifact_creation_request",
        isInvestigation: primaryFrame.frameType === "artifact_investigation_request",
        isMetaQuestion,
        requiresFileContent: isArtifactRequest
      },

      multiDomain: {
        present: secondaryFrames.length > 0,
        primary: primaryFrame.frameType || null,
        secondary: secondaryFrames.map(f => f.frameType),
        hasMultipleQuestions: framePriority.hasMultipleQuestions === true
      },

      responseMode: isArtifactRequest
        ? "code_or_artifact"
        : isQuestion || isMetaQuestion
          ? "direct_answer"
          : "normal_response",

      confidence: isArtifactRequest || isMetaQuestion ? 0.9 : 0.76,

      evidence: [
        isQuestion ? "question form" : null,
        isInstruction ? "instruction form" : null,
        isMetaQuestion ? "meta system question" : null,
        isArtifactRequest ? "artifact request" : null,
        framePriority.hasMultipleFrames ? "multiple semantic frames" : null
      ].filter(Boolean),

      authority: "semantic_description_only"
    };
  },

  buildResponseCharacteristics(n, primaryFrame, secondaryFrames = [], continuityFrame, summary = {}, canonicalMeaning = {}, framePriority = {}) {
    const text = n.text;

    const directQuestion =
      n.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(text);

    const developerFrames = [
      "developer_artifact_request",
      "artifact_modification_request",
      "artifact_creation_request",
      "artifact_investigation_request"
    ];

    const collaborationFrames = [
      "collaborative_software_build",
      "debugging_or_root_cause",
      ...developerFrames
    ];

    const frameTypes = [
      primaryFrame.frameType,
      ...secondaryFrames.map(f => f.frameType)
    ];

    const expectsCodeOrArtifact =
      canonicalMeaning?.responseMode === "code_or_artifact";

    return {
      expectsDirectAnswer: directQuestion || developerFrames.includes(primaryFrame.frameType),
      expectsExplanation:
        primaryFrame.frameType === "meta_system_question" ||
        /\b(explain|tell me|how does|why does|what does it mean)\b/.test(text),
      expectsCollaboration: collaborationFrames.includes(primaryFrame.frameType),
      expectsCodeOrArtifact,
      expectsReflection:
        frameTypes.includes("emotional_expression") ||
        frameTypes.includes("wisdom_or_values_tension"),
      expectsFollowUpContext: continuityFrame.isContinuation,
      likelyWantsMinimalAnswer: n.isShortTurn || /\b(briefly|quick|short answer)\b/.test(text),

      shouldUseMultiLaneResponse:
        framePriority.shouldPreserveSecondaryFrames === true,

      shouldAnswerPrimaryFirst: true,
      shouldPreserveSecondaryQuestions:
        framePriority.hasMultipleQuestions === true ||
        secondaryFrames.length >= 2,

      confidence: this.cap(
        55 +
        (directQuestion ? 14 : 0) +
        (collaborationFrames.includes(primaryFrame.frameType) ? 18 : 0) +
        (expectsCodeOrArtifact ? 18 : 0) +
        (continuityFrame.isContinuation ? 10 : 0) +
        (secondaryFrames.length ? 8 : 0)
      )
    };
  },

  buildAmbiguitySignal(n, primaryFrame, secondaryFrames = [], continuityFrame, summary = {}, features = {}) {
    const pronounHits = this.findWordHits(n.text, [
      "it",
      "this",
      "that",
      "they",
      "them",
      "him",
      "her"
    ]);

    const developerFrames = [
      "developer_artifact_request",
      "artifact_modification_request",
      "artifact_creation_request",
      "artifact_investigation_request"
    ];

    if (developerFrames.includes(primaryFrame.frameType) && features.githubEvidenceAvailable) {
      return {
        present: false,
        reason: "Developer artifact request has usable file context.",
        confidence: 90,
        evidence: ["github file context available"]
      };
    }

    const directQuestion =
      n.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(n.text);

    const currentTurnComplete =
      developerFrames.includes(primaryFrame.frameType) ||
      (n.wordCount >= 10 && primaryFrame.confidence >= 65) ||
      (
        directQuestion &&
        primaryFrame &&
        primaryFrame.confidence >= 70
      );

    const present =
      !currentTurnComplete &&
      (
        (n.isVeryShortTurn && !continuityFrame.isContinuation) ||
        (pronounHits.length > 0 && !continuityFrame.referencesPriorContext)
      );

    const closeFrameConflict =
      secondaryFrames[0] &&
      Math.abs(Number(primaryFrame.confidence || 0) - Number(secondaryFrames[0].confidence || 0)) <= 6;

    return {
      present: present || closeFrameConflict,
      reason: present
        ? "Current turn lacks enough standalone meaning."
        : closeFrameConflict
          ? "Two semantic frames are close in confidence."
          : "No major ambiguity detected.",
      confidence: present || closeFrameConflict ? 72 : 35,
      evidence: [
        ...pronounHits,
        closeFrameConflict ? "close semantic frame scores" : null
      ].filter(Boolean)
    };
  },

  buildHandoff({
    normalized,
    primaryFrame,
    secondaryFrames = [],
    continuityFrame,
    inheritedContext,
    responseCharacteristics,
    ambiguity,
    canonicalMeaning = {},
    framePriority = {}
  }) {
    return {
      currentQuestion: normalized.original,
      currentMeaning: primaryFrame.frameType,
      domain: primaryFrame.domain,
      intent: primaryFrame.intent,

      secondaryMeanings: secondaryFrames.map(frame => ({
        frameType: frame.frameType,
        domain: frame.domain,
        intent: frame.intent,
        confidence: frame.confidence,
        evidence: frame.evidence || []
      })),

      framePriority,

      requiresPriorContext: continuityFrame.isContinuation,
      inheritedSubject: continuityFrame.isContinuation
        ? inheritedContext.activeSubject || inheritedContext.currentTopic
        : null,

      priorContextAvailable: inheritedContext.threadAvailable,
      previousAnswerSummary: continuityFrame.isContinuation
        ? inheritedContext.previousAnswerSummary
        : null,

      responseMode: canonicalMeaning?.responseMode ||
        (
          responseCharacteristics.expectsCodeOrArtifact
            ? "code_or_artifact"
            : responseCharacteristics.expectsCollaboration
              ? "collaborative_action"
              : responseCharacteristics.expectsDirectAnswer
                ? "direct_answer"
                : "normal_response"
        ),

      canonicalMeaning,
      requestedOperation: canonicalMeaning?.requestedOperation || null,
      artifactAction: canonicalMeaning?.artifactAction || null,

      ambiguityPresent: ambiguity.present,

      plannerHints: {
        shouldUseMultiLaneResponse: responseCharacteristics.shouldUseMultiLaneResponse,
        shouldAnswerPrimaryFirst: responseCharacteristics.shouldAnswerPrimaryFirst,
        shouldPreserveSecondaryQuestions: responseCharacteristics.shouldPreserveSecondaryQuestions,
        suggestedPlannerUse: framePriority.suggestedPlannerUse
      },

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetContract: false,
        role: "semantic_description_handoff_only"
      }
    };
  },

  buildEmotionalOverlay(n, features = {}) {
    let tone = "neutral";
    let intensity = "low";
    const evidence = [];

    if (/\b(happy|excited|proud|relieved|celebrate|deserve)\b/.test(n.text)) {
      tone = "positive_activation";
      intensity = n.hasExclamation || n.hasProfanity ? "high" : "medium";
      evidence.push("positive expressive language");
    }

    if (/\b(frustrated|angry|mad|annoying|confused|give up|come on|are you serious|overwhelmed|burned out|stressed|snapping|exhausted)\b/.test(n.text)) {
      tone = "strained_or_overloaded";
      intensity = n.hasProfanity ? "high" : "medium";
      evidence.push("strain/overload language");
    }

    if (n.hasProfanity && tone === "neutral") {
      tone = "intense_expression";
      intensity = "high";
      evidence.push("profanity emphasis");
    }

    return {
      tone,
      intensity,
      semanticMeaningSeparated: true,
      evidence
    };
  },

  buildSemanticSummary({
    primaryFrame,
    secondaryFrames = [],
    allFrames = [],
    normalized,
    continuityFrame,
    responseCharacteristics,
    emotionalOverlay,
    ambiguity,
    framePriority,
    canonicalMeaning
  }) {
    return {
      primaryMeaning: primaryFrame.frameType,
      domain: primaryFrame.domain,
      intent: primaryFrame.intent,
      conversationStyle: primaryFrame.conversationStyle,
      confidence:
        primaryFrame.confidence >= 85 ? "high" :
        primaryFrame.confidence >= 65 ? "medium" :
        "low",

      secondaryMeanings: secondaryFrames.map(f => f.frameType),

      continuity: {
        isContinuation: continuityFrame.isContinuation,
        referencesPriorContext: continuityFrame.referencesPriorContext,
        referencesPriorArtifact: continuityFrame.referencesPriorArtifact,
        confidence: continuityFrame.confidence
      },

      responseCharacteristics,
      emotionalOverlay,
      ambiguity,
      framePriority,
      canonicalMeaning,

      competingMeanings: allFrames
        .filter(f => f && f.frameType !== primaryFrame.frameType)
        .slice(0, 8)
        .map(f => f.frameType),

      languageNotes: {
        slangResolved: normalized.detectedSlang.length > 0,
        typosResolved: normalized.detectedTypos.length > 0,
        profanityAsSignal: normalized.hasProfanity,
        shortTurn: normalized.isShortTurn
      }
    };
  },

  readInheritedContext(summary = {}) {
    const threadState = summary.threadState || {};
    const recentMessages = summary.recentMessages || threadState.lastMessages || [];

    return {
      threadAvailable: Boolean(
        summary.threadStateLoaded ||
        recentMessages.length ||
        threadState.currentTopic ||
        threadState.activeSubject ||
        threadState.continuitySummary
      ),

      currentTopic: this.stringifyTopic(
        summary.activeTopic ||
        threadState.currentTopic ||
        null
      ),

      activeSubject: this.stringifyTopic(
        summary.resolvedPrimarySubject ||
        threadState.activeSubject ||
        null
      ),

      previousAnswerSummary:
        threadState.previousAnswerSummary ||
        threadState.lastFinalResponse ||
        summary.previousAnswerSummary ||
        null,

      recentMessages: Array.isArray(recentMessages)
        ? recentMessages.slice(-6)
        : [],

      authority: "context_only_not_current_meaning"
    };
  },

  normalizeText(text) {
    const original = this.clean(text);
    let normalized = original.toLowerCase();

    const replacements = {
      "wtf": "what the fuck",
      "idk": "i do not know",
      "rn": "right now",
      "u": "you",
      "ur": "your",
      "pls": "please",
      "plz": "please",
      "gonna": "going to",
      "wanna": "want to",
      "kinda": "kind of",
      "bc": "because",
      "cuz": "because"
    };

    const detectedSlang = [];

    Object.keys(replacements)
      .sort((a, b) => b.length - a.length)
      .forEach(key => {
        const pattern = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, "gi");
        if (pattern.test(normalized)) {
          detectedSlang.push({ from: key, to: replacements[key] });
          normalized = normalized.replace(pattern, replacements[key]);
        }
      });

    normalized = normalized
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    const wordCount = normalized.split(/\s+/).filter(Boolean).length;

    return {
      original,
      text: normalized,
      wordCount,
      detectedSlang,
      detectedTypos: [],
      hasQuestionMark: original.includes("?"),
      hasExclamation: original.includes("!"),
      hasProfanity: /\b(fuck|fucking|fucken|shit|wtf|damn|bullshit)\b/i.test(original),
      isShortTurn: wordCount <= 5,
      isVeryShortTurn: wordCount <= 2
    };
  },

  pushFrame(frames, frame) {
    frames.push({
      ...frame,
      confidence: this.cap(frame.confidence),
      advisoryOnly: true
    });
  },

  rankFrames(frames = []) {
    const merged = {};

    frames.filter(Boolean).forEach(frame => {
      const key = frame.frameType;

      if (!merged[key]) {
        merged[key] = { ...frame, evidence: [...(frame.evidence || [])] };
        return;
      }

      merged[key].confidence = this.cap(
        Math.max(merged[key].confidence, frame.confidence) + 4
      );

      merged[key].evidence = Array.from(
        new Set([...(merged[key].evidence || []), ...(frame.evidence || [])])
      );
    });

    return Object.values(merged).sort((a, b) => b.confidence - a.confidence);
  },

  defaultFrame(n) {
    return {
      frameType: "general_conversation",
      domain: "general",
      intent: "ordinary_conversation",
      conversationStyle: "open",
      confidence: n.text ? 40 : 10,
      evidence: [],
      advisoryOnly: true
    };
  },

  findPhraseHits(text, patterns = []) {
    const lower = String(text || "").toLowerCase();
    return patterns.filter(pattern => lower.includes(pattern.toLowerCase()));
  },

  findWordHits(text, words = []) {
    const lower = String(text || "").toLowerCase();
    return words.filter(word => {
      const pattern = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, "i");
      return pattern.test(lower);
    });
  },

  stringifyTopic(topic) {
    if (!topic) return null;
    if (typeof topic === "string") return topic;

    return (
      topic.surface ||
      topic.label ||
      topic.value ||
      topic.claim ||
      topic.evidence ||
      null
    );
  },

  clean(value) {
    return String(value || "").trim();
  },

  cap(score) {
    return Math.max(0, Math.min(100, Number(score) || 0));
  },

  escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
};

console.log(
  "ARI SEMANTIC FRAME BUILDER LOADED:",
  window.AriSemanticFrameBuilder?.version
);