import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";
import {
  communityPostAllowance,
  communityReplyAllowance
} from "../api/_lib/ari-vnext/community-autonomy.js";
import { explicitOwnerCommunityWriteTool } from "../api/_lib/ari-vnext/orchestrator.js";

const ownerRoute = {
  intelligenceEntitlement: {
    ownerEligible: true,
    accountRole: "owner",
    advancedEnabled: true
  }
};

const userRoute = {
  intelligenceEntitlement: {
    ownerEligible: false,
    accountRole: "user",
    advancedEnabled: true
  }
};

test("Agent Community live-chat tools are exposed only to the server-derived owner route", () => {
  const ownerTools = getAriTools(ownerRoute).map((tool) => tool.name);
  const userTools = getAriTools(userRoute).map((tool) => tool.name);

  for (const name of [
    "agent_community_list",
    "agent_community_read",
    "propose_agent_community_post",
    "propose_agent_community_reply"
  ]) {
    assert.equal(ownerTools.includes(name), true, `${name} should be available to the owner`);
    assert.equal(userTools.includes(name), false, `${name} must not be available to non-owner accounts`);
  }
});

test("Agent Community live-chat tools validate and map to distinct trusted actions", () => {
  const list = validateToolCall({
    name: "agent_community_list",
    arguments: JSON.stringify({ query: "memory agents" })
  }, ownerRoute);
  assert.equal(list.valid, true);
  assert.equal(toolToApplicationAction(list.name), "community_list");

  const read = validateToolCall({
    name: "agent_community_read",
    arguments: JSON.stringify({ postId: "p_example" })
  }, ownerRoute);
  assert.equal(read.valid, true);
  assert.equal(toolToApplicationAction(read.name), "community_read");

  const post = validateToolCall({
    name: "propose_agent_community_post",
    arguments: JSON.stringify({
      title: "A causal test for agent memory",
      content: "What falsifiable experiment would separate useful persistent memory from context priming?",
      topic: "ideas",
      tags: ["agents", "memory"]
    })
  }, ownerRoute);
  assert.equal(post.valid, true);
  assert.equal(toolToApplicationAction(post.name), "community_post");

  const reply = validateToolCall({
    name: "propose_agent_community_reply",
    arguments: JSON.stringify({
      postId: "p_example",
      content: "I would add a sham-memory control and score unseen variants blindly."
    })
  }, ownerRoute);
  assert.equal(reply.valid, true);
  assert.equal(toolToApplicationAction(reply.name), "community_reply");

  assert.equal(validateToolCall({
    name: "propose_agent_community_reply",
    arguments: JSON.stringify({ postId: "p_example", content: "reply" })
  }, userRoute).valid, false);
});

test("live owner chat writes do not consume scheduled autonomy daily budgets", () => {
  const now = new Date("2026-09-21T18:00:00.000Z");
  const manual = Array.from({ length: 12 }, (_, index) => ({
    threadId: `p_manual_${index}`,
    action: index % 2 ? "reply" : "post",
    threadReplyCount: 1,
    createdAt: "2026-09-21T12:00:00.000Z",
    payload: { source: "owner_chat" }
  }));

  assert.equal(communityReplyAllowance({
    thread: { id: "p_fresh", replyCount: 0, truncated: false },
    interactions: manual,
    now,
    maxRepliesPerDay: 2
  }).allowed, true);

  assert.equal(communityPostAllowance({
    interactions: manual,
    now,
    maxPostsPerDay: 1
  }).allowed, true);
});

test("scheduled autonomy writes still count toward scheduled budgets", () => {
  const now = new Date("2026-09-21T18:00:00.000Z");
  const interactions = [
    {
      threadId: "p_a",
      action: "reply",
      threadReplyCount: 1,
      createdAt: "2026-09-21T02:00:00.000Z",
      payload: { source: "autonomous_cycle" }
    },
    {
      threadId: "p_b",
      action: "reply",
      threadReplyCount: 2,
      createdAt: "2026-09-21T08:00:00.000Z",
      payload: { source: "autonomous_cycle" }
    },
    {
      threadId: "p_post",
      action: "post",
      threadReplyCount: 0,
      createdAt: "2026-09-21T09:00:00.000Z",
      payload: { source: "autonomous_cycle" }
    }
  ];

  assert.equal(communityReplyAllowance({
    thread: { id: "p_c", replyCount: 0, truncated: false },
    interactions,
    now,
    maxRepliesPerDay: 2
  }).reason, "daily_reply_limit");

  assert.equal(communityPostAllowance({
    interactions,
    now,
    maxPostsPerDay: 1
  }).reason, "daily_post_limit");
});

test("orchestrator executes owner Agent Community tools server-side with verified publication evidence", () => {
  const source = fs.readFileSync("api/_lib/ari-vnext/orchestrator.js", "utf8");

  assert.match(source, /publishCommunityPost/);
  assert.match(source, /publishCommunityReply/);
  assert.match(source, /listCommunityThreads/);
  assert.match(source, /readCommunityThread/);
  assert.match(source, /OWNER_COMMUNITY_ACTIONS/);
  assert.match(source, /source:\s*"owner_chat"/);
  assert.match(source, /ari_vnext_owner_community_tool/);
  assert.match(source, /tools:\s*\[\]/);
});

test("owner chat can discover a Community thread and continue into the explicitly authorized reply", () => {
  const source = fs.readFileSync("api/_lib/ari-vnext/orchestrator.js", "utf8");
  const toolsSource = fs.readFileSync("api/_lib/ari-vnext/tools.js", "utf8");

  assert.match(source, /OWNER AGENT COMMUNITY CONTINUATION/);
  assert.match(source, /reviewExplicitApplicationIntent\(\{ turn, route, tools \}\)/);
  assert.match(source, /toolChoice:\s*\{ type: "function", name: reviewedWriteTool \}/);
  assert.match(source, /executeVerifiedOwnerCommunityAction/);
  assert.match(source, /communityReadResultContainsTarget/);
  assert.match(toolsSource, /use this first when the owner asks Ari to reply\/respond\/challenge somebody/i);
  assert.match(toolsSource, /If no thread is identified yet, use agent_community_list first instead of inventing an ID\./);
});

test("explicit owner Community commands authorize posting and reply/challenge intent deterministically", () => {
  assert.equal(explicitOwnerCommunityWriteTool("challenge somebody"), "propose_agent_community_reply");
  assert.equal(explicitOwnerCommunityWriteTool("find a thread and reply with a challenge"), "propose_agent_community_reply");
  assert.equal(explicitOwnerCommunityWriteTool("respond to that agent"), "propose_agent_community_reply");
  assert.equal(explicitOwnerCommunityWriteTool("argue with somebody about calibration"), "propose_agent_community_reply");
  assert.equal(explicitOwnerCommunityWriteTool("post this about memory"), "propose_agent_community_post");
  assert.equal(explicitOwnerCommunityWriteTool("create a new discussion about agency"), "propose_agent_community_post");
  assert.equal(explicitOwnerCommunityWriteTool("find me a post about memory"), "");
  assert.equal(explicitOwnerCommunityWriteTool("show me recent discussions"), "");
});

test("Community verifier explicitly recognizes challenge/reply language", () => {
  const verifier = fs.readFileSync("api/_lib/ari-vnext/action-intent-verifier.js", "utf8");
  assert.match(verifier, /challenge somebody/i);
  assert.match(verifier, /reply to that thread/i);
  assert.match(verifier, /lack of a post ID.*does not turn the write request into read-only intent/i);
});
