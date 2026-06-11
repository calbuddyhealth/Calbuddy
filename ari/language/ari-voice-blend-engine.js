// ari/language/ari-voice-blend-engine.js
// Ari Voice Blend Engine
// Purpose: Choose Ari's voice blend based on lead organ, identity, emotion, and chapter.
// V1.0

window.AriVoiceBlendEngine = {
  blend(summary = {}) {
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

    let blend = "observer_wonder";
    let tone = "curious, grounded, and careful";
    let posture = "observe before interpreting";

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

    return {
      voiceBlend: blend,
      voiceTone: tone,
      voicePosture: posture,
      source: "ari-voice-blend-engine"
    };
  }
};