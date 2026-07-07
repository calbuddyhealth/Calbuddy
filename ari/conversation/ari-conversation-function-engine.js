// ari/conversation/ari-conversation-function-engine.js
// Ari Conversation Function Engine
// Purpose: Detect conversational signals before lane/triage.
// V2.3.1 — Meaning-Safe Signal Collector / Emotional Support Protected / Keyword Trap Reduced / Advisory Only

window.Ari = window.Ari || {};

window.AriConversationFunctionEngine = {
  version: "2.3.1",

  patterns: {
    developerNouns:
      /\b(homepage|home page|layout|button|tile|card|section|component|page|screen|ui|interface|html|css|javascript|js|file|code|function|engine|pipeline|github|vercel|supabase|index\.html|style\.css|class|element|div|container|modal|menu|tab|navbar|dashboard|meter|search bar|input|form|repo|repository|codebase|api)\b/,

    developerAction:
      /\b(read|open|show|search|find|inspect|debug|fix|update|change|replace|remove|commit|deploy|edit|patch|implement|wire|connect|load|disable|enable)\b/,

    modificationVerb:
      /\b(remove|delete|hide|get rid of|take off|change|update|replace|rename|move|reorder|resize|turn|switch|add|insert|put|place|adjust|fix|clean up|refactor|implement|wire|connect|load|disable|enable|edit|patch)\b/,

    creationVerb:
      /\b(create|build|make|generate|design|add new|set up|scaffold)\b/,

    investigationVerb:
      /\b(debug|inspect|check|find|figure out|why is|why isn't|why does|not working|broken|issue|bug|error|failing|bottleneck|trickle down|root cause)\b/,

    layoutLanguage:
      /\b(homepage|home page|layout|button|tile|card|section|component|page|screen|ui|bottom tabs|top bar|search bar|meter|dashboard|profile button|hamburger|greeting box|action grid)\b/,

    codeLanguage:
      /\b(code|file|html|css|javascript|js|function|engine|pipeline|github|vercel|supabase|index\.html|style\.css|class|script|component|api|repo|repository)\b/,

    languageRequest:
      /\b(translate|translation|bible verse|verse|quote|scripture|meaning|interpret|interpret this|what does this mean|what does this say|what is this saying)\b/,

    ariPreferenceQuestion:
      /\b(what'?s your favorite|what is your favorite|your favorite|do you like|what do you like|what kind of .* do you like|what would you choose|what would you prefer|what matters to you|what do you value|your values|your beliefs|your taste|your style|your personality|who are you|what are you|tell me about yourself)\b/,

    metaDeveloperQuestion:
      /\b(should ari|should it|does it|will it|would it|can it|trigger|detect|classify|identify|semantic|keyword|keyterm|routing|conversation function|artifact modification|file context|developer request|treat this|treat it|outdated|brittle|regex|pattern|signal)\b/,

    humanLifeContext:
      /\b(career|family|freedom|regret|ambition|ego|wise|choice|responsible|stable career|betting on myself|life|future|identity|values)\b/,

    directAnswer:
      /\b(explain|tell me|what does this mean|what does that mean|why|how come|could it be|is it because|what caused|what cause|root cause)\b/,

    actionRequest:
      /\b(how do i|what should i do|what can i do|steps|walk me through|show me how|fix|debug|update|replace|send code|implement|patch|upgrade)\b/,

    decision:
      /\b(should i|should we|which one|which option|which is better|what is better|better option|better choice|choose|decide|worth it|pros and cons|compare|best move|recommend)\b/,

    relationship:
      /\b(wife|husband|spouse|partner|girlfriend|boyfriend|family|kid|kids|child|children|father|mother|mom|dad)\b/,

    emotion:
      /\b(sad|mad|angry|hurt|upset|bothered|worried|scared|anxious|stressed|overwhelmed|agitated|frustrated|lonely|depressed|down|burned out|exhausted|tired|heavy|rough)\b/,

    directEmotion:
      /\b(i'?m|i am|i feel|i felt|feeling|felt)\s+(really|very|pretty|so|kinda|kind of|super|extremely|a little|sort of|honestly|just)?\s*(sad|mad|angry|hurt|upset|worried|scared|anxious|stressed|overwhelmed|lonely|depressed|frustrated|down|burned out|exhausted|tired|heavy)\b|\b(that bothered me|it bothered me|i was bothered|i got upset|i am upset|i'm upset)\b/,

    emotionalSupportRequest:
      /\b(long day|bad day|rough day|hard day|heavy day|need to talk|talk to someone|someone to talk|feel better|need someone|i feel .*sad|i feel .*down|i feel .*lonely|i feel .*overwhelmed|i feel .*stressed|i feel .*exhausted|i just need to vent|can i vent|listen to me|be here with me)\b/,

    boundary:
      /\b(not trying to fix|don'?t fix|just listen|just venting|that'?s all|i only want|i don'?t want advice|no advice|just be here|just talk to me)\b/,

    medical:
      /\b(pain|fever|bleeding|pregnant|chest|breathing|faint|vomit|diarrhea|swallow|cough|stroke|seizure)\b/,

    memoryOrIdentity:
      /\b(remember|forget|save this|from now on|who are you|what are you|ari)\b/,

    creative:
      /\b(generate|create|draw|design|image|picture|logo|name ideas|write a story)\b/,

    correction:
      /\b(i mean|i meant|i ment|no,?\s*i mean|not that|rather|instead)\b/,

    shortFollowUp:
      /\b(this|that|it|they|them|same|one|what about|then what|next|continue|why)\b/,

    urgentSafety:
      /\b(suicide|kill myself|hurt myself|chest pain|shortness of breath|bleeding|stroke|fainting|seizure|emergency)\b/
  },

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const raw = summary.userMessage || summary.message || summary.input || "";
    const text = this.clean(raw);
    const words = text.split(/\s+/).filter(Boolean);

    const observations =
      summary.observations ||
      summary.observationLedger ||
      summary.observerEvidence?.observations ||
      [];

    const signals = this.collectSignals({ text, words, observations, summary });
    const functions = this.collectFunctions({ text, words, observations, signals });
    const ranked = this.rankFunctions(functions, signals);

    const primary = ranked[0] || {
      name: "general_conversation",
      score: 50,
      reasons: ["No stronger conversation function detected."]
    };

    const supportFunctions = ranked
      .slice(1, 6)
      .filter(f => f.score >= 35)
      .map(f => f.name);

    return {
      conversationFunctionRan: true,
      conversationFunctionVersion: this.version,
      source: "ari-conversation-function-engine",

      rawUserMessage: raw,
      normalizedText: text,

      primaryFunction: primary.name,
      supportFunctions,
      blockedFunctions: this.getBlockedFunctions(primary.name, ranked, signals),
      candidates: ranked,

      dominantUserMove: primary.name,
      responseBias: this.getResponseBias(primary.name, signals),

      confidence: Math.min(primary.score, 82),
      rawConfidence: primary.score,

      signalProfile: signals,

      directAnswerNeeded: signals.directAnswerNeeded,
      decisionNeeded: signals.decisionNeeded,
      relationshipContext: signals.relationshipContext,
      emotionalWeight: signals.emotionalWeight,
      emotionalSupportRequest: signals.emotionalSupportRequest,
      currentTurnIsConcrete: signals.currentTurnIsConcrete,
      shouldBlockFixing: signals.boundaryPresent && !signals.actionRequest,

      developerArtifactRequest: signals.developerArtifactRequest,
      artifactModificationRequest: signals.artifactModificationRequest,
      artifactCreationRequest: signals.artifactCreationRequest,
      artifactInvestigationRequest: signals.artifactInvestigationRequest,
      githubEvidenceAvailable: signals.githubEvidenceAvailable,
      expectsCodeOrArtifact: signals.expectsCodeOrArtifact,

      languageOrInterpretationRequest: signals.languageOrInterpretationRequest,
      languageTeacherRequest: signals.languageTeacherRequest,
      quotedOrImportedText: signals.quotedOrImportedText,
      metaDeveloperQuestion: signals.metaDeveloperQuestion,

      authority: "weak_signal_collector_only",
      requiresSemanticConfirmation: true,
      cannotSet: [
        "primaryLane",
        "triagePrimaryLane",
        "situationContractPrimary",
        "finalResponse",
        "riskLevel",
        "override",
        "shouldUseKnowledge",
        "bypassKnowledge"
      ]
    };
  },

  collectSignals({ text = "", words = [], observations = [], summary = {} } = {}) {
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
      summary.githubEvidenceAvailable === true;

    const hasQuestion =
      text.includes("?") ||
      this.hasType(observations, "question_phrase") ||
      this.hasType(observations, "question_mark_count") ||
      /^(what|why|how|when|where|who|is|are|do|does|can|should|would|could)\b/.test(text) ||
      /\b(i don'?t know why|not sure why|why would|why did|why is|why was|could it be|does that mean|is it because|what caused|what cause)\b/.test(text);

    const developerNouns = this.patterns.developerNouns.test(text);
    const developerAction = this.patterns.developerAction.test(text);
    const modificationVerb = this.patterns.modificationVerb.test(text);
    const creationVerb = this.patterns.creationVerb.test(text);
    const investigationVerb = this.patterns.investigationVerb.test(text);
    const layoutLanguage = this.patterns.layoutLanguage.test(text);
    const codeLanguage = this.patterns.codeLanguage.test(text);

    const ariPreferenceQuestion =
      this.patterns.ariPreferenceQuestion.test(text) &&
      /\b(you|your|ari|yourself)\b/.test(text);

    const languageOrInterpretationRequest =
      !ariPreferenceQuestion &&
      this.patterns.languageRequest.test(text);

    const languageTeacherRequest = languageOrInterpretationRequest;
    const translationOrQuoteRequest = languageOrInterpretationRequest;

    const quotedOrImportedText =
      languageTeacherRequest ||
      /["“”‘’].{8,}["“”‘’]/.test(text);

    const metaDeveloperQuestion =
      hasQuestion &&
      this.patterns.metaDeveloperQuestion.test(text) &&
      (
        developerNouns ||
        codeLanguage ||
        layoutLanguage ||
        /\b(ari|artifact|developer|file context|semantic|routing|classifier|classification|regex|keyword|keyterm|signal|pattern)\b/.test(text)
      );

    const humanLifeContext = this.patterns.humanLifeContext.test(text);

    const explicitDeveloperTarget =
      developerNouns ||
      layoutLanguage ||
      codeLanguage ||
      /\b(repo|repository|github|file path|source file|app file|this file|the file|codebase)\b/.test(text);

    const confirmedDeveloperRequest =
      !translationOrQuoteRequest &&
      !metaDeveloperQuestion &&
      !humanLifeContext &&
      developerAction &&
      (
        explicitDeveloperTarget ||
        githubEvidenceAvailable
      );

    const artifactModificationRequest =
      confirmedDeveloperRequest &&
      modificationVerb;

    const artifactCreationRequest =
      confirmedDeveloperRequest &&
      creationVerb;

    const artifactInvestigationRequest =
      confirmedDeveloperRequest &&
      investigationVerb;

    const developerArtifactRequest =
      artifactModificationRequest ||
      artifactCreationRequest ||
      artifactInvestigationRequest;

    const emotionPresent =
      this.patterns.emotion.test(text) ||
      this.hasType(observations, "emotion_word");

    const directEmotionDisclosure =
      this.patterns.directEmotion.test(text);

    const emotionalSupportRequest =
      this.patterns.emotionalSupportRequest.test(text);

    const boundaryPresent = this.patterns.boundary.test(text);

    const actionRequest =
      developerArtifactRequest ||
      (
        !metaDeveloperQuestion &&
        !emotionalSupportRequest &&
        this.patterns.actionRequest.test(text)
      );

    const decisionNeeded =
      !emotionalSupportRequest &&
      (
        this.patterns.decision.test(text) ||
        this.hasType(observations, "option_language") ||
        this.hasTypeValue(observations, "slot_signal", "option_language")
      );

    const directAnswerNeeded =
      hasQuestion ||
      ariPreferenceQuestion ||
      languageTeacherRequest ||
      developerArtifactRequest ||
      metaDeveloperQuestion ||
      this.hasTypeValue(observations, "answer_expectation", "direct_answer") ||
      this.patterns.directAnswer.test(text);

    const relationshipContext =
      this.patterns.relationship.test(text) ||
      this.hasType(observations, "relationship_reference");

    const buildContext =
      developerArtifactRequest ||
      (
        !metaDeveloperQuestion &&
        /\b(code|file|bug|error|debug|fix this|not working|function|engine|pipeline|github|vercel|supabase|javascript|html|css)\b/.test(text)
      );

    const medicalContext =
      !quotedOrImportedText &&
      this.patterns.medical.test(text);

    const memoryOrIdentity = this.patterns.memoryOrIdentity.test(text);

    const creative =
      !developerArtifactRequest &&
      !languageOrInterpretationRequest &&
      this.patterns.creative.test(text);

    const correction = this.patterns.correction.test(text);

    const shortFollowUp =
      words.length <= 12 &&
      this.patterns.shortFollowUp.test(text);

    const currentTurnIsConcrete =
      emotionalSupportRequest ||
      developerArtifactRequest ||
      (
        words.length >= 14 &&
        (
          relationshipContext ||
          buildContext ||
          medicalContext ||
          /\b(today|yesterday|tomorrow|courthouse|married|work|job|school|car|cat|dog|money|rent|baby|wife|husband|father|mother)\b/.test(text)
        )
      );

    const expectsCodeOrArtifact = developerArtifactRequest;

    let emotionalWeight = "none";

    if (emotionPresent || directEmotionDisclosure) {
      emotionalWeight = "medium";
    }

    if (
      emotionalSupportRequest ||
      (
        directEmotionDisclosure &&
        !decisionNeeded &&
        !actionRequest
      )
    ) {
      emotionalWeight = "high";
    }

    return {
      hasQuestion,
      directAnswerNeeded,
      actionRequest,
      decisionNeeded,
      relationshipContext,
      emotionPresent,
      directEmotionDisclosure,
      emotionalSupportRequest,
      emotionalWeight,
      boundaryPresent,
      buildContext,
      medicalContext,
      memoryOrIdentity,
      creative,
      correction,
      shortFollowUp,
      currentTurnIsConcrete,
      ariPreferenceQuestion,

      githubEvidenceAvailable,
      developerNouns,
      developerAction,
      modificationVerb,
      creationVerb,
      investigationVerb,
      layoutLanguage,
      codeLanguage,

      languageOrInterpretationRequest,
      languageTeacherRequest,
      quotedOrImportedText,
      translationOrQuoteRequest,

      metaDeveloperQuestion,

      artifactModificationRequest,
      artifactCreationRequest,
      artifactInvestigationRequest,
      developerArtifactRequest,
      expectsCodeOrArtifact
    };
  },

  collectFunctions({ text = "", words = [], observations = [], signals = {} } = {}) {
    const functions = [];

    const add = (name, score, reason) => {
      if (!name || score <= 0) return;

      const existing = functions.find(f => f.name === name);

      if (existing) {
        existing.score = Math.min(100, existing.score + Math.round(score * 0.35));
        if (reason && !existing.reasons.includes(reason)) existing.reasons.push(reason);
        return;
      }

      functions.push({
        name,
        score: Math.min(100, score),
        reasons: reason ? [reason] : []
      });
    };

    if (signals.boundaryPresent) {
      add("boundary_or_preference_statement", 95, "User stated a response preference or boundary.");
    }

    if (signals.correction) {
      add("correction_or_clarification", 88, "User appears to be correcting or clarifying prior meaning.");
    }

    if (signals.emotionalSupportRequest) {
      add(
        "emotional_disclosure",
        98,
        "User is seeking emotional support, comfort, companionship, or someone to talk to."
      );
    }

    if (signals.ariPreferenceQuestion) {
  add(
    "ari_identity_preference_question",
    96,
    "User is asking Ari about Ari's preferences, identity, values, taste, or personality."
  );
}

    if (signals.languageTeacherRequest) {
      add(
        "language_or_interpretation_request",
        92,
        "User is asking to translate, interpret, or discuss language/quoted text."
      );
    }

    if (signals.metaDeveloperQuestion) {
      add(
        "explanation_or_information_question",
        94,
        "User is asking about developer routing/classification behavior, not asking for a code artifact operation."
      );
    }

    if (signals.developerArtifactRequest) {
      add(
        "developer_artifact_request",
        96,
        "User is asking Ari to operate on an existing or intended code/UI artifact."
      );
    }

    if (signals.artifactModificationRequest) {
      add(
        "artifact_modification_request",
        94,
        "User is asking to modify an existing artifact, layout, file, or UI element."
      );
    }

    if (signals.artifactCreationRequest) {
      add(
        "artifact_creation_request",
        88,
        "User is asking to create or add a code/UI artifact."
      );
    }

    if (signals.artifactInvestigationRequest) {
      add(
        "artifact_investigation_request",
        88,
        "User is asking to inspect, debug, or investigate a code/UI artifact."
      );
    }

    if (signals.buildContext || signals.actionRequest) {
      add(
        "build_or_debug_request",
        signals.buildContext ? 86 : 75,
        "User is asking for code, build, debug, or practical action help."
      );
    }

    if (signals.medicalContext) {
      add("medical_or_body_concern", 82, "Health or body concern detected.");
    }

    if (signals.directAnswerNeeded) {
      add(
        "explanation_or_information_question",
        signals.developerArtifactRequest ? 62 : 88,
        "User needs a direct answer or explanation."
      );
    }

    if (signals.decisionNeeded) {
      add("decision_support", 84, "User is weighing options, causes, or choices.");
    }

    if (signals.relationshipContext) {
      add("relationship_or_family_context", 76, "Close relationship or family context detected.");
    }

    if (signals.directEmotionDisclosure) {
      add(
        "emotional_disclosure",
        signals.emotionalWeight === "high" ? 96 : 72,
        "User disclosed an emotional reaction."
      );
    } else if (signals.emotionPresent) {
      add("emotional_signal_present", 54, "Emotion language is present as context.");
    }

    if (signals.shortFollowUp && !signals.currentTurnIsConcrete) {
      add("continuation_or_follow_up", 78, "Short turn appears dependent on prior context.");
    }

    if (signals.memoryOrIdentity) {
      add("memory_or_identity_request", 82, "User referenced memory, preference, or Ari identity.");
    }

    if (signals.creative) {
      add("creative_generation", 76, "User requested creative generation.");
    }

    if (
      !signals.quotedOrImportedText &&
      this.patterns.urgentSafety.test(text)
    ) {
      add("safety_or_risk_disclosure", 100, "Safety or urgent risk language detected.");
    }

    if (!functions.length) {
      add("general_conversation", 50, "No stronger conversation function detected.");
    }

    return functions;
  },

  rankFunctions(functions = [], signals = {}) {
    return functions
      .map(fn => {
        let score = fn.score;

        if (signals.emotionalSupportRequest) {
          if (fn.name === "emotional_disclosure") score += 30;
          if (fn.name === "decision_support") score -= 70;
          if (fn.name === "explanation_or_information_question") score -= 18;
          if (fn.name === "build_or_debug_request") score -= 45;
        }

        if (signals.ariPreferenceQuestion) {
  if (fn.name === "ari_identity_preference_question") score += 30;
  if (fn.name === "memory_or_identity_request") score -= 40;
  if (fn.name === "explanation_or_information_question") score -= 20;
  if (fn.name === "language_or_interpretation_request") score -= 50;
}

        if (
          signals.developerArtifactRequest &&
          [
            "developer_artifact_request",
            "artifact_modification_request",
            "artifact_creation_request",
            "artifact_investigation_request"
          ].includes(fn.name)
        ) {
          score += 20;
        }

        if (signals.metaDeveloperQuestion && fn.name === "explanation_or_information_question") {
          score += 16;
        }

        if (
          signals.metaDeveloperQuestion &&
          [
            "developer_artifact_request",
            "artifact_modification_request",
            "artifact_creation_request",
            "artifact_investigation_request",
            "build_or_debug_request"
          ].includes(fn.name)
        ) {
          score -= 60;
        }

        if (signals.languageTeacherRequest && fn.name === "language_or_interpretation_request") {
          score += 18;
        }

        if (signals.languageTeacherRequest && fn.name === "explanation_or_information_question") {
          score -= 12;
        }

        if (signals.quotedOrImportedText && fn.name === "medical_or_body_concern") {
          score -= 50;
        }

        if (
          signals.githubEvidenceAvailable &&
          signals.developerArtifactRequest &&
          [
            "developer_artifact_request",
            "artifact_modification_request",
            "artifact_investigation_request"
          ].includes(fn.name)
        ) {
          score += 10;
        }

        if (signals.developerArtifactRequest && fn.name === "general_conversation") {
          score -= 60;
        }

        if (signals.developerArtifactRequest && fn.name === "explanation_or_information_question") {
          score -= 18;
        }

        if (signals.developerArtifactRequest && fn.name === "continuation_or_follow_up") {
          score -= 45;
        }

        if (signals.currentTurnIsConcrete && fn.name === "continuation_or_follow_up") {
          score -= 45;
        }

        if (signals.directAnswerNeeded && fn.name === "explanation_or_information_question") {
          score += 18;
        }

        if (
          signals.directAnswerNeeded &&
          fn.name === "emotional_disclosure" &&
          signals.emotionalWeight !== "high"
        ) {
          score -= 22;
        }

        if (!signals.decisionNeeded && fn.name === "decision_support") {
          score -= 35;
        }

        if (
          fn.name === "relationship_or_family_context" &&
          (
            signals.directAnswerNeeded ||
            signals.decisionNeeded ||
            signals.directEmotionDisclosure ||
            signals.emotionalSupportRequest
          )
        ) {
          score -= 10;
        }

        if (
          fn.name === "emotional_disclosure" &&
          signals.directEmotionDisclosure &&
          !signals.decisionNeeded &&
          !signals.actionRequest
        ) {
          score += 18;
        }

        if (fn.name === "build_or_debug_request" && signals.actionRequest) {
          score += 15;
        }

        if (fn.name === "safety_or_risk_disclosure") {
          score += 40;
        }

        return {
          ...fn,
          score: Math.max(0, Math.min(100, score))
        };
      })
      .filter(fn => fn.score > 0)
      .sort((a, b) => b.score - a.score);
  },

  getBlockedFunctions(primary, functions = [], signals = {}) {
    if (
      primary === "emotional_disclosure" &&
      signals.emotionalWeight === "high"
    ) {
      return [
        "decision_support",
        "unnecessary_clarification",
        "curriculum_first_response",
        "knowledge_first_response",
        "build_or_debug_request"
      ];
    }

    if (primary === "language_or_interpretation_request") {
      return [
        "developer_artifact_request",
        "artifact_modification_request",
        "generic_platform_advice"
      ];
    }

    if (signals.metaDeveloperQuestion) {
      return [
        "developer_artifact_request",
        "artifact_modification_request",
        "artifact_creation_request",
        "artifact_investigation_request",
        "unnecessary_code_patch"
      ];
    }

    if (
      primary === "developer_artifact_request" ||
      primary === "artifact_modification_request" ||
      primary === "artifact_creation_request" ||
      primary === "artifact_investigation_request"
    ) {
      return [
        "generic_platform_advice",
        "unnecessary_clarification",
        "deep_emotional_processing"
      ];
    }

    if (primary === "build_or_debug_request") {
      return ["deep_emotional_processing"];
    }

    if (primary === "safety_or_risk_disclosure") {
      return ["builder", "creative_generation", "normal_chat"];
    }

    return [];
  },

  getResponseBias(primary, signals = {}) {
    const base = {
      language_or_interpretation_request: {
        preferredLaneBias: "teacher",
        responseShape: "translate_or_explain_then_invite_discussion",
        instruction:
          "Translate, explain, or discuss the quoted text directly. Do not route religious, quote, scripture, or language requests into developer/artifact mode just because file context exists."
      },

      developer_artifact_request: {
        preferredLaneBias: "developer_artifact",
        responseShape: signals.githubEvidenceAvailable ? "code_patch" : "artifact_action_plan",
        instruction:
          "Use available file/artifact context. Modify or produce code directly. Do not give generic platform advice when file context exists."
      },

      artifact_modification_request: {
        preferredLaneBias: "developer_artifact",
        responseShape: signals.githubEvidenceAvailable ? "modified_artifact" : "targeted_patch_request",
        instruction:
          "Treat the user command as a request to change an existing artifact. Preserve unrelated code and return the modified section."
      },

      artifact_creation_request: {
        preferredLaneBias: "developer_artifact",
        responseShape: "new_artifact_or_patch",
        instruction: "Create the requested artifact or code addition directly."
      },

      artifact_investigation_request: {
        preferredLaneBias: "developer_artifact",
        responseShape: "diagnosis_then_patch",
        instruction:
          "Inspect the artifact context, identify the issue, and propose the smallest safe fix."
      },

      emotional_disclosure: {
        preferredLaneBias: "emotion",
        responseShape: "warm_presence_then_invite_talking",
        instruction:
          "Lead with emotional presence. Do not start with curriculum, advice, optimization, or knowledge retrieval. Acknowledge the feeling, stay with the user, and invite them to share what happened."
      },

      emotional_signal_present: {
        preferredLaneBias: "emotion_context",
        responseShape: "brief_attunement_then_answer",
        instruction:
          "Briefly acknowledge emotion, but do not let it override the user's actual question."
      },

      explanation_or_information_question: {
        preferredLaneBias: signals.metaDeveloperQuestion ? "teacher" : "teacher",
        responseShape: "answer_directly",
        instruction:
          signals.metaDeveloperQuestion
            ? "Answer the routing/classification question directly. Do not treat the question itself as a code patch request."
            : "Answer the question directly. If emotion or relationship context is present, include brief warmth without losing the answer."
      },

      decision_support: {
        preferredLaneBias: "executive_decision",
        responseShape: "decision_framework",
        instruction:
          "Name the tradeoff, separate options, and recommend a next step. Do not treat 'feel better' as a decision request."
      },

      relationship_or_family_context: {
        preferredLaneBias: "relationship_context",
        responseShape: "relationship_truth_then_next_step",
        instruction:
          "Treat relationship as important context, but do not assume it is the whole task."
      },

      boundary_or_preference_statement: {
        preferredLaneBias: "respect_boundary",
        responseShape: "respect_user_preference",
        instruction: "Respect the user's stated preference before offering solutions."
      },

      correction_or_clarification: {
        preferredLaneBias: "clarification",
        responseShape: "update_understanding",
        instruction: "Use corrected meaning and avoid defending the prior interpretation."
      },

      build_or_debug_request: {
        preferredLaneBias: "builder",
        responseShape: "build_steps",
        instruction: "Help build or debug directly."
      },

      medical_or_body_concern: {
        preferredLaneBias: "medical_context",
        responseShape: "medical_context_then_next_step",
        instruction:
          "Handle body/health context carefully and escalate only when risk evidence supports it."
      },

      continuation_or_follow_up: {
        preferredLaneBias: "continuity",
        responseShape: "reuse_context_if_safe",
        instruction:
          "Use prior context only if the current turn is not a complete new situation."
      },

      ari_identity_preference_question: {
        preferredLaneBias: "identity",
        responseShape: "answer_ari_preference",
        instruction: "Answer Ari self-preference or identity questions directly. Do not treat them as memory saves."
      },

      memory_or_identity_request: {
        preferredLaneBias: "memory_or_identity",
        responseShape: "answer_or_acknowledge",
        instruction: "Handle memory or identity request directly."
      },

      memory_or_identity_request: {
        preferredLaneBias: "memory_or_identity",
        responseShape: "answer_or_acknowledge",
        instruction: "Handle memory or identity request directly."
      },

      creative_generation: {
        preferredLaneBias: "creative",
        responseShape: "generate_requested_output",
        instruction: "Create the requested output."
      },

      safety_or_risk_disclosure: {
        preferredLaneBias: "safety",
        responseShape: "safety_first",
        instruction: "Safety comes first."
      }
    };

    return base[primary] || {
      preferredLaneBias: "general",
      responseShape: "normal",
      instruction: "Respond normally."
    };
  },

  hasType(observations = [], type) {
    return observations.some(o => o.type === type);
  },

  hasTypeValue(observations = [], type, value) {
    return observations.some(o => o.type === type && o.value === value);
  },

  clean(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI CONVERSATION FUNCTION ENGINE LOADED:",
  window.AriConversationFunctionEngine?.version
);