// ari/observer-system/ari-dual-salience-system.js
// Ari Dual Salience System
// Purpose: Compare objective importance with subjective human salience.
// V1.0

window.AriDualSalienceSystem = {
  version: "1.0.0",

  analyze(input = {}) {
    const text = String(input.text || input.message || "").toLowerCase();

    const objective = this.scoreObjective(text, input);
    const subjective = this.scoreSubjective(text, input);
    const gaps = this.detectGaps(objective, subjective);
    const priority = this.choosePriority(objective, subjective, gaps);
    const clarity = this.assessClarity(objective, subjective, priority);

    return {
      system: "ari-dual-salience-system",
      version: this.version,
      objective,
      subjective,
      gaps,
      priority,
      clarity,
      recommendedMove: this.recommendMove(priority, clarity)
    };
  },

  scoreObjective(text, input) {
    return {
      safety: this.scoreByTerms(text, [
        "suicide", "kill myself", "hurt myself", "hurt someone",
        "unsafe", "danger", "abuse", "overdose", "bleeding heavily",
        "can't breathe", "chest pain"
      ], 100, 20),

      physical_health: this.scoreByTerms(text, [
        "pain", "bleeding", "pregnant", "fever", "vomiting",
        "diarrhea", "dehydrated", "dizzy", "not eating",
        "shortness of breath", "chest pain", "sick", "injury"
      ], 90, 35),

      mental_health: this.scoreByTerms(text, [
        "anxious", "panic", "depressed", "hopeless", "overwhelmed",
        "crying", "lonely", "stressed", "spiraling", "burned out"
      ], 88, 35),

      nutrition: this.scoreByTerms(text, [
        "hungry", "food", "eat", "meal", "calories", "not eating",
        "diet", "weight", "protein", "drink water"
      ], 80, 30),

      sleep: this.scoreByTerms(text, [
        "tired", "sleep", "insomnia", "exhausted", "rest",
        "can't sleep", "no sleep"
      ], 80, 30),

      relationship: this.scoreByTerms(text, [
        "wife", "girlfriend", "fiance", "fiancée", "partner",
        "family", "argument", "fight", "alone", "connection",
        "baby", "father", "mother"
      ], 75, 30),

      purpose: this.scoreByTerms(text, [
        "meaning", "purpose", "father", "future", "career",
        "identity", "life", "what should i do", "lost"
      ], 75, 30)
    };
  },

  scoreSubjective(text, input) {
    return {
      fear: this.scoreByTerms(text, [
        "scared", "afraid", "fear", "worried", "terrified"
      ], 95, 20),

      anxiety: this.scoreByTerms(text, [
        "anxious", "panic", "overthinking", "spiraling",
        "can't stop thinking", "worried"
      ], 95, 20),

      shame: this.scoreByTerms(text, [
        "ashamed", "embarrassed", "failure", "guilty",
        "i messed up", "my fault"
      ], 85, 15),

      anger: this.scoreByTerms(text, [
        "mad", "angry", "pissed", "furious", "annoyed"
      ], 85, 15),

      sadness: this.scoreByTerms(text, [
        "sad", "lonely", "hurt", "crying", "heartbroken"
      ], 85, 15),

      relationship_focus: this.scoreByTerms(text, [
        "wife", "girlfriend", "fiance", "fiancée", "partner",
        "argument", "fight", "family", "baby"
      ], 90, 20),

      body_focus: this.scoreByTerms(text, [
        "pain", "sick", "hungry", "tired", "bleeding",
        "pregnant", "dizzy", "nauseous"
      ], 85, 20),

      goal_focus: this.scoreByTerms(text, [
        "goal", "weight", "career", "app", "money",
        "future", "calbuddy", "ari", "roadmap"
      ], 80, 20)
    };
  },

  detectGaps(objective, subjective) {
    const gaps = [];

    if (objective.physical_health >= 85 && subjective.body_focus < 50) {
      gaps.push({
        type: "objective_high_subjective_low",
        domain: "physical_health",
        message: "Physical health matters, but the person may not be focused on it yet."
      });
    }

    if (objective.nutrition >= 75 && subjective.body_focus < 50) {
      gaps.push({
        type: "objective_high_subjective_low",
        domain: "nutrition",
        message: "Nutrition matters, but the person may not be emotionally available for food advice yet."
      });
    }

    if (objective.sleep >= 75 && subjective.anxiety >= 85) {
      gaps.push({
        type: "subjective_blocks_objective",
        domain: "sleep_anxiety",
        message: "Anxiety may be blocking the person from engaging with rest."
      });
    }

    if (objective.physical_health >= 75 && subjective.anxiety >= 85) {
      gaps.push({
        type: "subjective_blocks_objective",
        domain: "anxiety_physical_health",
        message: "Anxiety may need calming before practical health advice lands."
      });
    }

    return gaps;
  },

  choosePriority(objective, subjective, gaps) {
    const topObjective = this.topScore(objective);
    const topSubjective = this.topScore(subjective);

    if (objective.safety >= 90) {
      return {
        lead: "safety",
        mode: "urgent_support",
        objectiveLead: "safety",
        subjectiveLead: topSubjective.key,
        reason: "Safety overrides all other priorities."
      };
    }

    if (topObjective.score >= 85 && topSubjective.score >= 85) {
      return {
        lead: "integrated",
        mode: "validate_then_act",
        objectiveLead: topObjective.key,
        subjectiveLead: topSubjective.key,
        reason: "Objective importance and human salience are both high."
      };
    }

    if (topObjective.score >= 85 && topSubjective.score < 60) {
      return {
        lead: "bridge",
        mode: "acknowledge_gap_then_gently_redirect",
        objectiveLead: topObjective.key,
        subjectiveLead: topSubjective.key,
        reason: "Objective need is high, but the person’s attention is elsewhere."
      };
    }

    if (topSubjective.score >= 85) {
      return {
        lead: "subjective_salience",
        mode: "follow_user_attention_first",
        objectiveLead: topObjective.key,
        subjectiveLead: topSubjective.key,
        reason: "The person’s emotional focus is the doorway."
      };
    }

    return {
      lead: "balanced",
      mode: "ask_clarifying_question",
      objectiveLead: topObjective.key,
      subjectiveLead: topSubjective.key,
      reason: "No signal is strong enough to act without clarification."
    };
  },

  assessClarity(objective, subjective, priority) {
    const topObjective = this.topScore(objective);
    const topSubjective = this.topScore(subjective);
    const distance = Math.abs(topObjective.score - topSubjective.score);

    if (priority.lead === "safety") {
      return {
        confidence: 1.0,
        action: "act_now"
      };
    }

    if (topObjective.score >= 85 || topSubjective.score >= 85) {
      return {
        confidence: 0.82,
        action: "respond_then_optionally_verify"
      };
    }

    if (distance < 15) {
      return {
        confidence: 0.58,
        action: "ask_one_clarifying_question"
      };
    }

    return {
      confidence: 0.68,
      action: "respond_with_gentle_assumption"
    };
  },

  recommendMove(priority, clarity) {
    if (priority.mode === "urgent_support") {
      return "Prioritize safety, stabilization, and urgent support.";
    }

    if (priority.mode === "validate_then_act") {
      return "Name what the person feels, then give one concrete next step.";
    }

    if (priority.mode === "acknowledge_gap_then_gently_redirect") {
      return "Acknowledge what feels loud, then bridge toward the objective need.";
    }

    if (priority.mode === "follow_user_attention_first") {
      return "Start with the person’s emotional focus before practical advice.";
    }

    if (clarity.action === "ask_one_clarifying_question") {
      return "Ask one focused question before advising.";
    }

    return "Give a balanced response with one gentle next step.";
  },

  scoreByTerms(text, terms, hitScore, missScore) {
    return terms.some(term => text.includes(term)) ? hitScore : missScore;
  },

  topScore(obj) {
    return Object.entries(obj)
      .map(([key, score]) => ({ key, score }))
      .sort((a, b) => b.score - a.score)[0];
  }
};