// ari/context/ari-thread-understanding-engine.js
// Ari Thread Understanding Engine
// Purpose: Convert recent conversation context into structured working meaning.
// V1.0.0

window.Ari = window.Ari || {};

window.AriThreadUnderstandingEngine = {
  version: "1.0.0",

  understand(input = {}) {
    const summary = input.summary || input || {};
    const currentText = this.clean(
      summary.userMessage || summary.message || summary.input || ""
    );

    const facts = Array.isArray(summary.activeThreadFacts)
      ? summary.activeThreadFacts
      : [];

    const recentMessages = facts
      .filter(f => f?.type === "recent_message" && f.claim)
      .map(f => this.clean(f.claim))
      .filter(Boolean);

    const priorMessages = recentMessages
      .filter(msg => this.clean(msg) !== this.clean(currentText))
      .slice(-6);

    const currentIsFollowUp =
      summary.followUpDetected === true ||
      summary.continuityState?.followUpDetected === true ||
      this.isShortContextQuestion(currentText);

    const activeSubject = this.resolveActiveSubject(priorMessages, currentText);
    const activeIssue = this.resolveActiveIssue(priorMessages, currentText, activeSubject);
    const impliedQuestion = this.resolveImpliedQuestion(
      currentText,
      activeSubject,
      activeIssue,
      currentIsFollowUp
    );

    const domain = this.resolveDomain(activeSubject, activeIssue, summary);
    const laneHint = this.resolveLaneHint(domain, impliedQuestion, summary);

    const threadUnderstanding = {
      threadUnderstandingRan: true,
      threadUnderstandingVersion: this.version,
      threadUnderstandingSource: "ari-thread-understanding-engine",

      continuityUsed: currentIsFollowUp && Boolean(priorMessages.length),
      currentText,
      priorMessages,

      activeSubject,
      activeIssue,
      impliedQuestion,

      domain,
      laneHint,

      confidence: this.scoreConfidence({
        currentIsFollowUp,
        priorMessages,
        activeSubject,
        activeIssue,
        impliedQuestion
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

    return {
      threadUnderstandingRan: true,
      threadUnderstandingVersion: this.version,
      threadUnderstandingSource: "ari-thread-understanding-engine",
      threadUnderstanding,

      threadDomain: domain,
      threadLaneHint: laneHint,
      threadActiveSubject: activeSubject,
      threadActiveIssue: activeIssue,
      threadImpliedQuestion: impliedQuestion
    };
  },

  isShortContextQuestion(text = "") {
    const wordCount = this.clean(text).split(/\s+/).filter(Boolean).length;
    const asksFollowUp =
      text.includes("?") ||
      /^(what|why|how|when|where|should|can|do|does|is|are|will|would)\b/i.test(text);

    return asksFollowUp && wordCount <= 10;
  },

  resolveActiveSubject(priorMessages = [], currentText = "") {
    const combined = this.clean([...priorMessages, currentText].join(" "));

    const subjectPatterns = [
      { type: "pet", label: "the pet being discussed", evidence: /\b(my\s+)?(cat|dog|pet|kitten|puppy)\b/ },
      { type: "family_member", label: "the family member being discussed", evidence: /\b(my\s+)?(father|dad|mother|mom|brother|sister|child|baby|fiancee|fiancée|wife|husband)\b/ },
      { type: "project", label: "the project or code being discussed", evidence: /\b(file|code|html|pipeline|engine|ari|rebirth|supabase|github)\b/ },
      { type: "vehicle", label: "the vehicle being discussed", evidence: /\b(car|civic|vehicle|suv|honda|paint|miles)\b/ },
      { type: "self", label: "the user", evidence: /\b(i|me|my|myself)\b/ }
    ];

    for (const pattern of subjectPatterns) {
      const match = combined.match(pattern.evidence);
      if (match) {
        return {
          type: pattern.type,
          label: pattern.label,
          evidence: match[0],
          confidence: 0.82
        };
      }
    }

    return {
      type: "unknown",
      label: null,
      evidence: null,
      confidence: 0.2
    };
  },

  resolveActiveIssue(priorMessages = [], currentText = "", subject = {}) {
    const combined = this.clean([...priorMessages, currentText].join(" "));

    const issuePatterns = [
      { type: "health_symptom", label: "a health symptom", evidence: /\b(diarrhea|vomit|vomiting|pain|cough|swallow|itch|bleeding|fever|breathing|dizzy|faint|sick)\b/ },
      { type: "code_placement", label: "where code should be placed", evidence: /\b(where.*place|where.*put|html|pipeline|file|code|script)\b/ },
      { type: "implementation_step", label: "the next implementation step", evidence: /\b(next|done|send code|build|create|update|replace)\b/ },
      { type: "decision_or_risk", label: "something to watch or decide", evidence: /\b(watch|worried|concerned|risk|should|decision)\b/ },
      { type: "value_or_meaning", label: "a values or meaning question", evidence: /\b(worth|meaning|belief|god|faith|wisdom|right thing)\b/ }
    ];

    for (const pattern of issuePatterns) {
      const match = combined.match(pattern.evidence);
      if (match) {
        return {
          type: pattern.type,
          label: pattern.label,
          evidence: match[0],
          subjectType: subject.type || "unknown",
          confidence: 0.82
        };
      }
    }

    return {
      type: "unknown",
      label: null,
      evidence: null,
      subjectType: subject.type || "unknown",
      confidence: 0.2
    };
  },

  resolveImpliedQuestion(currentText = "", subject = {}, issue = {}, isFollowUp = false) {
    const cleanCurrent = this.clean(currentText);

    if (!isFollowUp) {
      return {
        type: "direct",
        resolvedText: currentText,
        confidence: 0.55
      };
    }

    const subjectLabel = subject.label || "the prior subject";
    const issueLabel = issue.label || "the prior issue";

    if (this.hasAny(cleanCurrent, ["watch", "watch out", "look for"])) {
      return {
        type: "monitoring_guidance",
        resolvedText: `What should the user watch for regarding ${issueLabel} in ${subjectLabel}?`,
        confidence: 0.88
      };
    }

    if (this.hasAny(cleanCurrent, ["should i", "should he", "should she", "worried", "concerned"])) {
      return {
        type: "risk_or_decision_guidance",
        resolvedText: `Should the user be concerned about ${issueLabel} in ${subjectLabel}?`,
        confidence: 0.84
      };
    }

    if (this.hasAny(cleanCurrent, ["where", "place", "put", "goes"])) {
      return {
        type: "placement_guidance",
        resolvedText: `Where should this go in the current project context?`,
        confidence: 0.84
      };
    }

    return {
      type: "contextual_follow_up",
      resolvedText: `${currentText} Context: ${subjectLabel}, ${issueLabel}.`,
      confidence: 0.72
    };
  },

  resolveDomain(subject = {}, issue = {}, summary = {}) {
    if (subject.type === "pet" && issue.type === "health_symptom") {
      return "animal_health_context";
    }

    if (
      subject.type === "family_member" &&
      issue.type === "health_symptom"
    ) {
      return "human_health_context";
    }

    if (
      subject.type === "self" &&
      issue.type === "health_symptom"
    ) {
      return "human_health_context";
    }

    if (subject.type === "project" || issue.type === "code_placement" || issue.type === "implementation_step") {
      return "builder_context";
    }

    if (subject.type === "vehicle") {
      return "vehicle_context";
    }

    if (issue.type === "value_or_meaning") {
      return "meaning_context";
    }

    if (summary.conversationType === "decision_question") {
      return "decision_context";
    }

    return "general_context";
  },

  resolveLaneHint(domain = "", impliedQuestion = {}, summary = {}) {
    if (domain === "animal_health_context") return "medical_context";
    if (domain === "human_health_context") return "medical_context";
    if (domain === "builder_context") return "builder";
    if (domain === "meaning_context") return "general_understanding";

    if (impliedQuestion.type === "monitoring_guidance") return "medical_context";
    if (impliedQuestion.type === "placement_guidance") return "builder";

    return summary.primaryLaneSuggestion || "general_understanding";
  },

  scoreConfidence(data = {}) {
    let score = 35;

    if (data.currentIsFollowUp) score += 20;
    if (data.priorMessages?.length) score += 20;
    if (data.activeSubject?.confidence >= 0.8) score += 15;
    if (data.activeIssue?.confidence >= 0.8) score += 15;
    if (data.impliedQuestion?.confidence >= 0.8) score += 10;

    return Math.min(95, score);
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(String(term).toLowerCase()));
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