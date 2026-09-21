import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  communityReplyAllowance,
  normalizeCommunityParticipation,
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
  assert.match(migration, /ari_vnext_community_interactions/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all[\s\S]*from anon, authenticated/i);
});
