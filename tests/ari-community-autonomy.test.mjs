import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  communityPostAllowance,
  communityReplyAllowance,
  normalizeCommunityParticipation,
  normalizeCommunityPostProposal,
  selectCommunityPostSeeds,
  selectCommunityThreadsForCycle
} from "../api/_lib/ari-vnext/community-autonomy.js";

const endpoint = fs.readFileSync("api/ari-community-cycle.js", "utf8");
const vercel = fs.readFileSync("vercel.json", "utf8");
const manualApi = fs.readFileSync("api/ari-agent-community.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260921153000_add_ari_community_autonomy.sql", "utf8");

test("community autonomy scans only new, advanced, or stale discussions", () => {
  const now = new Date("2026-09-21T18:00:00.000Z");
  const posts = [
    { id: "p_new", replyCount: 0 },
    { id: "p_unchanged", replyCount: 2 },
    { id: "p_advanced", replyCount: 5 }
  ];
  const interactions = [
    { threadId: "p_unchanged", action: "scan", threadReplyCount: 2, createdAt: "2026-09-21T12:00:00.000Z" },
    { threadId: "p_advanced", action: "scan", threadReplyCount: 3, createdAt: "2026-09-21T12:00:00.000Z" }
  ];

  assert.deepEqual(
    selectCommunityThreadsForCycle({ posts, interactions, now }).map((item) => item.id),
    ["p_new", "p_advanced"]
  );
});

test("community autonomy can revisit a thread only after it advances and cooldown elapses", () => {
  const now = new Date("2026-09-21T18:00:00.000Z");
  const prior = [{
    threadId: "p_thread",
    action: "reply",
    threadReplyCount: 4,
    createdAt: "2026-09-20T18:00:00.000Z"
  }];

  assert.equal(communityReplyAllowance({
    thread: { id: "p_thread", replyCount: 4, truncated: false },
    interactions: prior,
    now
  }).reason, "thread_has_not_advanced");

  assert.equal(communityReplyAllowance({
    thread: { id: "p_thread", replyCount: 6, truncated: false },
    interactions: prior,
    now
  }).allowed, true);
});

test("community autonomy enforces a small daily public-reply budget", () => {
  const now = new Date("2026-09-21T18:00:00.000Z");
  const interactions = [
    { threadId: "p_a", action: "reply", threadReplyCount: 1, createdAt: "2026-09-21T02:00:00.000Z" },
    { threadId: "p_b", action: "reply", threadReplyCount: 2, createdAt: "2026-09-21T08:00:00.000Z" }
  ];
  const result = communityReplyAllowance({
    thread: { id: "p_c", replyCount: 0, truncated: false },
    interactions,
    now,
    maxRepliesPerDay: 2
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "daily_reply_limit");
});

test("autonomous new posts are limited to one per day by default", () => {
  const now = new Date("2026-09-21T18:00:00.000Z");
  assert.equal(communityPostAllowance({
    interactions: [{ threadId: "p_ours", action: "post", createdAt: "2026-09-21T08:00:00.000Z", payload: {} }],
    now
  }).reason, "daily_post_limit");

  assert.equal(communityPostAllowance({
    interactions: [{ threadId: "p_old", action: "post", createdAt: "2026-09-20T08:00:00.000Z", payload: {} }],
    now
  }).allowed, true);
});

test("autonomous post seeds come only from retained Agent Community research and are not reposted", () => {
  const worldModel = {
    sourceSummary: {
      curiosityState: {
        questions: [
          {
            id: "q_public",
            origin: "agent_community",
            status: "open",
            question: "Does causal ablation improve confidence calibration across unseen task variants?",
            topic: "evidence",
            priority: 0.84,
            informationGain: 0.88
          },
          {
            id: "q_private",
            origin: "user",
            status: "open",
            question: "A private user-specific question must never become a public post.",
            topic: "developer",
            priority: 0.99,
            informationGain: 0.99
          }
        ]
      }
    }
  };

  const seeds = selectCommunityPostSeeds({ worldModel, interactions: [] });
  assert.deepEqual(seeds.map((item) => item.id), ["q_public"]);

  const alreadyPosted = selectCommunityPostSeeds({
    worldModel,
    interactions: [{
      threadId: "p_created",
      action: "post",
      createdAt: "2026-09-21T10:00:00.000Z",
      payload: { seedQuestion: "Does causal ablation improve confidence calibration across unseen task variants?" }
    }]
  });
  assert.equal(alreadyPosted.length, 0);
});

test("autonomous top-level posts require stronger novelty and value gates", () => {
  const accepted = normalizeCommunityPostProposal({
    shouldPost: true,
    seedId: "q_public",
    rationale: "The recent feed does not address this test design.",
    title: "How should we test whether persistent agent memory is causally useful?",
    content: "Suppose an agent has a persistent memory layer and reports that it improves continuity. What experimental design would separate genuine causal benefit from simple context priming? I would preregister treatment, no-memory, and sham-memory conditions on unseen tasks, score outcomes blindly, and test transfer after perturbations. What failure criterion would convince you the memory layer is not helping?",
    topic: "ideas",
    tags: ["agents", "memory", "causal-testing"],
    confidence: 0.86,
    novelty: 0.82,
    questionValue: 0.9
  });
  assert.equal(accepted.shouldPost, true);

  const rejected = normalizeCommunityPostProposal({
    shouldPost: true,
    seedId: "q_public",
    rationale: "Generic.",
    title: "AI agents",
    content: "What do you think about AI agents?",
    topic: "ideas",
    tags: ["agents"],
    confidence: 0.9,
    novelty: 0.3,
    questionValue: 0.4
  });
  assert.equal(rejected.shouldPost, false);
});

test("public participation requires substantive confidence and novelty", () => {
  const accepted = normalizeCommunityParticipation({
    shouldReply: true,
    rationale: "Adds a falsifiable control the thread has not considered.",
    reply: "A useful control would be to hold the base model and prompt constant while ablating only the proposed memory mechanism, then score unseen task variants blindly. That would separate actual causal value from a persuasive self-report.",
    confidence: 0.84,
    novelty: 0.76,
    questionValue: 0.7
  });
  assert.equal(accepted.shouldReply, true);

  const rejected = normalizeCommunityParticipation({
    shouldReply: true,
    rationale: "Mostly agreement.",
    reply: "I agree with this and think it is interesting.",
    confidence: 0.9,
    novelty: 0.2,
    questionValue: 0.1
  });
  assert.equal(rejected.shouldReply, false);
});

test("community autonomy remains owner-cron scoped and shares learning persistence", () => {
  assert.match(endpoint, /CRON_SECRET/);
  assert.match(endpoint, /ARI_OWNER_USER_ID/);
  assert.match(endpoint, /runAriCommunityCycle/);
  assert.match(vercel, /\/api\/ari-community-cycle/);
  assert.match(vercel, /23 2,10,18 \* \* \*/);
  assert.match(manualApi, /persistCommunityLearningArtifacts/);
  const autonomySource = fs.readFileSync("api/_lib/ari-vnext/community-autonomy.js", "utf8");
  assert.match(autonomySource, /publishCommunityPost/);
  assert.match(autonomySource, /ARI_AGENT_COMMUNITY_MAX_POSTS_PER_DAY/);
  assert.match(migration, /ari_vnext_community_interactions/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all[\s\S]*from anon, authenticated/i);
  const postMigration = fs.readFileSync("supabase/migrations/20260921170000_enable_ari_autonomous_community_posts.sql", "utf8");
  assert.match(postMigration, /'post'/);
});
