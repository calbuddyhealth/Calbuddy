// ari/context/ari-thread-understanding-engine.js
// Ari Thread Understanding Engine
// Purpose: Maintain active working context across turns.
// V3.1.0 — Universal Working Context / Advisory Only

window.Ari = window.Ari || {};

window.AriThreadUnderstandingEngine = {
  version: "3.1.0",

  understand(input = {}) {
    const summary = input.summary || input || {};

    const currentText = this.clean(
      summary.userMessage || summary.message || summary.input || ""
    );

    const previousWorkingContext =
      summary.workingContext ||
      summary.threadUnderstanding?.workingContext ||
      window.Ari.workingContext ||
      this.emptyWorkingContext();

    const recentMessages = this.getRecentMessages(summary, currentText);

    const currentTurn = this.interpretTurn(currentText);
    const reconstructedContext = this.rebuildContextFromMessages(recentMessages);

    const topicTransition = this.detectTopicTransition({
      previousWorkingContext,
      reconstructedContext,
      currentTurn
    });

    const workingContext = this.mergeWorkingContext({
      previousWorkingContext,
      reconstructedContext,
      currentTurn,
      currentText,
      topicTransition
    });

    const stateChange = this.detectStateChange(currentTurn, workingContext);

    this.updateUnresolvedItems(workingContext, currentTurn, stateChange);

    const resolvedMeaning = this.resolveMeaning({
      currentText,
      currentTurn,
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
      workingContext,
      resolvedMeaning,

      stateChange,
      topicTransition,

      activeSubject: workingContext.activeSubject,
      activeObject: workingContext.activeObject,
      activeIssue: workingContext.activeIssue,
      activeGoal: workingContext.activeGoal,
      activeConstraints: workingContext.activeConstraints,
      activeAttempts: workingContext.activeAttempts,

      unresolvedItems: workingContext.unresolvedItems,

      impliedQuestion: this.toImpliedQuestion(resolvedMeaning),
      domainSignals: workingContext.domainSignals,
      intentSignals: workingContext.intentSignals,

      confidence: this.scoreConfidence({
        recentMessages,
        workingContext,
        resolvedMeaning,
        stateChange,
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

      threadActiveSubject: workingContext.activeSubject,
      threadActiveObject: workingContext.activeObject,
      threadActiveIssue: workingContext.activeIssue,
      threadActiveGoal: workingContext.activeGoal,

      threadStateChange: stateChange,
      threadTopicTransition: topicTransition,
      threadResolvedMeaning: resolvedMeaning,
      threadImpliedQuestion: threadUnderstanding.impliedQuestion,
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

      activeConstraints: [],
      activeAttempts: [],
      unresolvedItems: [],

      domainSignals: [],
      intentSignals: [],
      timeline: [],

      lastUserText: null,
      updatedAt: null
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
      .slice(-10);
  },

  interpretTurn(text = "") {
    const clean = this.clean(text);
    const lower = clean.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);

    const signals = this.extractSignals(lower);

    return {
      raw: text,
      clean,
      lower,
      wordCount: words.length,

      isQuestion:
        lower.includes("?") ||
        /^(what|why|how|when|where|should|can|could|do|does|is|are|will|would|who)\b/.test(lower),

      isShortFollowUp: words.length <= 12,

      hasExplicitReset:
        /\b(nevermind|never mind|forget it|different topic|new question|unrelated|switch topics)\b/.test(lower),

      hasContinuationCue:
        /\b(and|also|what if|but what if|still|then|so|okay but|what about)\b/.test(lower),

      signals
    };
  },
    extractSignals(text = "") {
    const signals = [];

    const add = (category, type, value, evidence, confidence = 0.7) => {
      signals.push({
        category,
        type,
        value,
        evidence,
        confidence,
        source: "ari-thread-understanding-engine"
      });
    };

    this.detectSubjectSignals(text, add);
    this.detectObjectSignals(text, add);
    this.detectIssueSignals(text, add);
    this.detectGoalSignals(text, add);
    this.detectConstraintSignals(text, add);
    this.detectAttemptSignals(text, add);
    this.detectIntentSignals(text, add);
    this.detectDomainSignals(text, add);

    return signals;
  },

  detectSubjectSignals(text = "", add) {
    if (/\b(i|me|my|myself)\b/.test(text)) {
      add("subject", "subject_reference", "self", "first-person reference", 0.82);
    }

    if (/\b(we|us|our|ourselves)\b/.test(text)) {
      add("subject", "subject_reference", "group_self", "group/self reference", 0.78);
    }

    if (/\b(he|she|they|him|her|them|his|hers|their|theirs)\b/.test(text)) {
      add("subject", "subject_reference", "other_or_group", "third-person reference", 0.68);
    }

    if (/\b(my dad|my father|my mom|my mother|my wife|my husband|my girlfriend|my boyfriend|my fiance|my fiancé|my partner|my spouse|my kid|my child|my baby|my family)\b/.test(text)) {
      add("subject", "subject_reference", "close_person_or_family", "close person reference", 0.86);
    }

    if (/\b(cat|dog|pet|kitten|puppy|animal)\b/.test(text)) {
      add("subject", "subject_reference", "animal_or_pet", "animal/pet reference", 0.9);
    }

    if (/\b(coworker|boss|manager|leadership|team|employee|staff|friend|neighbor|classmate)\b/.test(text)) {
      add("subject", "subject_reference", "social_or_work_person", "social/work person reference", 0.8);
    }
  },

  detectObjectSignals(text = "", add) {
    if (/\b(code|file|html|css|javascript|script|function|engine|pipeline|github|supabase|vercel|console|app|page|button|form)\b/.test(text)) {
      add("object", "object_reference", "system_or_code", "system/code object", 0.84);
    }

    if (/\b(body|ear|throat|chest|stomach|head|leg|arm|skin|mouth|rectum|poop|urine|breathing|heart)\b/.test(text)) {
      add("object", "object_reference", "body_or_body_function", "body/body-function object", 0.84);
    }

    if (/\b(car|vehicle|engine|paint|tire|brake|battery|door|screen|phone|computer|device)\b/.test(text)) {
      add("object", "object_reference", "physical_object_or_device", "physical object/device", 0.78);
    }

    if (/\b(decision|choice|option|plan|goal|deadline|schedule|timeline)\b/.test(text)) {
      add("object", "object_reference", "decision_or_plan", "decision/plan object", 0.76);
    }
  },

  detectIssueSignals(text = "", add) {
    if (/\b(pain|hurt|sick|symptom|fever|bleeding|vomit|vomiting|diarrhea|constipation|cough|dizzy|faint|rash|itch|swallow|breathing|nausea|worse|worsening)\b/.test(text)) {
      add("issue", "issue_frame", "health_or_body_issue", "health/body issue language", 0.86);
    }

    if (/\b(bug|error|broken|not working|doesn't work|doesnt work|failed|crash|issue|problem|fix|debug|wrong|missing)\b/.test(text)) {
      add("issue", "issue_frame", "technical_or_system_issue", "technical/system issue language", 0.84);
    }

    if (/\b(conflict|argument|upset|angry|mad|hurt|trust|honest|honesty|lie|lied|deny|denies|denying|relationship|communication)\b/.test(text)) {
      add("issue", "issue_frame", "relationship_or_trust_issue", "relationship/trust issue language", 0.82);
    }

    if (/\b(rushing|pressure|deadline|only|limited|constraint|forced|required|have to|must|not enough time|too much)\b/.test(text)) {
      add("issue", "issue_frame", "pressure_or_constraint_issue", "pressure/constraint language", 0.8);
    }

    if (/\b(cutting corners|unsafe|mistake|quality|report|reported|complaint|leadership|policy|rule)\b/.test(text)) {
      add("issue", "issue_frame", "accountability_or_work_quality_issue", "accountability/work-quality language", 0.84);
    }
  },

  detectGoalSignals(text = "", add) {
    if (/\b(what should|what do i do|how do i|how can i|next step|recommend|help me|best way)\b/.test(text)) {
      add("goal", "goal_frame", "action_guidance", "action guidance request", 0.88);
    }

    if (/\b(watch for|watch out|red flag|warning sign|concerned|worried|monitor|look for)\b/.test(text)) {
      add("goal", "goal_frame", "monitoring_guidance", "monitoring guidance request", 0.86);
    }

    if (/\b(understand|why|how come|what if|explain|make sense)\b/.test(text)) {
      add("goal", "goal_frame", "understanding_or_explanation", "understanding/explanation request", 0.78);
    }

    if (/\b(avoid|prevent|without|don't want|do not want|keep from|make sure)\b/.test(text)) {
      add("goal", "goal_frame", "avoid_unwanted_outcome", "avoidance goal", 0.8);
    }
  },

  detectConstraintSignals(text = "", add) {
    if (/\b(only|just|limited|deadline|due|soon|urgent|rushed|rushing|pressure|forced|required|have to|must|can't|cannot)\b/.test(text)) {
      add("constraint", "constraint_frame", "limited_time_or_pressure", "time/pressure constraint", 0.78);
    }

    if (/\b(money|budget|cost|afford|debt|rent|payment|income|save|savings)\b/.test(text)) {
      add("constraint", "constraint_frame", "financial_constraint", "financial constraint", 0.78);
    }

    if (/\b(worried|afraid|scared|nervous|team hate me|backlash|retaliation|consequence)\b/.test(text)) {
      add("constraint", "constraint_frame", "social_or_consequence_risk", "social/consequence risk", 0.8);
    }
  },

  detectAttemptSignals(text = "", add) {
    if (/\b(tried|already did|did that|talked to|asked|reported|called|checked|tested|replaced|changed)\b/.test(text)) {
      add("attempt", "attempt_frame", "prior_action_taken", "prior action language", 0.78);
    }

    if (/\b(still|again|keeps|keep|not working|didn't work|doesn't work|hasn't worked|deny everything|denies everything)\b/.test(text)) {
      add("attempt", "attempt_frame", "problem_persisted_or_response_failed", "persistence/failure language", 0.8);
    }
  },
    detectIntentSignals(text = "", add) {
    if (/\b(what should|what do i do|how do i|how can i|should i|recommend|best move|next step)\b/.test(text)) {
      add("intent", "intent_frame", "action_guidance", "action guidance intent", 0.88);
    }

    if (/\b(why|how come|what if|does that mean|is it possible|could it be)\b/.test(text)) {
      add("intent", "intent_frame", "explanation_or_possibility", "explanation/possibility intent", 0.82);
    }

    if (/\b(watch for|look for|red flag|warning sign|monitor|when should|concerned|worried)\b/.test(text)) {
      add("intent", "intent_frame", "monitoring_or_risk_check", "monitoring/risk intent", 0.84);
    }

    if (/\b(send code|replace|place|where exactly|update this|rewrite|fix this|debug|test)\b/.test(text)) {
      add("intent", "intent_frame", "implementation_help", "implementation/help intent", 0.86);
    }

    if (/\b(write|rewrite|draft|make this sound|summarize|format|email|essay|paper)\b/.test(text)) {
      add("intent", "intent_frame", "writing_help", "writing/help intent", 0.78);
    }

    if (/\b(remember|don't forget|dont forget|save this|from now on|going forward|note that)\b/.test(text)) {
      add("intent", "intent_frame", "memory_or_preference", "memory/preference intent", 0.86);
    }
  },

  detectDomainSignals(text = "", add) {
    if (/\b(cat|dog|pet|kitten|puppy|animal|vet)\b/.test(text)) {
      add("domain", "domain_signal", "animal_health_or_pet_context", "animal/pet domain", 0.9);
    }

    if (/\b(pain|fever|bleeding|pregnant|chest|breathing|faint|dizzy|vomit|diarrhea|swallow|cough|symptom)\b/.test(text)) {
      add("domain", "domain_signal", "human_or_body_health_context", "health/body domain", 0.84);
    }

    if (/\b(code|html|css|javascript|github|supabase|vercel|bug|error|function|file|engine|pipeline)\b/.test(text)) {
      add("domain", "domain_signal", "builder_or_system_context", "builder/system domain", 0.86);
    }

    if (/\b(coworker|boss|manager|leadership|team|job|work|promotion|career|report|policy)\b/.test(text)) {
      add("domain", "domain_signal", "work_or_accountability_context", "work/accountability domain", 0.84);
    }

    if (/\b(wife|husband|spouse|partner|girlfriend|boyfriend|family|friend|kids|children|trust|honest|deny|upset)\b/.test(text)) {
      add("domain", "domain_signal", "relationship_or_family_context", "relationship/family domain", 0.84);
    }

    if (/\b(money|budget|debt|rent|payment|income|afford|save|cost)\b/.test(text)) {
      add("domain", "domain_signal", "financial_context", "financial domain", 0.82);
    }
  },

  rebuildContextFromMessages(messages = []) {
    const context = this.emptyWorkingContext();

    for (const message of messages || []) {
      const turn = this.interpretTurn(message);
      this.applyTurnToContext(context, turn);
    }

    return context;
  },

  mergeWorkingContext({
    previousWorkingContext = {},
    reconstructedContext = {},
    currentTurn = {},
    currentText = "",
    topicTransition = {}
  }) {
    const merged = this.emptyWorkingContext();

    if (!topicTransition.switched) {
      this.copyContextInto(merged, previousWorkingContext);
    }

    this.copyContextInto(merged, reconstructedContext);
    this.applyTurnToContext(merged, currentTurn);

    merged.lastUserText = currentText;
    merged.updatedAt = new Date().toISOString();

    merged.activeSubject = this.chooseBest(
      merged.activeSubject,
      topicTransition.switched ? null : previousWorkingContext.activeSubject,
      reconstructedContext.activeSubject
    );

    merged.activeObject = this.chooseBest(
      merged.activeObject,
      topicTransition.switched ? null : previousWorkingContext.activeObject,
      reconstructedContext.activeObject
    );

    merged.activeIssue = this.chooseBest(
      merged.activeIssue,
      topicTransition.switched ? null : previousWorkingContext.activeIssue,
      reconstructedContext.activeIssue
    );

    merged.activeGoal = this.chooseBest(
      merged.activeGoal,
      topicTransition.switched ? null : previousWorkingContext.activeGoal,
      reconstructedContext.activeGoal
    );

    return merged;
  },

  copyContextInto(target = {}, source = {}) {
    if (!source || typeof source !== "object") return;

    target.activeSubject = this.chooseBest(target.activeSubject, source.activeSubject);
    target.activeObject = this.chooseBest(target.activeObject, source.activeObject);
    target.activeIssue = this.chooseBest(target.activeIssue, source.activeIssue);
    target.activeGoal = this.chooseBest(target.activeGoal, source.activeGoal);

    target.activeConstraints = this.mergeArrays(target.activeConstraints, source.activeConstraints);
    target.activeAttempts = this.mergeArrays(target.activeAttempts, source.activeAttempts);
    target.unresolvedItems = this.mergeArrays(target.unresolvedItems, source.unresolvedItems);
    target.domainSignals = this.mergeArrays(target.domainSignals, source.domainSignals);
    target.intentSignals = this.mergeArrays(target.intentSignals, source.intentSignals);
    target.timeline = this.mergeArrays(target.timeline, source.timeline).slice(-12);
  },

  applyTurnToContext(context = {}, turn = {}) {
    const signals = turn.signals || [];

    signals.forEach(signal => {
      if (signal.category === "subject") {
        context.activeSubject = this.makeNode(
          "subject",
          signal.value,
          this.labelForSubject(signal.value),
          signal.evidence,
          signal.confidence
        );
      }

      if (signal.category === "object") {
        context.activeObject = this.makeNode(
          "object",
          signal.value,
          this.labelForObject(signal.value),
          signal.evidence,
          signal.confidence
        );
      }

      if (signal.category === "issue") {
        context.activeIssue = this.makeNode(
          "issue",
          signal.value,
          this.labelForIssue(signal.value),
          signal.evidence,
          signal.confidence
        );
      }

      if (signal.category === "goal") {
        context.activeGoal = this.makeNode(
          "goal",
          signal.value,
          this.labelForGoal(signal.value),
          signal.evidence,
          signal.confidence
        );
      }

      if (signal.category === "constraint") {
        context.activeConstraints.push(
          this.makeNode("constraint", signal.value, this.labelForConstraint(signal.value), signal.evidence, signal.confidence)
        );
      }

      if (signal.category === "attempt") {
        context.activeAttempts.push(
          this.makeNode("attempt", signal.value, this.labelForAttempt(signal.value), signal.evidence, signal.confidence)
        );
      }

      if (signal.category === "domain") {
        context.domainSignals.push(signal);
      }

      if (signal.category === "intent") {
        context.intentSignals.push(signal);
      }
    });

    if (turn.clean) {
      context.timeline.push({
        text: turn.clean,
        createdAt: new Date().toISOString()
      });
    }
  },
    detectStateChange(turn = {}, workingContext = {}) {
    if (turn.hasExplicitReset) {
      return {
        type: "topic_reset_or_abandoned",
        confidence: 0.88
      };
    }

    if (this.hasSignal(turn, "attempt", "problem_persisted_or_response_failed")) {
      return {
        type: "prior_attempt_failed_or_issue_persisted",
        confidence: 0.84
      };
    }

    if (this.hasSignal(turn, "goal", "monitoring_guidance")) {
      return {
        type: "monitoring_requested",
        confidence: 0.82
      };
    }

    if (this.hasSignal(turn, "goal", "action_guidance")) {
      return {
        type: "next_step_requested",
        confidence: 0.82
      };
    }

    if (this.hasSignal(turn, "goal", "avoid_unwanted_outcome")) {
      return {
        type: "constraint_or_avoidance_added",
        confidence: 0.8
      };
    }

    if (turn.isShortFollowUp && workingContext.activeIssue) {
      return {
        type: "contextual_follow_up",
        confidence: 0.78
      };
    }

    return {
      type: "none",
      confidence: 0.4
    };
  },

  detectTopicTransition({
    previousWorkingContext = {},
    reconstructedContext = {},
    currentTurn = {}
  }) {
    if (currentTurn.hasExplicitReset) {
      return {
        switched: true,
        from: this.primaryDomain(previousWorkingContext),
        to: null,
        reason: "User explicitly reset or changed topic.",
        confidence: 0.88
      };
    }

    const previousDomain = this.primaryDomain(previousWorkingContext);
    const currentDomain = this.primaryDomain(reconstructedContext);

    if (
      previousDomain &&
      currentDomain &&
      previousDomain !== currentDomain &&
      !currentTurn.isShortFollowUp &&
      currentTurn.wordCount > 5
    ) {
      return {
        switched: true,
        from: previousDomain,
        to: currentDomain,
        reason: "Current turn introduced a different dominant domain.",
        confidence: 0.78
      };
    }

    return {
      switched: false,
      from: previousDomain || null,
      to: currentDomain || previousDomain || null,
      reason: "No clear topic switch detected.",
      confidence: 0.65
    };
  },

  updateUnresolvedItems(context = {}, turn = {}, stateChange = {}) {
    if (!Array.isArray(context.unresolvedItems)) {
      context.unresolvedItems = [];
    }

    if (!context.activeIssue) return;

    const existing = context.unresolvedItems.find(
      item => item.kind === context.activeIssue.kind
    );

    const status =
      stateChange.type === "topic_reset_or_abandoned"
        ? "abandoned"
        : "active";

    if (existing) {
      existing.status = status;
      existing.lastMention = turn.clean || existing.lastMention;
      existing.updatedAt = new Date().toISOString();
      existing.confidence = Math.max(
        existing.confidence || 0,
        context.activeIssue.confidence || 0
      );
    } else {
      context.unresolvedItems.push({
        ...context.activeIssue,
        status,
        lastMention: turn.clean || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    context.unresolvedItems = context.unresolvedItems.slice(-8);
  },

  resolveMeaning({
    currentText = "",
    currentTurn = {},
    workingContext = {},
    stateChange = {}
  }) {
    const intent = this.resolveIntent(currentTurn, workingContext, stateChange);
    const isContextual = this.isContextualTurn(currentTurn, workingContext, stateChange);

    const resolvedText = this.composeResolvedText({
      currentText,
      intent,
      isContextual,
      workingContext,
      stateChange
    });

    return {
      isContextual,
      intent,
      resolvedText,

      resolvedSubject: workingContext.activeSubject,
      resolvedObject: workingContext.activeObject,
      resolvedIssue: workingContext.activeIssue,
      resolvedGoal: workingContext.activeGoal,
      resolvedConstraints: workingContext.activeConstraints || [],
      resolvedAttempts: workingContext.activeAttempts || [],

      stateChange,

      confidence: this.meaningConfidence({
        isContextual,
        intent,
        workingContext,
        stateChange
      }),

      authority: "advisory_context_only"
    };
  },

  resolveIntent(turn = {}, workingContext = {}, stateChange = {}) {
    if (this.hasSignal(turn, "intent", "implementation_help")) {
      return "implementation_help";
    }

    if (this.hasSignal(turn, "intent", "writing_help")) {
      return "writing_help";
    }

    if (this.hasSignal(turn, "intent", "memory_or_preference")) {
      return "memory_or_preference";
    }

    if (stateChange.type === "prior_attempt_failed_or_issue_persisted") {
      return "alternative_strategy";
    }

    if (this.hasSignal(turn, "intent", "monitoring_or_risk_check")) {
      return "monitoring_or_risk_check";
    }

    if (this.hasSignal(turn, "intent", "action_guidance")) {
      return "action_guidance";
    }

    if (this.hasSignal(turn, "intent", "explanation_or_possibility")) {
      return "explanation_or_possibility";
    }

    if (turn.isQuestion) {
      return "question_or_follow_up";
    }

    return "respond_normally";
  },

  isContextualTurn(turn = {}, workingContext = {}, stateChange = {}) {
    return Boolean(
      turn.isShortFollowUp ||
      turn.hasContinuationCue ||
      stateChange.type !== "none" ||
      workingContext.activeIssue ||
      workingContext.activeSubject ||
      workingContext.activeObject
    );
  },

  composeResolvedText({
    currentText = "",
    intent = "respond_normally",
    isContextual = false,
    workingContext = {},
    stateChange = {}
  }) {
    if (!isContextual) return currentText;

    const subject = workingContext.activeSubject?.label || "the active subject";
    const object = workingContext.activeObject?.label || "the active object";
    const issue = workingContext.activeIssue?.label || "the active issue";
    const goal = workingContext.activeGoal?.label || "the active goal";

    return [
      currentText,
      `Context: subject=${subject}; object=${object}; issue=${issue}; goal=${goal}; intent=${intent}; state=${stateChange?.type || "none"}.`
    ].join(" ");
  },
    toImpliedQuestion(resolvedMeaning = {}) {
    return {
      type: resolvedMeaning.intent || "respond_normally",
      resolvedText: resolvedMeaning.resolvedText || null,
      confidence: resolvedMeaning.confidence ?? null,
      authority: "advisory_context_only"
    };
  },

  primaryDomain(context = {}) {
    const signals = Array.isArray(context.domainSignals)
      ? context.domainSignals
      : [];

    if (!signals.length) return null;

    const sorted = [...signals].sort(
      (a, b) => (b.confidence || 0) - (a.confidence || 0)
    );

    return sorted[0]?.value || null;
  },

  hasSignal(turn = {}, category = "", value = "") {
    return (turn.signals || []).some(
      signal =>
        signal.category === category &&
        signal.value === value
    );
  },

  makeNode(type, kind, label, evidence, confidence = 0.6) {
    return {
      type,
      kind,
      label,
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

  mergeArrays(a = [], b = []) {
    const combined = [
      ...(Array.isArray(a) ? a : []),
      ...(Array.isArray(b) ? b : [])
    ];

    const seen = new Set();

    return combined.filter(item => {
      const key = JSON.stringify({
        category: item?.category,
        type: item?.type,
        kind: item?.kind,
        value: item?.value,
        label: item?.label,
        evidence: item?.evidence,
        status: item?.status
      });

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  labelForSubject(kind = "") {
    const labels = {
      self: "the user",
      group_self: "the user and their group",
      other_or_group: "the other person or group",
      close_person_or_family: "the close person or family member",
      animal_or_pet: "the animal or pet",
      social_or_work_person: "the social or work person"
    };

    return labels[kind] || "the active subject";
  },

  labelForObject(kind = "") {
    const labels = {
      system_or_code: "the system, file, code, or app",
      body_or_body_function: "the body or body function",
      physical_object_or_device: "the physical object or device",
      decision_or_plan: "the decision or plan"
    };

    return labels[kind] || "the active object";
  },

  labelForIssue(kind = "") {
    const labels = {
      health_or_body_issue: "a health or body issue",
      technical_or_system_issue: "a technical or system issue",
      relationship_or_trust_issue: "a relationship or trust issue",
      pressure_or_constraint_issue: "a pressure or constraint issue",
      accountability_or_work_quality_issue: "an accountability or work-quality issue"
    };

    return labels[kind] || "the active issue";
  },

  labelForGoal(kind = "") {
    const labels = {
      action_guidance: "choose the next action",
      monitoring_guidance: "know what to watch for",
      understanding_or_explanation: "understand what may be happening",
      avoid_unwanted_outcome: "avoid an unwanted outcome"
    };

    return labels[kind] || "the active goal";
  },

  labelForConstraint(kind = "") {
    const labels = {
      limited_time_or_pressure: "limited time, pressure, or urgency",
      financial_constraint: "financial constraint",
      social_or_consequence_risk: "social or consequence risk"
    };

    return labels[kind] || "the active constraint";
  },

  labelForAttempt(kind = "") {
    const labels = {
      prior_action_taken: "a prior action was taken",
      problem_persisted_or_response_failed: "the issue persisted or the response failed"
    };

    return labels[kind] || "the active attempt";
  },

  scoreConfidence({
    recentMessages = [],
    workingContext = {},
    resolvedMeaning = {},
    stateChange = {},
    topicTransition = {}
  }) {
    let score = 35;

    if (recentMessages.length >= 2) score += 12;
    if (workingContext.activeSubject) score += 12;
    if (workingContext.activeObject) score += 10;
    if (workingContext.activeIssue) score += 14;
    if (workingContext.activeGoal) score += 8;
    if ((workingContext.activeConstraints || []).length) score += 6;
    if ((workingContext.activeAttempts || []).length) score += 6;
    if (resolvedMeaning.isContextual) score += 8;
    if (resolvedMeaning.intent !== "respond_normally") score += 8;
    if (stateChange.type && stateChange.type !== "none") score += 4;
    if (topicTransition.switched) score -= 10;

    return Math.max(25, Math.min(95, score));
  },

  meaningConfidence({
    isContextual = false,
    intent = "respond_normally",
    workingContext = {},
    stateChange = {}
  }) {
    let score = 40;

    if (isContextual) score += 12;
    if (workingContext.activeSubject) score += 10;
    if (workingContext.activeObject) score += 10;
    if (workingContext.activeIssue) score += 12;
    if (workingContext.activeGoal) score += 8;
    if ((workingContext.activeConstraints || []).length) score += 6;
    if ((workingContext.activeAttempts || []).length) score += 6;
    if (intent && intent !== "respond_normally") score += 8;
    if (stateChange?.type && stateChange.type !== "none") score += 4;

    return Math.max(25, Math.min(95, score));
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