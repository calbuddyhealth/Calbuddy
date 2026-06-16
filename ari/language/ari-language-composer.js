// ari/language/ari-language-composer.js
// Ari Language Composer
// Purpose: Final response writer only.
// V7.5.0 — Budget + Lexical-Grounded Composer

window.Ari = window.Ari || {};

window.AriLanguageComposer = {
  version: "7.5.0",

  async compose(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};
    const mouth = summary.mouthDirector || {};
    const communicationPlan = summary.communicationPlan || {};
    const reasoning = summary.reasoning || {};
    const conclusion = reasoning.executiveConclusion || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      communicationPlan.primary ||
      mouth.contractPrimary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    let bodyParts = [];

    if (primary === "executive_decision") {
      bodyParts = this.composeExecutiveDecision({
        summary,
        reasoning,
        conclusion,
        language,
        communicationPlan
      });
    } else {
      bodyParts = await this.composeWithAI({
        summary,
        primary,
        contract,
        language,
        mouth,
        communicationPlan
      });
    }

    bodyParts = this.cleanParts(bodyParts, language);

    if (!bodyParts.length) {
      bodyParts = [this.localEmergencyFallback(summary, primary)];
    }

    bodyParts = this.applyCommunicationBudget(bodyParts, communicationPlan);

    let finalResponse = this.renderByPresentationStyle(
      bodyParts,
      communicationPlan
    );

    finalResponse = this.finalPolish(finalResponse, language);
    finalResponse = this.enforceFinalBudget(finalResponse, communicationPlan);

    return {
      languageMode: primary,
      languageOpening: bodyParts[0] || null,
      languageBody: bodyParts.join("\n\n"),
      languageSections: bodyParts,
      languageClosing: null,
      finalResponse,

      composerVersion: this.version,
      source: "ari-language-composer",

      composerUsedCommunicationPlan: Boolean(communicationPlan),
      composerUsedLexicalGrounding: Boolean(summary.preferredTerms),
      composerUsedAI: primary !== "executive_decision",
      composerAllowsCompression: true,
      compressionDirective: mouth.compressionDirective || null,

      composerDebug: {
        primary,
        preferredTerms: summary.preferredTerms || {},
        conceptMap: summary.conceptMap || {},
        communicationPlan,
        languageBudget: communicationPlan.languageBudget || null,
        informationBudget: communicationPlan.informationBudget || null,
        presentationStyle: communicationPlan.presentationStyle || null,
        useHeadings: communicationPlan.useHeadings ?? null,
        sectionPlan: communicationPlan.sectionPlan || [],
        sentenceRules: communicationPlan.sentenceRules || {},
        usedParts: bodyParts
      }
    };
  },

  composeExecutiveDecision({
    summary = {},
    reasoning = {},
    conclusion = {},
    language = {},
    communicationPlan = {}
  }) {
    const rec = reasoning.recommendation || {};
    const infoBudget = communicationPlan.informationBudget || {};
    const sectionPlan = communicationPlan.sectionPlan || [
      "recommendation",
      "reason",
      "next_step"
    ];

    const grounded = this.getGroundedTerms(summary);

    const rawRecommendation =
      conclusion.recommendation ||
      rec.summary ||
      "protect the main priority first, then choose the option with the least unnecessary risk.";

    const recommendation = this.groundExecutiveRecommendation(
      rawRecommendation,
      grounded
    );

    const reason = this.bestExecutiveReason({
      summary,
      reasoning,
      conclusion,
      grounded
    });

    const rawNextStep =
      conclusion.nextStep ||
      reasoning.caseModel?.nextAction ||
      rec.alternatives?.[0] ||
      null;

    const nextStep = this.groundExecutiveNextStep(rawNextStep, grounded);

    const wantsSeparated = communicationPlan.wantsSeparatedReasoning;
    const parts = [];

    if (wantsSeparated) {
      return this.composeSeparatedExecutiveDecision({
        reasoning,
        conclusion,
        rec,
        communicationPlan,
        grounded
      });
    }

    if (
      sectionPlan.includes("recommendation") &&
      infoBudget.recommendation !== 0
    ) {
      parts.push(`My recommendation: ${this.upperFirst(recommendation)}`);
    }

    if (
      reason &&
      sectionPlan.includes("reason") &&
      infoBudget.supportingReason !== 0
    ) {
      parts.push(`Why: ${this.upperFirst(reason)}`);
    }

    if (
      nextStep &&
      sectionPlan.includes("next_step") &&
      infoBudget.nextAction !== 0
    ) {
      parts.push(`Next step: ${this.upperFirst(nextStep)}`);
    }

    return parts;
  },

  getGroundedTerms(summary = {}) {
    const preferred = summary.preferredTerms || {};
    const conceptMap = summary.conceptMap || {};

    return {
      primaryGoal:
        preferred.primaryGoal ||
        conceptMap.primary_goal?.phrase ||
        conceptMap.time_sensitive_financial_goal?.phrase ||
        "the main goal",

      optionalPlan:
        preferred.optionalPlan ||
        conceptMap.optional_plan?.phrase ||
        conceptMap.discretionary_activity?.phrase ||
        "the optional plan",

      deadline:
        preferred.deadline ||
        conceptMap.deadline?.phrase ||
        "the deadline",

      limitingResource:
        preferred.limitingResource ||
        conceptMap.limiting_resource?.phrase ||
        "your budget",

      centralTradeoff:
        preferred.centralTradeoff ||
        conceptMap.central_tradeoff?.phrase ||
        null
    };
  },

  groundExecutiveRecommendation(text = "", grounded = {}) {
    const primary = this.cleanUserPhrase(grounded.primaryGoal);
    const optional = this.cleanUserPhrase(grounded.optionalPlan);

    const normalized = this.normalize(text);

    if (
      normalized.includes("time sensitive financial goal") ||
      normalized.includes("financial goal") ||
      normalized.includes("main priority") ||
      normalized.includes("top priority")
    ) {
      if (primary && optional) {
        return `protect ${primary} first, then resize ${optional} around what safely remains.`;
      }

      if (primary) {
        return `protect ${primary} first, then use what remains for lower-priority options.`;
      }
    }

    return this.replaceAbstractTerms(text, grounded);
  },

  groundExecutiveNextStep(text = "", grounded = {}) {
    if (!text) return null;

    const primary = this.cleanUserPhrase(grounded.primaryGoal);
    const optional = this.cleanUserPhrase(grounded.optionalPlan);

    const normalized = this.normalize(text);

    if (
      primary &&
      optional &&
      (
        normalized.includes("calculate the required amount") ||
        normalized.includes("cap the optional plan") ||
        normalized.includes("time sensitive goal")
      )
    ) {
      return `figure out the exact amount you need for ${primary}, set it aside, then plan ${optional} with the remaining money.`;
    }

    return this.replaceAbstractTerms(text, grounded);
  },

  replaceAbstractTerms(text = "", grounded = {}) {
    let output = String(text || "");

    const primary = this.cleanUserPhrase(grounded.primaryGoal);
    const optional = this.cleanUserPhrase(grounded.optionalPlan);
    const deadline = this.cleanUserPhrase(grounded.deadline);
    const resource = this.cleanUserPhrase(grounded.limitingResource);

    if (primary) {
      output = output
        .replace(/\bthe time-sensitive financial goal\b/gi, primary)
        .replace(/\bthe time sensitive financial goal\b/gi, primary)
        .replace(/\bthe time-sensitive goal\b/gi, primary)
        .replace(/\bthe time sensitive goal\b/gi, primary)
        .replace(/\bthe main goal\b/gi, primary)
        .replace(/\bthe main priority\b/gi, primary)
        .replace(/\bthe top priority\b/gi, primary);
    }

    if (optional) {
      output = output
        .replace(/\bthe optional plan\b/gi, optional)
        .replace(/\bthe optional goal\b/gi, optional)
        .replace(/\bthe discretionary activity\b/gi, optional)
        .replace(/\boptional benefit\b/gi, optional);
    }

    if (deadline) {
      output = output
        .replace(/\bthe deadline\b/gi, deadline);
    }

    if (resource) {
      output = output
        .replace(/\bthe limiting resource\b/gi, resource);
    }

    return output;
  },

  bestExecutiveReason({ summary = {}, reasoning = {}, conclusion = {}, grounded = {} }) {
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const specific = this.specificReasonFromGrounding(text, grounded);
    if (specific) return specific;

    if (conclusion.keyReason) {
      return this.replaceAbstractTerms(this.cleanReason(conclusion.keyReason), grounded);
    }

    if (reasoning.coreJudgment) {
      return this.replaceAbstractTerms(this.cleanReason(reasoning.coreJudgment), grounded);
    }

    const tradeoff = conclusion.keyTradeoff || reasoning.tradeoffs?.[0];

    if (tradeoff?.sideA && tradeoff?.sideB) {
      const sideA = this.replaceAbstractTerms(tradeoff.sideA, grounded);
      const sideB = this.replaceAbstractTerms(tradeoff.sideB, grounded);
      return `${sideB} matters more right now than ${sideA}.`;
    }

    return null;
  },

  specificReasonFromGrounding(text = "", grounded = {}) {
    const primary = this.cleanUserPhrase(grounded.primaryGoal);
    const optional = this.cleanUserPhrase(grounded.optionalPlan);
    const deadline = this.cleanUserPhrase(grounded.deadline);

    if (primary && optional && deadline) {
      return `${this.upperFirst(primary)} is tied to ${deadline}, while ${optional} can be adjusted.`;
    }

    if (primary && optional) {
      return `${this.upperFirst(primary)} is the more important constraint, while ${optional} has more flexibility.`;
    }

    return null;
  },

  cleanUserPhrase(phrase = "") {
    let text = String(phrase || "").trim();
    if (!text) return "";

    text = text
      .replace(/^i\s+/i, "")
      .replace(/^we\s+/i, "")
      .replace(/^my\s+/i, "your ")
      .replace(/^our\s+/i, "your ")
      .replace(/^want to\s+/i, "")
      .replace(/^would like to\s+/i, "")
      .replace(/^planning to\s+/i, "")
      .replace(/^plan to\s+/i, "")
      .replace(/^hope to\s+/i, "")
      .replace(/^need to\s+/i, "")
      .replace(/^have to\s+/i, "")
      .replace(/^must\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  },

  composeSeparatedExecutiveDecision({
    reasoning = {},
    conclusion = {},
    rec = {},
    communicationPlan = {},
    grounded = {}
  }) {
    const sentenceRules = communicationPlan.sentenceRules || {};
    const maxBullets = sentenceRules.maxBulletsPerSection || 3;

    const known = this.limitList(reasoning.knownFacts || [], maxBullets)
      .map(item => this.replaceAbstractTerms(item, grounded));

    const inferred = this.limitList(reasoning.inferredFacts || [], maxBullets)
      .map(item => this.replaceAbstractTerms(item, grounded));

    const unknowns = this.limitList(reasoning.unknowns || [], maxBullets)
      .map(item => this.replaceAbstractTerms(item, grounded));

    const rawRecommendation =
      conclusion.recommendation ||
      rec.summary ||
      "protect the main priority first.";

    const recommendation = this.groundExecutiveRecommendation(
      rawRecommendation,
      grounded
    );

    const rawNextStep =
      conclusion.nextStep ||
      reasoning.caseModel?.nextAction ||
      rec.alternatives?.[0] ||
      null;

    const nextStep = this.groundExecutiveNextStep(rawNextStep, grounded);

    const parts = [
      `My recommendation: ${this.upperFirst(recommendation)}`
    ];

    if (known.length) parts.push(`What we know:\n${this.bullets(known)}`);
    if (inferred.length) parts.push(`What I’m inferring:\n${this.bullets(inferred)}`);
    if (unknowns.length) parts.push(`What could change the answer:\n${this.bullets(unknowns)}`);
    if (nextStep) parts.push(`Next step: ${this.upperFirst(nextStep)}`);

    return parts;
  },

  cleanReason(reason = "") {
    return String(reason || "")
      .replace(/^the deciding factor is\s+/i, "")
      .replace(/^why:\s*/i, "")
      .replace(/\bthe time-sensitive goal comes first because\s+/i, "")
      .replace(/\bthe time sensitive goal comes first because\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  applyCommunicationBudget(parts = [], communicationPlan = {}) {
    const budget = communicationPlan.languageBudget || {};
    const maxSections = budget.maxSections || communicationPlan.sentenceRules?.maxSections || parts.length;
    return parts.slice(0, maxSections);
  },

  enforceFinalBudget(text = "", communicationPlan = {}) {
    const budget = communicationPlan.languageBudget || {};
    const sentenceRules = communicationPlan.sentenceRules || {};

    const maxSentences =
      sentenceRules.maxSentences ||
      budget.maxSentences ||
      null;

    const maxWords =
      sentenceRules.maxWords ||
      budget.maxWords ||
      null;

    let result = String(text || "").trim();

    if (maxSentences) result = this.limitSentences(result, maxSentences);
    if (maxWords) result = this.limitWords(result, maxWords);

    return result.trim();
  },

  limitSentences(text = "", max = 4) {
    const parts = String(text || "")
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    return parts.slice(0, max).join(" ");
  },

  limitWords(text = "", max = 100) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (words.length <= max) return text;
    return words.slice(0, max).join(" ").replace(/[,:;–-]$/, "") + ".";
  },

  async composeWithAI({
    summary = {},
    primary = "general_understanding",
    contract = {},
    language = {},
    mouth = {},
    communicationPlan = {}
  }) {
    const instruction = this.buildAIInstruction({
      summary,
      primary,
      contract,
      language,
      mouth,
      communicationPlan
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

        const aiText =
          aiResult.knowledgeAnswer ||
          aiResult.finalResponse ||
          aiResult.response ||
          aiResult.text ||
          null;

        const safe = this.safeAnswer(aiText);
        if (safe) return [safe];
      }
    } catch (error) {
      console.warn("AriLanguageComposer AI compose failed:", error);
    }

    return [this.localEmergencyFallback(summary, primary)];
  },

  buildAIInstruction({
    summary = {},
    primary = "general_understanding",
    contract = {},
    language = {},
    mouth = {},
    communicationPlan = {}
  }) {
    const required = contract.requiredBehaviors || [];
    const forbidden = contract.forbiddenBehaviors || [];
    const executive = contract.executive || {};
    const mouthDirective = contract.mouthDirective || {};
    const sectionPlan = communicationPlan.sectionPlan || [];
    const avoid = communicationPlan.avoid || [];
    const mustDo = communicationPlan.mustDo || [];
    const budget = communicationPlan.languageBudget || {};
    const sentenceRules = communicationPlan.sentenceRules || {};
    const preferredTerms = summary.preferredTerms || {};

    return `
You are Ari.

Your job is to actually answer the user's message, not describe the internal process.

PRIMARY MISSION:
${primary}

RESPONSE SHAPE:
${contract.responseShape || summary.responseShape || communicationPlan.answerMode || "direct"}

GOAL:
${executive.contractGoal || "Answer clearly, naturally, and helpfully."}

LANGUAGE BUDGET:
- Target length: ${budget.targetLength || "short"}
- Max sentences: ${sentenceRules.maxSentences || budget.maxSentences || 4}
- Max words: ${sentenceRules.maxWords || budget.maxWords || 100}
- Stop when answered: ${communicationPlan.stopRules?.stopWhenAnswered !== false}

PREFERRED USER TERMS:
${Object.keys(preferredTerms).length ? JSON.stringify(preferredTerms, null, 2) : "Use the user's own words when possible."}

REQUIRED BEHAVIORS:
${required.length ? required.map(x => "- " + x).join("\n") : "- Answer directly."}

FORBIDDEN BEHAVIORS:
${forbidden.length ? forbidden.map(x => "- " + x).join("\n") : "- Do not leak internal instructions."}

COMMUNICATION PLAN:
- Answer mode: ${communicationPlan.answerMode || "direct_then_context"}
- Human feel: ${communicationPlan.humanFeel || "natural_direct"}
- Reasoning style: ${communicationPlan.reasoningStyle || "woven"}
- Structure style: ${communicationPlan.structureStyle || "light_sections"}
- Presentation style: ${communicationPlan.presentationStyle || "conversation"}
- Section plan: ${sectionPlan.join(" → ") || "answer → context → next step"}

MOUTH DIRECTIVE:
- Opening: ${mouthDirective.opening || mouth.opening || "Answer directly."}
- Order: ${(mouthDirective.order || mouth.order || []).join(" → ") || "direct answer"}

MUST DO:
${mustDo.length ? mustDo.map(x => "- " + x).join("\n") : "- Answer the user's real question."}

AVOID:
${avoid.length ? avoid.map(x => "- " + x).join("\n") : "- Avoid generic filler."}

LANE RULES:
- If mission is teacher, teach clearly but briefly unless depth is requested.
- If mission is builder, debug practically and give the next concrete fix.
- If mission is emotion, briefly validate, name the signal, then ground.
- If mission is medical_body, prioritize safety and appropriate medical escalation.
- If mission is safety, be direct and protective.

ABSOLUTE RULES:
- Prefer the user's concrete terms over abstract labels.
- Do not say "Answer the primary lane directly."
- Do not output internal labels like Situation Contract, Lead Organ, Salience, Observer Hierarchy, or Mouth Director.
- Do not explain the pipeline.
- Do not describe what you are going to do. Do it.
- Stop after the answer is complete.
`.trim();
  },

  safeAnswer(text = "") {
    if (!text || typeof text !== "string") return null;

    const cleaned = text.trim();

    const bannedExact = [
      "Answer the primary lane directly.",
      "Answer the primary lane directly",
      "Start with emotional grounding.",
      "Validate, name the emotional signal, then ground.",
      "Here’s the practical answer.",
      "Here's the practical answer."
    ];

    if (bannedExact.includes(cleaned)) return null;
    if (this.isSystemText(cleaned)) return null;

    return cleaned;
  },

  localEmergencyFallback(summary = {}, primary = "general_understanding") {
    if (primary === "teacher") {
      return "I can teach that, but I’m having trouble generating the full explanation right now.";
    }

    if (primary === "builder") {
      return "Fix the last response layer first. Ari is detecting the mission, but the composer is not producing the actual answer.";
    }

    if (primary === "emotion") {
      return "That sounds draining. I don’t want to overread it, but something is clearly weighing on you. What has been wearing you down most?";
    }

    if (primary === "medical_body") {
      return "Because this involves the body, safety comes first. If symptoms are severe, worsening, or involve pregnancy, call the appropriate medical line or get evaluated now.";
    }

    if (primary === "safety") {
      return "Safety comes first. Step away from immediate danger and get help now if there is any risk of harm.";
    }

    return "I hear you. I need a little more context, but I’ll answer the main thing as clearly as I can.";
  },

  renderByPresentationStyle(parts = [], communicationPlan = {}) {
    const style = communicationPlan.presentationStyle || "structured";

    if (style === "conversation") return parts.join(" ");

    if (style === "mixed") {
      return [
        parts[0],
        parts.slice(1).join("\n")
      ].filter(Boolean).join("\n\n");
    }

    return parts.join("\n\n");
  },

  bullets(items = []) {
    return items
      .filter(Boolean)
      .map(item => `- ${String(item).trim()}`)
      .join("\n");
  },

  limitList(items = [], max = 4) {
    return (items || []).filter(Boolean).slice(0, max);
  },

  cleanParts(parts, language = {}) {
    return (parts || [])
      .filter(Boolean)
      .map(text => this.cleanText(text, language))
      .filter(Boolean);
  },

  cleanText(text, language = {}) {
    if (!text || typeof text !== "string") return null;

    let cleaned = text.trim()
      .replace(/^let'?s organize this clearly\.?\s*/i, "")
      .replace(/^here'?s the practical answer\.?\s*/i, "")
      .replace(/^here'?s the practical move\.?\s*/i, "")
      .replace(/^something feels important here\.?\s*/i, "")
      .trim();

    cleaned = this.fixAwkwardGrammar(cleaned);

    if (!cleaned) return null;
    if (this.isBanned(cleaned, language)) return null;
    if (this.isSystemText(cleaned)) return null;

    return cleaned;
  },

  fixAwkwardGrammar(text = "") {
    return String(text || "")
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();
  },

  isBanned(text, language = {}) {
    const normalized = this.normalize(text);
    const banned = language.bannedPhrases || [];

    return banned.some(phrase =>
      normalized.includes(this.normalize(phrase))
    );
  },

  isSystemText(text = "") {
    const normalized = this.normalize(text);

    return [
      "situation contract",
      "mouth director",
      "human language engine",
      "lead organ",
      "salience",
      "observer hierarchy",
      "primary human need",
      "contract bridge",
      "triage engine",
      "situation map"
    ].some(term => normalized.includes(term));
  },

  finalPolish(response, language = {}) {
    if (!response) return "";

    let polished = response
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();

    if (language.polish?.preferNaturalContractions !== false) {
      polished = polished
        .replace(/\bdo not\b/gi, "don’t")
        .replace(/\bcan not\b/gi, "can’t")
        .replace(/\bwill not\b/gi, "won’t");
    }

    return polished;
  },

  upperFirst(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};