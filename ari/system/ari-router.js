// ari/brain/ari-router.js
// Ari Router
// Purpose: Choose which Ari organ should lead based on user intent, emotion, and context.

window.Ari = window.Ari || {};

window.Ari.router = {
  version: "1.0.0",

  routes: {
    companion: [
      "sad",
      "alone",
      "lonely",
      "overwhelmed",
      "stressed",
      "hurt",
      "relationship",
      "talk",
      "vent"
    ],

    coach: [
      "calorie",
      "nutrition",
      "weight",
      "meal",
      "food",
      "exercise",
      "habit",
      "goal",
      "discipline",
      "accountability"
    ],

    builder: [
      "code",
      "bug",
      "fix",
      "github",
      "repository",
      "repo",
      "javascript",
      "html",
      "css",
      "api",
      "supabase",
      "vercel",
      "debug",
      "build"
    ],

    teacher: [
      "explain",
      "teach",
      "learn",
      "break down",
      "how does",
      "what does",
      "why does"
    ],

    explorer: [
      "brainstorm",
      "imagine",
      "what if",
      "possibility",
      "future",
      "wonder",
      "idea"
    ],

    observer: [
      "notice",
      "pattern",
      "what am i missing",
      "why does this keep happening",
      "trend",
      "observe"
    ],

    memory: [
      "remember",
      "memory",
      "what did we say",
      "what have you learned",
      "save this",
      "forget"
    ],

    relationship: [
      "friend",
      "companion",
      "trust",
      "know me",
      "relationship with ari",
      "how should ari talk"
    ],

    reflection: [
      "reflect",
      "meaning",
      "why do i feel",
      "what did i learn",
      "journal",
      "self discovery"
    ],

    planner: [
      "plan",
      "roadmap",
      "next step",
      "schedule",
      "milestone",
      "organize"
    ],

    creator: [
      "create",
      "design",
      "invent",
      "make",
      "brand",
      "name"
    ],

    storykeeper: [
      "milestone",
      "story",
      "journey",
      "how far",
      "turning point",
      "remember this moment"
    ]
  },

  guardianKeywords: [
    "suicide",
    "kill myself",
    "hurt myself",
    "overdose",
    "chest pain",
    "stroke",
    "can't breathe",
    "abuse",
    "danger",
    "emergency"
  ],

  normalize(text = "") {
    return String(text || "").toLowerCase().trim();
  },

  includesAny(text, keywords = []) {
    return keywords.some(keyword => text.includes(keyword));
  },

  scoreOrgan(text, organName) {
    const keywords = this.routes[organName] || [];
    let score = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += keyword.length > 8 ? 2 : 1;
      }
    }

    return score;
  },

  route(message = "", context = {}) {
    const text = this.normalize(message);

    if (!text) {
      return {
        primaryOrgan: "companion",
        supportingOrgans: ["heart"],
        guardianRequired: false,
        confidence: "low",
        reason: "Empty or unclear message. Defaulting to Companion."
      };
    }

    if (this.includesAny(text, this.guardianKeywords)) {
      return {
        primaryOrgan: "guardian",
        supportingOrgans: ["companion", "heart"],
        guardianRequired: true,
        confidence: "high",
        reason: "Guardian keyword detected."
      };
    }

    const scores = Object.keys(this.routes).map(organName => ({
      organName,
      score: this.scoreOrgan(text, organName)
    }));

    scores.sort((a, b) => b.score - a.score);

    const top = scores[0];

    if (!top || top.score === 0) {
      return {
        primaryOrgan: "companion",
        supportingOrgans: ["observer"],
        guardianRequired: false,
        confidence: "low",
        reason: "No strong route detected. Defaulting to Companion with Observer support."
      };
    }

    const supportingOrgans = scores
      .filter(item => item.score > 0 && item.organName !== top.organName)
      .slice(0, 2)
      .map(item => item.organName);

    return {
      primaryOrgan: top.organName,
      supportingOrgans,
      guardianRequired: false,
      confidence: top.score >= 2 ? "medium" : "low",
      reason: `Matched ${top.organName} route.`,
      scores
    };
  }
};