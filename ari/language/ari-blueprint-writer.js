// ari/language/ari-blueprint-writer.js
// Purpose: Fast reusable local drafts from expression blueprints.
// V1.0.1 — Blueprint Families / Supabase Knowledge Drafts / AI-Safe Handoff

window.Ari = window.Ari || {};

window.AriBlueprintWriter = {
  version: "1.0.1",

  write(input = {}) {
    const packet = input.composerPacket || input.packet || input || {};
    const question = String(packet.userQuestion || "").trim();

    if (!packet?.ready || !question) {
      return this.returnDraft("", "blueprint_packet_missing", false);
    }

    const knowledgeDraft = this.composeSupabaseKnowledge(packet);

    if (knowledgeDraft) {
      return this.returnDraft(
        knowledgeDraft,
        "blueprint_supabase_knowledge_draft",
        true,
        {
          id: "supabase_knowledge_draft",
          strategy: "knowledge",
          responseGoal: "answer_from_retrieved_knowledge",
          aiAllowed: false
        }
      );
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
    const component =
      terms.composerComponent?.short ||
      terms.thingToFix?.short ||
      "that";

    const bodyProblem = terms.bodyProblem?.short || "that pain";

    const decision =
      terms.decisionOption?.short ||
      terms.centralTradeoff?.short ||
      "the choice";

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

  composeSupabaseKnowledge(packet = {}) {
    const knowledge = packet.evidence?.knowledge || {};
    const nodes = Array.isArray(knowledge.nodes) ? knowledge.nodes : [];
    const question = String(packet.userQuestion || "").trim();
    const q = question.toLowerCase();

    if (!knowledge.shouldUseKnowledge || !nodes.length) return "";

    const plan = packet.communicationPlan || {};
    const budget = plan.languageBudget || {};
    const maxSentences = budget.maxSentences || 5;

    const node = nodes[0] || {};
    const topic = node.topic || node.lesson || "this";

    const definition = this.cleanForUser(node.definition || "");
    const summary = this.cleanForUser(node.summary || "");
    const deep = this.cleanForUser(node.deep_understanding || "");
    const use = this.cleanForUser(node.how_ari_should_use_this || "");

    const style = this.detectKnowledgeStyle(q);

    const isDefinition =
      /\b(what is|define|definition|meaning of|what does.*mean)\b/.test(q);

    const isAdvice =
      /\b(what should i do|how do i|help|where do i start|what can i do|advice|fix|improve|deal with)\b/.test(q);

    const isCause =
      /\b(why|what'?s going on|what is going on|how does|can .* affect|does .* affect|explain)\b/.test(q);

    const userState =
      /\b(i am|i'm|im|i feel|my|me|i have|i keep|i can'?t|i cannot)\b/.test(q);

    let sentences = [];

    if (isDefinition || style === "textbook") {
      sentences = [
        definition || summary || `${topic} is the main idea here.`,
        this.pickBestSupport({ q, summary, deep, use, style })
      ];
    } else if (isAdvice) {
      sentences = [
        userState
          ? `Yeah — ${String(topic).toLowerCase()} may be part of what is going on.`
          : `${topic} is probably the right place to start.`,
        this.pickBestSupport({ q, summary, deep, use, style }),
        this.buildOneNextStep(node, q)
      ];
    } else if (isCause || userState) {
      sentences = [
        this.buildDirectAnswer(topic, q, style),
        this.pickBestSupport({ q, summary, deep, use, style }),
        this.buildMeaningForUser(node, q)
      ];
    } else {
      sentences = [
        summary || definition || `${topic} matters here.`,
        this.pickBestSupport({ q, summary, deep, use, style })
      ];
    }

    return this.polishResponse(sentences, maxSentences, style);
  },

  detectKnowledgeStyle(q = "") {
    if (
      /\b(define|definition|what is|textbook|explain fully|explain in detail|technical|scientific)\b/.test(q)
    ) {
      return "textbook";
    }

    if (
      /\b(i feel|i'm|im|my|me|what'?s going on|what is going on|help|what should i do|why am i)\b/.test(q)
    ) {
      return "conversation";
    }

    return "direct";
  },

  buildDirectAnswer(topic = "", q = "", style = "conversation") {
    const lowerTopic = String(topic || "this").toLowerCase();

    if (/\b(can|does|could)\b/.test(q)) {
      return style === "conversation"
        ? `Yeah — ${lowerTopic} can definitely affect that.`
        : `Yes — ${lowerTopic} can affect that.`;
    }

    if (/\bwhat'?s going on|what is going on|why\b/.test(q)) {
      return style === "conversation"
        ? `What’s probably happening is that ${lowerTopic} is hitting more than one part of your life at once.`
        : `${lowerTopic} may be affecting multiple areas at once.`;
    }

    return style === "conversation"
      ? `This sounds connected to ${lowerTopic}.`
      : `${lowerTopic} is relevant here.`;
  },

  pickBestSupport({ q = "", summary = "", deep = "", use = "", style = "conversation" } = {}) {
    const source = deep || use || summary || "";
    if (!source) return "";

    const sentences = this.splitSentences(source);

    const scored = sentences
      .map(sentence => ({
        sentence,
        score: this.relevanceScore(sentence, q)
      }))
      .sort((a, b) => b.score - a.score);

    let best = scored[0]?.sentence || sentences[0] || "";

    if (style === "conversation") {
      best = best
        .replace(
          /\bPoor sleep can amplify stress, worsen mood, weaken discipline, reduce patience, increase cravings, impair judgment, and make ordinary problems feel much harder\./i,
          "When sleep is off, your patience, mood, cravings, and judgment can all take a hit."
        )
        .replace(/\bSleep is not wasted time\.\s*/i, "")
        .replace(/\bIt is one of the core systems that allows humans to\b/i, "It helps you");
    }

    return best;
  },

  buildMeaningForUser(node = {}, q = "") {
    const topic = String(node.topic || node.lesson || "this").toLowerCase();

    if (topic.includes("sleep")) {
      return "So if you’re more reactive with people, it may be a recovery problem before it’s a personality problem.";
    }

    const practical = Array.isArray(node.practical_applications)
      ? node.practical_applications
      : [];

    const cleaned = practical
      .map(item => this.cleanPractical(item))
      .filter(Boolean);

    return cleaned[0] || `The useful move is to treat ${topic} as a real factor, not as a character flaw.`;
  },

  buildOneNextStep(node = {}, q = "") {
    const topic = String(node.topic || node.lesson || "this").toLowerCase();

    if (topic.includes("sleep")) {
      return "Start by protecting one sleep block or one recovery habit before trying to fix everything else.";
    }

    const practical = Array.isArray(node.practical_applications)
      ? node.practical_applications
      : [];

    const cleaned = practical
      .map(item => this.cleanPractical(item))
      .filter(Boolean);

    return cleaned[0] || "Start with one small realistic change instead of trying to fix everything at once.";
  },

  cleanPractical(text = "") {
    const cleaned = String(text || "")
      .replace(/^Ask about\b/i, "Look at")
      .replace(/^Encourage\b/i, "Try")
      .replace(/^Support\b/i, "Build around")
      .replace(/^Connect\b/i, "Remember that")
      .replace(/^Avoid shaming.*$/i, "Don’t turn this into a shame issue; treat it as a solvable pattern")
      .replace(/^Recommend medical evaluation\b/i, "Consider medical evaluation")
      .replace(/\busers report\b/gi, "you notice")
      .replace(/\busers\b/gi, "you")
      .replace(/\buser\b/gi, "you")
      .replace(/\.$/, "")
      .trim();

    return cleaned ? `${cleaned}.` : "";
  },

  cleanForUser(text = "") {
    return String(text || "")
      .replace(/\bAri should\b/gi, "")
      .replace(/\bHelp Ari recognize when\b/gi, "This matters when")
      .replace(/\bHelp Ari\b/gi, "The point is to")
      .replace(/\busers\b/gi, "people")
      .replace(/\buser\b/gi, "person")
      .replace(/\s+/g, " ")
      .trim();
  },

  splitSentences(text = "") {
    return String(text || "")
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  },

  relevanceScore(sentence = "", q = "") {
    const s = String(sentence || "").toLowerCase();

    const words = String(q || "")
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);

    let score = 0;

    for (const word of words) {
      if (s.includes(word)) score += 2;
    }

    if (s.includes("affect")) score += 1;
    if (s.includes("because")) score += 1;
    if (s.includes("can")) score += 1;
    if (s.includes("not")) score -= 0.5;

    return score;
  },

  polishResponse(sentences = [], maxSentences = 5, style = "conversation") {
    const seen = new Set();

    let cleaned = sentences
      .filter(Boolean)
      .map(s => String(s).trim())
      .filter(s => {
        const key = s.toLowerCase().replace(/[^\w\s]/g, "").slice(0, 80);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxSentences);

    if (style === "conversation") {
      cleaned = cleaned.slice(0, Math.min(cleaned.length, 3));
    }

    return cleaned.join(" ");
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