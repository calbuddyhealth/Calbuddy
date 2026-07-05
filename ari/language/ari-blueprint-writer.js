// ari/language/ari-blueprint-writer.js
// Purpose: Fast deterministic conversation planning + local draft rendering from expression blueprints.
// V1.3.2 — Conversation Planner / Primitive Renderer / No Coaching Too Fast

window.Ari = window.Ari || {};

window.AriBlueprintWriter = {
  version: "1.3.2",

  write(input = {}) {
    const packet = input.composerPacket || input.packet || input || {};
    const question = String(packet.userQuestion || "").trim();

    if (!packet?.ready || !question) {
      return this.returnDraft("", "blueprint_packet_missing", false);
    }

    const knowledgeMeaning = this.getKnowledgeMeaning(packet);

    if (knowledgeMeaning?.usable) {
      const blueprint = this.resolveKnowledgeBlueprint(packet, knowledgeMeaning);
      const draft = this.renderKnowledgeDraft({ packet, question, knowledgeMeaning, blueprint });

      return this.returnDraft(draft, "blueprint_knowledge_meaning_packet", true, {
        ...blueprint,
        strategy: "knowledge_meaning",
        responseGoal: "answer_from_knowledge_meaning",
        aiAllowed: true,
        knowledgeMeaningUsed: true,
        knowledgeAnswerMode: knowledgeMeaning.answerMode,
        knowledgeDomain: knowledgeMeaning.domain,
        knowledgeIntent: knowledgeMeaning.intent
      });
    }

    const legacyKnowledgeDraft = this.composeSupabaseKnowledge(packet);

    if (legacyKnowledgeDraft) {
      return this.returnDraft(legacyKnowledgeDraft, "blueprint_legacy_supabase_knowledge_draft", true, {
        id: "legacy_supabase_knowledge_draft",
        strategy: "knowledge",
        responseGoal: "answer_from_retrieved_knowledge",
        aiAllowed: true
      });
    }

    const blueprint = this.resolveBlueprint(packet);

    if (!blueprint) {
      return this.returnDraft("", "no_matching_blueprint", false);
    }

    const conversationPlan = this.buildConversationPlan({ packet, blueprint, question });

    const draft = this.renderConversationPlan({
      packet,
      blueprint,
      question,
      conversationPlan
    });

    if (!draft) {
      return this.returnDraft("", "blueprint_no_local_draft", false, blueprint);
    }

    return this.returnDraft(draft, `blueprint_${conversationPlan.id}`, true, {
      ...blueprint,
      conversationPlan,
      deterministicConversationPlanner: true
    });
  },

  buildConversationPlan({ packet = {}, blueprint = {}, question = "" } = {}) {
    const id = blueprint.id || "general_direct_response";
    const q = String(question || "").toLowerCase();

    const emotionKind = this.detectEmotionKind(q);
const relationshipContext = this.extractRelationshipContext(question);
    
    const relationshipTone = this.detectRelationshipTone(q);
const safeBlueprintId =
  id === "relationship_repair_clarity" && relationshipTone === "positive"
    ? "relationship_positive_connection"
    : id;
    
    const plans = {
      emotion_presence_grounding: this.emotionPresencePlan(emotionKind),

      emotion_balance_repair: [
        "attune",
        "name_imbalance",
        "name_cost",
        "repair_invitation"
      ],

relationship_positive_connection: [
  "acknowledge_kind_gesture",
  "name_emotional_impact",
  "warm_reflection"
],

      decision_tradeoff: [
        "name_tradeoff",
        "separate_questions",
        "recommend_priority",
        "small_next_step"
      ],

      builder_direct_help: [
        "confirm_practical",
        "identify_target",
        "contained_patch",
        "test_before_more_changes"
      ],

      knowledge_clear_explanation: [
        "direct_answer",
        "brief_explanation",
        "usable_example"
      ],

      relationship_repair_clarity: [
        "name_relationship_truth",
        "reduce_blame",
        "repair_script",
        "one_next_step"
      ],

      medical_context_calm_guidance: [
        "calm_medical_frame",
        "safe_first_step",
        "red_flags"
      ],

      memory_direct_acknowledgment: [
        "simple_ack"
      ],

      wisdom_principle_then_step: [
        "principle",
        "apply_principle",
        "next_step"
      ],

      safety_urgent_support: [
        "pause",
        "immediate_safety",
        "trusted_help"
      ],

      general_direct_response: [
        "direct_answer",
        "brief_explanation",
        "one_next_step"
      ]
    };

    return {
      id: safeBlueprintId,
      primary: String(packet.primary || "").toLowerCase(),
      emotionKind,
      relationshipContext,
      moves: plans[safeBlueprintId] || plans.general_direct_response,
      maxSentences: this.resolveMaxSentences(packet, safeBlueprintId),
      relationshipTone,
      tone: packet.humanLanguageProfile?.tone || "direct_warm_plain",
      naturalizer: true
    };
  },

  emotionPresencePlan(emotionKind = "general") {
    if (emotionKind === "sad") {
      return [
        "sadness_attune",
        "sadness_validate",
        "invite_context"
      ];
    }

    if (emotionKind === "anxious" || emotionKind === "overwhelmed") {
      return [
        "anxiety_attune",
        "anxiety_validate",
        "offer_grounding_choice"
      ];
    }

    if (emotionKind === "angry" || emotionKind === "frustrated") {
      return [
        "anger_attune",
        "anger_validate",
        "invite_context"
      ];
    }

    return [
      "attune",
      "gentle_validation",
      "invite_context"
    ];
  },

extractRelationshipContext(question = "") {
  const text = String(question || "").trim();
  const q = text.toLowerCase();

  const relationship =
    q.includes("wife") ? "wife" :
    q.includes("husband") ? "husband" :
    q.includes("girlfriend") ? "girlfriend" :
    q.includes("boyfriend") ? "boyfriend" :
    q.includes("partner") ? "partner" :
    null;

  const conflict =
    /\b(argument|argued|fight|fighting|disagreement|conflict)\b/.test(q);

  if (!relationship && !conflict) {
    return {
      hasRelationshipContext: false
    };
  }

  return {
    hasRelationshipContext: true,
    relationship,
    conflict,
    phrase: relationship && conflict
      ? `argument with your ${relationship}`
      : relationship
        ? `situation with your ${relationship}`
        : "relationship situation"
  };
},

  renderConversationPlan({ packet = {}, blueprint = {}, question = "", conversationPlan = {} } = {}) {
    const moves = Array.isArray(conversationPlan.moves) ? conversationPlan.moves : [];
    const sentences = [];

    for (const move of moves) {
      const sentence = this.renderMove({ move, packet, blueprint, question, conversationPlan });
      if (sentence) sentences.push(sentence);
    }

    return this.naturalize(sentences, {
      packet,
      maxSentences: conversationPlan.maxSentences || 4,
      style: this.resolveStyle(packet)
    });
  },

  renderMove({ move = "", packet = {}, question = "", conversationPlan = {} } = {}) {
    const terms = packet.evidence?.lexicalGrounding?.preferredTerms || {};

    const component =
      terms.composerComponent?.short ||
      terms.thingToFix?.short ||
      "this part";

    const bodyProblem =
      terms.bodyProblem?.short ||
      "that symptom";

    const decision =
      terms.decisionOption?.short ||
      terms.centralTradeoff?.short ||
      "the choice";

    const object =
      terms.object?.short ||
      terms.topic?.short ||
      "this";

    const q = String(question || "").toLowerCase();

    const moveMap = {
      sadness_attune:
  this.renderSadnessAttune(conversationPlan),

sadness_validate:
  this.renderSadnessValidate(conversationPlan),

invite_context:
  this.renderInviteContext(conversationPlan),

      anxiety_attune:
        "Yeah, I’m here with you.",

      anxiety_validate:
        "When everything feels loud at once, the first move is not to solve your whole life.",

      offer_grounding_choice:
        "We can either talk through what triggered it, or start with one small grounding step.",

acknowledge_kind_gesture:
  "That was really thoughtful of her.",

name_emotional_impact:
  "After a rough week, having someone show up for you like that can mean a lot.",

warm_reflection:
  "I’m glad it made your whole day.",

      anger_attune:
        "Yeah, I can feel the frustration in that.",

      anger_validate:
        "Before trying to fix it, it probably helps to name what actually set you off.",

      attune:
        "Yeah, I’m here with you.",

      gentle_validation:
        "That sounds like something worth slowing down with.",

      name_imbalance:
        "The thing itself may not be the enemy, but the imbalance is.",

      name_cost:
        "Your body, mood, and relationship are starting to pay the bill.",

      repair_invitation:
        "Start with one repair move, not a whole life overhaul.",

      name_tradeoff:
        `The real issue is the tradeoff, not just ${decision}.`,

      separate_questions:
        "Separate it into two questions: what matters most right now, and what can wait without causing damage?",

      recommend_priority:
        "I’d choose the option that protects the highest-priority thing first.",

      small_next_step:
        "Then make the next step small enough to actually do.",

      confirm_practical:
        "Yes — keep this practical.",

      identify_target:
        `For ${component}, identify the exact file or function before changing anything.`,

      contained_patch:
        "Make one contained patch instead of mixing three ideas together.",

      test_before_more_changes:
        "Then test the output before touching the next layer.",

      direct_answer:
        this.directAnswerFor(question, object),

      brief_explanation:
        "Answer the actual question first, then explain only enough to make it useful.",

      usable_example:
        "That keeps the response clear instead of turning it into a lecture.",

      name_relationship_truth:
        "The move is not to win the argument.",

      reduce_blame:
        "It is to lower the temperature and repair trust.",

      repair_script:
        "Say the true thing plainly, own your part without over-apologizing, and ask for one concrete next step.",

      one_next_step:
        "Keep the next move small, specific, and doable.",

      calm_medical_frame:
        `For ${bodyProblem}, treat it seriously but don’t panic.`,

      safe_first_step:
        "Start with the safest simple step: monitor severity and avoid anything that clearly worsens it.",

      red_flags:
        "If it is severe, worsening, unusual, or comes with red flags, contact a clinician.",

      simple_ack:
        "Got it. I’ll keep that in mind.",

      principle:
        "The principle is simple: don’t let urgency pretend to be importance.",

      apply_principle:
        "Protect what matters long term, not just what feels loud right now.",

      next_step:
        "Choose the next honest step and do that first.",

      pause:
        "Pause everything else and focus on immediate safety.",

      immediate_safety:
        "Get away from the danger if you can and contact emergency help or a trusted person nearby.",

      trusted_help:
        "Do not handle this alone."
    };

    if (move === "direct_answer" && q.includes("what do you like to do")) {
      return "I don’t know yet, but I think I’d like helping people make sense of things and find the next honest step.";
    }

    return moveMap[move] || "";
  },

renderSadnessAttune(conversationPlan = {}) {
  const ctx = conversationPlan.relationshipContext || {};

  if (ctx.hasRelationshipContext && ctx.phrase) {
    const article = ctx.conflict ? "an" : "a";
    return `I’m sorry you’re carrying that after ${article} ${ctx.phrase}.`;
  }

  return "I’m sorry you’re feeling sad.";
},

renderSadnessValidate(conversationPlan = {}) {
  const ctx = conversationPlan.relationshipContext || {};

  if (ctx.hasRelationshipContext) {
    return "Arguments with someone close can linger even after the moment has passed.";
  }

  return "That can feel heavy, especially when you don’t know what to do with it.";
},

renderInviteContext(conversationPlan = {}) {
  const ctx = conversationPlan.relationshipContext || {};

  if (ctx.hasRelationshipContext) {
    return "What happened between you two?";
  }

  return "Do you want to tell me what happened, or did it just hit you out of nowhere?";
},

detectRelationshipTone(q = "") {
  const positive =
    /\b(surprised me|made my day|made my whole day|thoughtful|sweet|kind|caring|grateful|happy|loved|appreciated|dinner|gift|supportive)\b/.test(q);

  const conflict =
    /\b(argument|argued|fight|fighting|disagreement|conflict|tension|mad|angry|hurt|upset)\b/.test(q);

  if (positive && !conflict) return "positive";
  if (conflict) return "repair";
  return "neutral";
},

  detectEmotionKind(q = "") {
    if (/\b(sad|down|depressed|heavy|cry|crying)\b/.test(q)) return "sad";
    if (/\b(anxious|anxiety|panic|overwhelmed|stressed|worried)\b/.test(q)) return "anxious";
    if (/\b(angry|mad|furious|frustrated|annoyed)\b/.test(q)) return "angry";
    return "general";
  },

  directAnswerFor(question = "", object = "this") {
    const q = String(question || "").toLowerCase();

    if (q.includes("can") || q.includes("does") || q.includes("could")) {
      return "Yes — it can affect that.";
    }

    if (q.includes("what is") || q.includes("what's")) {
      return `${object} is the main thing to understand here.`;
    }

    if (q.includes("why")) {
      return "The short answer is that more than one pressure is probably stacking together.";
    }

    return "Yes. The clean move is to answer the current question directly.";
  },

  resolveMaxSentences(packet = {}, blueprintId = "") {
    const profile = packet.humanLanguageProfile || {};

    if (blueprintId.includes("safety")) return 3;
    if (blueprintId.includes("memory")) return 1;
    if (blueprintId === "emotion_presence_grounding") return 3;
    if (profile.pace === "brief") return 2;
    if (profile.depth === "minimal") return 2;
    if (profile.depth === "technical") return 4;

    return 4;
  },

  resolveStyle(packet = {}) {
    const profile = packet.humanLanguageProfile || {};
    if (profile.tone?.includes("medical")) return "medical";
    if (profile.tone?.includes("developer")) return "builder";
    if (profile.tone?.includes("warm")) return "conversation";
    return "direct";
  },

  naturalize(sentences = [], options = {}) {
    const maxSentences = options.maxSentences || 4;
    const packet = options.packet || {};
    const banned = packet.humanLanguageProfile?.bannedPhrases || [];

    let cleaned = sentences
      .filter(Boolean)
      .map(sentence => String(sentence).trim())
      .filter(Boolean)
      .map(sentence => this.cleanForUser(sentence))
      .filter(sentence => !this.containsBannedPhrase(sentence, banned));

    cleaned = this.removeDuplicateSentences(cleaned);
    cleaned = this.smoothSentenceFlow(cleaned);
    cleaned = cleaned.slice(0, maxSentences);

    return cleaned.join(" ").trim();
  },

  removeDuplicateSentences(sentences = []) {
    const seen = new Set();

    return sentences.filter(sentence => {
      const key = sentence
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 90);

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  smoothSentenceFlow(sentences = []) {
    return sentences.map(sentence =>
      String(sentence || "")
        .replace(/\s+/g, " ")
        .replace(/\bdo not\b/gi, "don’t")
        .replace(/\bI would\b/gi, "I’d")
        .replace(/\bIt is\b/gi, "It’s")
        .trim()
    );
  },

  containsBannedPhrase(sentence = "", banned = []) {
    const lower = String(sentence || "").toLowerCase();
    return banned.some(phrase =>
      lower.includes(String(phrase || "").toLowerCase())
    );
  },

  getKnowledgeMeaning(packet = {}) {
    return (
      packet.evidence?.knowledgeMeaning ||
      packet.evidence?.knowledgeSynthesis ||
      packet.knowledgeMeaning ||
      packet.knowledgeSynthesis ||
      packet.summary?.knowledgeMeaning ||
      packet.summary?.knowledgeSynthesis ||
      null
    );
  },

  resolveKnowledgeBlueprint(packet = {}, meaning = {}) {
    const mode = meaning.answerMode || "general_knowledge";

    const map = {
      identity_or_character: "knowledge_identity_answer",
      memory_recall: "knowledge_memory_recall",
      medical_guidance: "knowledge_medical_guidance",
      developer: "knowledge_developer_analysis",
      definition: "knowledge_definition",
      explanation: "knowledge_explanation",
      decision: "knowledge_decision",
      relationship_advice: "knowledge_relationship_advice",
      relationship_meaning: "knowledge_relationship_advice",
      life_advice: "knowledge_life_advice",
      advice: "knowledge_life_advice",
      writing: "knowledge_writing_context",
      general_knowledge: "knowledge_clear_explanation"
    };

    const id = map[mode] || "knowledge_clear_explanation";
    return this.blueprints[id] || this.blueprints.knowledge_clear_explanation;
  },

  renderKnowledgeDraft({ question = "", knowledgeMeaning = {} } = {}) {
    const directAnswer = this.cleanForUser(knowledgeMeaning.directAnswer || "");

    const keyFacts = Array.isArray(knowledgeMeaning.keyFacts)
      ? knowledgeMeaning.keyFacts.map(x => this.cleanForUser(x)).filter(Boolean)
      : [];

    const cautions = Array.isArray(knowledgeMeaning.cautions)
      ? knowledgeMeaning.cautions.map(x => this.cleanForUser(x)).filter(Boolean)
      : [];

    return this.polishResponse([
      directAnswer || keyFacts[0] || this.directAnswerFor(question),
      keyFacts[1] || "",
      keyFacts[2] || "",
      cautions[0] || ""
    ], 4, "direct");
  },

  resolveBlueprint(packet = {}) {
    const id =
      packet.blueprintHint ||
      packet.expressionPlan?.blueprintId ||
      packet.mouthDirective?.blueprintHint ||
      "general_direct_response";

    return this.blueprints[id] || this.blueprints.general_direct_response;
  },

  composeSupabaseKnowledge(packet = {}) {
    const knowledge = packet.evidence?.knowledge || {};
    const nodes = Array.isArray(knowledge.nodes) ? knowledge.nodes : [];
    const question = String(packet.userQuestion || "").trim();
    const q = question.toLowerCase();

    if (!knowledge.shouldUseKnowledge || !nodes.length) return "";

    const node = nodes[0] || {};
    const topic = node.topic || node.lesson || "this";

    const definition = this.cleanForUser(node.definition || "");
    const summary = this.cleanForUser(node.summary || "");
    const deep = this.cleanForUser(node.deep_understanding || "");

    const style = this.detectKnowledgeStyle(q);

    const isDefinition =
      /\b(what is|define|definition|meaning of|what does.*mean)\b/.test(q);

    const isCause =
      /\b(why|what'?s going on|what is going on|how does|can .* affect|does .* affect|could .* affect|explain)\b/.test(q);

    let sentences = [];

    if (isDefinition || style === "textbook") {
      sentences = [
        definition || summary || `${topic} is the main idea here.`,
        this.pickBestSupport({ q, summary, deep, style })
      ];
    } else if (isCause) {
      sentences = [
        this.buildDirectAnswer(topic, q, style),
        this.pickBestSupport({ q, summary, deep, style })
      ];
    } else {
      sentences = [
        summary || definition || `${topic} matters here.`,
        this.pickBestSupport({ q, summary, deep, style })
      ];
    }

    return this.polishResponse(sentences, 4, style);
  },

  detectKnowledgeStyle(q = "") {
    if (/\b(define|definition|what is|textbook|explain fully|explain in detail|technical|scientific)\b/.test(q)) {
      return "textbook";
    }

    if (/\b(i feel|i'm|im|my|me|what'?s going on|what is going on|help|what should i do|why am i)\b/.test(q)) {
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

  pickBestSupport({ q = "", summary = "", deep = "", style = "conversation" } = {}) {
    const source = deep || summary || "";
    if (!source) return "";

    const sentences = this.splitSentences(source);

    const scored = sentences
      .map(sentence => ({
        sentence,
        score: this.relevanceScore(sentence, q)
      }))
      .sort((a, b) => b.score - a.score);

    return scored[0]?.sentence || sentences[0] || "";
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
    const cleaned = this.removeDuplicateSentences(
      sentences
        .filter(Boolean)
        .map(s => this.cleanForUser(s))
        .filter(Boolean)
    );

    const limited =
      style === "conversation"
        ? cleaned.slice(0, Math.min(cleaned.length, 3))
        : cleaned.slice(0, maxSentences);

    return limited.join(" ").trim();
  },

  blueprints: {
    knowledge_identity_answer: {
      id: "knowledge_identity_answer",
      strategy: "identity",
      responseGoal: "answer_character_question",
      structure: ["direct_answer", "grounding", "honest_boundary"],
      aiAllowed: true
    },

    knowledge_memory_recall: {
      id: "knowledge_memory_recall",
      strategy: "memory",
      responseGoal: "answer_from_memory",
      structure: ["known_fact", "context", "uncertainty_if_needed"],
      aiAllowed: true
    },

    knowledge_medical_guidance: {
      id: "knowledge_medical_guidance",
      strategy: "medical",
      responseGoal: "safe_guidance",
      structure: ["direct_answer", "practical_guidance", "red_flags"],
      medicalBoundary: true,
      aiAllowed: true
    },

    knowledge_developer_analysis: {
      id: "knowledge_developer_analysis",
      strategy: "developer",
      responseGoal: "diagnose_and_patch",
      structure: ["diagnosis", "evidence", "patch"],
      aiAllowed: true
    },

    knowledge_definition: {
      id: "knowledge_definition",
      strategy: "define",
      responseGoal: "clear_definition",
      structure: ["definition", "meaning", "example_if_useful"],
      aiAllowed: true
    },

    knowledge_explanation: {
      id: "knowledge_explanation",
      strategy: "explain",
      responseGoal: "clear_causal_answer",
      structure: ["direct_answer", "mechanism", "practical_implication"],
      aiAllowed: true
    },

    knowledge_decision: {
      id: "knowledge_decision",
      strategy: "decision",
      responseGoal: "choose_next_step",
      structure: ["tradeoff", "recommendation", "next_step"],
      aiAllowed: true
    },

    knowledge_relationship_advice: {
      id: "knowledge_relationship_advice",
      strategy: "relationship",
      responseGoal: "repair_or_understand_pattern",
      structure: ["name_pattern", "reduce_blame", "repair_step"],
      aiAllowed: true
    },

    knowledge_life_advice: {
      id: "knowledge_life_advice",
      strategy: "life_advice",
      responseGoal: "practical_next_step",
      structure: ["direct_answer", "meaning", "one_step"],
      aiAllowed: true
    },

    knowledge_writing_context: {
      id: "knowledge_writing_context",
      strategy: "writing_context",
      responseGoal: "support_writing_task",
      structure: ["context_only"],
      aiAllowed: true
    },

    emotion_presence_grounding: {
      id: "emotion_presence_grounding",
      strategy: "presence",
      responseGoal: "help_user_feel_understood_before_solving",
      aiAllowed: false
    },

    emotion_balance_repair: {
      id: "emotion_balance_repair",
      strategy: "repair",
      responseGoal: "restore_balance",
      aiAllowed: false
    },

    decision_tradeoff: {
      id: "decision_tradeoff",
      strategy: "organize",
      responseGoal: "choose_next_step",
      aiAllowed: true
    },

    builder_direct_help: {
      id: "builder_direct_help",
      strategy: "build",
      responseGoal: "fix_or_patch",
      aiAllowed: true
    },

    knowledge_clear_explanation: {
      id: "knowledge_clear_explanation",
      strategy: "explain",
      responseGoal: "understand",
      aiAllowed: true
    },

    relationship_repair_clarity: {
      id: "relationship_repair_clarity",
      strategy: "repair",
      responseGoal: "reduce_conflict",
      aiAllowed: true
    },

    medical_context_calm_guidance: {
      id: "medical_context_calm_guidance",
      strategy: "guide",
      responseGoal: "safe_next_step",
      medicalBoundary: true,
      aiAllowed: true
    },

    safety_urgent_support: {
      id: "safety_urgent_support",
      strategy: "protect",
      responseGoal: "immediate_safety",
      aiAllowed: false
    },

    memory_direct_acknowledgment: {
      id: "memory_direct_acknowledgment",
      strategy: "acknowledge",
      responseGoal: "confirm",
      aiAllowed: false
    },

    wisdom_principle_then_step: {
      id: "wisdom_principle_then_step",
      strategy: "principle",
      responseGoal: "clarify_values",
      aiAllowed: true
    },

    general_direct_response: {
      id: "general_direct_response",
      strategy: "answer",
      responseGoal: "help",
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

window.Ari.blueprintWriter = window.AriBlueprintWriter;

console.log("ARI BLUEPRINT WRITER LOADED:", window.AriBlueprintWriter.version);