import { listRecentDecisions, summarizeDecisionState } from "./_lib/ari-vnext/decision-journal.js";
import { listUserExperiments, summarizeExperimentLedger } from "./_lib/ari-vnext/experiment-ledger.js";
import { deriveInitiativeCandidate } from "./_lib/ari-vnext/initiative-engine.js";
import {
  listRecentInitiatives,
  recordInitiativeSurface,
  shouldSuppressInitiative
} from "./_lib/ari-vnext/initiative-events.js";
import { deriveProactiveInsights } from "./_lib/ari-vnext/proactive-insights.js";
import { deriveRelationshipContinuity } from "./_lib/ari-vnext/relationship-continuity.js";
import { deriveTemporalTimeline } from "./_lib/ari-vnext/temporal-timeline.js";
import { loadUserWorldModel } from "./_lib/ari-vnext/user-world-model.js";

// Owner-first background observer for Ari Signals. It deliberately performs no
// language-model call. It only evaluates persisted state and deterministic
// initiative rules, so Ari can reach the owner even while Home is closed.
export default async function handler(req, res) {
  setHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  const cronSecret = clean(process.env.CRON_SECRET, 4000);
  const authorization = clean(req?.headers?.authorization, 5000);
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, code: "SIGNAL_SCAN_UNAUTHORIZED" });
  }

  const userId = clean(process.env.ARI_OWNER_USER_ID, 200);
  if (!userId) {
    return res.status(503).json({ success: false, code: "OWNER_ID_NOT_CONFIGURED" });
  }

  try {
    const now = new Date();
    const [experiments, decisions, worldModel, priorInitiatives] = await Promise.all([
      listUserExperiments({ userId, statuses: ["active", "completed"], limit: 12 }),
      listRecentDecisions({ userId, limit: 20 }),
      loadUserWorldModel({ userId }),
      listRecentInitiatives({ userId, limit: 30 })
    ]);

    const experimentLedger = summarizeExperimentLedger(experiments);
    const decisionState = summarizeDecisionState(decisions);
    const temporalTimeline = deriveTemporalTimeline({
      context: {},
      experiments,
      decisions,
      limit: 28
    });
    const relationshipContinuity = deriveRelationshipContinuity({
      userWorldModel: worldModel || {},
      decisionState,
      experimentLedger,
      temporalTimeline,
      recentContinuityPairs: 0,
      now
    });
    const proactiveInsights = deriveProactiveInsights({
      userWorldModel: worldModel || {},
      decisionState,
      experimentLedger
    });
    const initiativeState = deriveInitiativeCandidate({
      proactiveInsights,
      relationshipContinuity,
      experimentLedger,
      now
    });

    if (!initiativeState.shouldInitiate || !initiativeState.candidate) {
      return res.status(200).json({
        success: true,
        signalCreated: false,
        reason: initiativeState.reason || "nothing_meaningful_enough",
        languageModelCalls: 0
      });
    }

    const suppression = shouldSuppressInitiative({
      candidate: initiativeState.candidate,
      events: priorInitiatives,
      now
    });
    if (suppression.suppress) {
      return res.status(200).json({
        success: true,
        signalCreated: false,
        reason: "repeat_suppressed",
        suppression,
        languageModelCalls: 0
      });
    }

    const stored = await recordInitiativeSurface({
      userId,
      candidate: initiativeState.candidate
    });

    return res.status(200).json({
      success: Boolean(stored?.stored),
      signalCreated: Boolean(stored?.stored),
      signalId: stored?.event?.id || null,
      reasonId: initiativeState.candidate.reasonId || null,
      priority: initiativeState.candidate.priority || null,
      push: stored?.push || { attempted: false },
      languageModelCalls: 0
    });
  } catch (error) {
    console.warn("[ARI Signals Scan]", error?.message || error);
    return res.status(500).json({
      success: false,
      signalCreated: false,
      code: "SIGNAL_SCAN_FAILED",
      languageModelCalls: 0
    });
  }
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Signals-Scan", "owner-v1");
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
