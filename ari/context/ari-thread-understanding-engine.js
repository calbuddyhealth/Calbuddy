// ari/context/ari-thread-understanding-engine.js
// Ari Thread Understanding Engine
// Purpose: Convert user language into active situation context across turns.
// V5.1.3 — Situation Understanding / Decision Structure / Context Memory / Advisory Only

window.Ari = window.Ari || {};

window.AriThreadUnderstandingEngine = {
  version: "5.1.3",

  understand(input = {}) {
    const summary = input.summary || input || {};

    const currentText = this.clean(
      summary.userMessage || summary.message || summary.input || ""
    );

    const previousWorkingContext =
  window.Ari.workingContext ||
  summary.threadState?.workingContext ||
  summary.threadUnderstanding?.workingContext ||
  summary.workingContext ||
  this.emptyWorkingContext();

    const recentMessages = this.getRecentMessages(summary, currentText);
    const currentTurn = this.readTurn(currentText);

    const currentSituation = this.understandSituation(currentTurn, recentMessages);

    const topicTransition = this.detectTopicTransition({
      previousWorkingContext,
      currentTurn,
      currentSituation
    });

    const workingContext = this.mergeWorkingContext({
      previousWorkingContext,
      currentTurn,
      currentSituation,
      currentText,
      topicTransition
    });

    const stateChange = this.detectStateChange(currentTurn, currentSituation);

    const resolvedMeaning = this.resolveMeaning({
      currentText,
      currentTurn,
      currentSituation,
      workingContext,
      stateChange
    });

    const threadUnderstanding = {
      threadUnderstandingRan: true,
      threadUnderstandingVersion: this.version,
      source: "ari-thread-understanding-engine",

      currentText,
      recentMessages,
      currentTurn,

     activeSituation: workingContext.activeSituation || currentSituation.activeSituation,
situationFrame: workingContext.situationFrame || currentSituation.situationFrame,
keyFacts: workingContext.keyFacts?.length ? workingContext.keyFacts : currentSituation.keyFacts,
      decisionStructure: currentSituation.decisionStructure,
      centralTradeoff: currentSituation.centralTradeoff,
      hardConstraints: currentSituation.hardConstraints,
      openQuestions: currentSituation.openQuestions,

      workingContext,
      resolvedMeaning,
      stateChange,
      topicTransition,

      activeSubject: workingContext.activeSubject,
      activeObject: workingContext.activeObject,
      activeIssue: workingContext.activeIssue,
      activeGoal: workingContext.activeGoal,
      activeEntities: workingContext.activeEntities,
      activeConstraints: workingContext.activeConstraints,
      activeAttempts: workingContext.activeAttempts,
      unresolvedItems: workingContext.unresolvedItems,
      domainSignals: workingContext.domainSignals,
      intentSignals: workingContext.intentSignals,

      staleContextSuppressed: topicTransition.switched === true,
      suppressedTopics: topicTransition.suppressedTopics || [],

      confidence: this.scoreConfidence({
        currentSituation,
        workingContext,
        resolvedMeaning,
        topicTransition
      }),

      authority: "advisory_context_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "recommendation",
        "medicalEscalation",
        "responseShape",
        "intent",
        "conversationIntent"
      ]
    };

    window.Ari.workingContext = workingContext;
    window.Ari.threadUnderstanding = threadUnderstanding;

    return {
      threadUnderstandingRan: true,
      threadUnderstandingVersion: this.version,
      threadUnderstandingSource: "ari-thread-understanding-engine",

      threadUnderstanding,
      workingContext,
      threadWorkingContext: workingContext,

      activeSituation: workingContext.activeSituation || currentSituation.activeSituation,
situationFrame: workingContext.situationFrame || currentSituation.situationFrame,
keyFacts: workingContext.keyFacts?.length ? workingContext.keyFacts : currentSituation.keyFacts,
      decisionStructure: currentSituation.decisionStructure,
      centralTradeoff: currentSituation.centralTradeoff,
      hardConstraints: currentSituation.hardConstraints,
      openQuestions: currentSituation.openQuestions,

      threadActiveSubject: workingContext.activeSubject,
      threadActiveObject: workingContext.activeObject,
      threadActiveIssue: workingContext.activeIssue,
      threadActiveGoal: workingContext.activeGoal,

      threadStateChange: stateChange,
      threadTopicTransition: topicTransition,
      threadResolvedMeaning: resolvedMeaning,
      threadRecentMessages: recentMessages,

      authority: "advisory_context_only"
    };
  },

  emptyWorkingContext() {
    return {
      activeSubject: null,
      activeObject: null,
      activeIssue: null,
      activeGoal: null,
activeClaim: null,
activeQuestion: null,
followUpAnchor: null,
lastResolvedAnswer: null,
semanticState: null,
      activeEntities: [],
      activeConstraints: [],
      activeAttempts: [],
      unresolvedItems: [],

      domainSignals: [],
      intentSignals: [],
      timeline: [],

      activeSituation: null,
      situationFrame: null,
      keyFacts: [],
      decisionStructure: null,
      centralTradeoff: null,
      hardConstraints: [],
      openQuestions: [],

      lastUserText: null,
      updatedAt: null
    };
  },

  getRecentMessages(summary = {}, currentText = "") {
    const continuityMessages =
      summary.continuityState?.lastMessages ||
      summary.threadState?.lastMessages ||
      [];

    const fromContinuity = continuityMessages
      .map(m => this.clean(m.text || m.claim || ""))
      .filter(Boolean);

    const facts = Array.isArray(summary.activeThreadFacts)
      ? summary.activeThreadFacts
      : [];

    const fromFacts = facts
      .filter(f => f?.type === "recent_message" && f.claim)
      .map(f => this.clean(f.claim))
      .filter(Boolean);

    return [...fromContinuity, ...fromFacts, currentText]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(-10);
  },

  readTurn(text = "") {
    const clean = this.clean(text);
    const lower = clean.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);

    return {
      raw: text,
      clean,
      lower,
      wordCount: words.length,

      isQuestion:
        lower.includes("?") ||
        /^(what|why|how|when|where|should|can|could|do|does|is|are|will|would|who)\b/.test(lower),

      isShortFollowUp:
  words.length <= 12 &&
  /^(why|how|what|what about|what else|then what|can i|should i|do i|does it|is it|are they|really)\b/.test(lower),

      hasExplicitReset:
        /\b(nevermind|never mind|forget it|different topic|new question|unrelated|switch topics|start over)\b/.test(lower),

      hasContinuationCue:
        /\b(and|also|what if|but what if|still|then|so|okay but|what about|next|continue|based on that|what matters|what should i do)\b/.test(lower),

      signals: this.extractSignals(lower, clean)
    };
  },

  understandSituation(turn = {}, recentMessages = []) {
    const text = turn.clean || "";
    const lower = turn.lower || "";

    const entities = this.extractEntities(text);
    const domains = this.detectDomains(lower, entities);
    const intentSignals = this.detectIntentSignals(lower);
    const situationFrame = this.detectSituationFrame(lower, entities, intentSignals);
    const decisionStructure = this.extractDecisionStructure(text, lower, entities);
    const hardConstraints = this.extractHardConstraints(text, lower);
    const centralTradeoff = this.extractCentralTradeoff({
      text,
      lower,
      entities,
      decisionStructure,
      hardConstraints
    });

    const keyFacts = this.extractKeyFacts({
      text,
      lower,
      entities,
      situationFrame,
      decisionStructure,
      hardConstraints,
      centralTradeoff
    });

    const activeSituation = this.makeActiveSituation({
      text,
      situationFrame,
      decisionStructure,
      centralTradeoff,
      keyFacts
    });

    const openQuestions = this.extractOpenQuestions({
      situationFrame,
      decisionStructure,
      hardConstraints,
      keyFacts
    });

    return {
      activeSituation,
      situationFrame,
      entities,
      domains,
      intentSignals,
      decisionStructure,
      centralTradeoff,
      hardConstraints,
      keyFacts,
      openQuestions,
      confidence: this.scoreSituationConfidence({
        activeSituation,
        situationFrame,
        entities,
        decisionStructure,
        keyFacts,
        hardConstraints
      })
    };
  },

  extractSignals(lowerText = "", cleanText = "") {
    return [
      ...this.detectDomains(lowerText, this.extractEntities(cleanText)),
      ...this.detectIntentSignals(lowerText)
    ];
  },

  extractEntities(text = "") {
    const lower = text.toLowerCase();
    const entities = [];

    const add = (type, value, label, evidence, confidence = 0.75) => {
      if (!value) return;
      entities.push({
        type,
        value,
        label: label || value,
        evidence: evidence || value,
        confidence,
        source: "ari-thread-understanding-engine"
      });
    };

    const people = [
      ["father", /\b(my father|my dad|dad)\b/, "my father"],
      ["mother", /\b(my mother|my mom|mom)\b/, "my mother"],
      ["partner", /\b(my wife|my husband|my fiancé|my fiance|my girlfriend|my boyfriend|partner)\b/, "my partner"],
      ["child", /\b(my child|my kid|my son|my daughter|child|kid)\b/, "my child"],
      ["friend", /\b(my friend|friend)\b/, "my friend"],
      ["coworker", /\b(coworker|co-worker|colleague|staff|employee)\b/, "coworker"],
      ["pet", /\b(my cat|my dog|cat|dog|pet)\b/, "pet"]
    ];

    people.forEach(([value, regex, label]) => {
      if (regex.test(lower)) add("person", value, label, label, 0.84);
    });

    if (/\b(i|me|my|i'm|i am)\b/.test(lower)) {
      add("person", "self", "the user", "first person", 0.82);
    }

    const objectPatterns = [
      ["car", /\bcar|vehicle|truck|suv\b/],
      ["code", /\bcode|file|javascript|html|css|github|supabase|vercel|engine|pipeline\b/],
      ["school_event", /\bschool event|school performance|school meeting|school\b/],
      ["money", /\bmoney|budget|payment|debt|cost|rent|salary\b/],
      ["health_symptom", /\bpain|fever|bleeding|diarrhea|cough|itch|swallow|symptom\b/]
    ];

    objectPatterns.forEach(([value, regex]) => {
      if (regex.test(lower)) add("object", value, value, value, 0.78);
    });

    return this.uniqueNodes(entities);
  },

  detectDomains(lower = "", entities = []) {
    const domains = [];

    const add = (value, evidence, confidence = 0.75) => {
      domains.push({
        category: "domain",
        type: "domain",
        value,
        evidence,
        confidence,
        source: "ari-thread-understanding-engine"
      });
    };

    if (entities.some(e => e.value === "child" || e.value === "father" || e.value === "mother" || e.value === "partner")) {
      add("family", "family entity", 0.82);
    }

    if (entities.some(e => e.value === "friend" || e.value === "partner")) {
      add("relationship", "relationship entity", 0.8);
    }

    if (/\bwork|job|career|promotion|salary|coworker|leadership|boss|school\b/.test(lower)) {
      add("work_or_school", "work/school language", 0.76);
    }

    if (/\bcode|file|javascript|html|css|github|supabase|vercel|engine|pipeline\b/.test(lower)) {
      add("software", "software language", 0.82);
    }

    if (/\bpain|fever|bleeding|diarrhea|cough|itch|swallow|symptom|pregnant|vitals|labs\b/.test(lower)) {
      add("health", "health language", 0.84);
    }

    if (/\bmoney|budget|payment|debt|cost|salary|rent|afford\b/.test(lower)) {
      add("finance", "finance language", 0.8);
    }

    return this.uniqueSignals(domains);
  },

  detectIntentSignals(lower = "") {
    const signals = [];

    const add = (value, evidence, confidence = 0.75) => {
      signals.push({
        category: "intent",
        type: "intent",
        value,
        evidence,
        confidence,
        source: "ari-thread-understanding-engine"
      });
    };

    if (/\bwhat should i do|should i|what do i do|recommend|decide|choose|only do one\b/.test(lower)) {
      add("decision_support", "decision language", 0.86);
    }

    if (/\bwhy|how come|what causes\b/.test(lower)) {
      add("explanation", "explanation language", 0.76);
    }

    if (/\bfix|debug|not working|broken|error|bug\b/.test(lower)) {
      add("debugging", "debugging language", 0.82);
    }

    if (/\bwhat matters|what is more important|priority|prioritize\b/.test(lower)) {
      add("prioritization", "priority language", 0.84);
    }

    return this.uniqueSignals(signals);
  },

  detectSituationFrame(lower = "", entities = [], intentSignals = []) {
    const hasDecision = intentSignals.some(s => s.value === "decision_support" || s.value === "prioritization");

    if (
      hasDecision &&
      /\bbut|however|at the same time|only do one|either|or|between|can't do both|cannot do both\b/.test(lower)
    ) {
      return {
        value: "competing_obligations_or_tradeoff",
        label: "competing obligations or tradeoff",
        confidence: 0.9,
        source: "ari-thread-understanding-engine"
      };
    }

    if (hasDecision) {
      return {
        value: "decision_support",
        label: "decision support",
        confidence: 0.84,
        source: "ari-thread-understanding-engine"
      };
    }

    if (/\bfix|debug|not working|broken|error|bug\b/.test(lower)) {
      return {
        value: "debugging_problem",
        label: "debugging problem",
        confidence: 0.84,
        source: "ari-thread-understanding-engine"
      };
    }

    if (/\bpain|fever|bleeding|diarrhea|cough|itch|swallow|symptom|pregnant\b/.test(lower)) {
      return {
        value: "medical_or_body_concern",
        label: "medical or body concern",
        confidence: 0.84,
        source: "ari-thread-understanding-engine"
      };
    }

    if (entities.some(e => e.type === "person" && e.value !== "self")) {
      return {
        value: "relationship_or_people_context",
        label: "relationship or people context",
        confidence: 0.74,
        source: "ari-thread-understanding-engine"
      };
    }

    return {
      value: "general_understanding",
      label: "general understanding",
      confidence: 0.6,
      source: "ari-thread-understanding-engine"
    };
  },

  extractDecisionStructure(text = "", lower = "", entities = []) {
    const hasDecision =
      /\bwhat should i do|should i|decide|choose|only do one|either|or|between|can't do both|cannot do both\b/.test(lower);

    if (!hasDecision) return null;

    const options = this.extractOptions(text, lower, entities);

    return {
      type: "decision_structure",
      options,
      optionCount: options.length,
      mutuallyExclusive:
        /\bonly do one|can't do both|cannot do both|at the same time|same time|either\b/.test(lower),
      decisionQuestion:
        /\bwhat should i do|should i|what do i do\b/.test(lower),
      confidence: options.length >= 2 ? 0.86 : 0.68,
      source: "ari-thread-understanding-engine"
    };
  },

  extractOptions(text = "", lower = "", entities = []) {
    const options = [];

    const add = (label, evidence, confidence = 0.76) => {
      if (!label) return;
      options.push({
        label,
        evidence: evidence || label,
        confidence,
        source: "ari-thread-understanding-engine"
      });
    };

    const promiseMatch = text.match(/\bpromised\s+([^.!?]{3,90})/i);
    if (promiseMatch) {
      add(this.clean(promiseMatch[0]), promiseMatch[0], 0.82);
    }

    const couldMatch = text.match(/\bcould\s+([^.!?]{3,90})/i);
    if (couldMatch) {
      const phrase = this.clean(couldMatch[0]);
      if (phrase.includes(" or ")) {
        phrase.split(/\s+or\s+/i).forEach(part => add(this.clean(part), part, 0.76));
      } else {
        add(phrase, phrase, 0.76);
      }
    }

    if (lower.includes("friend") && lower.includes("move")) {
      add("help friend move", "friend + move", 0.86);
    }

    if (lower.includes("child") && lower.includes("school")) {
      add("attend child's school event", "child + school event", 0.88);
    }

    if (lower.includes("repair") && lower.includes("car")) {
      add("repair the car", "repair + car", 0.82);
    }

    if (lower.includes("course") || lower.includes("career")) {
      add("invest in career opportunity", "course/career", 0.78);
    }

    return this.uniqueOptions(options).slice(0, 4);
  },

  extractHardConstraints(text = "", lower = "") {
    const constraints = [];

    const add = (label, evidence, confidence = 0.78) => {
      constraints.push({
        type: "hard_constraint",
        label,
        value: label,
        evidence,
        confidence,
        source: "ari-thread-understanding-engine"
      });
    };

    if (/\bat the same time|same time\b/.test(lower)) {
      add("two commitments happen at the same time", "same time", 0.86);
    }

    if (/\bonly do one|can only do one|can't do both|cannot do both\b/.test(lower)) {
      add("the user can only choose one option", "only do one", 0.9);
    }

    if (/\btomorrow|tonight|morning|deadline|due\b/.test(lower)) {
      add("time pressure is present", "time phrase", 0.76);
    }

    if (/\bcan't afford both|cannot afford both|not enough money|budget\b/.test(lower)) {
      add("limited money prevents doing both", "money constraint", 0.84);
    }

    if (/\bexhausted|tired|burned out|overwhelmed|stressed\b/.test(lower)) {
      add("limited energy is affecting the decision", "energy state", 0.78);
    }

    return this.uniqueNodes(constraints);
  },

  extractCentralTradeoff({ lower = "", entities = [], decisionStructure = null, hardConstraints = [] }) {
    if (!decisionStructure) return null;

    const hasFriend = lower.includes("friend");
    const hasChild = lower.includes("child") || lower.includes("kid") || lower.includes("son") || lower.includes("daughter");
    const hasPromise = lower.includes("promised");
    const hasSchool = lower.includes("school");

    if (hasFriend && hasChild && hasPromise && hasSchool) {
      return {
        type: "central_tradeoff",
        sideA: "honoring a promise to a friend",
        sideB: "being present for the child’s school event",
        label: "promise to friend vs presence for child",
        confidence: 0.9,
        source: "ari-thread-understanding-engine"
      };
    }

    if (decisionStructure.options?.length >= 2) {
      return {
        type: "central_tradeoff",
        sideA: decisionStructure.options[0].label,
        sideB: decisionStructure.options[1].label,
        label: `${decisionStructure.options[0].label} vs ${decisionStructure.options[1].label}`,
        confidence: 0.78,
        source: "ari-thread-understanding-engine"
      };
    }

    return null;
  },

  extractKeyFacts({
    text = "",
    lower = "",
    entities = [],
    situationFrame = {},
    decisionStructure = null,
    hardConstraints = [],
    centralTradeoff = null
  }) {
    const facts = [];

    const add = (fact, confidence = 0.82) => {
      if (!fact) return;
      facts.push({
        type: "key_fact",
        claim: fact,
        confidence,
        source: "ari-thread-understanding-engine"
      });
    };

    if (lower.includes("promised") && lower.includes("friend") && lower.includes("move")) {
      add("The user promised to help a friend move.", 0.9);
    }

    if (lower.includes("tomorrow")) {
      add("The conflict happens tomorrow.", 0.78);
    }

    if (lower.includes("child") && lower.includes("school")) {
      add("The user's child has a school event.", 0.9);
    }

    if (/\bat the same time|same time\b/.test(lower)) {
      add("The commitments happen at the same time.", 0.88);
    }

    if (/\bonly do one|can only do one|can't do both|cannot do both\b/.test(lower)) {
      add("The user can only choose one commitment.", 0.9);
    }

    if (centralTradeoff) {
      add(`The central tradeoff is ${centralTradeoff.sideA} versus ${centralTradeoff.sideB}.`, 0.86);
    }

    if (!facts.length && text) {
      add(`The user's current situation: ${text}`, 0.68);
    }

    return this.uniqueFacts(facts).slice(0, 8);
  },

  makeActiveSituation({ text = "", situationFrame = {}, decisionStructure = null, centralTradeoff = null, keyFacts = [] }) {
    const label =
      centralTradeoff?.label ||
      situationFrame?.label ||
      "active situation";

    return {
      type: "active_situation",
      value: text,
      label,
      evidence: text,
      situationFrame: situationFrame?.value || null,
      confidence: Math.max(
        situationFrame?.confidence || 0.6,
        decisionStructure?.confidence || 0,
        centralTradeoff?.confidence || 0,
        keyFacts.length ? 0.82 : 0
      ),
      source: "ari-thread-understanding-engine"
    };
  },

  extractOpenQuestions({ situationFrame = {}, decisionStructure = null, hardConstraints = [], keyFacts = [] }) {
    const questions = [];

    if (decisionStructure && decisionStructure.options?.length < 2) {
      questions.push("What are the real options being compared?");
    }

    if (decisionStructure && !hardConstraints.length) {
      questions.push("What constraint prevents doing both?");
    }

    if (situationFrame?.value === "medical_or_body_concern") {
      questions.push("Are there red flags, worsening symptoms, or high-risk features?");
    }

    return questions.slice(0, 3);
  },

isLowInformationFollowUp(turn = {}) {
  const text = turn.lower || "";
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length > 8) return false;

  return (
    /^(why|how|what|what else|what about|then what|really|can i|should i|do i)\??$/.test(text) ||
    /\b(it|this|that|they|them)\b/.test(text)
  );
},

  mergeWorkingContext({
    previousWorkingContext = {},
    currentTurn = {},
    currentSituation = {},
    currentText = "",
    topicTransition = {}
  }) {
    const merged = this.emptyWorkingContext();
const lowInfoFollowUp = this.isLowInformationFollowUp(currentTurn);
    if (!topicTransition.switched) {
      this.copyContextInto(merged, previousWorkingContext);
    }

    if (lowInfoFollowUp && !topicTransition.switched) {
  merged.activeSituation = previousWorkingContext.activeSituation || currentSituation.activeSituation;
  merged.situationFrame = previousWorkingContext.situationFrame || currentSituation.situationFrame;
  merged.keyFacts = previousWorkingContext.keyFacts?.length
    ? previousWorkingContext.keyFacts
    : currentSituation.keyFacts || [];

  merged.activeClaim = previousWorkingContext.activeClaim || null;
  merged.activeQuestion = previousWorkingContext.activeQuestion || null;
    merged.followUpAnchor =
    previousWorkingContext.followUpAnchor ||
    previousWorkingContext.semanticState?.followUpAnchor ||
    previousWorkingContext.activeClaim ||
    previousWorkingContext.semanticState?.activeClaim ||
    previousWorkingContext.lastUserText ||
    null;

  merged.semanticState = previousWorkingContext.semanticState || null;
} else {
  merged.activeSituation = currentSituation.activeSituation || merged.activeSituation;
  merged.situationFrame = currentSituation.situationFrame || merged.situationFrame;
  merged.keyFacts = currentSituation.keyFacts || [];

  merged.activeClaim = this.extractActiveClaim(currentText, currentSituation);
  merged.activeQuestion = currentTurn.isQuestion ? currentText : null;
  merged.followUpAnchor =
    merged.activeClaim ||
    merged.activeQuestion ||
    currentSituation.activeSituation?.value ||
    null;
      merged.semanticState = this.buildSemanticState({
    currentText,
    currentTurn,
    currentSituation,
    workingContext: merged
  });
}
    merged.decisionStructure = currentSituation.decisionStructure || null;
    merged.centralTradeoff = currentSituation.centralTradeoff || null;
    merged.hardConstraints = currentSituation.hardConstraints || [];
    merged.openQuestions = currentSituation.openQuestions || [];

    currentSituation.entities?.forEach(entity => {
      if (entity.value === "self") {
        merged.activeSubject = this.chooseBest(merged.activeSubject, entity);
      } else {
        merged.activeEntities.push(entity);
      }
    });

    currentSituation.hardConstraints?.forEach(c => merged.activeConstraints.push(c));
    currentSituation.domains?.forEach(d => merged.domainSignals.push(d));
    currentSituation.intentSignals?.forEach(i => merged.intentSignals.push(i));

    merged.timeline.push({
      text: currentText,
      createdAt: new Date().toISOString(),
      situationFrame: currentSituation.situationFrame?.value || null
    });

    merged.lastUserText = currentText;
    merged.updatedAt = new Date().toISOString();

    return this.normalizeWorkingContext(merged);
  },

  copyContextInto(target = {}, source = {}) {
    if (!source || typeof source !== "object") return;

    target.activeSubject = this.chooseBest(target.activeSubject, source.activeSubject);
    target.activeObject = this.chooseBest(target.activeObject, source.activeObject);
    target.activeIssue = this.chooseBest(target.activeIssue, source.activeIssue);
    target.activeGoal = this.chooseBest(target.activeGoal, source.activeGoal);
target.activeClaim = this.chooseBestText(target.activeClaim, source.activeClaim);
target.activeQuestion = this.chooseBestText(target.activeQuestion, source.activeQuestion);
target.followUpAnchor = this.chooseBestText(target.followUpAnchor, source.followUpAnchor);
target.lastResolvedAnswer = this.chooseBestText(target.lastResolvedAnswer, source.lastResolvedAnswer);
target.semanticState = source.semanticState || target.semanticState || null;

    target.activeEntities = this.mergeArrays(target.activeEntities, source.activeEntities);
    target.activeConstraints = this.mergeArrays(target.activeConstraints, source.activeConstraints);
    target.activeAttempts = this.mergeArrays(target.activeAttempts, source.activeAttempts);
    target.unresolvedItems = this.mergeArrays(target.unresolvedItems, source.unresolvedItems);
    target.domainSignals = this.mergeArrays(target.domainSignals, source.domainSignals);
    target.intentSignals = this.mergeArrays(target.intentSignals, source.intentSignals);
    target.timeline = this.mergeArrays(target.timeline, source.timeline).slice(-12);
  },

  normalizeWorkingContext(context = {}) {
    context.activeEntities = this.uniqueNodes(context.activeEntities);
    context.activeConstraints = this.uniqueNodes(context.activeConstraints);
    context.domainSignals = this.uniqueSignals(context.domainSignals);
    context.intentSignals = this.uniqueSignals(context.intentSignals);
    context.timeline = (context.timeline || []).slice(-12);
    return context;
  },

  detectStateChange(turn = {}, situation = {}) {
    if (turn.hasExplicitReset) {
      return { type: "topic_reset", confidence: 0.9 };
    }

    if (turn.isShortFollowUp || turn.hasContinuationCue) {
      return { type: "context_continued", confidence: 0.72 };
    }

    if (situation.activeSituation?.confidence >= 0.8) {
      return { type: "new_active_situation", confidence: 0.82 };
    }

    return { type: "none", confidence: 0.4 };
  },

  detectTopicTransition({ previousWorkingContext = {}, currentTurn = {}, currentSituation = {} }) {
    if (currentTurn.hasExplicitReset) {
      return {
        switched: true,
        from: previousWorkingContext.situationFrame?.value || null,
        to: currentSituation.situationFrame?.value || null,
        reason: "User explicitly reset topic.",
        confidence: 0.9,
        suppressedTopics: this.summarizeSuppressed(previousWorkingContext)
      };
    }

    const previousFrame = previousWorkingContext.situationFrame?.value || null;
    const currentFrame = currentSituation.situationFrame?.value || null;

    if (
      previousFrame &&
      currentFrame &&
      previousFrame !== currentFrame &&
      !currentTurn.isShortFollowUp
    ) {
      return {
        switched: true,
        from: previousFrame,
        to: currentFrame,
        reason: "New active situation frame appeared.",
        confidence: 0.78,
        suppressedTopics: this.summarizeSuppressed(previousWorkingContext)
      };
    }

    return {
      switched: false,
      from: previousFrame,
      to: currentFrame || previousFrame,
      reason: "No clear topic switch.",
      confidence: 0.65,
      suppressedTopics: []
    };
  },

  summarizeSuppressed(context = {}) {
    return (context.timeline || [])
      .slice(-5)
      .map(item => item.text)
      .filter(Boolean);
  },

buildSemanticState({
  currentText = "",
  currentTurn = {},
  currentSituation = {},
  workingContext = {}
}) {
  return {
    lastUserText: currentText,
    activeClaim: workingContext.activeClaim || null,
    activeQuestion: workingContext.activeQuestion || null,
    followUpAnchor: workingContext.followUpAnchor || null,

    situationFrame:
      workingContext.situationFrame?.value ||
      currentSituation.situationFrame?.value ||
      null,

    keyFacts:
      workingContext.keyFacts?.map(f => f.claim || f).filter(Boolean) ||
      [],

    intent:
      currentSituation.intentSignals?.[0]?.value ||
      null,

    isQuestion: Boolean(currentTurn.isQuestion),
    isLowInformationFollowUp: this.isLowInformationFollowUp(currentTurn),

    confidence:
      currentSituation.confidence ||
      workingContext.activeSituation?.confidence ||
      0.5,

    updatedAt: new Date().toISOString(),
    source: "ari-thread-understanding-engine"
  };
},

extractActiveClaim(text = "", situation = {}) {
  const clean = this.clean(text);
  if (!clean) return null;

  if (situation?.keyFacts?.length) {
    return situation.keyFacts[0]?.claim || clean;
  }

  if (/^(why|how|what|can i|should i|do i)\b/i.test(clean)) {
    return null;
  }

  return clean;
},

  resolveMeaning({ currentText = "", currentTurn = {}, currentSituation = {}, workingContext = {}, stateChange = {} }) {
    return {
      isContextual: Boolean(
        currentTurn.isShortFollowUp ||
        currentTurn.hasContinuationCue ||
        stateChange.type === "context_continued"
      ),

      currentText,

      activeSituation: workingContext.activeSituation || currentSituation.activeSituation,
situationFrame: workingContext.situationFrame || currentSituation.situationFrame,
keyFacts: workingContext.keyFacts?.length ? workingContext.keyFacts : currentSituation.keyFacts,
      decisionStructure: currentSituation.decisionStructure || null,
      centralTradeoff: currentSituation.centralTradeoff || null,
      hardConstraints: currentSituation.hardConstraints || [],
      openQuestions: currentSituation.openQuestions || [],

      resolvedSubject: workingContext.activeSubject || null,
      resolvedObject: workingContext.activeObject || null,
      resolvedIssue: workingContext.activeIssue || null,
      resolvedGoal: workingContext.activeGoal || null,
      resolvedConstraints: workingContext.activeConstraints || [],
      resolvedAttempts: workingContext.activeAttempts || [],

      stateChange,
      confidence: currentSituation.confidence || 0.5,
      authority: "advisory_context_only"
    };
  },

  scoreSituationConfidence({ activeSituation, situationFrame, entities = [], decisionStructure, keyFacts = [], hardConstraints = [] }) {
    let score = 0.35;

    if (activeSituation) score += 0.12;
    if (situationFrame?.confidence) score += 0.12;
    if (entities.length) score += 0.08;
    if (decisionStructure) score += 0.12;
    if (keyFacts.length >= 2) score += 0.15;
    if (hardConstraints.length) score += 0.08;

    return Math.min(0.95, score);
  },

  scoreConfidence({ currentSituation = {}, workingContext = {}, resolvedMeaning = {}, topicTransition = {} }) {
    let score = 35;

    if (currentSituation.activeSituation) score += 16;
    if (currentSituation.situationFrame) score += 10;
    if ((currentSituation.keyFacts || []).length) score += 14;
    if (currentSituation.decisionStructure) score += 10;
    if (currentSituation.centralTradeoff) score += 10;
    if ((currentSituation.hardConstraints || []).length) score += 6;
    if (resolvedMeaning.isContextual) score += 4;
    if (topicTransition.switched) score += 2;

    return Math.max(25, Math.min(95, score));
  },

  makeNode(type, value, label, evidence, confidence = 0.6) {
    return {
      type,
      value,
      label: label || value,
      evidence,
      confidence,
      updatedAt: new Date().toISOString(),
      source: "ari-thread-understanding-engine"
    };
  },

  chooseBest(...nodes) {
    const valid = nodes.filter(Boolean);
    if (!valid.length) return null;

    return valid.sort(
      (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)
    )[0];
  },

chooseBestText(...values) {
  return values.find(v => typeof v === "string" && v.trim()) || null;
},

  uniqueOptions(options = []) {
    const seen = new Set();

    return options.filter(option => {
      const key = String(option.label || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  uniqueFacts(facts = []) {
    const seen = new Set();

    return facts.filter(fact => {
      const key = String(fact.claim || fact).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  uniqueNodes(nodes = []) {
    const seen = new Set();

    return (nodes || []).filter(node => {
      const key = `${node.type || ""}:${node.value || node.label || node.evidence || ""}`.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  uniqueSignals(signals = []) {
    const seen = new Set();

    return (signals || []).filter(signal => {
      const key = `${signal.category || ""}:${signal.type || ""}:${signal.value || ""}`.toLowerCase();
      if (!signal?.value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  mergeArrays(a = [], b = []) {
    return this.uniqueNodes([
      ...(Array.isArray(a) ? a : []),
      ...(Array.isArray(b) ? b : [])
    ]);
  },

  clean(value = "") {
    return String(value || "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI THREAD UNDERSTANDING ENGINE LOADED:",
  window.AriThreadUnderstandingEngine?.version
);