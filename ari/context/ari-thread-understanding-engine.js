// ari/context/ari-thread-understanding-engine.js
// Ari Thread Understanding Engine
// Purpose: Maintain active working context across turns.
// V2.0.0 — Working Context / Active Object Model

window.Ari = window.Ari || {};

window.AriThreadUnderstandingEngine = {
  version: "2.0.0",

  understand(input = {}) {
    const summary = input.summary || input || {};

    const currentText = this.clean(
      summary.userMessage || summary.message || summary.input || ""
    );

    const previousWorkingContext =
      summary.workingContext ||
      summary.threadUnderstanding?.workingContext ||
      window.Ari.workingContext ||
      {};

    const recentMessages = this.getRecentMessages(summary, currentText);

    const currentTurn = this.interpretCurrentTurn(currentText);
    const priorContext = this.rebuildContextFromMessages(recentMessages);

    const workingContext = this.mergeWorkingContext({
      previousWorkingContext,
      priorContext,
      currentTurn,
      currentText
    });

    const resolvedMeaning = this.resolveMeaning({
      currentText,
      currentTurn,
      workingContext
    });

    const domain = this.resolveDomain(workingContext, resolvedMeaning);
    const laneHint = this.resolveLaneHint(domain, resolvedMeaning, summary);

    const threadUnderstanding = {
      threadUnderstandingRan: true,
      threadUnderstandingVersion: this.version,
      source: "ari-thread-understanding-engine",

      currentText,
      recentMessages,

      currentTurn,
      workingContext,
      resolvedMeaning,

      subject: workingContext.activeSubject,
      object: workingContext.activeObject,
      problem: workingContext.activeProblem,
      goal: workingContext.activeGoal,

      domain,
      laneHint,

      confidence: this.scoreConfidence({
        recentMessages,
        workingContext,
        resolvedMeaning
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
        "medicalEscalation"
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

      threadSubject: workingContext.activeSubject,
      threadObject: workingContext.activeObject,
      threadProblem: workingContext.activeProblem,
      threadGoal: workingContext.activeGoal,

      threadDomain: domain,
      threadLaneHint: laneHint,
      threadResolvedMeaning: resolvedMeaning,

      threadRecentMessages: recentMessages
    };
  },

  getRecentMessages(summary = {}, currentText = "") {
    const facts = Array.isArray(summary.activeThreadFacts)
      ? summary.activeThreadFacts
      : [];

    const fromFacts = facts
      .filter(f => f?.type === "recent_message" && f.claim)
      .map(f => this.clean(f.claim))
      .filter(Boolean);

    const continuityMessages =
      summary.continuityState?.lastMessages ||
      summary.threadState?.lastMessages ||
      [];

    const fromContinuity = continuityMessages
      .map(m => this.clean(m.text || m.claim || ""))
      .filter(Boolean);

    return [...fromFacts, ...fromContinuity, currentText]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(-8);
  },

  interpretCurrentTurn(text = "") {
    const clean = this.clean(text);
    const lower = clean.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);

    return {
      raw: text,
      clean,
      wordCount: words.length,

      isQuestion:
        lower.includes("?") ||
        /^(what|why|how|when|where|should|can|could|do|does|is|are|will|would)\b/.test(lower),

      isShortFollowUp:
        words.length <= 12,

      hasSelfReference:
        /\b(i|me|my|myself)\b/.test(lower),

      hasOtherPersonReference:
        /\b(he|she|they|him|her|them|my father|my dad|my mom|my mother|my fiancee|my fiancée|my wife|my husband|my baby|my child)\b/.test(lower),

      hasAnimalReference:
        /\b(cat|dog|pet|kitten|puppy|animal)\b/.test(lower),

      asksForAction:
        /\b(what should|what do i do|how do i|what can i do|next|fix|help|recommend)\b/.test(lower),

      asksForMonitoring:
        /\b(watch|watch out|look for|red flag|warning|concerned|worry|worried)\b/.test(lower),

      expressesAvoidance:
        /\b(i don't want|i do not want|avoid|without|don't let|prevent)\b/.test(lower),

      expressesFailedAttempt:
        /\b(tried|already did|did that|not working|still|hasn't worked|haven't worked)\b/.test(lower),

      rawSignals: this.extractUniversalSignals(lower)
    };
  },

  extractUniversalSignals(text = "") {
    const signals = [];

    const add = (type, value, evidence, confidence = 0.7) => {
      signals.push({ type, value, evidence, confidence });
    };

    if (/\b(i|me|my|myself)\b/.test(text)) {
      add("subject_reference", "self", "first-person reference", 0.8);
    }

    if (/\b(he|she|they|him|her|them)\b/.test(text)) {
      add("subject_reference", "other_person", "third-person reference", 0.65);
    }

    if (/\b(cat|dog|pet|animal)\b/.test(text)) {
      add("subject_reference", "animal", "animal/pet reference", 0.85);
    }

    if (/\b(hurt|pain|sick|symptom|breathing|bleeding|fever|vomit|diarrhea|constipation|poop|cough|swallow|dizzy|faint)\b/.test(text)) {
      add("problem_frame", "body_function_or_symptom", "body/symptom language", 0.82);
    }

    if (/\b(code|file|html|script|pipeline|engine|bug|error|github|supabase)\b/.test(text)) {
      add("problem_frame", "build_or_system_issue", "build/system language", 0.82);
    }

    if (/\b(car|vehicle|engine|brake|paint|tire|miles)\b/.test(text)) {
      add("problem_frame", "object_or_vehicle_issue", "object/vehicle language", 0.78);
    }

    if (/\b(what should|what do i do|how do i|help|fix|recommend)\b/.test(text)) {
      add("intent", "action_guidance", "action guidance request", 0.85);
    }

    if (/\b(watch|watch out|look for|warning|red flag|worried|concerned)\b/.test(text)) {
      add("intent", "monitoring_guidance", "monitoring/risk language", 0.85);
    }

    if (/\b(i don't want|avoid|without|prevent)\b/.test(text)) {
      add("goal", "avoid_harm_or_unwanted_action", "avoidance language", 0.78);
    }

    return signals;
  },

  rebuildContextFromMessages(messages = []) {
    const context = this.emptyWorkingContext();

    for (const message of messages || []) {
      const turn = this.interpretCurrentTurn(message);
      this.applyTurnToContext(context, turn);
    }

    return context;
  },

  mergeWorkingContext({ previousWorkingContext = {}, priorContext = {}, currentTurn = {}, currentText = "" }) {
    const merged = this.emptyWorkingContext();

    this.copyContextInto(merged, previousWorkingContext);
    this.copyContextInto(merged, priorContext);
    this.applyTurnToContext(merged, currentTurn);

    merged.lastUserText = currentText;
    merged.updatedAt = new Date().toISOString();

    merged.activeSubject = this.chooseBest(
      merged.activeSubject,
      previousWorkingContext.activeSubject,
      priorContext.activeSubject
    );

    merged.activeObject = this.chooseBest(
      merged.activeObject,
      previousWorkingContext.activeObject,
      priorContext.activeObject
    );

    merged.activeProblem = this.chooseBest(
      merged.activeProblem,
      previousWorkingContext.activeProblem,
      priorContext.activeProblem
    );

    merged.activeGoal = this.chooseBest(
      merged.activeGoal,
      previousWorkingContext.activeGoal,
      priorContext.activeGoal
    );

    return merged;
  },

  emptyWorkingContext() {
    return {
      activeSubject: null,
      activeObject: null,
      activeProblem: null,
      activeGoal: null,
      activeConstraints: [],
      activeAttempts: [],
      timeline: [],
      lastUserText: null,
      updatedAt: null
    };
  },

  copyContextInto(target = {}, source = {}) {
    if (!source || typeof source !== "object") return;

    target.activeSubject = this.chooseBest(target.activeSubject, source.activeSubject);
    target.activeObject = this.chooseBest(target.activeObject, source.activeObject);
    target.activeProblem = this.chooseBest(target.activeProblem, source.activeProblem);
    target.activeGoal = this.chooseBest(target.activeGoal, source.activeGoal);

    target.activeConstraints = this.mergeArrays(
      target.activeConstraints,
      source.activeConstraints
    );

    target.activeAttempts = this.mergeArrays(
      target.activeAttempts,
      source.activeAttempts
    );

    target.timeline = this.mergeArrays(
      target.timeline,
      source.timeline
    ).slice(-10);
  },

  applyTurnToContext(context = {}, turn = {}) {
    const text = String(turn.clean || "").toLowerCase();

    if (turn.hasSelfReference) {
      context.activeSubject = this.makeNode("subject", "self", "the user", "first-person reference", 0.85);
    } else if (turn.hasAnimalReference) {
      context.activeSubject = this.makeNode("subject", "animal", "the animal/pet being discussed", "animal reference", 0.85);
    } else if (turn.hasOtherPersonReference) {
      context.activeSubject = this.makeNode("subject", "other_person", "the person being discussed", "third-person reference", 0.7);
    }

    for (const signal of turn.rawSignals || []) {
      if (signal.type === "problem_frame") {
        context.activeProblem = this.makeNode(
          "problem",
          signal.value,
          this.labelForProblem(signal.value),
          signal.evidence,
          signal.confidence
        );

        context.activeObject = this.objectForProblem(signal.value);
      }

      if (signal.type === "goal") {
        context.activeGoal = this.makeNode(
          "goal",
          signal.value,
          this.labelForGoal(signal.value),
          signal.evidence,
          signal.confidence
        );
      }
    }

    if (turn.expressesAvoidance) {
      context.activeConstraints.push(
        this.makeNode("constraint", "avoid_unwanted_action", turn.clean, "avoidance statement", 0.78)
      );
    }

    if (turn.expressesFailedAttempt) {
      context.activeAttempts.push(
        this.makeNode("attempt", "prior_attempt_failed_or_incomplete", turn.clean, "failed/continued attempt language", 0.78)
      );
    }

    if (turn.clean) {
      context.timeline.push({
        text: turn.clean,
        createdAt: new Date().toISOString()
      });
    }
  },

  resolveMeaning({ currentText = "", currentTurn = {}, workingContext = {} }) {
    const subject = workingContext.activeSubject;
    const object = workingContext.activeObject;
    const problem = workingContext.activeProblem;
    const goal = workingContext.activeGoal;

    const isContextual =
      currentTurn.isShortFollowUp ||
      currentTurn.asksForAction ||
      currentTurn.asksForMonitoring ||
      currentTurn.expressesAvoidance ||
      currentTurn.expressesFailedAttempt;

    let intent = "respond_normally";
    if (currentTurn.asksForAction) intent = "action_guidance";
    if (currentTurn.asksForMonitoring) intent = "monitoring_guidance";
    if (currentTurn.expressesAvoidance && currentTurn.asksForAction) {
      intent = "safe_alternative_guidance";
    }

    const resolvedText = this.composeResolvedText({
      currentText,
      subject,
      object,
      problem,
      goal,
      intent,
      isContextual
    });

    return {
      isContextual,
      intent,
      resolvedText,

      resolvedSubject: subject,
      resolvedObject: object,
      resolvedProblem: problem,
      resolvedGoal: goal,

      confidence: this.meaningConfidence({
        isContextual,
        subject,
        object,
        problem,
        goal,
        intent
      }),

      authority: "advisory_context_only"
    };
  },

  composeResolvedText({ currentText, subject, object, problem, goal, intent, isContextual }) {
    if (!isContextual) return currentText;

    const s = subject?.label || "the active subject";
    const o = object?.label || "the active object";
    const p = problem?.label || "the active problem";
    const g = goal?.label || "the active goal";

    if (intent === "safe_alternative_guidance") {
      return `User is asking what to do about ${p} affecting ${s}, while avoiding ${g || "an unwanted action"} related to ${o}.`;
    }

    if (intent === "action_guidance") {
      return `User is asking what to do next about ${p} affecting ${s}.`;
    }

    if (intent === "monitoring_guidance") {
      return `User is asking what to watch for regarding ${p} affecting ${s}.`;
    }

    return `${currentText} Context: subject=${s}; object=${o}; problem=${p}; goal=${g}.`;
  },

  resolveDomain(workingContext = {}, resolvedMeaning = {}) {
    const subjectKind = workingContext.activeSubject?.kind;
    const problemKind = workingContext.activeProblem?.kind;
    const objectKind = workingContext.activeObject?.kind;

    if (
      objectKind === "body_function" ||
      problemKind === "body_function_or_symptom"
    ) {
      if (subjectKind === "animal") return "animal_health_context";
      return "human_health_context";
    }

    if (problemKind === "build_or_system_issue") return "builder_context";
    if (problemKind === "object_or_vehicle_issue") return "object_or_vehicle_context";
    if (resolvedMeaning.intent === "monitoring_guidance") return "risk_monitoring_context";
    if (resolvedMeaning.intent === "action_guidance") return "action_guidance_context";

    return "general_context";
  },

  resolveLaneHint(domain = "", resolvedMeaning = {}, summary = {}) {
    if (domain === "human_health_context") return "medical_context";
    if (domain === "animal_health_context") return "medical_context";
    if (domain === "builder_context") return "builder";

    if (resolvedMeaning.intent === "monitoring_guidance") return "medical_context";
    if (resolvedMeaning.intent === "safe_alternative_guidance") return "medical_context";
    if (resolvedMeaning.intent === "action_guidance") {
      return summary.primaryLaneSuggestion || "executive_decision";
    }

    return summary.primaryLaneSuggestion || "general_understanding";
  },

  objectForProblem(problemKind = "") {
    if (problemKind === "body_function_or_symptom") {
      return this.makeNode(
        "object",
        "body_function",
        "the body function or symptom being discussed",
        "body/symptom frame",
        0.78
      );
    }

    if (problemKind === "build_or_system_issue") {
      return this.makeNode(
        "object",
        "system_or_code",
        "the system, file, or code being discussed",
        "build/system frame",
        0.78
      );
    }

    if (problemKind === "object_or_vehicle_issue") {
      return this.makeNode(
        "object",
        "physical_object_or_vehicle",
        "the object or vehicle being discussed",
        "object/vehicle frame",
        0.72
      );
    }

    return null;
  },

  labelForProblem(kind = "") {
    const labels = {
      body_function_or_symptom: "a body function or symptom",
      build_or_system_issue: "a build, file, or system issue",
      object_or_vehicle_issue: "an object or vehicle issue"
    };

    return labels[kind] || "the active problem";
  },

  labelForGoal(kind = "") {
    const labels = {
      avoid_harm_or_unwanted_action: "avoid making the problem worse or doing the unwanted action"
    };

    return labels[kind] || "the active goal";
  },

  makeNode(type, kind, label, evidence, confidence = 0.6) {
    return {
      type,
      kind,
      label,
      evidence,
      confidence,
      updatedAt: new Date().toISOString()
    };
  },

  chooseBest(...nodes) {
    const valid = nodes.filter(Boolean);
    if (!valid.length) return null;

    return valid.sort((a, b) => {
      const ac = Number(a.confidence || 0);
      const bc = Number(b.confidence || 0);
      return bc - ac;
    })[0];
  },

  mergeArrays(a = [], b = []) {
    const combined = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
    const seen = new Set();

    return combined.filter(item => {
      const key = JSON.stringify({
        type: item?.type,
        kind: item?.kind,
        label: item?.label,
        evidence: item?.evidence
      });

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  scoreConfidence({ recentMessages = [], workingContext = {}, resolvedMeaning = {} }) {
    let score = 35;

    if (recentMessages.length >= 2) score += 15;
    if (workingContext.activeSubject) score += 15;
    if (workingContext.activeObject) score += 15;
    if (workingContext.activeProblem) score += 15;
    if (resolvedMeaning.isContextual) score += 10;
    if (resolvedMeaning.intent !== "respond_normally") score += 10;

    return Math.min(95, score);
  },

  meaningConfidence({ isContextual, subject, object, problem, goal, intent }) {
    let score = 40;

    if (isContextual) score += 15;
    if (subject) score += 12;
    if (object) score += 12;
    if (problem) score += 12;
    if (goal) score += 8;
    if (intent && intent !== "respond_normally") score += 10;

    return Math.min(95, score);
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