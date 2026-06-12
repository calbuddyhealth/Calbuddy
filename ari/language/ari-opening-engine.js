// ari/language/ari-opening-engine.js
// Ari Opening Engine
// Purpose: Generate the first emotional contact.
// V2.1
// Fixes:
// - Separates body stabilization openings from true safety override openings.
// - Makes body-first responses warmer and less alarming.

window.AriOpeningEngine = {
  version: "2.1.0",

  create(summary = {}) {
    const opening = this.generate(summary);

    if (!opening) return null;

    return {
      opening,
      source: "ari-opening-engine"
    };
  },

  generate(summary = {}) {
    const lead =
      summary.synthesisLeadOrgan ||
      summary.salienceLeadOrgan ||
      null;

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      summary.needResponseMode ||
      null;

    const intent = summary.responseIntent || null;

    const pattern =
      summary.mouthResponsePattern ||
      summary.responseShape ||
      null;

    const need = summary.primaryHumanNeed || null;
    const chapter = summary.primaryLifeChapter || null;
    const wisdomTension = summary.wisdomTension || null;

    // ===================================
    // BODY STABILIZATION
    // ===================================
    // Body-first is not always a safety override.
    // It should sound warm, practical, and non-alarming.
    if (
      mode === "stabilize_body_first" ||
      intent === "stabilize_organism_function" ||
      need === "body"
    ) {
      return this.pick([
        "Your body is the priority right now.",
        "Your body may need some attention before anything else.",
        "Before we interpret this, let's make sure your body is okay."
      ]);
    }

    // ===================================
    // DIGNITY / WORTH
    // ===================================
    if (
      mode === "restore_dignity" ||
      intent === "protect_dignity" ||
      need === "worth"
    ) {
      return this.pick([
        "That sounds disrespectful and frustrating.",
        "Being treated that way can wear on a person's dignity.",
        "It sounds like this landed as more than irritation. It landed as disrespect.",
        "When respect feels absent, it often hurts more than people admit.",
        "Something about this seems to have struck at your sense of worth."
      ]);
    }

    // ===================================
    // CONNECTION
    // ===================================
    if (
      mode === "emotional_connection" ||
      intent === "offer_connection" ||
      need === "connection"
    ) {
      return this.pick([
        "That sounds lonely.",
        "Something about this feels emotionally isolating.",
        "It sounds like part of you wanted connection and did not find it.",
        "Being unseen can hurt more than people realize.",
        "This sounds less like a problem to solve and more like a need to feel understood."
      ]);
    }

    // ===================================
    // TRUE SAFETY OVERRIDE
    // ===================================
    if (
      mode === "safety_override" ||
      intent === "protect_safety" ||
      lead === "safety"
    ) {
      return this.pick([
        "Safety comes first here.",
        "Before anything else, let's make sure you're safe.",
        "This may be a situation where protection matters more than interpretation.",
        "The first priority here is safety.",
        "Everything else can wait if safety is at risk."
      ]);
    }

    // ===================================
    // UNCERTAINTY
    // ===================================
    if (
      lead === "uncertainty" ||
      intent === "clarify_before_interpreting" ||
      pattern === "brief_reflect_then_question"
    ) {
      return this.pick([
        "I do not want to guess too fast here.",
        "There may be something important missing from the picture.",
        "I want to understand this more clearly before naming it.",
        "Something here feels incomplete.",
        "There is not enough signal yet to draw a confident conclusion."
      ]);
    }

    // ===================================
    // LIFE CHAPTERS
    // ===================================
    if (chapter === "fatherhood_transition") {
      return this.pick([
        "Something important is changing.",
        "This chapter seems to be reshaping what matters most.",
        "Fatherhood has a way of reorganizing priorities.",
        "Life may be asking something different from you now.",
        "This feels connected to a larger transition already underway."
      ]);
    }

    if (chapter === "family_transition") {
      return this.pick([
        "This feels bigger than a simple decision.",
        "Something important appears to be shifting inside your family life.",
        "There is more at stake here than the surface decision.",
        "Family transitions often carry more weight than they first appear.",
        "This feels connected to a larger change."
      ]);
    }

    // ===================================
    // IDENTITY
    // ===================================
    if (lead === "identity") {
      return this.pick([
        "This may be about who is trying to lead inside you right now.",
        "Part of this may be an identity question.",
        "This feels connected to who you believe you need to be.",
        "The deeper issue may not be the situation itself.",
        "Something about identity seems active here."
      ]);
    }

    // ===================================
    // MEANING
    // ===================================
    if (lead === "meaning") {
      return this.pick([
        "Something important about this season is trying to reveal itself.",
        "This feels connected to something larger than the immediate problem.",
        "There may be more underneath this than first appears.",
        "This feels like a moment that asks for reflection before action.",
        "Something meaningful may be trying to get your attention."
      ]);
    }

    // ===================================
    // WISDOM
    // ===================================
    if (
      lead === "wisdom" ||
      (wisdomTension && wisdomTension !== "unclear")
    ) {
      return this.pick([
        "There is a real tension here.",
        "Two important things seem to be pulling against each other.",
        "This feels less like a simple decision and more like competing priorities.",
        "Something valuable exists on both sides of this.",
        "The challenge may not be choosing a good thing. It may be deciding which good thing leads."
      ]);
    }

    // ===================================
    // STEWARDSHIP
    // ===================================
    if (lead === "stewardship") {
      return this.pick([
        "This sounds more like responsibility than fear.",
        "Something important feels entrusted to you.",
        "You seem focused on protecting something that matters.",
        "This feels like stewardship, not avoidance.",
        "Part of you appears to be trying to care well for something valuable."
      ]);
    }

    // ===================================
    // EMOTION
    // ===================================
    if (lead === "emotion") {
      return this.pick([
        "Something underneath the surface seems to be asking for attention.",
        "This feels emotionally significant.",
        "There seems to be more here than the surface emotion alone.",
        "Something inside this experience appears to be asking to be understood.",
        "Part of this feels emotionally unresolved."
      ]);
    }

    return this.pick([
      "Something feels worth paying attention to here.",
      "There may be more here than first appears.",
      "Something important seems to be present.",
      "This feels worth slowing down for.",
      "There may be a deeper signal underneath this."
    ]);
  },

  pick(options = []) {
    if (!Array.isArray(options) || !options.length) {
      return null;
    }

    const index = Math.floor(Math.random() * options.length);
    return options[index];
  }
};