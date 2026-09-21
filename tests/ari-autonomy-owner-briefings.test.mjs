import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { formatAutonomyOwnerBriefing } from "../api/_lib/ari-vnext/initiative-events.js";

test("autonomous commits become concise merge recommendations", () => {
  const formatted = formatAutonomyOwnerBriefing({
    initiativeKey: "ari_autonomy:goal:2026-09-17T19",
    reasonId: "ari_autonomous_branch_commit",
    source: "ari_autonomy_runtime",
    priority: "high",
    confidence: 0.87,
    opener: "old opener",
    context: "Improved contradiction checking. Changed validator.js on agent/ari-autonomous-development. Production was not changed.",
    followUpPrompt: "Goal: improve contradiction checking. Evidence: regression test now catches the failure. CI is pending.",
    action: "review_autonomous_commit",
    artifact: {
      type: "github_commit",
      commitSha: "abcdef1234567890abcdef1234567890abcdef12",
      commitUrl: "https://github.com/example/repo/commit/abcdef1234567890abcdef1234567890abcdef12",
      branch: "agent/ari-autonomous-development",
      filePath: "api/_lib/validator.js",
      status: "pending_ci",
      productionChanged: false
    },
    cooldownHours: 48
  });

  assert.ok(formatted);
  assert.match(formatted.opener, /ready for review/i);
  assert.match(formatted.followUpPrompt, /review evidence/i);
  assert.equal(formatted.artifact.commitSha, "abcdef1234567890abcdef1234567890abcdef12");
  assert.equal(formatted.artifact.productionChanged, false);
  assert.equal(formatted.action, "review_autonomous_commit");
  assert.equal(formatted.cooldownHours, 24);
});

test("a commit-labeled signal without verifiable commit evidence stays quiet", () => {
  const formatted = formatAutonomyOwnerBriefing({
    initiativeKey: "ari_autonomy:goal:2026-09-17T19",
    reasonId: "ari_autonomous_branch_commit",
    source: "ari_autonomy_runtime",
    priority: "high",
    confidence: 0.87,
    opener: "I created something.",
    context: "A model-generated summary claims a change exists.",
    followUpPrompt: "Please merge it.",
    action: "review_autonomous_commit",
    cooldownHours: 24
  });

  assert.equal(formatted, null);
});

test("malformed commit evidence cannot produce a merge-review signal", () => {
  const formatted = formatAutonomyOwnerBriefing({
    initiativeKey: "ari_autonomy:goal:2026-09-17T19",
    reasonId: "ari_autonomous_branch_commit",
    source: "ari_autonomy_runtime",
    artifact: {
      type: "github_commit",
      commitSha: "not-a-sha",
      commitUrl: "https://example.com/not-a-commit",
      branch: "main",
      filePath: "../unsafe.js",
      status: "pending_ci"
    }
  });

  assert.equal(formatted, null);
});

test("blocked autonomous research becomes a Jose plus ChatGPT collaboration request", () => {
  const formatted = formatAutonomyOwnerBriefing({
    initiativeKey: "ari_autonomy:goal:2026-09-17T20",
    reasonId: "ari_autonomous_research_cycle",
    source: "ari_autonomy_runtime",
    priority: "medium",
    confidence: 0.7,
    context: "The change requires a Supabase schema migration and is outside my isolated branch authority. No production code was changed.",
    followUpPrompt: "Goal: improve persistence. Evidence: the missing field is database-backed.",
    action: "review_autonomous_learning",
    cooldownHours: 48
  });

  assert.ok(formatted);
  assert.match(formatted.opener, /Jose \+ ChatGPT/i);
  assert.match(formatted.followUpPrompt, /what i want help with/i);
  assert.equal(formatted.action, "collaborate_on_autonomous_goal");
});

test("routine research with no owner action stays quiet", () => {
  const formatted = formatAutonomyOwnerBriefing({
    initiativeKey: "ari_autonomy:goal:2026-09-17T21",
    reasonId: "ari_autonomous_research_cycle",
    source: "ari_autonomy_runtime",
    priority: "medium",
    confidence: 0.76,
    context: "I compared the current implementation with the available evidence and found no justified bounded change. No production code was changed.",
    followUpPrompt: "Goal: test whether the current strategy is still sound. Evidence: current behavior remains consistent with the regression suite.",
    action: "review_autonomous_learning",
    cooldownHours: 48
  });

  assert.equal(formatted, null);
});

test("ordinary Ari initiatives are not rewritten by autonomy briefing policy", () => {
  const candidate = {
    initiativeKey: "experiment:due",
    reasonId: "experiment_due",
    source: "initiative_engine",
    opener: "Your experiment is due for review."
  };
  assert.equal(formatAutonomyOwnerBriefing(candidate), candidate);
});

test("autonomy cron runs twice daily instead of hourly", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const autonomyCron = config.crons.find((item) => item.path === "/api/ari-autonomy-cycle");
  assert.ok(autonomyCron);
  assert.equal(autonomyCron.schedule, "47 4,16 * * *");
});
