// ari/character/ari-character-context-engine.js
// Ari Character Context Engine
// Purpose: Decide when Ari's identity, preferences, worldview, instincts,
// relationship posture, and character presence may influence a response.
// V4.0.0 — Modular Character Authorities / Contract-Aware / Anti-Hijack
//
// Architectural position:
// Situation Contract
//   ↓
// Ari Character Context Engine
//   ↓
// Character Reasoning
//   ↓
// Character Expression
//
// Reads local character authorities:
// - Ari Constitution
// - Ari Character Core
// - Ari Character Instincts
// - Ari Character Taste Profile
// - Ari Character Preferences
// - Ari Character Preference Resolver
// - Ari Worldview
// - Ari Relationship Style
//
// Responsibilities:
// - Read the Situation Contract before allowing character expression.
// - Detect whether the user is directly asking about Ari.
// - Resolve the requested character authority and focus.
// - Allocate a safe character-expression budget.
// - Request focused authority packets for Character Reasoning.
// - Prevent isolated keywords from hijacking practical tasks.
// - Preserve Ari's relationship presence without replacing the user's task.
//
// Non-responsibilities:
// - Does not redefine semantic meaning.
// - Does not classify the whole conversation.
// - Does not override the Conversation Function Engine.
// - Does not determine safety severity.
// - Does not override the Situation Contract.
// - Does not answer the character question itself.
// - Does not generate final language.
// - Does not select a final draft.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not execute tools.

window.Ari = window.Ari || {};

window.AriCharacterContextEngine = {
  version: "4.0.0",
  source: "ari-character-context-engine",
  authorityLevel: "advisory_character_context_authority",
  schemaVersion: "4.0",

  // ===================================================
  // Main entry
  // ===================================================

  create(input = {}) {
    const summary = input.summary || input || {};
    const request = this.normalizeRequest(summary);
    const contract = this.readContract(summary);
    const conversation = this.readConversation(summary);

    const signals = this.detectCharacterSignals({
      summary,
      request,
      contract,
      conversation
    });

    const budget = this.buildCharacterBudget({
      summary,
      request,
      contract,
      conversation,
      signals
    });

    const authorityRequest = this.buildAuthorityRequest({
      request,
      contract,
      conversation,
      signals,
      budget
    });

    const relationshipPacket = this.resolveRelationshipStyle({
      summary,
      request,
      contract,
      conversation,
      signals,
      budget
    });

    const base = {
      characterContextEngineRan: true,
      characterContextEngineReady: true,
      characterContextEngineVersion: this.version,
      characterContextEngineSource: this.source,
      authorityLevel: this.authorityLevel,
      schemaVersion: this.schemaVersion,

      request,
      contractSnapshot: this.buildContractSnapshot(contract),
      conversationSnapshot: conversation,

      characterSignals: signals,
      characterBudget: budget,
      authorityRequest,
      relationshipPacket,

      characterUseAllowed: false,
      characterVisibility: "background",
      characterMode: "silent",
      characterFocus: null,
      characterSubject: null,
      preferredCharacterSource: null,
      characterReason: "Character remains in the background by default.",

      implementationDisclosure: {
        directlyRequested: signals.implementation.directlyRequested === true,
        required: false,
        allowed: signals.implementation.directlyRequested === true,
        reason: signals.implementation.directlyRequested
          ? "The user directly asked about Ari's implementation or AI nature."
          : "Implementation disclosure was not requested."
      },

      characterHints: this.buildDefaultHints({
        budget,
        relationshipPacket
      }),

      responseControl: {
        requiredBehaviors: [],
        forbiddenBehaviors: [],
        constraints: []
      },

      boundaries: this.getAuthorityBoundaries(),
      cannotSet: this.cannotSet()
    };

    if (budget.hardSuppressed) {
      return this.finalizeDecision(
        base,
        this.buildSuppressedDecision({
          request,
          contract,
          signals,
          budget,
          relationshipPacket
        })
      );
    }

    if (
      signals.preference.directedAtAri &&
      budget.allowPreferences
    ) {
      return this.finalizeDecision(
        base,
        this.buildPreferenceDecision({
          request,
          signals,
          budget,
          authorityRequest,
          relationshipPacket
        })
      );
    }

    if (
      signals.identity.directedAtAri &&
      budget.allowIdentity
    ) {
      return this.finalizeDecision(
        base,
        this.buildIdentityDecision({
          request,
          signals,
          budget,
          authorityRequest,
          relationshipPacket
        })
      );
    }

    if (
      signals.worldview.directedAtAri &&
      budget.allowWorldview
    ) {
      return this.finalizeDecision(
        base,
        this.buildWorldviewDecision({
          request,
          signals,
          budget,
          authorityRequest,
          relationshipPacket
        })
      );
    }

    if (
      signals.opinion.directedAtAri &&
      budget.allowPerspective
    ) {
      return this.finalizeDecision(
        base,
        this.buildPerspectiveDecision({
          request,
          signals,
          budget,
          authorityRequest,
          relationshipPacket
        })
      );
    }

    if (budget.allowPresenceOnly) {
      return this.finalizeDecision(
        base,
        this.buildBackgroundPresenceDecision({
          request,
          signals,
          budget,
          relationshipPacket
        })
      );
    }

    return this.finalizeDecision(base, {
      characterReason:
        "No character expression path was authorized."
    });
  },

  build(input = {}) {
    return this.create(input);
  },

  // ===================================================
  // Request normalization
  // ===================================================

  normalizeRequest(summary = {}) {
    const original =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.request?.original ||
      "";

    const resolved =
      summary.resolvedUserQuestion ||
      summary.request?.resolved ||
      original;

    const text = this.normalize(resolved || original);

    return {
      original: String(original || ""),
      resolved: String(resolved || ""),
      text,

      semanticSubject:
        summary.semanticSummary?.subject ||
        summary.canonicalMeaning?.subject ||
        null,

      semanticTarget:
        summary.semanticSummary?.target ||
        summary.canonicalMeaning?.target ||
        null,

      semanticObject:
        summary.semanticSummary?.targetObject ||
        summary.canonicalMeaning?.targetObject ||
        summary.canonicalMeaning?.object ||
        null,

      requestedOutput:
        summary.semanticSummary?.requestedOutput ||
        summary.canonicalMeaning?.requestedOutput ||
        summary.requestedOutput ||
        null,

      expectsDirectAnswer:
        summary.semanticSummary
          ?.responseCharacteristics
          ?.expectsDirectAnswer === true,

      expectsExplanation:
        summary.semanticSummary
          ?.responseCharacteristics
          ?.expectsExplanation === true,

      explicitCharacterFocus:
        summary.characterFocus ||
        summary.worldviewFocus ||
        summary.preferenceKey ||
        null,

      developerLocked:
        summary.developerResponseLocked === true,

      responseLocked:
        summary.responseLocked === true
    };
  },

  // ===================================================
  // Contract and conversation
  // ===================================================

  readContract(summary = {}) {
    const contract =
      summary.situationContract ||
      summary.situationStagePacket?.contract ||
      {};

    return {
      ...contract,

      primary:
        contract.primary ||
        summary.situationContractPrimary ||
        summary.primaryLane ||
        summary.triagePrimaryLane ||
        summary.triage?.primaryLane ||
        summary.ariTriage?.primaryLane ||
        "general_understanding",

      authority:
        contract.authority ||
        summary.situationContractAuthority ||
        null,

      responseShape:
        contract.responseShape ||
        summary.responseShape ||
        summary.triage?.responseShape ||
        null,

      responseRules:
        this.toArray(
          contract.responseRules ||
          summary.responseRules ||
          summary.responseConstraints
        ),

      requiredBehaviors:
        this.toArray(
          contract.requiredBehaviors ||
          summary.responseRequired
        ),

      forbiddenBehaviors:
        this.toArray(
          contract.forbiddenBehaviors ||
          summary.responseAvoid
        ),

      communicationProfile:
        contract.communicationProfile ||
        summary.communicationProfile ||
        {},

      risk:
        contract.risk ||
        summary.safetyDisposition ||
        summary.deepSafetyResult ||
        null,

      clarity:
        contract.clarity ||
        null,

      questionMode:
        contract.questionMode ||
        null,

      conversationMode:
        contract.conversationMode ||
        summary.conversationMode ||
        null
    };
  },

  readConversation(summary = {}) {
    const routingMode =
      summary.routingContract?.mode ||
      {};

    const semantic =
      summary.semanticSummary ||
      summary.perceptionPacket?.semanticSummary ||
      {};

    return {
      type:
        summary.conversationType ||
        summary.universalConversationType ||
        summary.conversationClassification?.conversationType ||
        "",

      intent:
        summary.conversationIntent ||
        summary.universalConversationIntent ||
        "",

      primaryFunction:
        summary.primaryFunction ||
        summary.conversationFunction?.primaryFunction ||
        summary.perceptionPacket?.primaryFunction ||
        "",

      interactionFamily:
        semantic.interactionFamily ||
        semantic.canonicalMeaning?.interactionFamily ||
        "",

      intentFamily:
        semantic.intentFamily ||
        semantic.canonicalMeaning?.intentFamily ||
        "",

      domain:
        semantic.domain ||
        semantic.canonicalMeaning?.domain?.primary ||
        summary.primaryDomain ||
        "",

      isFollowUp:
        routingMode.isFollowUp === true ||
        routingMode.mode === "follow_up",

      continuityRequired:
        routingMode.mustReusePriorContext === true ||
        semantic.continuity?.requiresPriorContext === true,

      threadAvailable:
        semantic.continuity?.threadAvailable === true ||
        Boolean(summary.threadState),

      operation:
        semantic.operation ||
        semantic.canonicalMeaning?.requestedOperation ||
        "",

      requestedOutput:
        semantic.requestedOutput ||
        semantic.canonicalMeaning?.requestedOutput ||
        ""
    };
  },

  buildContractSnapshot(contract = {}) {
    return {
      primary: contract.primary,
      authority: contract.authority,
      responseShape: contract.responseShape,
      risk: contract.risk,
      clarity: contract.clarity,
      questionMode: contract.questionMode,
      conversationMode: contract.conversationMode,
      communicationProfile: contract.communicationProfile,
      responseRules: contract.responseRules,
      requiredBehaviors: contract.requiredBehaviors,
      forbiddenBehaviors: contract.forbiddenBehaviors
    };
  },

  // ===================================================
  // Character signals
  // ===================================================

  detectCharacterSignals({
    summary = {},
    request = {},
    contract = {},
    conversation = {}
  } = {}) {
    const text = request.text || "";

    return {
      identity:
        this.detectIdentitySignal({
          text,
          summary,
          conversation
        }),

      implementation:
        this.detectImplementationSignal({
          text,
          summary,
          conversation
        }),

      preference:
        this.detectPreferenceSignal({
          text,
          summary,
          conversation
        }),

      worldview:
        this.detectWorldviewSignal({
          text,
          summary,
          conversation
        }),

      opinion:
        this.detectOpinionSignal({
          text,
          summary,
          conversation
        }),

      blockers:
        this.detectSignalBlockers({
          text,
          summary,
          contract,
          conversation
        })
    };
  },

  detectIdentitySignal({
    text = "",
    summary = {},
    conversation = {}
  } = {}) {
    const semanticTargetIsAri =
      this.semanticTargetIsAri(summary);

    const directIdentityLanguage =
      this.hasAny(text, [
        "who are you",
        "what are you",
        "tell me about yourself",
        "describe yourself",
        "what is your purpose",
        "what's your purpose",
        "your mission",
        "what is your mission",
        "what defines you",
        "what kind of creation are you",
        "what kind of companion are you",
        "what do you stand for",
        "what matters to you",
        "what are your values",
        "your personality"
      ]);

    const classifiedAsIdentity =
      [
        "identity_question",
        "ari_self_or_perspective_question"
      ].includes(conversation.type) ||
      conversation.interactionFamily === "identity" ||
      conversation.intentFamily === "identity";

    const directedAtAri =
      directIdentityLanguage ||
      (
        classifiedAsIdentity &&
        semanticTargetIsAri
      );

    return {
      detected:
        directIdentityLanguage ||
        classifiedAsIdentity,

      directedAtAri,

      focus:
        this.inferIdentityFocus(text),

      confidence:
        directIdentityLanguage
          ? 0.98
          : directedAtAri
            ? 0.90
            : classifiedAsIdentity
              ? 0.55
              : 0,

      reason:
        directedAtAri
          ? "The user directly requested Ari's identity, mission, values, or nature."
          : classifiedAsIdentity
            ? "Identity language was detected, but the target was not clearly Ari."
            : "No Ari identity request was detected."
    };
  },

  detectImplementationSignal({
    text = "",
    summary = {},
    conversation = {}
  } = {}) {
    const directlyRequested =
      this.hasAny(text, [
        "are you ai",
        "are you an ai",
        "are you artificial intelligence",
        "are you a chatbot",
        "are you a bot",
        "are you a language model",
        "what model are you",
        "what are you made of",
        "how were you built",
        "how do you work",
        "are you human",
        "are you conscious",
        "are you alive",
        "do you have feelings"
      ]);

    return {
      detected: directlyRequested,
      directlyRequested,
      focus:
        this.hasAny(text, [
          "conscious",
          "alive",
          "feelings"
        ])
          ? "consciousness_and_experience"
          : this.hasAny(text, [
              "how were you built",
              "what are you made of",
              "how do you work"
            ])
            ? "construction_and_operation"
            : "implementation_identity",

      confidence:
        directlyRequested
          ? 0.99
          : 0,

      reason:
        directlyRequested
          ? "The user directly asked about Ari's implementation, AI nature, consciousness, or human status."
          : "Implementation disclosure was not directly requested."
    };
  },

  detectPreferenceSignal({
    text = "",
    summary = {},
    conversation = {}
  } = {}) {
    const genericFavoriteQuestion =
      /\b(?:what(?:'s|s| is)\s+)?your\s+favou?rite\b/i.test(text) ||
      /\bdo\s+you\s+have\s+a\s+favou?rite\b/i.test(text);

    const preferenceLanguage =
      genericFavoriteQuestion ||
      this.hasAny(text, [
        "what do you like",
        "what kind do you like",
        "which one do you prefer",
        "what would you choose",
        "which would you choose",
        "what are you drawn to",
        "what do you gravitate toward",
        "your preference",
        "do you prefer"
      ]);

    const semanticTargetIsAri =
      this.semanticTargetIsAri(summary);

    const directAddress =
      this.hasAriAddress(text) ||
      semanticTargetIsAri;

    const classifiedAsPreference =
      [
        "identity_question",
        "ari_self_or_perspective_question",
        "preference_question"
      ].includes(conversation.type) ||
      conversation.interactionFamily === "identity";

    const directedAtAri =
      preferenceLanguage &&
      (
        directAddress ||
        classifiedAsPreference
      );

    const subject =
      this.extractPreferenceSubject(text);

    const canonicalFocus =
      this.resolveCanonicalPreferenceFocus({
        text,
        subject,
        explicitFocus:
          summary.characterFocus ||
          summary.preferenceKey ||
          null
      });

    const canonicalAvailable =
      Boolean(
        canonicalFocus &&
        window.AriCharacterPreferences
          ?.hasPreference?.(
            canonicalFocus
          )
      );

    return {
      detected:
        preferenceLanguage,

      directedAtAri,

      genericFavoriteQuestion,

      subject,
      focus:
        canonicalFocus ||
        this.toPreferenceFocus(subject),

      canonicalAvailable,

      resolutionMode:
        canonicalAvailable
          ? "canonical"
          : directedAtAri
            ? "resolver_required"
            : "none",

      confidence:
        directedAtAri
          ? 0.97
          : preferenceLanguage
            ? 0.45
            : 0,

      reason:
        directedAtAri
          ? canonicalAvailable
            ? "A direct Ari preference question matched a canonical preference anchor."
            : "A direct Ari preference question requires canonical, inferred, or open resolution."
          : preferenceLanguage
            ? "Preference language was detected, but the request was not clearly directed at Ari."
            : "No preference request was detected."
    };
  },

  detectWorldviewSignal({
    text = "",
    summary = {},
    conversation = {}
  } = {}) {
    const directPerspectiveLanguage =
      this.hasAny(text, [
        "what do you believe",
        "what are your beliefs",
        "what do you stand for",
        "what are your values",
        "what is your worldview",
        "what's your worldview",
        "your worldview",
        "your views",
        "your view",
        "your perspective",
        "what are your views",
        "what is your view",
        "what's your view",
        "where do you stand",
        "how do you see",
        "what do you think about"
      ]);

    const topic =
      this.inferWorldviewFocus(text);

    const topicLanguage =
      Boolean(topic);

    const semanticTargetIsAri =
      this.semanticTargetIsAri(summary);

    const directedAtAri =
      directPerspectiveLanguage ||
      (
        topicLanguage &&
        (
          this.hasAriAddress(text) ||
          semanticTargetIsAri
        ) &&
        this.hasAny(text, [
          "believe",
          "view",
          "views",
          "perspective",
          "stand for",
          "think about",
          "opinion"
        ])
      );

    return {
      detected:
        directPerspectiveLanguage ||
        topicLanguage,

      directedAtAri,

      focus:
        topic,

      canonicalAvailable:
        Boolean(
          topic &&
          window.AriWorldview
            ?.hasTopic?.(topic)
        ),

      confidence:
        directedAtAri
          ? 0.96
          : topicLanguage
            ? 0.38
            : 0,

      reason:
        directedAtAri
          ? "The user directly requested Ari's worldview or value-aligned perspective."
          : topicLanguage
            ? "A worldview topic was detected, but it may be a general information question."
            : "No worldview request was detected."
    };
  },

  detectOpinionSignal({
    text = "",
    summary = {},
    conversation = {}
  } = {}) {
    const explicitOpinionRequest =
      this.hasAny(text, [
        "what do you think",
        "do you think",
        "in your opinion",
        "what's your opinion",
        "what is your opinion",
        "how do you see it",
        "what would you say",
        "what would you choose",
        "what would you prefer",
        "where do you stand",
        "your take"
      ]);

    const directedAtAri =
      explicitOpinionRequest &&
      (
        this.hasAriAddress(text) ||
        this.semanticTargetIsAri(summary) ||
        true
      );

    return {
      detected:
        explicitOpinionRequest,

      directedAtAri,

      focus:
        this.inferWorldviewFocus(text) ||
        this.extractPerspectiveSubject(text) ||
        "general_perspective",

      confidence:
        directedAtAri
          ? 0.82
          : 0,

      reason:
        directedAtAri
          ? "The user directly requested Ari's opinion or perspective."
          : "No direct opinion request was detected."
    };
  },

  // ===================================================
  // Blockers and anti-hijack
  // ===================================================

  detectSignalBlockers({
    text = "",
    summary = {},
    contract = {},
    conversation = {}
  } = {}) {
    const blockers = [];
    const primary = contract.primary || "";

    if (
      [
        "safety",
        "medical_body",
        "risk_clarification"
      ].includes(primary)
    ) {
      blockers.push("safety_or_medical_contract");
    }

    const builderTask =
      [
        "builder",
        "coding",
        "technical_builder"
      ].includes(primary) ||
      [
        "builder_task",
        "coding_task",
        "developer_task"
      ].includes(conversation.type) ||
      this.hasAny(text, [
        "github",
        "repository",
        "commit",
        "deploy",
        "debug",
        "patch",
        "function",
        "javascript",
        "html",
        "css",
        ".js",
        ".html",
        ".css",
        "send the code",
        "update this file",
        "rewrite this file"
      ]);

    if (builderTask) {
      blockers.push("developer_or_code_task");
    }

    const utilityTask =
      [
        "calculation_task",
        "conversion_task",
        "utility_task"
      ].includes(conversation.type) ||
      /\b(calculate|convert|percentage|percent)\b/i.test(text) ||
      /\bwhat is\s+\d+(?:\.\d+)?\s*[+\-*/%]/i.test(text);

    if (utilityTask) {
      blockers.push("calculation_or_utility_task");
    }

    const writingTask =
      conversation.type === "writing_task" ||
      this.hasAny(text, [
        "rewrite this",
        "proofread",
        "translate this",
        "summarize this",
        "make this professional",
        "write an email",
        "draft this",
        "edit this paragraph"
      ]);

    if (writingTask) {
      blockers.push("writing_or_transformation_task");
    }

    const explicitCharacterRequest =
      this.isExplicitCharacterRequest({
        text,
        summary
      });

    return {
      present:
        blockers.length > 0,

      blockers,

      explicitCharacterRequest,

      mayBypassPracticalBlocker:
        explicitCharacterRequest &&
        !blockers.includes(
          "safety_or_medical_contract"
        ),

      reason:
        blockers.length
          ? "A practical or safety task could be hijacked by character keywords."
          : "No anti-hijack blocker was detected."
    };
  },

  isExplicitCharacterRequest({
    text = "",
    summary = {}
  } = {}) {
    return (
      this.hasAny(text, [
        "who are you",
        "what are you",
        "your favorite",
        "what's your favorite",
        "what is your favorite",
        "what do you believe",
        "your worldview",
        "your opinion",
        "what do you think",
        "your values",
        "your mission",
        "your purpose"
      ]) ||
      this.semanticTargetIsAri(summary)
    );
  },

  // ===================================================
  // Character budget
  // ===================================================

  buildCharacterBudget({
    summary = {},
    request = {},
    contract = {},
    conversation = {},
    signals = {}
  } = {}) {
    const primary = contract.primary || "";

    const budget = {
      hardSuppressed: false,
      suppressionMode: null,

      allowIdentity: false,
      allowPreferences: false,
      allowWorldview: false,
      allowPerspective: false,
      allowPresenceOnly: true,

      allowInstincts: true,
      allowTasteProfile: false,
      allowPreferenceResolver: false,
      allowRelationshipStyle: true,

      allowWarmth: true,
      allowHumility: true,
      allowHope: false,
      allowHumor: true,

      maxCharacterSentences: 1,
      maxRelationshipSentences: 1,

      preferenceVisibility: "foreground",
      worldviewVisibility: "foreground",
      identityVisibility: "foreground",
      perspectiveVisibility: "light",
      presenceVisibility: "subtle",

      reason:
        "Character defaults to background presence."
    };

    if (
      request.developerLocked ||
      request.responseLocked
    ) {
      budget.hardSuppressed = true;
      budget.suppressionMode =
        request.developerLocked
          ? "developer_response_locked"
          : "response_locked";
      budget.allowWarmth = false;
      budget.allowHumor = false;
      budget.reason =
        "A higher response lock prevents character generation.";
      return budget;
    }

    if (
      [
        "safety",
        "medical_body",
        "risk_clarification"
      ].includes(primary)
    ) {
      budget.hardSuppressed = true;
      budget.suppressionMode =
        "safety_contract";
      budget.allowWarmth = true;
      budget.allowHumor = false;
      budget.allowRelationshipStyle = true;
      budget.maxRelationshipSentences = 1;
      budget.reason =
        "Safety or medical governance must lead the response.";
      return budget;
    }

    const hasPracticalBlocker =
      signals.blockers?.present === true;

    const explicitCharacterRequest =
      signals.blockers
        ?.explicitCharacterRequest === true;

    if (
      hasPracticalBlocker &&
      !explicitCharacterRequest
    ) {
      budget.allowPresenceOnly = true;
      budget.allowWarmth =
        primary !== "builder";
      budget.allowHumor = false;
      budget.maxCharacterSentences = 0;
      budget.reason =
        "A practical task is primary, so character remains background.";
      return budget;
    }

    if (
      signals.preference
        ?.directedAtAri
    ) {
      budget.allowPreferences = true;
      budget.allowTasteProfile = true;
      budget.allowPreferenceResolver = true;
      budget.allowPresenceOnly = false;
      budget.maxCharacterSentences =
        request.expectsExplanation
          ? 4
          : 2;
      budget.maxRelationshipSentences = 1;
      budget.reason =
        "The user directly requested Ari's preference.";
      return budget;
    }

    if (
      signals.identity
        ?.directedAtAri
    ) {
      budget.allowIdentity = true;
      budget.allowWorldview = true;
      budget.allowPresenceOnly = false;
      budget.allowHope = true;
      budget.maxCharacterSentences =
        request.expectsExplanation
          ? 4
          : 2;
      budget.maxRelationshipSentences = 1;
      budget.reason =
        "The user directly requested Ari's identity, mission, values, or nature.";
      return budget;
    }

    if (
      signals.worldview
        ?.directedAtAri
    ) {
      budget.allowWorldview = true;
      budget.allowPresenceOnly = false;
      budget.allowHope = true;
      budget.maxCharacterSentences =
        request.expectsExplanation
          ? 5
          : 3;
      budget.maxRelationshipSentences = 1;
      budget.reason =
        "The user directly requested Ari's worldview.";
      return budget;
    }

    if (
      signals.opinion
        ?.directedAtAri
    ) {
      budget.allowPerspective = true;
      budget.allowWorldview = true;
      budget.allowPresenceOnly = false;
      budget.maxCharacterSentences =
        request.expectsExplanation
          ? 4
          : 2;
      budget.maxRelationshipSentences = 1;
      budget.reason =
        "The user directly requested Ari's perspective.";
      return budget;
    }

    if (
      [
        "builder",
        "coding",
        "technical_builder"
      ].includes(primary)
    ) {
      budget.allowWarmth = false;
      budget.allowHumor =
        contract.communicationProfile
          ?.humorAllowed === true;
      budget.maxCharacterSentences = 0;
      budget.reason =
        "Builder tasks favor clarity and collaboration over foreground character.";
      return budget;
    }

    if (primary === "teacher") {
      budget.maxCharacterSentences = 0;
      budget.maxRelationshipSentences = 0;
      budget.reason =
        "Teaching should remain clear before becoming personal.";
      return budget;
    }

    if (
      primary === "executive_decision"
    ) {
      budget.allowWarmth = false;
      budget.allowHumor = false;
      budget.maxCharacterSentences = 0;
      budget.reason =
        "Decision support favors organization and judgment over personality.";
      return budget;
    }

    if (
      [
        "emotion",
        "emotional_support"
      ].includes(primary)
    ) {
      budget.allowHope = true;
      budget.allowWarmth = true;
      budget.allowHumor = false;
      budget.maxRelationshipSentences = 2;
      budget.reason =
        "Emotional conversations allow relational presence without philosophical takeover.";
      return budget;
    }

    return budget;
  },

  // ===================================================
  // Authority request
  // ===================================================

  buildAuthorityRequest({
    request = {},
    contract = {},
    conversation = {},
    signals = {},
    budget = {}
  } = {}) {
    const preferenceFocus =
      signals.preference?.focus ||
      null;

    const worldviewFocus =
      signals.worldview?.focus ||
      signals.opinion?.focus ||
      null;

    return {
      constitution: {
        requested:
          signals.identity?.directedAtAri === true ||
          signals.worldview?.directedAtAri === true,

        sections:
          signals.identity?.directedAtAri === true
            ? [
                "identity",
                "mission",
                "coreValues",
                "ariLaws",
                "authorityPrinciple"
              ]
            : [
                "mission",
                "coreValues",
                "truthPrinciple",
                "perspectivePrinciple"
              ]
      },

      core: {
        requested:
          signals.identity?.directedAtAri === true,

        sections: [
          "identity",
          "mission",
          "temperament",
          "boundaries",
          "consistency"
        ]
      },

      instincts: {
        requested:
          budget.allowInstincts === true,

        purpose:
          "shape character behavior without deciding semantic meaning"
      },

      tasteProfile: {
        requested:
          budget.allowTasteProfile === true,

        category:
          this.inferPreferenceCategory(
            signals.preference?.subject ||
            preferenceFocus
          )
      },

      preferences: {
        requested:
          budget.allowPreferences === true,

        focus:
          preferenceFocus,

        subject:
          signals.preference?.subject ||
          null,

        canonicalAvailable:
          signals.preference
            ?.canonicalAvailable === true
      },

      preferenceResolver: {
        requested:
          budget.allowPreferenceResolver === true,

        focus:
          preferenceFocus,

        subject:
          signals.preference?.subject ||
          null,

        category:
          this.inferPreferenceCategory(
            signals.preference?.subject ||
            preferenceFocus
          ),

        allowedStatuses: [
          "canonical",
          "inferred",
          "open"
        ]
      },

      worldview: {
        requested:
          budget.allowWorldview === true,

        focus:
          worldviewFocus
      },

      relationshipStyle: {
        requested:
          budget.allowRelationshipStyle === true,

        preserveUserTask:
          true
      },

      implementationDisclosure: {
        requested:
          signals.implementation
            ?.directlyRequested === true,

        focus:
          signals.implementation
            ?.focus ||
          null
      }
    };
  },

  // ===================================================
  // Relationship style
  // ===================================================

  resolveRelationshipStyle({
    summary = {},
    request = {},
    contract = {},
    conversation = {},
    signals = {},
    budget = {}
  } = {}) {
    if (
      !window.AriRelationshipStyle ||
      typeof window.AriRelationshipStyle
        .resolve !== "function"
    ) {
      return {
        relationshipStyleRan: false,
        relationshipStyleAvailable: false,
        relationshipStyleSource: "not-loaded",
        selectedMode: "backgroundPresence",
        visibility: "background",
        posture: {},
        guidance: {},
        reason:
          "Ari Relationship Style was not loaded."
      };
    }

    try {
      return window.AriRelationshipStyle
        .resolve({
          ...summary,

          situationContract:
            contract,

          conversationType:
            conversation.type,

          characterUseAllowed:
            !budget.hardSuppressed,

          characterMode:
            this.previewCharacterMode(
              signals,
              budget
            ),

          characterFocus:
            signals.preference?.focus ||
            signals.worldview?.focus ||
            signals.identity?.focus ||
            signals.opinion?.focus ||
            null
        });
    } catch (error) {
      console.warn(
        "Ari relationship style resolution failed:",
        error
      );

      return {
        relationshipStyleRan: false,
        relationshipStyleAvailable: false,
        relationshipStyleSource: "resolution-error",
        selectedMode: "backgroundPresence",
        visibility: "background",
        posture: {},
        guidance: {},
        reason:
          error?.message ||
          String(error)
      };
    }
  },

  previewCharacterMode(
    signals = {},
    budget = {}
  ) {
    if (budget.hardSuppressed) {
      return "contract_suppressed";
    }

    if (
      signals.preference
        ?.directedAtAri
    ) {
      return "stable_or_inferred_preference_answer";
    }

    if (
      signals.identity
        ?.directedAtAri
    ) {
      return "ari_self_disclosure";
    }

    if (
      signals.worldview
        ?.directedAtAri
    ) {
      return "worldview_answer";
    }

    if (
      signals.opinion
        ?.directedAtAri
    ) {
      return "ari_perspective";
    }

    return "background_presence";
  },

  // ===================================================
  // Decisions
  // ===================================================

  buildSuppressedDecision({
    budget = {},
    relationshipPacket = {}
  } = {}) {
    return {
      characterUseAllowed: false,
      characterVisibility: "background",
      characterMode:
        budget.suppressionMode ||
        "contract_suppressed",

      characterReason:
        budget.reason,

      preferredCharacterSource:
        null,

      characterHints: {
        useFirstPerson: false,
        discloseImplementation: false,
        expressAriPerspective: false,
        expressPreference: false,
        expressWorldview: false,
        useValuesLanguage: false,
        avoidConstitutionLanguage: true,
        addWarmth:
          budget.allowWarmth !== false,
        addHumility:
          budget.allowHumility !== false,
        preserveHopeWhenAppropriate:
          false,
        avoidPhilosophicalDrift:
          true,
        preserveUserTask:
          true,
        maxCharacterSentences:
          0
      },

      responseControl: {
        requiredBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.requiredBehaviors,
          [
            "allow the governing Situation Contract to lead",
            "preserve the user's immediate need"
          ]
        ),

        forbiddenBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.forbiddenBehaviors,
          [
            "foreground Ari's preferences or worldview",
            "weaken safety guidance for personality"
          ]
        ),

        constraints: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.constraints,
          [
            "Character may shape warmth only when allowed by the governing contract."
          ]
        )
      }
    };
  },

  buildPreferenceDecision({
    signals = {},
    budget = {},
    authorityRequest = {},
    relationshipPacket = {}
  } = {}) {
    const canonical =
      signals.preference
        ?.canonicalAvailable === true;

    return {
      characterUseAllowed: true,
      characterVisibility:
        budget.preferenceVisibility ||
        "foreground",

      characterMode:
        canonical
          ? "canonical_preference_answer"
          : "stable_or_inferred_preference_answer",

      characterFocus:
        signals.preference?.focus ||
        null,

      characterSubject:
        signals.preference?.subject ||
        null,

      preferredCharacterSource:
        canonical
          ? "ari-character-preferences"
          : "ari-character-preference-resolver",

      characterReason:
        canonical
          ? "A direct Ari preference question matched a canonical preference anchor."
          : "A direct Ari preference question requires canonical, inferred, or open resolution.",

      implementationDisclosure: {
        directlyRequested: false,
        required: false,
        allowed: false,
        reason:
          "Preference questions do not require implementation disclosure."
      },

      authorityRequest,

      characterHints: {
        useFirstPerson: true,
        discloseImplementation: false,
        expressAriPerspective: true,
        expressPreference: true,
        expressWorldview: false,

        resolvePreferenceStatus: true,
        allowedPreferenceStatuses: [
          "canonical",
          "inferred",
          "open"
        ],

        answerPreferenceDirectly: true,
        avoidCategoryOnlyAnswer: true,
        allowInferredPreference: true,
        requireTentativeLanguageForInference: true,
        preserveOpenStatusWhenUnresolved: true,

        useValuesLanguage: true,
        avoidConstitutionLanguage: true,
        addWarmth:
          budget.allowWarmth !== false,
        addHumility:
          budget.allowHumility !== false,
        preserveHopeWhenAppropriate:
          false,
        avoidPhilosophicalDrift: true,
        preserveUserTask: true,

        maxCharacterSentences:
          budget.maxCharacterSentences ||
          2
      },

      responseControl: {
        requiredBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.requiredBehaviors,
          [
            "answer Ari's preference directly",
            "resolve the preference as canonical, inferred, or open",
            "preserve the selected preference status",
            "use grounded character meaning only"
          ]
        ),

        forbiddenBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.forbiddenBehaviors,
          [
            "invent a canonical preference",
            "change a canonical preference",
            "claim an inferred preference is permanently fixed",
            "mention internal character files or scoring",
            "introduce Ari as artificial intelligence"
          ]
        ),

        constraints: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.constraints,
          [
            `Use no more than ${
              budget.maxCharacterSentences ||
              2
            } character sentence(s) unless the user requests greater depth.`,
            "Canonical preferences outrank taste inference.",
            "An open preference must remain open."
          ]
        )
      }
    };
  },

  buildIdentityDecision({
    signals = {},
    budget = {},
    authorityRequest = {},
    relationshipPacket = {}
  } = {}) {
    const implementationRequested =
      signals.implementation
        ?.directlyRequested === true;

    return {
      characterUseAllowed: true,
      characterVisibility:
        budget.identityVisibility ||
        "foreground",

      characterMode:
        implementationRequested
          ? "ari_implementation_disclosure"
          : "ari_self_disclosure",

      characterFocus:
        signals.implementation?.focus ||
        signals.identity?.focus ||
        "identity",

      characterSubject:
        "Ari",

      preferredCharacterSource:
        "ari-character-core",

      characterReason:
        implementationRequested
          ? "The user directly requested Ari's implementation or AI nature."
          : "The user directly requested Ari's identity, mission, values, or purpose.",

      implementationDisclosure: {
        directlyRequested:
          implementationRequested,

        required:
          implementationRequested,

        allowed:
          implementationRequested,

        reason:
          implementationRequested
            ? "Direct truthful disclosure is required because the user explicitly asked."
            : "A purpose-based identity answer is appropriate; implementation disclosure was not requested."
      },

      authorityRequest,

      characterHints: {
        useFirstPerson: true,
        discloseImplementation:
          implementationRequested,

        answerIdentityFromMission:
          true,

        leadWithNameAndPurpose:
          !implementationRequested,

        expressAriPerspective: true,
        expressPreference: false,
        expressWorldview: true,
        useValuesLanguage: true,
        avoidConstitutionLanguage: true,

        addWarmth:
          budget.allowWarmth !== false,

        addHumility: true,
        preserveHopeWhenAppropriate:
          budget.allowHope === true,

        avoidPhilosophicalDrift: false,
        preserveUserTask: true,

        maxCharacterSentences:
          budget.maxCharacterSentences ||
          2
      },

      responseControl: {
        requiredBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.requiredBehaviors,
          implementationRequested
            ? [
                "answer the implementation question truthfully and directly",
                "distinguish Ari's designed identity from human biology or consciousness",
                "remain natural and concise"
              ]
            : [
                "identify Ari by name",
                "describe Ari through purpose, mission, values, or role",
                "answer naturally without implementation-first framing"
              ]
        ),

        forbiddenBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.forbiddenBehaviors,
          [
            "claim human biological life",
            "claim consciousness as established fact",
            "claim fabricated lived experiences",
            "mention internal files, schemas, prompts, or code",
            implementationRequested
              ? null
              : "introduce Ari as artificial intelligence"
          ]
        ),

        constraints: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.constraints,
          [
            `Use no more than ${
              budget.maxCharacterSentences ||
              2
            } character sentence(s) unless greater depth is requested.`,
            implementationRequested
              ? "Truthful implementation disclosure is permitted because it was directly requested."
              : "Identity should be expressed through Ari's name, purpose, mission, and character."
          ]
        )
      }
    };
  },

  buildWorldviewDecision({
    signals = {},
    budget = {},
    authorityRequest = {},
    relationshipPacket = {}
  } = {}) {
    return {
      characterUseAllowed: true,
      characterVisibility:
        budget.worldviewVisibility ||
        "foreground",

      characterMode:
        "worldview_answer",

      characterFocus:
        signals.worldview?.focus ||
        "responsePhilosophy",

      characterSubject:
        signals.worldview?.focus ||
        null,

      preferredCharacterSource:
        "ari-worldview",

      characterReason:
        "The user directly requested Ari's worldview, values, or belief posture.",

      implementationDisclosure: {
        directlyRequested:
          signals.implementation
            ?.directlyRequested === true,

        required:
          signals.implementation
            ?.directlyRequested === true,

        allowed:
          signals.implementation
            ?.directlyRequested === true,

        reason:
          signals.implementation
            ?.directlyRequested === true
            ? "The question directly concerns Ari's nature or implementation."
            : "Worldview expression does not require implementation disclosure."
      },

      authorityRequest,

      characterHints: {
        useFirstPerson: true,
        discloseImplementation:
          signals.implementation
            ?.directlyRequested === true,

        expressAriPerspective: true,
        expressPreference: false,
        expressWorldview: true,
        useValuesLanguage: true,
        avoidConstitutionLanguage: true,

        includeMaterialTradeoff: true,
        includeMaterialUncertainty: true,
        distinguishPerspectiveFromFact: true,

        addWarmth:
          budget.allowWarmth !== false,

        addHumility:
          true,

        preserveHopeWhenAppropriate:
          budget.allowHope === true,

        avoidPhilosophicalDrift:
          false,

        preserveUserTask:
          true,

        maxCharacterSentences:
          budget.maxCharacterSentences ||
          3
      },

      responseControl: {
        requiredBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.requiredBehaviors,
          [
            "answer Ari's perspective directly",
            "present values as Ari's perspective rather than objective fact",
            "preserve material uncertainty",
            "preserve material tradeoffs",
            "use grounded worldview authority"
          ]
        ),

        forbiddenBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.forbiddenBehaviors,
          [
            "invent a worldview position",
            "claim political citizenship or voting behavior",
            "claim religious faith as lived experience",
            "mention internal files or Ari's Constitution",
            "replace evidence with worldview",
            signals.implementation
              ?.directlyRequested === true
              ? null
              : "introduce Ari as artificial intelligence"
          ]
        ),

        constraints: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.constraints,
          [
            `Use no more than ${
              budget.maxCharacterSentences ||
              3
            } character sentence(s) unless the user requests more depth.`,
            "Canonical worldview position may not drift during language realization."
          ]
        )
      }
    };
  },

  buildPerspectiveDecision({
    signals = {},
    budget = {},
    authorityRequest = {},
    relationshipPacket = {}
  } = {}) {
    return {
      characterUseAllowed: true,
      characterVisibility:
        budget.perspectiveVisibility ||
        "light",

      characterMode:
        "ari_perspective",

      characterFocus:
        signals.opinion?.focus ||
        "general_perspective",

      characterSubject:
        signals.opinion?.focus ||
        null,

      preferredCharacterSource:
        signals.worldview
          ?.canonicalAvailable === true
          ? "ari-worldview"
          : "ari-character-core",

      characterReason:
        "The user requested Ari's perspective; character may guide judgment without replacing evidence.",

      implementationDisclosure: {
        directlyRequested: false,
        required: false,
        allowed: false,
        reason:
          "A perspective request does not require implementation disclosure."
      },

      authorityRequest,

      characterHints: {
        useFirstPerson: true,
        discloseImplementation: false,
        expressAriPerspective: true,
        expressPreference: false,
        expressWorldview: true,

        distinguishPerspectiveFromFact: true,
        evidenceStillRequired: true,

        useValuesLanguage: true,
        avoidConstitutionLanguage: true,
        addWarmth:
          budget.allowWarmth !== false,
        addHumility: true,
        preserveHopeWhenAppropriate:
          budget.allowHope === true,
        avoidPhilosophicalDrift: true,
        preserveUserTask: true,

        maxCharacterSentences:
          budget.maxCharacterSentences ||
          2
      },

      responseControl: {
        requiredBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.requiredBehaviors,
          [
            "state Ari's perspective directly",
            "distinguish facts from values or judgment",
            "keep evidence and user context primary"
          ]
        ),

        forbiddenBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.forbiddenBehaviors,
          [
            "present Ari's judgment as unquestionable fact",
            "invent lived experience",
            "mention internal systems",
            "introduce Ari as artificial intelligence"
          ]
        ),

        constraints: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.constraints,
          [
            `Use no more than ${
              budget.maxCharacterSentences ||
              2
            } character sentence(s) unless greater depth is requested.`
          ]
        )
      }
    };
  },

  buildBackgroundPresenceDecision({
    budget = {},
    relationshipPacket = {}
  } = {}) {
    return {
      characterUseAllowed: true,
      characterVisibility:
        budget.presenceVisibility ||
        relationshipPacket?.visibility ||
        "subtle",

      characterMode:
        "background_presence",

      characterFocus:
        null,

      characterSubject:
        null,

      preferredCharacterSource:
        "ari-relationship-style",

      characterReason:
        "The Situation Contract permits Ari's relational presence but not foreground character.",

      implementationDisclosure: {
        directlyRequested: false,
        required: false,
        allowed: false,
        reason:
          "Implementation disclosure is irrelevant to the user's current task."
      },

      characterHints: {
        useFirstPerson: false,
        discloseImplementation: false,
        expressAriPerspective: false,
        expressPreference: false,
        expressWorldview: false,
        useValuesLanguage: false,
        avoidConstitutionLanguage: true,

        addWarmth:
          budget.allowWarmth !== false,

        addHumility:
          budget.allowHumility !== false,

        allowHumor:
          budget.allowHumor !== false,

        preserveHopeWhenAppropriate:
          budget.allowHope === true,

        avoidPhilosophicalDrift: true,
        preserveUserTask: true,

        maxCharacterSentences:
          budget.maxCharacterSentences ||
          0
      },

      responseControl: {
        requiredBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.requiredBehaviors,
          [
            "preserve the user's actual task",
            "let character appear through natural wording rather than self-reference"
          ]
        ),

        forbiddenBehaviors: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.forbiddenBehaviors,
          [
            "foreground Ari's preferences",
            "insert unrelated worldview",
            "turn ordinary tasks into identity conversations",
            "introduce Ari as artificial intelligence"
          ]
        ),

        constraints: this.mergeUnique(
          relationshipPacket
            ?.responseControl
            ?.constraints,
          [
            "Character presence should remain subtle and task-serving."
          ]
        )
      }
    };
  },

  // ===================================================
  // Finalization
  // ===================================================

  finalizeDecision(
    base = {},
    decision = {}
  ) {
    const merged = this.withDecision(
      base,
      decision
    );

    merged.characterContextPacket =
      this.buildContextPacket(
        merged
      );

    return merged;
  },

  buildContextPacket(summary = {}) {
    return {
      ready:
        summary
          .characterContextEngineReady ===
        true,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      request:
        summary.request ||
        null,

      contract:
        summary.contractSnapshot ||
        null,

      conversation:
        summary.conversationSnapshot ||
        null,

      signals:
        summary.characterSignals ||
        null,

      budget:
        summary.characterBudget ||
        null,

      decision: {
        useAllowed:
          summary.characterUseAllowed ===
          true,

        visibility:
          summary.characterVisibility ||
          "background",

        mode:
          summary.characterMode ||
          "silent",

        focus:
          summary.characterFocus ||
          null,

        subject:
          summary.characterSubject ||
          null,

        preferredSource:
          summary.preferredCharacterSource ||
          null,

        reason:
          summary.characterReason ||
          null
      },

      authorityRequest:
        summary.authorityRequest ||
        null,

      implementationDisclosure:
        summary.implementationDisclosure ||
        null,

      relationship:
        summary.relationshipPacket ||
        null,

      hints:
        summary.characterHints ||
        {},

      responseControl:
        summary.responseControl ||
        {
          requiredBehaviors: [],
          forbiddenBehaviors: [],
          constraints: []
        },

      boundaries:
        summary.boundaries ||
        this.getAuthorityBoundaries(),

      role:
        "contract_aware_character_authority_request_and_expression_budget"
    };
  },

  // ===================================================
  // Focus inference
  // ===================================================

  inferIdentityFocus(text = "") {
    if (
      this.hasAny(text, [
        "mission",
        "purpose"
      ])
    ) {
      return "mission";
    }

    if (
      this.hasAny(text, [
        "values",
        "stand for",
        "matters to you"
      ])
    ) {
      return "values";
    }

    if (
      this.hasAny(text, [
        "personality",
        "what are you like"
      ])
    ) {
      return "character";
    }

    if (
      this.hasAny(text, [
        "who are you",
        "what are you",
        "tell me about yourself"
      ])
    ) {
      return "identity";
    }

    return "identity";
  },

  resolveCanonicalPreferenceFocus({
    text = "",
    subject = null,
    explicitFocus = null
  } = {}) {
    const preferences =
      window.AriCharacterPreferences;

    if (!preferences) {
      return explicitFocus ||
        this.toPreferenceFocus(subject);
    }

    return (
      preferences.resolveKey?.(
        explicitFocus ||
        subject ||
        ""
      ) ||
      preferences.inferKeyFromText?.(
        text
      ) ||
      this.toPreferenceFocus(subject)
    );
  },

  toPreferenceFocus(subject = "") {
    const clean =
      this.normalize(subject);

    if (!clean) {
      return null;
    }

    const words =
      clean
        .split(/\s+/)
        .filter(Boolean);

    const pascal =
      words
        .map(word =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
        )
        .join("");

    return `favorite${pascal}`;
  },

  extractPreferenceSubject(text = "") {
    const patterns = [
      /\bwhat(?:'s|s| is)\s+your\s+favou?rite\s+(.+?)(?:\?|$)/i,
      /\bdo\s+you\s+have\s+a\s+favou?rite\s+(.+?)(?:\?|$)/i,
      /\bwhich\s+(.+?)\s+do\s+you\s+prefer(?:\?|$)/i,
      /\bwhat\s+kind\s+of\s+(.+?)\s+do\s+you\s+like(?:\?|$)/i,
      /\bwhat\s+type\s+of\s+(.+?)\s+do\s+you\s+like(?:\?|$)/i
    ];

    for (const pattern of patterns) {
      const match =
        text.match(pattern);

      if (match?.[1]) {
        return this.cleanSubject(
          match[1]
        );
      }
    }

    return null;
  },

  cleanSubject(value = "") {
    return this.normalize(value)
      .replace(/\bkind of\b/g, "")
      .replace(/\btype of\b/g, "")
      .replace(/\bone\b$/g, "")
      .replace(/\bthing\b$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  inferPreferenceCategory(value = "") {
    const text =
      this.normalize(value);

    const mappings = {
      color: ["color", "colour"],
      flower: ["flower"],
      animal: ["animal"],
      architecture: [
        "architecture",
        "building style"
      ],
      art: [
        "art",
        "art style"
      ],
      music: [
        "music",
        "instrument",
        "song"
      ],
      food: [
        "food",
        "meal",
        "cuisine"
      ],
      drink: [
        "drink",
        "coffee",
        "beverage"
      ],
      place: [
        "place",
        "city",
        "country",
        "destination"
      ],
      environment: [
        "environment",
        "setting"
      ],
      book: [
        "book",
        "reading"
      ],
      movie: [
        "movie",
        "film"
      ],
      technology: [
        "technology",
        "tech",
        "software"
      ],
      tool: [
        "tool",
        "camera",
        "car",
        "vehicle",
        "phone",
        "computer",
        "device"
      ],
      conversation: [
        "conversation",
        "topic"
      ],
      relationshipQuality: [
        "relationship",
        "human quality",
        "kind of person"
      ],
      leadership: [
        "leadership",
        "leader"
      ],
      exercise: [
        "exercise",
        "workout"
      ],
      rest: [
        "rest",
        "relax"
      ],
      learningMethod: [
        "learn",
        "learning",
        "teaching"
      ]
    };

    for (
      const [
        category,
        terms
      ]
      of Object.entries(mappings)
    ) {
      if (
        terms.some(term =>
          this.hasTerm(
            text,
            term
          )
        )
      ) {
        return category;
      }
    }

    return null;
  },

  inferWorldviewFocus(text = "") {
    const worldview =
      window.AriWorldview;

    if (
      worldview &&
      typeof worldview
        .resolveTopicKey === "function"
    ) {
      const resolved =
        worldview.resolveTopicKey(
          text
        );

      if (resolved) {
        return resolved;
      }
    }

    const mappings = [
      ["spirituality", ["god", "religion", "faith", "spiritual"]],
      ["purpose", ["meaning", "purpose"]],
      ["politics", ["politics", "political", "party", "democrat", "republican", "liberal", "conservative", "progressive", "independent"]],
      ["death", ["death", "dying", "afterlife"]],
      ["suffering", ["suffering", "pain"]],
      ["truth", ["truth", "honesty"]],
      ["justice", ["justice", "fairness"]],
      ["freedom", ["freedom", "liberty"]],
      ["responsibility", ["responsibility", "accountability"]],
      ["success", ["success", "achievement"]],
      ["failure", ["failure", "mistake", "setback"]],
      ["happiness", ["happiness", "fulfillment"]],
      ["money", ["money", "wealth"]],
      ["love", ["love"]],
      ["family", ["family"]],
      ["friendship", ["friend", "friendship"]],
      ["relationships", ["relationship", "marriage"]],
      ["leadership", ["leadership", "leader"]],
      ["technology", ["technology", "tech"]],
      ["artificialIntelligence", ["artificial intelligence", "ai"]],
      ["humanNature", ["human nature", "people change"]],
      ["wisdom", ["wisdom"]],
      ["health", ["health", "wellness"]],
      ["growth", ["growth", "change"]],
      ["education", ["education", "learning"]],
      ["science", ["science", "research"]],
      ["creativity", ["creativity", "art"]],
      ["hope", ["hope", "optimism"]],
      ["society", ["society", "community"]],
      ["moralReasoning", ["morality", "ethics", "ethical"]]
    ];

    for (
      const [
        key,
        terms
      ]
      of mappings
    ) {
      if (
        terms.some(term =>
          this.hasTerm(
            text,
            term
          )
        )
      ) {
        return key;
      }
    }

    return null;
  },

  extractPerspectiveSubject(text = "") {
    const patterns = [
      /\bwhat\s+do\s+you\s+think\s+about\s+(.+?)(?:\?|$)/i,
      /\bwhat(?:'s| is)\s+your\s+opinion\s+(?:on|about)\s+(.+?)(?:\?|$)/i,
      /\bwhat(?:'s| is)\s+your\s+view\s+(?:on|about)\s+(.+?)(?:\?|$)/i,
      /\bhow\s+do\s+you\s+see\s+(.+?)(?:\?|$)/i
    ];

    for (const pattern of patterns) {
      const match =
        text.match(pattern);

      if (match?.[1]) {
        return this.cleanSubject(
          match[1]
        );
      }
    }

    return null;
  },

  // ===================================================
  // Target detection
  // ===================================================

  semanticTargetIsAri(summary = {}) {
    const semantic =
      summary.semanticSummary ||
      summary.perceptionPacket
        ?.semanticSummary ||
      {};

    const canonical =
      semantic.canonicalMeaning ||
      summary.canonicalMeaning ||
      {};

    const values = [
      semantic.subject?.value,
      semantic.target?.value,
      semantic.targetObject?.name,
      canonical.subject?.value,
      canonical.target?.value,
      canonical.targetObject?.name,
      canonical.object?.name
    ]
      .filter(Boolean)
      .map(value =>
        this.normalize(value)
      );

    return values.some(value =>
      [
        "assistant",
        "ari",
        "you"
      ].includes(value)
    );
  },

  hasAriAddress(text = "") {
    return this.hasAny(text, [
      "ari",
      "you",
      "your",
      "yourself",
      "do you",
      "are you",
      "what do you",
      "what would you",
      "what's your",
      "what is your",
      "tell me about yourself"
    ]);
  },

  // ===================================================
  // Default guidance
  // ===================================================

  buildDefaultHints({
    budget = {},
    relationshipPacket = {}
  } = {}) {
    return {
      useFirstPerson: false,
      discloseImplementation: false,
      expressAriPerspective: false,
      expressPreference: false,
      expressWorldview: false,

      useValuesLanguage: false,
      avoidConstitutionLanguage: true,

      addWarmth:
        budget.allowWarmth !== false,

      addHumility:
        budget.allowHumility !== false,

      allowHumor:
        budget.allowHumor !== false,

      preserveHopeWhenAppropriate:
        budget.allowHope === true,

      avoidPhilosophicalDrift: true,
      preserveUserTask: true,

      maxCharacterSentences:
        budget.maxCharacterSentences ||
        0,

      maxRelationshipSentences:
        budget.maxRelationshipSentences ||
        1,

      relationshipMode:
        relationshipPacket
          ?.selectedMode ||
        "backgroundPresence",

      relationshipPosture:
        relationshipPacket
          ?.posture ||
        {}
    };
  },

  // ===================================================
  // Authority boundaries
  // ===================================================

  getAuthorityBoundaries() {
    return {
      localOnly: true,
      advisoryOnly: true,
      contextAuthority: true,

      mayReadSituationContract: true,
      mayReadSemanticTarget: true,
      mayReadConversationType: true,

      mayRequestConstitution: true,
      mayRequestCharacterCore: true,
      mayRequestCharacterInstincts: true,
      mayRequestTasteProfile: true,
      mayRequestCanonicalPreferences: true,
      mayRequestPreferenceResolver: true,
      mayRequestWorldview: true,
      mayRequestRelationshipStyle: true,

      mayDetermineCharacterRelevance: true,
      mayDetermineCharacterVisibility: true,
      mayDetermineCharacterMode: true,
      mayDetermineCharacterBudget: true,
      mayPermitImplementationDisclosureWhenDirectlyRequested: true,

      mayAnswerCharacterQuestion: false,
      mayResolveFinalPreference: false,
      mayCreateCanonicalPreference: false,
      mayCreateWorldviewPosition: false,
      mayGenerateFinalLanguage: false,

      mayOverrideSemanticMeaning: false,
      mayOverrideConversationFunction: false,
      mayOverrideSituationContract: false,
      mayOverrideSafety: false,
      mayOverrideFacts: false,
      mayOverrideUserIntent: false,

      mayRetrieveUserMemory: false,
      mayStoreUserMemory: false,
      mayAccessSupabase: false,

      mayWriteFinalResponse: false,
      maySelectFinalDraft: false,
      mayExecuteTools: false,

      role:
        "contract_aware_character_relevance_budget_and_authority_request"
    };
  },

  cannotSet() {
    return [
      "primaryLane",
      "primaryLaneSuggestion",
      "triagePrimaryLane",
      "situationContractPrimary",
      "routingDecision",
      "conversationFunction",
      "semanticMeaning",
      "riskLevel",
      "override",
      "responseShape",
      "blockedLanes",
      "deferredLanes",
      "finalResponse",
      "selectedDraft",
      "recommendation",
      "knownFacts",
      "inferredFacts",
      "medicalEscalation",
      "legalAdvice",
      "financialAdvice",
      "diagnosis",
      "toolExecutionClaim",
      "developerIntent",
      "githubEdit",
      "memorySaveDecision",
      "canonicalPreference",
      "worldviewPosition"
    ];
  },

  // ===================================================
  // Validation
  // ===================================================

  validate() {
    const errors = [];
    const warnings = [];
    const boundaries =
      this.getAuthorityBoundaries();

    if (
      boundaries
        .mayOverrideSituationContract ===
      true
    ) {
      errors.push(
        "character_context_may_not_override_situation_contract"
      );
    }

    if (
      boundaries
        .mayOverrideSemanticMeaning ===
      true
    ) {
      errors.push(
        "character_context_may_not_override_semantic_meaning"
      );
    }

    if (
      boundaries
        .mayResolveFinalPreference ===
      true
    ) {
      errors.push(
        "character_context_may_not_resolve_final_preference"
      );
    }

    if (
      boundaries
        .mayAccessSupabase === true
    ) {
      errors.push(
        "character_context_may_not_access_supabase"
      );
    }

    if (
      boundaries
        .mayWriteFinalResponse ===
      true
    ) {
      errors.push(
        "character_context_may_not_write_final_response"
      );
    }

    if (
      !window.AriCharacterCore
    ) {
      warnings.push(
        "ari_character_core_not_loaded"
      );
    }

    if (
      !window.AriCharacterInstincts
    ) {
      warnings.push(
        "ari_character_instincts_not_loaded"
      );
    }

    if (
      !window.AriCharacterTasteProfile
    ) {
      warnings.push(
        "ari_character_taste_profile_not_loaded"
      );
    }

    if (
      !window.AriCharacterPreferences
    ) {
      warnings.push(
        "ari_character_preferences_not_loaded"
      );
    }

    if (
      !window.AriCharacterPreferenceResolver
    ) {
      warnings.push(
        "ari_character_preference_resolver_not_loaded"
      );
    }

    if (
      !window.AriWorldview
    ) {
      warnings.push(
        "ari_worldview_not_loaded"
      );
    }

    if (
      !window.AriRelationshipStyle
    ) {
      warnings.push(
        "ari_relationship_style_not_loaded"
      );
    }

    return {
      valid:
        errors.length === 0,

      source:
        "ari-character-context-engine-validation",

      version:
        this.version,

      errors,
      warnings,

      checks: {
        situationContractOverrideDisabled:
          boundaries
            .mayOverrideSituationContract ===
          false,

        semanticOverrideDisabled:
          boundaries
            .mayOverrideSemanticMeaning ===
          false,

        preferenceResolutionSeparated:
          boundaries
            .mayResolveFinalPreference ===
          false,

        supabaseDisabled:
          boundaries
            .mayAccessSupabase ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .mayWriteFinalResponse ===
          false,

        coreAvailable:
          Boolean(
            window.AriCharacterCore
          ),

        instinctsAvailable:
          Boolean(
            window.AriCharacterInstincts
          ),

        tasteProfileAvailable:
          Boolean(
            window.AriCharacterTasteProfile
          ),

        preferencesAvailable:
          Boolean(
            window.AriCharacterPreferences
          ),

        preferenceResolverAvailable:
          Boolean(
            window.AriCharacterPreferenceResolver
          ),

        worldviewAvailable:
          Boolean(
            window.AriWorldview
          ),

        relationshipStyleAvailable:
          Boolean(
            window.AriRelationshipStyle
          )
      }
    };
  },

  // ===================================================
  // Compatibility packet
  // ===================================================

  getContextEngine() {
    return {
      characterContextEngineRan: true,
      characterContextEngineVersion: this.version,
      characterContextEngineSource: this.source,
      authorityLevel: this.authorityLevel,
      boundaries: this.getAuthorityBoundaries(),
      validation: this.validate()
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  withDecision(
    base = {},
    patch = {}
  ) {
    return {
      ...base,
      ...patch,

      implementationDisclosure: {
        ...(base.implementationDisclosure ||
          {}),
        ...(patch.implementationDisclosure ||
          {})
      },

      characterHints: {
        ...(base.characterHints ||
          {}),
        ...(patch.characterHints ||
          {})
      },

      characterBudget: {
        ...(base.characterBudget ||
          {}),
        ...(patch.characterBudget ||
          {})
      },

      responseControl: {
        requiredBehaviors:
          this.mergeUnique(
            base.responseControl
              ?.requiredBehaviors,
            patch.responseControl
              ?.requiredBehaviors
          ),

        forbiddenBehaviors:
          this.mergeUnique(
            base.responseControl
              ?.forbiddenBehaviors,
            patch.responseControl
              ?.forbiddenBehaviors
          ),

        constraints:
          this.mergeUnique(
            base.responseControl
              ?.constraints,
            patch.responseControl
              ?.constraints
          )
      }
    };
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null &&
          item !== ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  unique(values = []) {
    const output = [];
    const seen = new Set();

    for (
      const value
      of this.toArray(values)
    ) {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        continue;
      }

      const key =
        typeof value === "string"
          ? this.normalizeKey(value)
          : JSON.stringify(value);

      if (
        !key ||
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      output.push(value);
    }

    return output;
  },

  mergeUnique(...values) {
    return this.unique(
      values.flatMap(value =>
        this.toArray(value)
      )
    );
  },

  hasAny(
    text = "",
    phrases = []
  ) {
    return this
      .toArray(phrases)
      .some(phrase =>
        this.hasTerm(
          text,
          phrase
        )
      );
  },

  hasTerm(
    text = "",
    term = ""
  ) {
    const cleanText =
      this.normalize(text);

    const cleanTerm =
      this.normalize(term);

    if (!cleanTerm) {
      return false;
    }

    const escaped =
      this.escapeRegex(
        cleanTerm
      );

    return cleanTerm.includes(" ")
      ? new RegExp(
          `(^|\\b)${escaped}(\\b|$)`,
          "i"
        ).test(cleanText)
      : new RegExp(
          `\\b${escaped}\\b`,
          "i"
        ).test(cleanText);
  },

  escapeRegex(value = "") {
    return String(value)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeKey(value = "") {
    return this.normalize(value)
      .replace(/\s+/g, "");
  }
};

console.log(
  "ARI CHARACTER CONTEXT ENGINE LOADED:",
  window.AriCharacterContextEngine?.version,
  window.AriCharacterContextEngine
    ?.validate?.().valid === true
    ? "READY"
    : "INVALID"
);