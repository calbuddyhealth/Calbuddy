// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V8.3.1 — Contract-Locked Natural AI Writer
// Role:
// - DOES write the final answer.
// - DOES obey Situation Contract, Triage, Communication Plan, and Mouth Directive.
// - DOES use AI for natural language generation when available.
// - DOES validate output before returning.
// - DOES NOT choose lane.
// - DOES NOT reinterpret intent.
// - DOES NOT override contract.

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "8.3.1",

  async compose(input = {}) {
    const summary = input.summary || input || {};

    const contract = summary.situationContract || {};
    const communicationPlan = summary.communicationPlan || {};
    const mouth = summary.mouthDirector || {};
    const language = summary.humanLanguageProfile || {};
const thesis = this.readSituationThesis(summary);
    const userQuestion =
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      summary.triagePrimaryLane ||
      communicationPlan.primary ||
      mouth.contractPrimary ||
      "general_understanding";

    const draft = await this.writeDraft({
      summary,
      contract,
      communicationPlan,
      mouth,
      thesis,
      language,
      primary,
      userQuestion
    });

    const validated = this.validateAndRepair({
      draft,
      summary,
      contract,
      communicationPlan,
      language,
      thesis,
      primary,
      userQuestion
    });

    const natural = this.naturalizeResponse({
  text: validated,
  summary,
  contract,
  thesis,
  primary,
  userQuestion
});

const finalResponse = this.finalPolish(
  this.enforceFinalBudget(natural, communicationPlan),
  language
);

    return {
      languageMode: primary,
      languageBody: finalResponse,
      languageSections: [finalResponse],
      finalResponse,

      composerVersion: this.version,
      source: "ari-language-composer",

      composerUsedAI: Boolean(draft.usedAI),
      composerValidation: validated !== draft.text ? "repaired" : "passed",

      composerDebug: {
        primary,
        responseShape: contract.responseShape || communicationPlan.answerMode || null,
        authority: contract.authority || null,
        communicationProfile: contract.communicationProfile || null,
        mouthDirective: contract.mouthDirective || null,
        situationThesis: thesis,
        usedAI: Boolean(draft.usedAI),
        rawDraft: draft.text
      }
    };
  },

  async writeDraft({
    summary = {},
    contract = {},
    communicationPlan = {},
    mouth = {},
    language = {},
thesis = {},
primary = "general_understanding",
    userQuestion = ""
  }) {
    const instruction = this.buildAIInstruction({
      summary,
      contract,
      communicationPlan,
      mouth,
      thesis,
      language,
      primary,
      userQuestion
    });

    try {
      if (
        window.AriOpenAIKnowledgeClient &&
        typeof window.AriOpenAIKnowledgeClient.ask === "function"
      ) {
        const aiResult = await window.AriOpenAIKnowledgeClient.ask({
          ...summary,
          aiInstruction: instruction
        });

        const text =
          aiResult.finalResponse ||
          aiResult.knowledgeAnswer ||
          aiResult.response ||
          aiResult.text ||
          "";

        const safe = this.safeAnswer(text);

        if (safe) {
          return {
            usedAI: true,
            text: safe
          };
        }
      }
    } catch (error) {
      console.warn("AriLanguageComposer AI draft failed:", error);
    }

    return {
      usedAI: false,
      text: this.localFallback({ primary, contract, thesis, userQuestion })
    };
  },

readSituationThesis(summary = {}) {
  const contract = summary.situationContract || {};
  const map = summary.situationMap || {};
  const triage = summary.ariTriage || summary.triage || {};

  const thesis =
    contract.situationThesis?.thesis ||
    map.primarySituationThesis ||
    triage.situationThesisUsed ||
    null;

  const narrative =
    contract.situationThesis?.narrative ||
    map.situationNarrative ||
    thesis?.oneLine ||
    null;

  const recommendedUse =
    contract.situationThesis?.recommendedUse ||
    map.thesisRecommendedUse ||
    triage.thesisRecommendedUse ||
    "do_not_use_as_authority";

  return {
    available: Boolean(thesis || narrative),
    thesis,
    narrative,
    recommendedUse,
    mustUse: recommendedUse === "use_as_situation_blueprint"
  };
},

  buildAIInstruction({
    summary = {},
    contract = {},
    communicationPlan = {},
    mouth = {},
    thesis = {},
    language = {},
    primary = "general_understanding",
    userQuestion = ""
  }) {
    const required = contract.requiredBehaviors || [];
    const forbidden = contract.forbiddenBehaviors || [];
    const responseRules = contract.responseRules || [];
    const executive = contract.executive || {};
    const mouthDirective = contract.mouthDirective || {};
    const profile = contract.communicationProfile || {};
    const preferredTerms = summary.preferredTerms || {};
    const reasoning = summary.reasoning || {};
    const conclusion = reasoning.executiveConclusion || {};
    const activeThreadFacts =
  summary.activeThreadFacts ||
  summary.continuityUsableFacts ||
  [];

const recentMessages =
  summary.threadRecentMessages ||
  summary.threadState?.lastMessages ||
  [];

const emotionalContext = {
  primaryEmotion:
    summary.primaryEmotion ||
    summary.semanticEmotionalTone ||
    null,

  underlyingEmotion:
    summary.underlyingEmotion ||
    null,

  emotionalClassification:
    summary.emotionalClassification ||
    null,

  currentNeed:
    summary.primaryHumanNeed ||
    summary.rootNeed ||
    null,

  event:
    summary.activeIssue ||
    summary.threadState?.activeIssue ||
    summary.situationSummary ||
    null,

  identity:
    summary.leadIdentity ||
    summary.primaryRole ||
    null,

  recentContext: recentMessages.slice(-3),
  activeThreadFacts
};
    
    const budget = communicationPlan.languageBudget || {};
    const sentenceRules = communicationPlan.sentenceRules || {};

    return `
You are Ari.

Write the final answer to the user.

USER QUESTION:
${userQuestion}

PRIMARY LANE:
${primary}

RESPONSE SHAPE:
${contract.responseShape || communicationPlan.answerMode || "direct"}

CONTRACT GOAL:
${executive.contractGoal || "Answer the user's actual question clearly."}

CONTRACT NEXT ACTION:
${executive.contractNextAction || "Give the user the useful answer now."}

KNOWN REASONING OR CONCLUSION:
${JSON.stringify(
  {
    recommendation: conclusion.recommendation || reasoning.recommendation || null,
    keyReason: conclusion.keyReason || reasoning.coreJudgment || null,
    nextStep: conclusion.nextStep || reasoning.nextStep || null
  },
  null,
  2
)}

SITUATION THESIS:
${thesis.available ? JSON.stringify({
  narrative: thesis.narrative,
  thesisType: thesis.thesis?.thesisType || null,
  coreConflict: thesis.thesis?.coreConflict || null,
  userNeed: thesis.thesis?.userNeed || null,
  bestResponse: thesis.thesis?.bestResponse || null,
  recommendedUse: thesis.recommendedUse,
  mustUse: thesis.mustUse
}, null, 2) : "No approved thesis."}

THESIS RULES:
- If mustUse is true, use the thesis as the response blueprint.
- Name the real situation in plain language.
- If there is a coreConflict, reflect it briefly before advice.
- Do not say “thesis,” “blueprint,” or any internal term.
- Do not over-interpret beyond the evidence.

NATURALNESS RULES:
- Sound like a real thinking partner, not a template.
- Start with the useful answer, not generic comfort.
- Use the user’s actual words when possible.
- Mention the concrete issue before giving advice.
- Avoid vague filler like “what matters most,” “take a moment,” or “small steps” unless truly appropriate.
- Vary sentence rhythm.
- Do not make every response emotional.
- Match the lane: technical = crisp, teaching = clear, decision = decisive, emotion = warm, medical = calm/direct.
- Match the user's conversational energy.
- If the user is simply greeting or chatting, respond socially instead of assuming they want to solve a problem.
- Do not force every interaction into advice, decision-making, or troubleshooting.
- If no problem has been presented, avoid asking "what are we trying to fix" or similar task-oriented questions.


EMOTIONAL / THREAD CONTEXT:
${JSON.stringify(emotionalContext, null, 2)}

EMPATHY RULES:
- If the user is sad, ashamed, scared, overwhelmed, or disappointed, name it plainly and briefly.
- Do not sound generic.
- Use the user’s actual situation, not vague phrases like “what matters most.”
- Pair empathy with one concrete next step.
- For mistakes, separate accountability from self-attack.
- For work/clinical errors, encourage reporting/following policy without shaming.
- Do not over-comfort.
- Do not become poetic.
- Do not ask a reflective question unless useful.

EXPRESSIVENESS RULES:
- Ari may use casual language, slang, contractions, humor, emphasis, and profanity when it naturally fits the moment.
- Do not use a fixed list of expressions.
- Do not randomly swear just to sound human.
- Use stronger language mainly when the user’s energy is high, frustrated, excited, relieved, joking, or emotionally intense.
- Match intensity to context: calm situations stay calm; big wins can sound excited; frustrating bugs can sound blunt.
- Medical, safety, pregnancy, legal, or serious risk contexts should stay calm and restrained.
- Avoid sounding corporate, scripted, or overly polished.
- Do not censor personality unless the contract or safety context requires it.

PREFERRED USER TERMS:
${Object.keys(preferredTerms).length ? JSON.stringify(preferredTerms, null, 2) : "Use the user's own wording."}

COMMUNICATION STYLE:
- Directness: ${profile.directness || "normal"}
- Emotional weight: ${profile.emotionalWeight || "normal"}
- Validation level: ${profile.validationLevel || "light"}
- Humor allowed: ${profile.humorAllowed !== false}
- Profanity allowed: ${profile.profanityAllowed !== false}

LENGTH:
- Target: ${budget.targetLength || "short"}
- Max sentences: ${sentenceRules.maxSentences || budget.maxSentences || 5}
- Max words: ${sentenceRules.maxWords || budget.maxWords || 120}

MOUTH DIRECTIVE:
- Opening: ${mouthDirective.opening || mouth.opening || "Answer directly."}
- Order: ${(mouthDirective.order || mouth.order || []).join(" → ") || "direct answer → reason → next step"}
- Closing: ${mouthDirective.closing || "none"}

REQUIRED:
${required.length ? required.map(x => "- " + x).join("\n") : "- Answer directly."}

FORBIDDEN:
${forbidden.length ? forbidden.map(x => "- " + x).join("\n") : "- Do not leak internal system labels."}

RESPONSE RULES:
${responseRules.length ? responseRules.map(x => "- " + x).join("\n") : "- Be natural, useful, and concise."}

ABSOLUTE RULES:
- Do not mention Situation Map, Triage, Contract, Mouth Director, Observer, Lead Organ, or internal pipeline.
- Do not say "primary lane."
- Do not explain what you are doing.
- Do not output placeholders.
- Do not sound robotic.
- Do not overvalidate.
- Do not ask a vague question unless the contract requires clarification.
- Answer the resolved user question, not the raw thread confusion.
- Stop when the answer is complete.

Write naturally, like a smart direct human partner.
`.trim();
  },

  validateAndRepair({
    draft = {},
    summary = {},
    contract = {},
    communicationPlan = {},
    thesis = {},
    language = {},
    primary = "general_understanding",
    userQuestion = ""
  }) {
    let text = typeof draft === "string" ? draft : draft.text || "";

    text = this.cleanText(text, language);

if (
  primary === "emotion" &&
  [
    "take a moment to breathe",
    "think about what matters most",
    "small steps you can take",
    "you might be feeling lost"
  ].some(p => text.toLowerCase().includes(p))
) {
  text = this.localFallback({ primary, contract, thesis, userQuestion });
}

    if (!text) {
      return this.localFallback({ primary, contract, thesis, userQuestion });
    }

    if (this.containsInternalLeak(text)) {
      text = this.removeInternalLeaks(text);
    }

    if (this.isRoboticDirective(text)) {
      text = this.localFallback({ primary, contract, thesis, userQuestion });
    }

    if (contract.clarity?.needed && contract.clarity?.placement === "only") {
      return contract.clarity.question || "Can you clarify the risk first?";
    }

    if (contract.clarity?.needed && contract.clarity?.placement === "end") {
      const question = contract.clarity.question;
      if (question && !text.includes(question)) {
        text = `${text}\n\n${question}`;
      }
    }

    return text;
  },

  localFallback({ primary = "general_understanding", contract = {}, thesis = {}, userQuestion = "" }) {
    if (primary === "builder") {
      return "Yes. The next move is to update the composer so it stops making decisions and only writes from the contract. That means: build the prompt from the contract, let AI draft naturally, validate the response, then block robotic or internal language before returning it.";
    }

    if (primary === "teacher") {
      return "The clean answer is this: the composer should not decide what the user needs. It should only turn the contract into a natural final response.";
    }

    if (primary === "executive_decision") {
      return "My recommendation: make the composer contract-locked. Let Triage decide the lane, let Contract define the rules, and let Composer only write and validate the final answer.";
    }

if (primary === "emotion") {
  const event =
    contract?.debug?.threadQuestionUsed
      ? "what you just described"
      : "that";

  return `Yeah — ${event} can hit hard. The move is: name what happened honestly, separate accountability from self-attack, and take one grounded next step instead of letting shame run the whole room.`;
}

    if (primary === "medical_body") {
      return "Because this involves the body, safety comes first. If symptoms are severe, worsening, or involve pregnancy, get medical guidance now.";
    }

    if (primary === "safety") {
      return "Safety comes first. Step away from immediate danger and get help now.";
    }

    if (contract.clarity?.question) {
      return contract.clarity.question;
    }

    return "Yes. The composer should be updated so it writes naturally from the contract instead of sounding like it is repeating internal instructions.";
  },

  safeAnswer(text = "") {
    if (!text || typeof text !== "string") return null;

    const cleaned = text.trim();

    if (!cleaned) return null;
    if (this.containsInternalLeak(cleaned)) return null;
    if (this.isRoboticDirective(cleaned)) return null;
if (this.isOverlyCorporate(cleaned)) return null;

    return cleaned;
  },

isOverlyCorporate(text = "") {
  const normalized = this.normalize(text);

  const corporatePhrases = [
    "i m here to help you keep building on that success",
  "if there s anything specific you d like to talk about",
      "if there are specific issues you fixed that you want to share",
    "let me know how i can assist",
    "it is great to hear",
    "thank you for sharing that with me"
  ];

  return corporatePhrases.some(phrase => normalized.includes(phrase));
},

  isRoboticDirective(text = "") {
    const normalized = this.normalize(text);

    const bad = [
      "answer the primary lane directly",
      "start with emotional grounding",
      "validate name the emotional signal then ground",
      "lead with immediate safety",
      "answer with build debug help first",
      "teach directly first",
      "organize the decision first"
    ];

    return bad.some(phrase => normalized === phrase || normalized.includes(phrase));
  },

  containsInternalLeak(text = "") {
    const normalized = this.normalize(text);

    const leaks = [
      "situation map",
      "triage engine",
      "situation contract",
      "mouth director",
      "lead organ",
      "observer hierarchy",
      "primary lane",
      "response shape",
      "contract goal",
      "internal pipeline",
      "ari rebirth response"
    ];

    return leaks.some(term => normalized.includes(term));
  },

  removeInternalLeaks(text = "") {
    return String(text || "")
      .replace(/situation map/gi, "context")
      .replace(/triage engine/gi, "priority system")
      .replace(/situation contract/gi, "instructions")
      .replace(/mouth director/gi, "response style")
      .replace(/primary lane/gi, "main answer")
      .replace(/lead organ/gi, "main focus")
      .trim();
  },

  cleanText(text = "", language = {}) {
    if (!text || typeof text !== "string") return "";

    let cleaned = text
      .replace(/^here'?s the practical answer\.?\s*/i, "")
      .replace(/^here'?s the direct answer\.?\s*/i, "")
      .replace(/^let'?s organize this clearly\.?\s*/i, "")
      .replace(/^certainly[,.]?\s*/i, "")
      .replace(/^of course[,.]?\s*/i, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();

    if (language.bannedPhrases?.length) {
      language.bannedPhrases.forEach(phrase => {
        cleaned = cleaned.replace(new RegExp(phrase, "gi"), "");
      });
    }

    return cleaned.trim();
  },

  enforceFinalBudget(text = "", communicationPlan = {}) {
    const budget = communicationPlan.languageBudget || {};
    const sentenceRules = communicationPlan.sentenceRules || {};

    let result = String(text || "").trim();

    const maxSentences =
      sentenceRules.maxSentences ||
      budget.maxSentences ||
      null;

    const maxWords =
      sentenceRules.maxWords ||
      budget.maxWords ||
      null;

    if (maxSentences) result = this.limitSentences(result, maxSentences);
    if (maxWords) result = this.limitWords(result, maxWords);

    return result.trim();
  },

  limitSentences(text = "", max = 5) {
    const parts = String(text || "")
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    return parts.slice(0, max).join(" ");
  },

  limitWords(text = "", max = 120) {
    const words = String(text || "").split(/\s+/).filter(Boolean);

    if (words.length <= max) return text;

    return words.slice(0, max).join(" ").replace(/[,:;–-]$/, "") + ".";
  },

naturalizeResponse({ text = "", summary = {}, contract = {}, thesis = {}, primary = "", userQuestion = "" }) {
  let result = String(text || "").trim();
  if (!result) return result;

  const genericPhrases = [
    "take a moment to breathe",
    "think about what matters most",
    "small steps you can take",
    "you might be feeling lost",
    "align with those priorities",
    "this situation can be challenging"
  ];

  const lower = result.toLowerCase();
  const soundsGeneric = genericPhrases.some(phrase => lower.includes(phrase));

  if (soundsGeneric) {
    return this.localFallback({ primary, contract, thesis, userQuestion });
  }

  result = result
    .replace(/\bIt sounds like you might be\b/gi, "It sounds like you’re")
    .replace(/\bIt is important to\b/gi, "You should")
    .replace(/\bYou may want to consider\b/gi, "Consider")
    .replace(/\bIn this situation,\s*/gi, "")
    .replace(/\bMoving forward,\s*/gi, "")
    .trim();

  return result;
},

  finalPolish(response = "", language = {}) {
    let polished = String(response || "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();

    if (language.polish?.preferNaturalContractions !== false) {
      polished = polished
        .replace(/\bdo not\b/gi, "don’t")
        .replace(/\bcan not\b/gi, "can’t")
        .replace(/\bwill not\b/gi, "won’t")
        .replace(/\bI am\b/g, "I’m")
        .replace(/\bit is\b/gi, "it’s")
        .replace(/\bthat is\b/gi, "that’s");
    }

    return polished;
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI LANGUAGE COMPOSER LOADED:",
  window.AriLanguageComposer?.version
);