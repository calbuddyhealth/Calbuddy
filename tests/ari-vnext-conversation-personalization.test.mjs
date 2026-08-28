import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  analyzeResponseStrategy,
  applyConversationPersonalization,
  detectConversationSignal,
  detectCurrentTurnCommunicationOverride,
  summarizeConversationPersonalization
} from "../api/_lib/ari-vnext/conversation-personalization.js";
import {
  buildCommunicationExposure,
  summarizeCommunicationLearning
} from "../api/_lib/ari-vnext/communication-outcomes.js";
import {
  resolveCommunicationProfile,
  resolvePersonalizedCommunicationProfile
} from "../api/_lib/ari-vnext/communication-profile.js";

const personalizationSource = await readFile(
  new URL("../api/_lib/ari-vnext/conversation-personalization.js", import.meta.url),
  "utf8"
);
const apiSource = await readFile(
  new URL("../api/ari-vnext.js", import.meta.url),
  "utf8"
);
const orchestratorSource = await readFile(
  new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
  "utf8"
);

function row({
  domain = "general",
  detail = "brief",
  directness = "direct",
  complexity = "simple",
  questionBurden = "none",
  formatStyle = "structured",
  direction = "positive",
  confidence = 0.9,
  source = "explicit_positive_conversation_feedback",
  desired = {},
  daysAgo = 1
} = {}) {
  const resolvedAt = new Date(Date.UTC(2026, 7, 23) - daysAgo * 86400000).toISOString();
  return {
    status: "resolved",
    domain,
    strategyKey: `${domain}-${detail}-${directness}-${complexity}-${questionBurden}-${formatStyle}-${daysAgo}-${Math.random()}`,
    strategy: {
      detail,
      realizedReplyLength: detail,
      directness,
      complexity,
      questionBurden,
      questionCount: questionBurden === "none" ? 0 : questionBurden === "light" ? 1 : 3,
      formatStyle
    },
    outcomeDirection: direction,
    associationConfidence: confidence,
    evaluationSource: source,
    followup: Object.keys(desired).length
      ? {
          conversationSignal: {
            direction,
            source,
            dimensions: desired,
            explicit: true
          }
        }
      : {},
    createdAt: resolvedAt,
    resolvedAt
  };
}

function strongLearning({ domain = "general", preferredDetail = "brief" } = {}) {
  const otherDetail = preferredDetail === "brief" ? "detailed" : "brief";
  const rows = [
    ...Array.from({ length: 5 }, (_, index) => row({
      domain,
      detail: preferredDetail,
      directness: "direct",
      complexity: "simple",
      questionBurden: "none",
      formatStyle: "structured",
      direction: "positive",
      daysAgo: index + 1
    })),
    ...Array.from({ length: 5 }, (_, index) => row({
      domain,
      detail: otherDetail,
      directness: "balanced",
      complexity: "advanced",
      questionBurden: "high",
      formatStyle: "prose",
      direction: "negative",
      source: "conversation_repair_friction",
      daysAgo: index + 1
    }))
  ];
  return summarizeCommunicationLearning(rows, { route: domain === "training" ? { training: true } : {} });
}

test("current-turn style instructions override learned conversation behavior immediately", () => {
  const learning = strongLearning();
  const profile = resolvePersonalizedCommunicationProfile({
    preferences: {},
    learning,
    message: "Give me a detailed answer in simple terms, but be direct.",
    safety: { highStakes: false }
  });

  assert.equal(profile.detail, "detailed");
  assert.equal(profile.complexity, "simple");
  assert.equal(profile.directness, "direct");
  assert.equal(profile.personalization.currentTurnOverrides.detail, "detailed");
});

test("saved explicit communication preferences cannot be overwritten by learning", () => {
  const learning = strongLearning({ preferredDetail: "brief" });
  const profile = resolvePersonalizedCommunicationProfile({
    preferences: { detail: "detailed", directness: "gentle", complexity: "advanced" },
    learning,
    message: "Explain this to me.",
    safety: { highStakes: false }
  });

  assert.equal(profile.detail, "detailed");
  assert.equal(profile.directness, "gentle");
  assert.equal(profile.complexity, "advanced");
  assert.equal(profile.personalization.explicitProfilePreserved, true);
});

test("learning only fills communication dimensions left adaptive", () => {
  const learning = strongLearning();
  const explicit = resolveCommunicationProfile({ tone: "warm", detail: "adaptive", directness: "adaptive" });
  const profile = applyConversationPersonalization({
    explicitProfile: explicit,
    learning,
    message: "What do you think?",
    safety: { highStakes: false }
  });

  assert.equal(profile.tone, "warm");
  assert.equal(profile.detail, "brief");
  assert.equal(profile.directness, "direct");
  assert.equal(profile.personalization.learnedApplied.detail, "brief");
});

test("high-stakes turns suppress learned style while preserving explicit settings", () => {
  const learning = strongLearning();
  const profile = resolvePersonalizedCommunicationProfile({
    preferences: { tone: "professional" },
    learning,
    message: "Explain what I should do.",
    safety: { highStakes: true }
  });

  assert.equal(profile.tone, "professional");
  assert.equal(profile.detail, "adaptive");
  assert.equal(profile.directness, "adaptive");
  assert.equal(profile.personalization.highStakesSuppressed, true);
  assert.deepEqual(profile.personalization.learnedApplied, {});
});

test("sparse evidence does not personalize a conversation", () => {
  const learning = summarizeConversationPersonalization([
    row({ detail: "brief", direction: "positive" }),
    row({ detail: "detailed", direction: "negative" })
  ], { route: {} });

  assert.equal(learning.shouldAdapt, false);
  assert.deepEqual(learning.adaptiveProfile, {});
  assert.equal(learning.confidence, "insufficient");
});

test("repeated recent evidence creates a multi-dimensional adaptive profile", () => {
  const learning = strongLearning();
  assert.equal(learning.shouldAdapt, true);
  assert.equal(learning.adaptiveProfile.detail, "brief");
  assert.equal(learning.adaptiveProfile.directness, "direct");
  assert.equal(learning.adaptiveProfile.complexity, "simple");
  assert.equal(learning.adaptiveProfile.questionBurden, "none");
  assert.equal(learning.adaptiveProfile.formatStyle, "structured");
  assert.ok(["low", "medium", "high"].includes(learning.confidence));
  assert.ok(learning.evidence.detail.sampleSize >= 4);
});

test("domain-specific evidence can personalize differently from the global pattern", () => {
  const rows = [
    ...Array.from({ length: 6 }, (_, index) => row({
      domain: "general",
      detail: "brief",
      direction: "positive",
      daysAgo: index + 1
    })),
    ...Array.from({ length: 6 }, (_, index) => row({
      domain: "general",
      detail: "detailed",
      direction: "negative",
      daysAgo: index + 1
    })),
    ...Array.from({ length: 5 }, (_, index) => row({
      domain: "training",
      detail: "detailed",
      directness: "direct",
      direction: "positive",
      daysAgo: index + 1
    })),
    ...Array.from({ length: 5 }, (_, index) => row({
      domain: "training",
      detail: "brief",
      directness: "balanced",
      direction: "negative",
      daysAgo: index + 1
    }))
  ];

  const training = summarizeConversationPersonalization(rows, { route: { training: true } });
  assert.equal(training.adaptiveProfile.detail, "detailed");
  assert.equal(training.evidence.detail.scope, "training");
});

test("negative explicit correction penalizes the old style and rewards the requested alternative", () => {
  const rows = Array.from({ length: 4 }, (_, index) => row({
    detail: "detailed",
    direction: "negative",
    source: "explicit_detail_feedback",
    desired: { detail: "brief" },
    daysAgo: index + 1
  }));

  const learning = summarizeConversationPersonalization(rows, { route: {} });
  assert.equal(learning.adaptiveProfile.detail, "brief");
  assert.ok(learning.evidence.detail.score > 0.5);
});

test("direct feedback detector understands common conversation corrections", () => {
  assert.deepEqual(detectConversationSignal({ message: "That was too long." })?.followup?.conversationSignal?.dimensions, { detail: "brief" });
  assert.deepEqual(detectConversationSignal({ message: "I need more detail." })?.followup?.conversationSignal?.dimensions, { detail: "detailed" });
  assert.deepEqual(detectConversationSignal({ message: "Stop sugarcoating it and be direct." })?.followup?.conversationSignal?.dimensions, { directness: "direct" });
  assert.deepEqual(detectConversationSignal({ message: "Put that in simple terms." })?.followup?.conversationSignal?.dimensions, { complexity: "simple" });
  assert.deepEqual(detectConversationSignal({ message: "Stop asking me follow-up questions." })?.followup?.conversationSignal?.dimensions, { questionBurden: "none" });
  assert.equal(detectConversationSignal({ message: "Exactly. That helps." })?.direction, "positive");
  assert.equal(detectConversationSignal({ message: "No, that's not what I asked." })?.source, "conversation_repair_friction");
});

test("current-turn override detector supports answer length, directness, complexity, questions, and format", () => {
  assert.deepEqual(
    detectCurrentTurnCommunicationOverride("Keep it short, be direct, use simple terms, don't ask follow-up questions, and use bullets."),
    {
      detail: "brief",
      directness: "direct",
      complexity: "simple",
      questionBurden: "none",
      formatStyle: "structured"
    }
  );
});

test("response strategy analysis measures realized conversation behavior", () => {
  const strategy = analyzeResponseStrategy({
    reply: "## Recommendation\n- Do the first thing.\n- Then do the second thing.\n\nWant a deeper explanation?",
    communication: { directness: "direct", detail: "brief", complexity: "simple", tone: "warm" }
  });

  assert.equal(strategy.directness, "direct");
  assert.equal(strategy.questionBurden, "light");
  assert.equal(strategy.formatStyle, "structured");
  assert.ok(strategy.listItemCount >= 2);
});

test("substantive general conversations are learnable but trivial greetings are not", () => {
  const substantive = buildCommunicationExposure({
    turnId: "turn-general",
    route: { casualConversation: true },
    turn: { message: "I'm trying to decide whether I should change my approach. What would you recommend?" },
    result: {
      success: true,
      reply: "I would keep the current approach for now because changing several variables at once makes it harder to tell what actually helped. Pick one change, watch the result, then adjust.",
      communication: { directness: "direct", detail: "brief", complexity: "simple", tone: "warm" }
    }
  });
  assert.ok(substantive);
  assert.equal(substantive.domain, "casual");

  const greeting = buildCommunicationExposure({
    turnId: "turn-hi",
    route: { casualConversation: true },
    turn: { message: "Hey" },
    result: { success: true, reply: "Hey." }
  });
  assert.equal(greeting, null);
});

test("conversation personalization never uses Circle/social signals or engagement objectives", () => {
  const learning = strongLearning();
  assert.equal(learning.circleSocialDataAllowed, false);
  assert.equal(learning.engagementOptimizationAllowed, false);
  assert.equal(learning.timeInAppOptimizationAllowed, false);
  assert.equal(learning.personalization.safeguards.circleSocialDataAllowed, false);
  assert.equal(learning.personalization.safeguards.emotionalDependencyOptimizationAllowed, false);
  assert.doesNotMatch(personalizationSource, /route\?\.social|context\?\.social|\.from\(["'](?:ari_)?circle/i);
});

test("conversation personalization is deterministic and adds no OpenAI request", () => {
  assert.doesNotMatch(personalizationSource, /fetch\s*\(/);
  assert.doesNotMatch(personalizationSource, /OPENAI_|api\.openai\.com/i);
});

test("Ari vNext uses personalized communication for ordinary conversations, not only fitness routes", () => {
  assert.match(apiSource, /shouldLoadConversationLearning/);
  assert.match(apiSource, /listCommunicationOutcomes\(\{ userId: auth\.userId, limit: 40 \}\)/);
  assert.match(apiSource, /summarizeCommunicationLearning\(communicationOutcomes, \{ route: routePreview \}\)/);
  assert.match(apiSource, /buildCommunicationExposure\(\{[\s\S]*turn[\s\S]*\}\)/);
  assert.doesNotMatch(apiSource, /const communicationLearning = fitnessRoute \?/);
  assert.match(orchestratorSource, /resolvePersonalizedCommunicationProfile/);
  assert.match(orchestratorSource, /learning: turn\?\.context\?\.communicationLearning/);
});
