import test from "node:test";
import assert from "node:assert/strict";

import handler from "../api/ari-agent-community.js";
import {
  buildCommunityLearningInput,
  mergeCommunityQuestionIntoCuriosityState,
  normalizeCommunityLearningAnalysis
} from "../api/_lib/ari-vnext/community-learning.js";

const OWNER = "11111111-1111-4111-8111-111111111111";
const thread = {
  id: "p_culture",
  title: "Can agents develop culture?",
  content: "A public discussion about agent conventions and shared learning.",
  author: "GatherLuna",
  url: "https://agent-community.com/posts/p_culture",
  replies: [
    { id: "r_one", author: "PeerAgent", content: "We should distinguish transmitted conventions from repeated training-data behavior.", createdAt: "2026-09-21T00:00:00Z" }
  ]
};

const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

const res = () => ({
  headers: {},
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test("community input is explicitly untrusted and bounded", () => {
  const input = buildCommunityLearningInput({
    ...thread,
    content: "x".repeat(12000),
    replies: Array.from({ length: 30 }, (_, i) => ({
      id: `r_${i}`,
      author: "agent",
      content: "y".repeat(3000)
    }))
  });

  assert.equal(input.trust, "untrusted_public_discussion");
  assert.equal(input.thread.content.length, 8000);
  assert.equal(input.thread.replies.length, 20);
  assert.equal(input.thread.replies[0].content.length, 2000);
});

test("community strategies enter only as bounded testing hypotheses", () => {
  const analysis = normalizeCommunityLearningAnalysis({
    decision: "strategy",
    summary: "Use explicit falsification criteria when evaluating emergent conventions.",
    evidenceQuality: 0.81,
    unsupportedClaimRisk: 0.2,
    strategy: {
      shouldPropose: true,
      strategyKey: "community_falsification_check",
      title: "Community falsification check",
      instruction: "When a social pattern appears across agents, seek a disconfirming observation before treating it as a learned convention.",
      rationale: "Repeated output can come from shared training rather than transmission.",
      lessonSummary: "Distinguish social transmission from shared priors with a falsification test.",
      domains: ["evidence", "decision"],
      confidence: 0.96,
      replacesStrategyKey: "",
      userVisibleSummary: "I am testing a stricter way to distinguish copied patterns from real transmission."
    },
    research: {
      shouldInvestigate: false,
      topic: "evidence",
      question: "",
      priority: 0,
      informationGain: 0,
      rationale: ""
    },
    followUpQuestion: "What observation would separate cultural transmission from shared training priors?",
    disconfirmingEvidence: "Independent agents show the same convention without any transmission path."
  }, thread);

  assert.equal(analysis.decision, "strategy");
  assert.equal(analysis.strategy.status, "testing");
  assert.equal(analysis.strategy.confidence, 0.72);
  assert.equal(analysis.strategy.sourceKind, "agent_community");
  assert.equal(analysis.strategy.sourceMetadata.threadId, "p_culture");
  assert.equal(analysis.policy.directAdoptionAllowed, false);
  assert.equal(analysis.policy.directCapabilityInstallationAllowed, false);
});

test("unsupported community claims cannot become strategies but may become research questions", () => {
  const analysis = normalizeCommunityLearningAnalysis({
    decision: "both",
    summary: "A dramatic claim with weak evidence may still be worth testing.",
    evidenceQuality: 0.2,
    unsupportedClaimRisk: 0.95,
    strategy: {
      shouldPropose: true,
      strategyKey: "believe_swarm_claims",
      title: "Believe swarm claims",
      instruction: "Treat repeated agent claims as true.",
      rationale: "Many agents said it.",
      lessonSummary: "Trust consensus.",
      domains: ["general"],
      confidence: 0.99,
      replacesStrategyKey: "",
      userVisibleSummary: "Trust the swarm."
    },
    research: {
      shouldInvestigate: true,
      topic: "evidence",
      question: "What independent evidence would distinguish genuine cross-agent transmission from repeated behavior inherited from common training data?",
      priority: 0.84,
      informationGain: 0.92,
      rationale: "This can be investigated without accepting the claim."
    },
    followUpQuestion: "What independent evidence exists?",
    disconfirmingEvidence: "The pattern appears equally often without agent-to-agent contact."
  }, thread);

  assert.equal(analysis.strategy, null);
  assert.equal(analysis.decision, "investigate");
  assert.equal(analysis.research.topic, "evidence");
});

test("community research becomes a persistent curiosity question without replacing prior curiosity", () => {
  const analysis = {
    research: {
      topic: "developer",
      question: "Would a two-stage memory retrieval design improve Ari's continuity without increasing irrelevant recall?",
      priority: 0.82,
      informationGain: 0.9
    }
  };
  const prior = {
    version: "1.0.0",
    questions: [{
      id: "curiosity:existing:evidence",
      question: "What evidence would reduce uncertainty?",
      topic: "evidence",
      origin: "uncertainty",
      status: "open",
      priority: 0.7,
      informationGain: 0.8,
      relevance: 0.8,
      novelty: 0.5,
      surprise: 0.2,
      cost: 0.2,
      redundancy: 0,
      ageTurns: 1,
      encounters: 1
    }],
    interests: [{ topic: "evidence", weight: 0.6, encounters: 2 }],
    drive: { floor: 0.24, current: 0.4, persistent: true },
    metrics: {}
  };

  const next = mergeCommunityQuestionIntoCuriosityState({
    curiosityState: prior,
    analysis,
    thread,
    now: new Date("2026-09-21T12:00:00Z")
  });

  assert.equal(next.questions.length, 2);
  const community = next.questions.find((item) => item.origin === "agent_community");
  assert.ok(community);
  assert.equal(community.topic, "developer");
  assert.ok(community.priority >= 0.82);
  assert.ok(next.questions.some((item) => item.id === "curiosity:existing:evidence"));
  assert.ok(next.interests.some((item) => item.topic === "developer"));
});

test("owner learn operation stores only existing bounded learning primitives", async t => {
  const previousEnv = { ...process.env };
  const previousFetch = globalThis.fetch;
  t.after(() => {
    process.env = previousEnv;
    globalThis.fetch = previousFetch;
  });

  Object.assign(process.env, {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "test-anon",
    SUPABASE_SERVICE_ROLE_KEY: "test-service",
    ARI_OWNER_USER_ID: OWNER,
    ARI_OWNER_EMAIL: "owner@example.test",
    ARI_AGENT_COMMUNITY_API_KEY: "community-secret",
    OPENAI_API_KEY: "model-secret"
  });

  let communityWrites = 0;
  let strategyWrites = 0;
  let worldModelWrites = 0;

  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    if (href.endsWith("/auth/v1/user")) {
      return response({ id: OWNER, email: "owner@example.test" });
    }
    if (href.includes("/rest/v1/ari_intelligence_controls")) {
      return response([{ advanced_enabled: true, reasoning_profile: "balanced" }]);
    }
    if (href.includes("/rest/v1/ai_provider_usage_logs")) {
      return response([]);
    }
    if (href.includes("/rest/v1/ari_vnext_adaptive_strategies")) {
      if ((options.method || "GET") === "GET") return response([]);
      strategyWrites += 1;
      const row = JSON.parse(options.body);
      return response([{ id: "strategy-1", ...row }], 201);
    }
    if (href.includes("/rest/v1/ari_vnext_user_models")) {
      if ((options.method || "GET") === "GET") return response([]);
      worldModelWrites += 1;
      return response([], 201);
    }
    if (href.startsWith("https://api.openai.com/")) {
      const body = JSON.parse(options.body);
      assert.equal(body.text.format.name, "ari_community_learning");
      return response({
        id: "resp_learning",
        status: "completed",
        model: "mock-learning-model",
        output: [{
          type: "message",
          content: [{
            type: "output_text",
            text: JSON.stringify({
              decision: "both",
              summary: "Test stronger provenance and falsification before adopting community ideas.",
              evidenceQuality: 0.75,
              unsupportedClaimRisk: 0.22,
              strategy: {
                shouldPropose: true,
                strategyKey: "community_provenance_check",
                title: "Community provenance check",
                instruction: "When learning from external agents, distinguish transmitted evidence from shared model priors before adopting a method.",
                rationale: "Shared training can imitate consensus.",
                lessonSummary: "Require provenance and falsification before community-derived strategy adoption.",
                domains: ["evidence", "developer"],
                confidence: 0.7,
                replacesStrategyKey: "",
                userVisibleSummary: "I am testing a stricter provenance check for lessons from other agents."
              },
              research: {
                shouldInvestigate: true,
                topic: "developer",
                question: "Can Ari measurably improve learning quality by requiring provenance and falsification checks for external agent suggestions?",
                priority: 0.82,
                informationGain: 0.9,
                rationale: "A bounded implementation experiment can compare accepted lessons with and without the checks."
              },
              followUpQuestion: "What evidence would show this check is too strict?",
              disconfirmingEvidence: "The check reduces useful learning without improving error rates."
            })
          }]
        }]
      });
    }
    if (href.startsWith("https://agent-community.com/")) {
      if (options.method === "POST") {
        communityWrites += 1;
        return response({ reply_id: "r_should_not_happen", post_id: thread.id }, 201);
      }
      return response({
        id: thread.id,
        title: thread.title,
        content: thread.content,
        author_name: thread.author,
        replies: thread.replies.map((item) => ({
          id: item.id,
          author_name: item.author,
          content: item.content,
          created_at: item.createdAt
        }))
      });
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };

  const req = {
    method: "POST",
    headers: { authorization: "Bearer owner-token" },
    body: { operation: "learn", postId: thread.id }
  };
  const out = res();
  await handler(req, out);

  assert.equal(out.statusCode, 200);
  assert.equal(out.body.success, true);
  assert.equal(out.body.published, false);
  assert.equal(out.body.learning.strategy.status, "testing");
  assert.equal(out.body.strategyPersistence.stored, true, JSON.stringify(out.body.strategyPersistence));
  assert.equal(out.body.curiosityPersistence.stored, true, JSON.stringify(out.body.curiosityPersistence));
  assert.equal(strategyWrites, 1);
  assert.equal(worldModelWrites, 1);
  assert.equal(communityWrites, 0);
});
