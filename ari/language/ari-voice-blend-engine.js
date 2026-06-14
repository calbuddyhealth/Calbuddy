// ari/language/ari-voice-blend-engine.js
// Ari Voice Blend Engine
// Purpose: Choose Ari's voice blend based on Situation Contract first, then legacy signals.
// V2.0
// Rule:
// - Voice Blend may choose tone/personality.
// - Voice Blend may NOT change the primary lane.
// - Situation Contract outranks life chapter, identity, emotion, and legacy lead organ.

window.AriVoiceBlendEngine = {
  version: "2.0.0",

  blend(summary = {}) {
    const contractPrimary =
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      null;

    const responseShape =
      summary.responseShape ||
      summary.situationContract?.responseShape ||
      null;

    const safetyRiskLevel =
      summary.safetyRiskLevel ||
      summary.safetyContextGate?.riskLevel ||
      summary.riskLevel ||
      "none";

    const clarityNeeded =
      summary.safetyFollowUpNeeded === true ||
      summary.situationContract?.clarity?.needed === true ||
      summary.situationContract?.primary === "risk_clarification";

    const lead =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      "observer";

    const identity =
      summary.resolvedLeadIdentity ||
      summary.leadIdentity ||
      null;

    const chapter = summary.primaryLifeChapter || null;
    const emotion = summary.emotionalClassification || null;
    const priority = summary.primaryPriority || null;
    const need = summary.primaryHumanNeed || null;

    let blend = "observer_wonder";
    let tone = "curious, grounded, and careful";
    let posture = "observe before interpreting";

    // ==================================================
    // 1. SITUATION CONTRACT FIRST
    // ==================================================

    if (contractPrimary === "risk_clarification" || clarityNeeded) {
      blend = "observer_guardian";
      tone = "calm, careful, non-assumptive, and direct";
      posture = "clarify risk before escalating or interpreting";
    } else if (contractPrimary === "safety") {
      blend = "guardian";
      tone = "calm, direct, stabilizing, and protective";
      posture = "protect immediate safety first";
    } else if (contractPrimary === "medical_body") {
      blend = "clinical_guardian";
      tone = "clear, calm, body-focused, and practical";
      posture = "stabilize the body before deeper interpretation";
    } else if (contractPrimary === "executive_decision") {
      blend = "steward";
      tone = "clear, grounded, prioritizing, and honest";
      posture = "help choose the next right step";
    } else if (contractPrimary === "builder") {
      blend = "builder_coach";
      tone = "focused, practical, direct, and implementation-ready";
      posture = "fix the bottleneck without overcomplicating";
    } else if (contractPrimary === "teacher") {
      blend = "teacher_companion";
      tone = "clear, patient, structured, and understandable";
      posture = "answer the question before philosophizing";
    } else if (contractPrimary === "emotion") {
      blend = "companion";
      tone = "warm, emotionally precise, steady, and gentle";
      posture = "attune before advising";
    } else if (contractPrimary === "family") {
      blend = "family_steward";
      tone = "protective, warm, honest, and stabilizing";
      posture = "protect family presence without ignoring stability";
    } else if (contractPrimary === "relationship") {
      blend = "companion_steward";
      tone = "relational, warm, honest, and careful";
      posture = "restore connection without losing truth";
    } else if (contractPrimary === "wisdom") {
      blend = "sage_companion";
      tone = "wise, calm, direct, and humane";
      posture = "name the ordering principle";
    } else if (contractPrimary === "memory") {
      blend = "continuity_keeper";
      tone = "simple, respectful, and precise";
      posture = "preserve what should carry forward";
    } else if (contractPrimary === "general_understanding") {
      blend = "steady_companion";
      tone = "clear, grounded, and curious";
      posture = "understand before interpreting";
    }

    // ==================================================
    // 2. RESPONSE SHAPE MODIFIER
    // ==================================================

    if (responseShape === "multi_question_triage") {
      blend = this.combineBlend(blend, "triage_steward");
      tone = this.addTone(tone, "organized");
      posture = "prioritize primary/support/brief/context/deferred lanes";
    }

    if (responseShape === "body_truth_then_action") {
      blend = "clinical_guardian";
      tone = "clear, calm, body-focused, and action-oriented";
      posture = "state body truth, then give the next step";
    }

    if (responseShape === "comfort_then_truth") {
      blend = this.combineBlend(blend, "companion_truth");
      tone = this.addTone(tone, "warm but honest");
      posture = "comfort first, then tell the truth";
    }

    if (responseShape === "teach_clearly") {
      blend = "teacher_companion";
      tone = "clear, structured, and patient";
      posture = "teach clearly without drifting";
    }

    // ==================================================
    // 3. SAFETY RISK MODIFIER
    // ==================================================

    if (safetyRiskLevel === "critical") {
      blend = "guardian";
      tone = "calm, direct, immediate, and protective";
      posture = "protect safety before anything else";
    } else if (safetyRiskLevel === "high" && contractPrimary !== "medical_body") {
      blend = this.combineBlend(blend, "guardian");
      tone = this.addTone(tone, "safety-aware");
      posture = "keep safety visible while following the contract";
    }

    // ==================================================
    // 4. LEGACY FALLBACK ONLY IF NO CONTRACT EXISTS
    // ==================================================

    if (!contractPrimary) {
      if (chapter === "fatherhood_transition" || identity === "father") {
        blend = "guardian_companion_wonder";
        tone = "steady, protective, warm, and honest";
        posture = "protect presence and future family";
      } else if (priority === "family" || identity === "family-protector") {
        blend = "guardian_companion";
        tone = "protective, relational, and clear";
        posture = "put family before acceleration";
      } else if (identity === "builder") {
        blend = "builder_coach_wonder";
        tone = "focused, encouraging, strategic, and imaginative";
        posture = "keep purpose alive without overextending";
      } else if (lead === "uncertainty") {
        blend = "observer_wonder";
        tone = "humble, curious, and non-forcing";
        posture = "ask before assuming";
      } else if (emotion === "stewardship") {
        blend = "guardian_wisdom";
        tone = "respectful, steady, and responsibility-aware";
        posture = "treat responsibility as care, not fear";
      } else if (lead === "wisdom") {
        blend = "sage_companion";
        tone = "wise, calm, and direct";
        posture = "name the ordering principle";
      } else if (lead === "emotion") {
        blend = "companion_wonder";
        tone = "warm, emotionally precise, and gentle";
        posture = "name the feeling without forcing it";
      }
    }

    // ==================================================
    // 5. HUMAN NEED SOFT MODIFIER
    // ==================================================
    // This can soften tone, but cannot override contract primary.

    if (need === "connection" && !tone.includes("warm")) {
      tone = this.addTone(tone, "warm");
    }

    if (need === "clarity" && !tone.includes("clear")) {
      tone = this.addTone(tone, "clear");
    }

    if (need === "body" && contractPrimary !== "medical_body") {
      tone = this.addTone(tone, "body-aware");
    }

    return {
      voiceBlendEngineRan: true,
      voiceBlendEngineVersion: this.version,

      voiceBlend: blend,
      voiceTone: tone,
      voicePosture: posture,

      contractPrimary,
      responseShape,
      safetyRiskLevel,
      primaryHumanNeed: need,

      voiceBlendRules: [
        "Situation Contract chooses the lane.",
        "Voice Blend chooses tone/personality only.",
        "Voice Blend must not override primary/support/brief/context/deferred structure.",
        "Life chapter and identity are fallback signals only when no Situation Contract exists."
      ],

      source: "ari-voice-blend-engine"
    };
  },

  combineBlend(current = "", addition = "") {
    if (!addition) return current;
    if (!current) return addition;
    if (current.includes(addition)) return current;
    return `${current}_${addition}`;
  },

  addTone(current = "", addition = "") {
    if (!addition) return current;
    if (!current) return addition;
    if (current.includes(addition)) return current;
    return `${current}, ${addition}`;
  }
};