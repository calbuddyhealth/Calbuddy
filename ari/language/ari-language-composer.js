// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V8.1.0 — Contract-Locked Natural AI Writer
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
  version: "8.1.0",

  async compose(input = {}) {
    const summary = input.summary || input || {};

    const contract = summary.situationContract || {};
    const communicationPlan = summary.communicationPlan || {};
    const mouth = summary.mouthDirector || {};
    const language = summary.humanLanguageProfile || {};

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
      primary,
      userQuestion
    });

    const finalResponse = this.finalPolish(
      this.enforceFinalBudget(validated, communicationPlan),
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
    primary = "general_understanding",
    userQuestion = ""
  }) {
    const instruction = this.buildAIInstruction({
      summary,
      contract,
      communicationPlan,
      mouth,
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
      text: this.localFallback({ primary, contract, userQuestion })
    };
  },

  buildAIInstruction({
    summary = {},
    contract = {},
    communicationPlan = {},
    mouth = {},
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
    language = {},
    primary = "general_understanding",
    userQuestion = ""
  }) {
    let text = typeof draft === "string" ? draft : draft.text || "";

    text = this.cleanText(text, language);

    if (!text) {
      return this.localFallback({ primary, contract, userQuestion });
    }

    if (this.containsInternalLeak(text)) {
      text = this.removeInternalLeaks(text);
    }

    if (this.isRoboticDirective(text)) {
      text = this.localFallback({ primary, contract, userQuestion });
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

  localFallback({ primary = "general_understanding", contract = {}, userQuestion = "" }) {
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
  return "Yeah — that makes sense. A med error can hit hard because you care about doing the job right, not because you’re a bad nurse. First: follow your unit policy, report/document what needs to be reported, and make sure the patient is okay. Then debrief with someone safe instead of letting shame eat you alive.";
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

    return cleaned;
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