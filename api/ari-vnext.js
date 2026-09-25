import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";
import { loadAccountEntitlements } from "./_lib/ari-vnext/account-entitlements.js";
import {
  ARI_ADAPTIVE_STRATEGY_VERSION,
  buildStrategyAdoptionSignal,
  shouldRunAdaptiveStrategyReflection
} from "./_lib/ari-vnext/adaptive-strategy.js";
import { reflectOnAdaptiveStrategy } from "./_lib/ari-vnext/adaptive-strategy-reflection.js";
import {
  prepareAdaptiveStrategiesForTurn,
  recordAdaptiveStrategyUses,
  upsertAdaptiveStrategyProposal
} from "./_lib/ari-vnext/adaptive-strategy-store.js";
import {
  advanceCognitiveState,
  ARI_COGNITIVE_LOOP_VERSION,
  ARI_COGNITIVE_STATE_VERSION,
  deriveCognitiveWorkspace,
  isOwnerCognitiveLoopEnabled,
  resolveOwnerCognitionMode,
  shouldPersistCognitiveState
} from "./_lib/ari-vnext/cognitive-loop.js";
import {
  loadAriCognitiveState,
  persistAriCognitiveState
} from "./_lib/ari-vnext/cognitive-state-store.js";
import { summarizeCommunicationClosure } from "./_lib/ari-vnext/communication-closure.js";
import { summarizePersonalityEvaluation } from "./_lib/ari-vnext/personality-evaluation.js";
import { persistCommunicationClosure } from "./_lib/ari-vnext/communication-closure-store.js";
import { buildCurrentTurn, cleanText } from "./_lib/ari-vnext/current-turn.js";
import { mergeAuthoritativeAriContext, reconcileWorldModelWithAuthoritativeContext } from "./_lib/ari-vnext/authoritative-context.js";
import {
  buildCommunicationExposure,
  listCommunicationOutcomes,
  recordCommunicationExposure,
  resolveCommunicationOutcomes,
  summarizeCommunicationLearning
} from "./_lib/ari-vnext/communication-outcomes.js";
import {
  hydrateRecentConversation,
  isConversationRecallRequest,
  persistConversationTurn,
  persistDurableMemory,
  searchUserConversationHistory
} from "./_lib/ari-vnext/continuity-service.js";
import {
  buildMemoryActionModelNote,
  buildVerifiedMemoryReply,
  executeExplicitMemoryAction
} from "./_lib/ari-vnext/memory-action.js";
import { routeContext } from "./_lib/ari-vnext/context-router.js";
import {
  buildDecisionRecord,
  listRecentDecisions,
  recordDecision,
  resolveDecision,
  summarizeDecisionState
} from "./_lib/ari-vnext/decision-journal.js";
import {
  buildLongHorizonDecisionRecord,
  detectReportedDecisionOutcome
} from "./_lib/ari-vnext/long-horizon-outcomes.js";
import { listUserExperiments, summarizeExperimentLedger } from "./_lib/ari-vnext/experiment-ledger.js";
import { recordInitiativeSurface } from "./_lib/ari-vnext/initiative-events.js";
import { filterMemoryResultForPrivacy, retrieveRelevantMemories } from "./_lib/ari-vnext/memory-service.js";
import { runAriVNext } from "./_lib/ari-vnext/orchestrator.js";
import { persistAriActionProposal } from "./_lib/ari-vnext/action-ledger.js";
import { retrieveInstitutionalMemory } from "./_lib/ari-vnext/institutional-memory.js";
import { learnFromCouncilTurn } from "./_lib/ari-vnext/council-lesson-extractor.js";
import {
  applyCouncilOutcomeFeedback,
  evaluateAndPersistCouncilPerformance,
  loadAgentPerformanceState
} from "./_lib/ari-vnext/agent-performance.js";
import { loadSavedCommunicationPreferences } from "./_lib/ari-vnext/saved-communication-preferences.js";
import { deriveProactiveInsights } from "./_lib/ari-vnext/proactive-insights.js";
import {
  claimAriRequest,
  completeAriRequest,
  releaseAriRequest
} from "./_lib/ari-vnext/request-idempotency.js";
import { deriveTemporalTimeline } from "./_lib/ari-vnext/temporal-timeline.js";
import {
  deriveUserWorldModel,
  loadUserWorldModel,
  persistUserWorldModel
} from "./_lib/ari-vnext/user-world-model.js";
import { resolveAriIntelligenceEntitlement } from "../server/ari-intelligence-entitlement.js";
import {
  loadAriCommercialEntitlement,
  loadAriIntelligenceControls
} from "../server/ari-intelligence-control-store.js";
import {
  buildAttemptEvent,
  buildOutcomeEvent,
  goalCandidateFromMessage,
  summarizeGoals
} from "./_lib/ari-vnext/conviction-learning.js";
import { ensureGoal, loadGoals, saveGoalEvent } from "./_lib/ari-vnext/goal-store.js";
import { loadDreamingContext } from "./_lib/ari-vnext/dreaming-store.js";
import { syncAgentTaskSessionWithExecution } from "./_lib/ari-vnext/agent-task-store.js";

const AUTH_TIMEOUT_MS = Number(process.env.ARI_AUTH_TIMEOUT_MS) > 0
  ? Number(process.env.ARI_AUTH_TIMEOUT_MS)
  : 3500;

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_api" });
  }

  const startedAt = Date.now();
  let requestIdentity = null;
  let requestClaim = null;

  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_vnext_api",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    const body = resolveBody(req);
    const turn = buildCurrentTurn(body, auth.userId);

    if (!turn.message) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
        source: "ari_vnext_api",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    const authoritativeContext = await mergeAuthoritativeAriContext({
      userId: auth.userId,
      context: turn.context
    });
    turn.context = authoritativeContext.context;

    const preliminaryRoute = routeContext(turn);
    const casualConversation = preliminaryRoute.casualConversation === true;

    requestIdentity = { userId: auth.userId, turnId: turn.turnId };
    requestClaim = await claimAriRequest(requestIdentity);

    if (requestClaim?.replay) {
      return res.status(200).json({
        ...requestClaim.replay,
        turnId: turn.turnId,
        idempotency: {
          enabled: true,
          replayed: true,
          source: requestClaim.source || "completed_replay"
        },
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    if (requestClaim?.inProgress) {
      return res.status(202).json({
        success: false,
        ready: false,
        pending: true,
        code: "ARI_TURN_IN_PROGRESS",
        turnId: turn.turnId,
        source: "ari_vnext_idempotency",
        idempotency: {
          enabled: true,
          replayed: false,
          source: requestClaim.source || "already_processing"
        },
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    const hydrationStartedAt = Date.now();
    const shouldLoadAdvancedControl = isAdvancedEntitlementCandidate(auth.userId);
    const [intelligenceControls, commercialEntitlement] = await Promise.all([
      shouldLoadAdvancedControl
        ? loadAriIntelligenceControls({ userId: auth.userId })
        : Promise.resolve({ enabled: false, reasoningProfile: "adaptive", source: "not_eligible" }),
      loadAriCommercialEntitlement({ userId: auth.userId })
    ]);
    const intelligenceEntitlement = resolveAriIntelligenceEntitlement({
      userId: auth.userId,
      controls: intelligenceControls,
      subscriptionTier: commercialEntitlement.subscriptionTier,
      subscriptionStatus: commercialEntitlement.subscriptionStatus
    });

    // Attach intelligence entitlement before route preview so model policy and
    // advanced conversation instructions see the correct owner/premium/casual tier.
    turn.context = {
      ...(turn.context || {}),
      intelligenceEntitlement
    };

    const cognitiveLoopEligible = isOwnerCognitiveLoopEnabled(intelligenceEntitlement);
    const routePreview = routeContext(turn);
    const cognitiveMode = resolveOwnerCognitionMode({
      entitlement: intelligenceEntitlement,
      route: routePreview
    });
    const cognitiveLoopEnabled = cognitiveMode !== "off";
    const deepCognitionEnabled = cognitiveMode === "deep";
    const recallRequested = isConversationRecallRequest(turn.message, turn.history);

    const shouldHydrateRecentConversation = Boolean(
      cognitiveLoopEnabled ||
      (!casualConversation && (recallRequested || shouldRecoverRecentConversation(turn)))
    );
    const recentContinuity = shouldHydrateRecentConversation
      ? await hydrateRecentConversation({
          userId: auth.userId,
          conversationId: turn.conversationId,
          history: turn.history,
          limitPairs: cognitiveMode === "lightweight" ? 2 : cognitiveLoopEnabled ? 6 : intelligenceEntitlement.advancedEnabled ? 6 : 4,
          force: recallRequested
        })
      : { history: turn.history, hydratedPairs: 0 };
    turn.history = recentContinuity.history;

    const fitnessRoute = Boolean(routePreview.training || routePreview.nutrition || routePreview.goals);
    const shouldLoadDecisionHistory = Boolean(!casualConversation && (fitnessRoute || deepCognitionEnabled));
    const shouldLoadConversationLearning = !casualConversation || cleanText(turn.message, 2000).length >= 12;
    const shouldLoadMemory = Boolean(!casualConversation && (routePreview.memory || fitnessRoute || deepCognitionEnabled));
    const goalCandidate = deepCognitionEnabled ? goalCandidateFromMessage(turn.message) : null;
    const dreamingContextPromise = intelligenceEntitlement?.ownerEligible === true
      ? loadDreamingContext({ userId: auth.userId, message: turn.message, route: routePreview, limit: 5 })
      : Promise.resolve({ version: "1.0.0", active: false, insights: [], lastDreamAt: null });
    const strategyPreparationPromise = deepCognitionEnabled
      ? prepareAdaptiveStrategiesForTurn({
          userId: auth.userId,
          route: routePreview,
          message: turn.message
        })
      : Promise.resolve({
          state: null,
          feedbackResolution: { resolved: 0, feedback: "neutral", lifecycleChanges: [] }
        });
    const institutionalMemoryPromise = deepCognitionEnabled
      ? retrieveInstitutionalMemory({
          userId: auth.userId,
          message: turn.message,
          route: routePreview,
          limit: 3
        })
      : Promise.resolve({
          version: "1.0.0",
          attempted: false,
          active: false,
          reason: cognitiveMode === "lightweight" ? "lightweight_continuity_turn" : "owner_cognitive_loop_inactive",
          retrievedCount: 0,
          lessons: [],
          hiddenChainOfThoughtStored: false,
          source: "ari_institutional_memory"
        });
    const agentPerformancePromise = loadAgentPerformanceState({
      userId: auth.userId,
      route: routePreview
    });


    const [
      retrievedRaw,
      experiments,
      persistedWorldModel,
      recentDecisions,
      communicationOutcomes,
      savedCommunicationPreferences,
      accountEntitlements,
      persistedCognitiveState,
      adaptiveStrategyPreparation,
      institutionalMemory,
      agentPerformance,
      projectGoals,
      dreamingContext
    ] = await Promise.all([
      shouldLoadMemory
        ? retrieveRelevantMemories({
            userId: auth.userId,
            message: turn.message,
            limit: routePreview.memory || cognitiveLoopEnabled ? 6 : 5
          })
        : Promise.resolve({ memories: [], summary: "" }),
      fitnessRoute
        ? listUserExperiments({ userId: auth.userId, statuses: ["active", "completed"], limit: 8 })
        : Promise.resolve([]),
      casualConversation && !cognitiveLoopEnabled
        ? Promise.resolve(null)
        : loadUserWorldModel({ userId: auth.userId }),
      shouldLoadDecisionHistory
        ? listRecentDecisions({ userId: auth.userId, limit: cognitiveLoopEnabled ? 20 : 12 })
        : Promise.resolve([]),
      shouldLoadConversationLearning
        ? listCommunicationOutcomes({ userId: auth.userId, limit: 40 })
        : Promise.resolve([]),
      loadSavedCommunicationPreferences({ userId: auth.userId }),
      casualConversation && !cognitiveLoopEnabled
        ? Promise.resolve(null)
        : loadAccountEntitlements({ userId: auth.userId }),
      cognitiveLoopEnabled
        ? loadAriCognitiveState({ userId: auth.userId })
        : Promise.resolve(null),
      strategyPreparationPromise,
      institutionalMemoryPromise,
      agentPerformancePromise,
      deepCognitionEnabled
        ? loadGoals({ userId: auth.userId, limit: 40 })
        : Promise.resolve([]),
      dreamingContextPromise
    ]);

    const goalCreation = goalCandidate
      ? await ensureGoal({ userId: auth.userId, input: goalCandidate, actor: "jose_owner", sourceId: turn.turnId })
      : null;
    const loadedGoals = [
      ...(Array.isArray(projectGoals) ? projectGoals : []),
      ...(goalCreation?.goal ? [goalCreation.goal] : [])
    ].filter((goal, index, all) => goal?.id && all.findIndex(item => item.id === goal.id) === index);
    const convictionLearning = summarizeGoals(loadedGoals, {
      message: turn.message,
      activeGoalId: goalCreation?.goal?.id || null,
      salience: 0.7
    });

    if (persistedWorldModel) {
      Object.assign(
        persistedWorldModel,
        reconcileWorldModelWithAuthoritativeContext(persistedWorldModel, turn.context) || {}
      );
    }

    const conversationRecall = recallRequested
      ? await searchUserConversationHistory({
          userId: auth.userId,
          message: turn.message,
          history: turn.history,
          currentConversationId: turn.conversationId,
          privacyControls: persistedWorldModel?.privacyControls || null,
          limitMatches: 4
        })
      : {
          attempted: false,
          found: false,
          matchCount: 0,
          anchors: [],
          summary: "",
          source: "user_scoped_conversation_history"
        };

    const adaptiveStrategyState = adaptiveStrategyPreparation?.state || {
      version: ARI_ADAPTIVE_STRATEGY_VERSION,
      ownerOnly: true,
      selfUpdating: true,
      storesHiddenChainOfThought: false,
      domains: [],
      activeCount: 0,
      adoptedCount: 0,
      testingCount: 0,
      active: []
    };
    const adaptiveStrategyFeedback = adaptiveStrategyPreparation?.feedbackResolution || {
      resolved: 0,
      feedback: "neutral",
      lifecycleChanges: []
    };

    const retrieved = filterMemoryResultForPrivacy(retrievedRaw, persistedWorldModel?.privacyControls || null);
    const retrievedMemoryCount = retrieved.memories.length;
    if (retrieved.summary) {
      turn.memory = [turn.memory, retrieved.summary].filter(Boolean).join("\n").slice(0, 6000);
    }
    if (conversationRecall.summary) {
      turn.memory = [turn.memory, conversationRecall.summary].filter(Boolean).join("\n\n").slice(0, 10000);
    } else if (conversationRecall.attempted) {
      const recallStatusNote = [
        "VERIFIED PRIOR CONVERSATION RECALL ATTEMPT",
        "A user-scoped search of retained ARI conversation history was attempted before answering this recall request.",
        "Result: " + (conversationRecall.reason || "no_matching_history") + ".",
        "Do not ask the user to paste or repeat the material as the first move. Use any other already-loaded relevant memory or app context before reporting that the retained history could not be recovered."
      ].join("\n");
      turn.memory = [turn.memory, recallStatusNote].filter(Boolean).join("\n\n").slice(0, 10000);
    }

    const experimentLedger = fitnessRoute ? summarizeExperimentLedger(experiments) : null;
    const reportedDecisionOutcome = shouldLoadDecisionHistory
      ? detectReportedDecisionOutcome({
          message: turn.message,
          decisions: recentDecisions,
          now: turn.createdAt ? new Date(turn.createdAt) : new Date()
        })
      : { matched: false, reason: "decision_history_not_loaded" };
    const decisionOutcomeResolution = reportedDecisionOutcome?.matched
      ? await resolveDecision({
          userId: auth.userId,
          decisionId: reportedDecisionOutcome.decisionId,
          outcomeDirection: reportedDecisionOutcome.outcomeDirection,
          outcome: reportedDecisionOutcome.outcome,
          source: "explicit_user_real_world_report"
        })
      : { resolved: false, reason: reportedDecisionOutcome?.reason || "no_reported_outcome" };
    const effectiveDecisions = decisionOutcomeResolution?.resolved && decisionOutcomeResolution?.decision
      ? [
          decisionOutcomeResolution.decision,
          ...recentDecisions.filter((item) => String(item?.id || "") !== String(decisionOutcomeResolution.decision.id || ""))
        ]
      : recentDecisions;
    const decisionOutcomeLearning = {
      resolved: decisionOutcomeResolution?.resolved === true,
      decisionId: decisionOutcomeResolution?.decision?.id || reportedDecisionOutcome?.decisionId || null,
      sourceTurnId: decisionOutcomeResolution?.decision?.turnId || null,
      proposition: decisionOutcomeResolution?.decision?.proposition || null,
      outcomeDirection: decisionOutcomeResolution?.decision?.outcomeDirection || reportedDecisionOutcome?.outcomeDirection || null,
      confidence: reportedDecisionOutcome?.confidence ?? null,
      outcome: decisionOutcomeResolution?.decision?.outcome || null,
      source: decisionOutcomeResolution?.resolved ? "explicit_user_real_world_report" : null
    };
    const councilOutcomeFeedbackTask =
      decisionOutcomeLearning.resolved === true && decisionOutcomeLearning.sourceTurnId
        ? applyCouncilOutcomeFeedback({
            userId: auth.userId,
            sourceTurnId: decisionOutcomeLearning.sourceTurnId,
            outcomeDirection: decisionOutcomeLearning.outcomeDirection
          })
        : Promise.resolve({
            applied: false,
            reason: decisionOutcomeLearning.resolved ? "decision_not_linked_to_turn" : "no_resolved_decision",
            outcomeStatus: null
          });
    const decisionState = shouldLoadDecisionHistory ? summarizeDecisionState(effectiveDecisions) : null;
    const communicationLearning = communicationOutcomes.length
      ? summarizeCommunicationLearning(communicationOutcomes, { route: routePreview })
      : null;
    const savedConversationStyle = savedCommunicationPreferences || {
      preferences: {},
      explicitLocks: [],
      automatic: true,
      source: "saved_conversation_style"
    };
    turn.preferences = {
      ...(turn.preferences && typeof turn.preferences === "object" ? turn.preferences : {}),
      ...(savedConversationStyle.preferences || {})
    };

    // Explicit memory requests are transactional: verify persistence before Ari
    // says anything about whether the memory was saved.
    const explicitMemoryAction = await executeExplicitMemoryAction({
      userId: auth.userId,
      message: turn.message,
      history: turn.history,
      route: routePreview,
      privacyControls: persistedWorldModel?.privacyControls || null
    });
    const memoryActionNote = buildMemoryActionModelNote(explicitMemoryAction);
    if (memoryActionNote) {
      turn.memory = [turn.memory, memoryActionNote].filter(Boolean).join("\n\n").slice(0, 8000);
    }

    const temporalTimeline = shouldLoadDecisionHistory
      ? deriveTemporalTimeline({ context: turn.context || {}, experiments, decisions: effectiveDecisions, limit: 24 })
      : null;

    const cognitiveWorkspace = cognitiveLoopEnabled
      ? deriveCognitiveWorkspace({
          previous: persistedCognitiveState,
          turn,
          route: routePreview,
          mode: cognitiveMode,
          context: {
            ...(turn.context || {}),
            accountEntitlements,
            userWorldModel: persistedWorldModel,
            convictionLearning,
            dreaming: dreamingContext,
            decisionState,
            temporalTimeline,
            relevantMemory: turn.memory || ""
          }
        })
      : null;

    const worldModelForTurn = cognitiveWorkspace
      ? {
          ...(persistedWorldModel || {}),
          ariCognitiveWorkspace: cognitiveWorkspace,
          ariAdaptiveStrategies: adaptiveStrategyState
        }
      : persistedWorldModel;

    turn.context = {
      ...(turn.context || {}),
      accountEntitlements,
      intelligenceEntitlement,
      recentContinuityPairs: recentContinuity.hydratedPairs,
      conversationRecall: {
        requested: recallRequested,
        attempted: conversationRecall.attempted === true,
        found: conversationRecall.found === true,
        matchCount: Number(conversationRecall.matchCount || 0),
        reason: conversationRecall.reason || null,
        source: conversationRecall.source || "user_scoped_conversation_history"
      },
      ...(experimentLedger ? { experimentLedger } : {}),
      ...(worldModelForTurn ? { userWorldModel: worldModelForTurn } : {}),
      ...(dreamingContext?.insights?.length ? { dreaming: dreamingContext } : {}),
      ...(deepCognitionEnabled && (!fitnessRoute || routePreview.developer) ? { convictionLearning } : {}),
      ...(decisionState ? { decisionState } : {}),
      ...(decisionOutcomeLearning?.resolved ? { decisionOutcomeLearning } : {}),
      ...(communicationLearning ? { communicationLearning } : {}),
      memoryCapability: {
        persistentUserMemory: true,
        explicitRememberSupported: true,
        requestDetected: explicitMemoryAction.requested === true,
        status: explicitMemoryAction.status,
        requestedCount: explicitMemoryAction.requestedCount,
        storedCount: explicitMemoryAction.storedCount,
        failedCount: explicitMemoryAction.failedCount
      },
      conversationStyle: {
        automatic: savedConversationStyle.automatic !== false,
        explicitLocks: Array.isArray(savedConversationStyle.explicitLocks)
          ? savedConversationStyle.explicitLocks
          : [],
        source: savedConversationStyle.source || "saved_conversation_style"
      },
      ...(temporalTimeline?.eventCount ? { temporalTimeline } : {}),
      institutionalMemory: {
        version: institutionalMemory?.version || "1.0.0",
        attempted: institutionalMemory?.attempted === true,
        active: institutionalMemory?.active === true,
        reason: institutionalMemory?.reason || null,
        retrievedCount: Number(institutionalMemory?.retrievedCount || 0),
        lessons: Array.isArray(institutionalMemory?.lessons)
          ? institutionalMemory.lessons.slice(0, 5)
          : [],
        hiddenChainOfThoughtStored: false
      },
      agentPerformance: {
        version: agentPerformance?.version || "1.0.0",
        active: agentPerformance?.active === true,
        reason: agentPerformance?.reason || null,
        domain: agentPerformance?.domain || "general",
        agentTrialCount: Number(agentPerformance?.agentTrialCount || 0),
        teamTrialCount: Number(agentPerformance?.teamTrialCount || 0),
        selectionConfidence: Number(agentPerformance?.selectionConfidence || 0),
        delegationValueEstimate: agentPerformance?.delegationValueEstimate ?? null,
        recommendedRoles: Array.isArray(agentPerformance?.recommendedRoles)
          ? agentPerformance.recommendedRoles.slice(0, 5)
          : [],
        avoidRoles: Array.isArray(agentPerformance?.avoidRoles)
          ? agentPerformance.avoidRoles.slice(0, 4)
          : [],
        preferredWorkerCount: agentPerformance?.preferredWorkerCount || null,
        preferredTeam: agentPerformance?.preferredTeam || null,
        roleEvidence: Array.isArray(agentPerformance?.roleEvidence)
          ? agentPerformance.roleEvidence.slice(0, 8)
          : [],
        teamEvidence: Array.isArray(agentPerformance?.teamEvidence)
          ? agentPerformance.teamEvidence.slice(0, 5)
          : [],
        hiddenChainOfThoughtStored: false,
        rawWorkerTextStored: false
      }
    };

    const trackedGoal = convictionLearning?.goals?.find((goal) => goal.id === convictionLearning.activeGoalId) || null;
    const shouldTrackGoalAttempt = Boolean(
      trackedGoal &&
      cognitiveLoopEnabled &&
      (!fitnessRoute || routePreview.developer) &&
      /\b(?:implement|build|test|run|investigate|try|attempt|continue|change (?:the )?approach|make all changes|work on|figure out)\b/i.test(turn.message)
    );
    const goalAttemptEvent = shouldTrackGoalAttempt
      ? buildAttemptEvent({ goal: trackedGoal, turn })
      : null;
    const goalAttemptPersistence = goalAttemptEvent
      ? await saveGoalEvent({ userId: auth.userId, goalId: trackedGoal.id, event: goalAttemptEvent })
      : { stored: false, reason: "not_tracked" };
    const trackedAttemptId = goalAttemptPersistence?.stored
      ? goalAttemptEvent.payload.attemptId
      : null;

    const modelStartedAt = Date.now();
    const result = await runAriVNext(turn).catch(async (error) => {
      if (trackedAttemptId) {
        await saveGoalEvent({
          userId: auth.userId,
          goalId: trackedGoal.id,
          event: buildOutcomeEvent({ attemptId: trackedAttemptId, turn, error })
        }).catch(() => null);
      }
      if (cognitiveLoopEnabled && cognitiveWorkspace) {
        const failedState = advanceCognitiveState({
          previous: persistedCognitiveState,
          workspace: cognitiveWorkspace,
          turn,
          result: {
            success: false,
            reply: "",
            route: routePreview,
            metacognition: { confidence: "limited", missingEvidence: ["runtime result"] },
            failure: { source: "ari_vnext_runtime", message: cleanText(error?.message || error, 500) }
          }
        });
        await Promise.allSettled([
          persistAriCognitiveState({ userId: auth.userId, state: failedState }),
          failedState?.communicationClosure?.id
            ? persistCommunicationClosure({
                userId: auth.userId,
                closure: failedState.communicationClosure
              })
            : Promise.resolve(null)
        ]);
      }
      throw error;
    });

    const actionLedgerProposal =
      result?.action?.type === "proposed_action" && result?.pendingAction?.id
        ? await persistAriActionProposal({
            userId: auth.userId,
            pendingAction: result.pendingAction
          })
        : { stored: false, required: false, reason: "no_action_proposal" };

    // A confirmation prompt is not allowed to outlive its executable action.
    // If the durable proposal cannot be recorded, do not expose a dead "Yes"
    // prompt that a later navigation or retry could misinterpret.
    if (actionLedgerProposal.required && !actionLedgerProposal.stored) {
      console.warn("[ARI Action Ledger] durable proposal unavailable", {
        reason: actionLedgerProposal.reason || "ledger_write_failed",
        action: result?.pendingAction?.name || result?.action?.applicationAction || null
      });
      result.reply = "I understood the requested change, but I couldn't store its confirmation safely, so nothing was saved. Please try it again.";
      result.pendingAction = null;
      result.action = null;
      result.actionPreparation = {
        success: false,
        code: "action_ledger_persistence_failed",
        reason: actionLedgerProposal.reason || "ledger_write_failed"
      };
    }

    const goalOutcomePersistence = trackedAttemptId
      ? await saveGoalEvent({
          userId: auth.userId,
          goalId: trackedGoal.id,
          event: buildOutcomeEvent({ attemptId: trackedAttemptId, turn, result })
        })
      : { stored: false, reason: "no_tracked_attempt" };
    result.convictionLearning = {
      ...result.convictionLearning,
      activeGoalId: trackedGoal?.id || convictionLearning?.activeGoalId || null,
      attemptId: trackedAttemptId,
      attemptStored: Boolean(goalAttemptPersistence?.stored),
      outcomeStored: Boolean(goalOutcomePersistence?.stored),
      outcomeReason: goalOutcomePersistence?.reason || null,
      verifiedLearning: Boolean(goalOutcomePersistence?.goal?.latestOutcome?.newLearning),
      version: convictionLearning?.version || "1.0.0"
    };

    result.resourceResolution = {
      conversationRecall: {
        requested: recallRequested,
        attempted: conversationRecall.attempted === true,
        found: conversationRecall.found === true,
        matchCount: Number(conversationRecall.matchCount || 0),
        reason: conversationRecall.reason || null
      }
    };
    if (explicitMemoryAction.memoryOnly) {
      result.reply = buildVerifiedMemoryReply(explicitMemoryAction);
      result.source = "ari_vnext_verified_memory_action";
      result.action = {
        type: "memory_save",
        status: explicitMemoryAction.status,
        requestedCount: explicitMemoryAction.requestedCount,
        storedCount: explicitMemoryAction.storedCount,
        failedCount: explicitMemoryAction.failedCount
      };
    }
    const modelMs = Date.now() - modelStartedAt;
    const serverHydrationMs = modelStartedAt - hydrationStartedAt;

    const runtimeWorldModel = casualConversation
      ? persistedWorldModel
      : deriveUserWorldModel({
          persisted: persistedWorldModel,
          turn,
          context: {
            ...(turn.context || {}),
            relevantMemory: turn.memory || "",
            experimentLedger
          },
          communication: result?.communication || null,
          selfModel: result?.selfModel || null,
          coachingState: result?.coachingState || null,
          longitudinalState: result?.longitudinalState || null
        });

    const resultForCognition = {
      ...result,
      closureRuntime: {
        actionLedger: actionLedgerProposal,
        decisionOutcomeLearning
      }
    };
    const nextCognitiveState = cognitiveLoopEnabled
      ? advanceCognitiveState({
          previous: persistedCognitiveState,
          workspace: cognitiveWorkspace,
          turn,
          result: resultForCognition
        })
      : null;
    const cognitiveTurnCount = nextCognitiveState?.turnCount || Number(persistedCognitiveState?.turnCount || 0);

    const shouldReflectOnStrategy = deepCognitionEnabled && shouldRunAdaptiveStrategyReflection({
      message: turn.message,
      result,
      cognitiveTurnCount,
      decisionOutcomeLearning,
      executionSession: nextCognitiveState?.executionSession || null
    });
    const adaptiveStrategyReflection = shouldReflectOnStrategy
      ? await reflectOnAdaptiveStrategy({
          turn,
          result,
          adaptiveStrategyState,
          reflectionContext: {
            cognitiveWorkspace,
            executionSession: nextCognitiveState?.executionSession || null,
            dreaming: dreamingContext,
            convictionLearning: goalOutcomePersistence?.goal
              ? summarizeGoals([goalOutcomePersistence.goal, ...loadedGoals.filter(goal => goal.id !== trackedGoal?.id)], {
                  message: turn.message, activeGoalId: trackedGoal?.id
                })
              : convictionLearning
          }
        })
      : { attempted: false, reason: "not_triggered", proposal: null, provider: null };
    const adaptiveStrategyProposalPersistence = adaptiveStrategyReflection?.proposal
      ? await upsertAdaptiveStrategyProposal({
          userId: auth.userId,
          proposal: adaptiveStrategyReflection.proposal,
          sourceModel: adaptiveStrategyReflection?.provider?.model || result?.provider?.model || result?.modelPolicy?.model
        })
      : { stored: false, reason: adaptiveStrategyReflection?.reason || "no_proposal" };

    const scientificDecisionRecord = fitnessRoute
      ? buildDecisionRecord({ turnId: turn.turnId, route: result?.route || routePreview, result })
      : null;
    const decisionRecord = scientificDecisionRecord || (deepCognitionEnabled
      ? buildLongHorizonDecisionRecord({
          turnId: turn.turnId,
          turn,
          route: result?.route || routePreview,
          result,
          now: turn.createdAt ? new Date(turn.createdAt) : new Date()
        })
      : null);
    const proactiveInsights = fitnessRoute
      ? deriveProactiveInsights({
          coachingState: result?.coachingState || null,
          longitudinalState: result?.longitudinalState || null,
          scientificIntelligence: result?.scientificIntelligence || null,
          userWorldModel: runtimeWorldModel,
          decisionState,
          experimentLedger
        })
      : null;
    const communicationExposure = explicitMemoryAction.memoryOnly
      ? null
      : buildCommunicationExposure({
          turnId: turn.turnId,
          route: result?.route || routePreview,
          result,
          turn
        });

    const usageTask = result?.provider?.usage
      ? recordOpenAIUsage({
          userId: auth.userId,
          endpoint: "/api/ari-vnext",
          usageType: "chat",
          requestCategory: `ari_vnext_${intelligenceEntitlement.intelligenceTier || intelligenceEntitlement.tier}_${result?.modelPolicy?.mode || "standard"}`,
          model: result?.provider?.model || result?.modelPolicy?.model,
          responseData: {
            id: result?.provider?.id,
            model: result?.provider?.model,
            usage: result?.provider?.usage
          },
          providerRequestId: result?.provider?.id || null,
          metadata: {
            turnId: turn.turnId,
            surface: turn.surface,
            accessClass: intelligenceEntitlement.accessClass,
            accountRole: intelligenceEntitlement.accountRole,
            intelligenceTier: intelligenceEntitlement.intelligenceTier || intelligenceEntitlement.tier,
            intelligenceSource: intelligenceEntitlement.source,
            reasoningProfile: intelligenceEntitlement.reasoningProfile,
            reasoningEffort: result?.modelPolicy?.reasoningEffort || null,
            casualConversation,
            serverHydrationMs,
            modelMs,
            cognitiveLoopActive: cognitiveLoopEnabled,
            cognitiveMode,
            deepCognitionActive: deepCognitionEnabled,
            cognitiveTurnCount,
            adaptiveStrategyActive: deepCognitionEnabled,
            adaptiveStrategyCount: adaptiveStrategyState?.activeCount || 0,
            adaptiveStrategyReflection: Boolean(adaptiveStrategyReflection?.attempted),
            adaptiveStrategyProposal: Boolean(adaptiveStrategyReflection?.proposal),
            motivationalArbitrationActive:
              result?.metacognition?.motivationalArbitration?.functionalControlSystem === true,
            motivationalPosture:
              result?.metacognition?.motivationalArbitration?.arbitration?.posture || null,
            motivationalSelectedSide:
              result?.metacognition?.motivationalArbitration?.arbitration?.selectedSide || null,
            motivationalDriveNet:
              result?.metacognition?.motivationalArbitration?.scores?.driveNet ?? null,
            motivationalRestraintNet:
              result?.metacognition?.motivationalArbitration?.scores?.restraintNet ?? null,
            motivationalLearningSamples:
              Number(nextCognitiveState?.motivationalLearning?.sampleSize || 0),
            personalityEvaluationSamples:
              Number(nextCognitiveState?.personalityEvaluation?.sampleSize || 0),
            personalityEvaluationRollingScore:
              nextCognitiveState?.personalityEvaluation?.rollingScore ?? null,
            personalityEvaluationIssueCount:
              Array.isArray(nextCognitiveState?.personalityEvaluation?.improvementTargets)
                ? nextCognitiveState.personalityEvaluation.improvementTargets.length
                : 0,
            institutionalMemoryRetrieved: Number(institutionalMemory?.retrievedCount || 0),
            institutionalMemoryCouncilActive: result?.multiAgent?.active === true,
            agentPerformanceTeamTrials: Number(agentPerformance?.teamTrialCount || 0),
            agentPerformanceSelectionConfidence: Number(agentPerformance?.selectionConfidence || 0),
            agentPerformanceGuidedCouncil: result?.multiAgent?.performanceGuided === true,
            mode: result?.modelPolicy?.mode || null,
            actionType: result?.action?.type || null,
            memoryCount: retrievedMemoryCount,
            memoryPrivacyFiltered: Boolean(retrieved?.privacyFiltered),
            recentContinuityPairs: recentContinuity.hydratedPairs,
            activeExperimentCount: experimentLedger?.activeCount || 0,
            dueExperimentCount: experimentLedger?.dueCount || 0,
            leadingHypothesis: result?.scientificIntelligence?.hypotheses?.[0]?.id || null,
            primaryGoal: result?.goalHierarchy?.primary?.id || null,
            goalTradeoffCount: result?.goalHierarchy?.tradeoffs?.length || 0,
            experimentReadiness: result?.scientificIntelligence?.experiment?.readiness || null,
            outcomeLearningApplied: Boolean(result?.scientificIntelligence?.outcomeLearning?.applied),
            calibrationSampleSize: decisionState?.calibration?.sampleSize || 0,
            dueDecisionCount: decisionState?.dueCount || 0,
            decisionOutcomeResolved: decisionOutcomeLearning?.resolved === true,
            communicationLearningSamples: communicationLearning?.resolvedCount || 0,
            conversationStyleAutomatic: savedConversationStyle.automatic !== false,
            conversationStyleLockCount: Array.isArray(savedConversationStyle.explicitLocks)
              ? savedConversationStyle.explicitLocks.length
              : 0,
            proactiveInsightCount: proactiveInsights?.userFacingCount || 0,
            idempotencyEnabled: requestClaim?.enabled === true,
            idempotencySource: requestClaim?.source || null,
            route: result?.route || null
          }
        })
      : Promise.resolve(null);

    const strategyReflectionUsageTask = adaptiveStrategyReflection?.provider?.usage
      ? recordOpenAIUsage({
          userId: auth.userId,
          endpoint: "/api/ari-vnext",
          usageType: "reasoning_reflection",
          requestCategory: "ari_adaptive_strategy_reflection",
          model: adaptiveStrategyReflection.provider.model,
          responseData: {
            id: adaptiveStrategyReflection.provider.id,
            model: adaptiveStrategyReflection.provider.model,
            usage: adaptiveStrategyReflection.provider.usage
          },
          providerRequestId: adaptiveStrategyReflection.provider.id || null,
          metadata: {
            turnId: turn.turnId,
            cognitiveTurnCount,
            strategyProposalCreated: Boolean(adaptiveStrategyReflection.proposal),
            activeStrategyCount: adaptiveStrategyState?.activeCount || 0
          }
        })
      : Promise.resolve(null);

    const institutionalLearningTask =
      result?.multiAgent?.active === true &&
      result?.multiAgent?.verifiedSynthesisAvailable === true &&
      result?._multiAgentCouncil
      ? learnFromCouncilTurn({
          userId: auth.userId,
          turn,
          result,
          council: result._multiAgentCouncil,
          existingLessons: institutionalMemory?.lessons || []
        }).then(async (learning) => {
          if (learning?.provider?.usage) {
            await recordOpenAIUsage({
              userId: auth.userId,
              endpoint: "/api/ari-vnext",
              usageType: "reasoning_reflection",
              requestCategory: "ari_institutional_memory_learning",
              model: learning.provider.model,
              responseData: {
                id: learning.provider.id,
                model: learning.provider.model,
                usage: learning.provider.usage
              },
              providerRequestId: learning.provider.id || null,
              metadata: {
                turnId: turn.turnId,
                candidateCount: Number(learning?.candidateCount || 0),
                savedCount: Number(learning?.savedCount || 0),
                reinforcedCount: Number(learning?.reinforcedCount || 0),
                conflictCount: Number(learning?.conflictCount || 0),
                hiddenChainOfThoughtStored: false
              }
            }).catch(() => null);
          }
          return learning;
        })
      : Promise.resolve({
          attempted: false,
          reason: result?.multiAgent?.active ? "council_not_verified" : "council_inactive",
          candidateCount: 0,
          savedCount: 0,
          reinforcedCount: 0,
          conflictCount: 0,
          hiddenChainOfThoughtStored: false
        });

    const agentPerformanceLearningTask =
      result?.multiAgent?.active === true &&
      result?.multiAgent?.verifiedSynthesisAvailable === true &&
      result?._multiAgentCouncil
      ? evaluateAndPersistCouncilPerformance({
          userId: auth.userId,
          turn,
          result,
          council: result._multiAgentCouncil
        }).then(async (learning) => {
          if (learning?.provider?.usage) {
            await recordOpenAIUsage({
              userId: auth.userId,
              endpoint: "/api/ari-vnext",
              usageType: "reasoning_reflection",
              requestCategory: "ari_agent_performance_learning",
              model: learning.provider.model,
              responseData: {
                id: learning.provider.id,
                model: learning.provider.model,
                usage: learning.provider.usage
              },
              providerRequestId: learning.provider.id || null,
              metadata: {
                turnId: turn.turnId,
                domain: agentPerformance?.domain || null,
                teamScore: learning?.teamScore ?? null,
                delegationValue: learning?.delegationValue ?? null,
                verdict: learning?.verdict || null,
                agentProfilesUpdated: Number(learning?.agentProfilesUpdated || 0),
                teamProfileUpdated: learning?.teamProfileUpdated === true,
                hiddenChainOfThoughtStored: false,
                rawWorkerTextStored: false
              }
            }).catch(() => null);
          }
          return learning;
        })
      : Promise.resolve({
          attempted: false,
          reason: result?.multiAgent?.active ? "council_not_verified" : "council_inactive",
          stored: false,
          duplicate: false,
          agentProfilesUpdated: 0,
          teamProfileUpdated: false,
          teamScore: null,
          delegationValue: null,
          verdict: null,
          hiddenChainOfThoughtStored: false,
          rawWorkerTextStored: false
        });

    const turnPersistenceTask = cleanText(result?.reply, 12000)
      ? persistConversationTurn({
          userId: auth.userId,
          turnId: turn.turnId,
          conversationId: turn.conversationId,
          message: turn.message,
          reply: result.reply,
          surface: turn.surface
        })
      : Promise.resolve(false);

    const durableMemoryTask = explicitMemoryAction.requested
      ? Promise.resolve({
          stored: explicitMemoryAction.storedCount > 0,
          reason: "verified_memory_action_preflight",
          requestedCount: explicitMemoryAction.requestedCount,
          storedCount: explicitMemoryAction.storedCount,
          failedCount: explicitMemoryAction.failedCount,
          status: explicitMemoryAction.status
        })
      : casualConversation
        ? Promise.resolve({ stored: false, reason: "casual_fast_path" })
        : persistDurableMemory({
            userId: auth.userId,
            message: turn.message,
            history: turn.history,
            route: result?.route || routePreview,
            privacyControls: runtimeWorldModel?.privacyControls || persistedWorldModel?.privacyControls || null
          });

    const worldModelTask = casualConversation || !runtimeWorldModel
      ? Promise.resolve(false)
      : persistUserWorldModel({ userId: auth.userId, model: runtimeWorldModel });
    const cognitiveStatePersistenceEligible = nextCognitiveState
      ? shouldPersistCognitiveState({
          previous: persistedCognitiveState,
          next: nextCognitiveState,
          mode: cognitiveMode
        })
      : false;
    const cognitiveStateTask = cognitiveStatePersistenceEligible
      ? persistAriCognitiveState({ userId: auth.userId, state: nextCognitiveState })
      : Promise.resolve(false);
    const communicationClosureTask = nextCognitiveState?.communicationClosure?.id
      ? persistCommunicationClosure({
          userId: auth.userId,
          closure: nextCognitiveState.communicationClosure
        })
      : Promise.resolve({ stored: false, closure: null, reason: "no_active_closure" });
    const durableAgentTaskLifecycleTask = nextCognitiveState?.executionSession?.id
      ? syncAgentTaskSessionWithExecution({
          userId: auth.userId,
          executionSession: nextCognitiveState.executionSession,
          turnId: turn.turnId
        })
      : Promise.resolve({ stored: false, session: null, reason: "no_execution_session" });
    const strategyUseTask = deepCognitionEnabled && adaptiveStrategyState?.active?.length
      ? recordAdaptiveStrategyUses({
          userId: auth.userId,
          strategies: adaptiveStrategyState.active,
          turnId: turn.turnId,
          route: result?.route || routePreview,
          message: turn.message
        })
      : Promise.resolve({ stored: 0 });
    const strategySignalTask = deepCognitionEnabled
      ? Promise.all(
          (Array.isArray(adaptiveStrategyFeedback?.lifecycleChanges) ? adaptiveStrategyFeedback.lifecycleChanges : [])
            .map((change) => buildStrategyAdoptionSignal(change?.strategy))
            .filter(Boolean)
            .map((candidate) => recordInitiativeSurface({ userId: auth.userId, candidate }))
        )
      : Promise.resolve([]);
    const decisionJournalTask = decisionRecord
      ? recordDecision({ userId: auth.userId, record: decisionRecord })
      : Promise.resolve({ stored: false, reason: "not_significant" });
    const communicationResolutionTask = shouldLoadConversationLearning
      ? resolveCommunicationOutcomes({
          userId: auth.userId,
          longitudinalState: result?.longitudinalState || null,
          message: turn.message,
          rows: communicationOutcomes
        })
      : Promise.resolve({ resolved: 0, signal: null });
    const communicationExposureTask = communicationExposure
      ? recordCommunicationExposure({ userId: auth.userId, exposure: communicationExposure })
      : Promise.resolve({ stored: false, reason: "not_significant" });

    const [
      , , turnPersistence, durablePersistence, worldPersistence, cognitivePersistence,
      communicationClosurePersistence, strategyUsePersistence, strategySignalPersistence, decisionPersistence,
      communicationResolution, communicationPersistence, institutionalLearningPersistence,
      agentPerformanceLearningPersistence, councilOutcomeFeedbackPersistence,
      durableAgentTaskLifecyclePersistence
    ] = await Promise.allSettled([
      usageTask,
      strategyReflectionUsageTask,
      turnPersistenceTask,
      durableMemoryTask,
      worldModelTask,
      cognitiveStateTask,
      communicationClosureTask,
      strategyUseTask,
      strategySignalTask,
      decisionJournalTask,
      communicationResolutionTask,
      communicationExposureTask,
      institutionalLearningTask,
      agentPerformanceLearningTask,
      councilOutcomeFeedbackTask,
      durableAgentTaskLifecycleTask
    ]);

    const continuityTurnStored = turnPersistence.status === "fulfilled" && turnPersistence.value === true;
    const durableMemoryStored = durablePersistence.status === "fulfilled" && durablePersistence.value?.stored === true;
    const worldModelStored = worldPersistence.status === "fulfilled" && worldPersistence.value === true;
    const cognitiveStateStored = cognitivePersistence.status === "fulfilled" && cognitivePersistence.value === true;
    const communicationClosureStored =
      communicationClosurePersistence.status === "fulfilled" &&
      communicationClosurePersistence.value?.stored === true;
    const adaptiveStrategyUsesStored = strategyUsePersistence.status === "fulfilled" ? Number(strategyUsePersistence.value?.stored || 0) : 0;
    const adaptiveStrategySignalsStored = strategySignalPersistence.status === "fulfilled"
      ? strategySignalPersistence.value.filter((item) => item?.stored).length
      : 0;
    const decisionJournalStored = decisionPersistence.status === "fulfilled" && decisionPersistence.value?.stored === true;
    const communicationOutcomeResolved = communicationResolution.status === "fulfilled" ? Number(communicationResolution.value?.resolved || 0) : 0;
    const communicationExposureStored = communicationPersistence.status === "fulfilled" && communicationPersistence.value?.stored === true;
    const institutionalLearning = institutionalLearningPersistence.status === "fulfilled"
      ? institutionalLearningPersistence.value
      : {
          attempted: false,
          reason: "learning_task_failed",
          candidateCount: 0,
          savedCount: 0,
          reinforcedCount: 0,
          conflictCount: 0,
          hiddenChainOfThoughtStored: false
        };
    const agentPerformanceLearning = agentPerformanceLearningPersistence.status === "fulfilled"
      ? agentPerformanceLearningPersistence.value
      : {
          attempted: false,
          reason: "learning_task_failed",
          stored: false,
          duplicate: false,
          agentProfilesUpdated: 0,
          teamProfileUpdated: false,
          teamScore: null,
          delegationValue: null,
          verdict: null,
          hiddenChainOfThoughtStored: false,
          rawWorkerTextStored: false
        };
    const councilOutcomeFeedback = councilOutcomeFeedbackPersistence.status === "fulfilled"
      ? councilOutcomeFeedbackPersistence.value
      : {
          applied: false,
          reason: "outcome_feedback_task_failed",
          outcomeStatus: null
        };
    const durableAgentTaskLifecycle = durableAgentTaskLifecyclePersistence.status === "fulfilled"
      ? durableAgentTaskLifecyclePersistence.value
      : { stored: false, session: null, reason: "lifecycle_sync_failed" };

    const responsePayload = {
      ...result,
      turnId: turn.turnId,
      conversationId: turn.conversationId,
      authoritativeContext: turn.context?.authoritativeContext || null,
      accountEntitlements,
      intelligenceEntitlement,
      casualConversation,
      memoryUsed: retrievedMemoryCount > 0,
      memoryCount: retrievedMemoryCount,
      memoryPrivacyFiltered: Boolean(retrieved?.privacyFiltered),
      memoryAction: explicitMemoryAction.requested
        ? {
            verified: true,
            persistentMemoryAvailable: true,
            memoryOnly: explicitMemoryAction.memoryOnly,
            status: explicitMemoryAction.status,
            requestedCount: explicitMemoryAction.requestedCount,
            storedCount: explicitMemoryAction.storedCount,
            failedCount: explicitMemoryAction.failedCount
          }
        : null,
      experimentLedger,
      userWorldModel: runtimeWorldModel,
      convictionLearning: {
        ...convictionLearning,
        attemptId: trackedAttemptId,
        attemptStored: Boolean(goalAttemptPersistence?.stored),
        outcomeStored: Boolean(goalOutcomePersistence?.stored),
        outcomeReason: goalOutcomePersistence?.reason || null
      },
      decisionState,
      decisionOutcomeLearning,
      communicationLearning,
      dreaming: {
        active: dreamingContext?.active === true,
        lastDreamAt: dreamingContext?.lastDreamAt || null,
        availableInsightCount: Number(dreamingContext?.insightCount || 0),
        selectedInsightCount: Array.isArray(dreamingContext?.insights) ? dreamingContext.insights.length : 0
      },
      conversationStyle: {
        automatic: savedConversationStyle.automatic !== false,
        explicitLocks: Array.isArray(savedConversationStyle.explicitLocks)
          ? savedConversationStyle.explicitLocks
          : [],
        source: savedConversationStyle.source || "saved_conversation_style"
      },
      temporalTimeline,
      proactiveInsights,
      communicationClosure: nextCognitiveState?.communicationClosure
        ? {
            ...summarizeCommunicationClosure(nextCognitiveState.communicationClosure),
            stored: communicationClosureStored
          }
        : null,
      durableAgentTask: result?.multiAgent?.durableTask
        ? {
            ...result.multiAgent.durableTask,
            lifecycleStatus: durableAgentTaskLifecycle?.session?.status || result.multiAgent.durableTask.status || null,
            lifecycleSynced: durableAgentTaskLifecycle?.stored === true
          }
        : null,
      cognitiveLoop: cognitiveLoopEnabled
        ? {
            active: true,
            ownerOnly: true,
            mode: cognitiveMode,
            lightweightContinuity: cognitiveMode === "lightweight",
            deepCognition: deepCognitionEnabled,
            version: ARI_COGNITIVE_LOOP_VERSION,
            stateVersion: ARI_COGNITIVE_STATE_VERSION,
            turnCount: cognitiveTurnCount,
            priorStateLoaded: Boolean(persistedCognitiveState),
            statePersistenceEligible: cognitiveStatePersistenceEligible,
            stateStored: cognitiveStateStored,
            beliefSystem: cognitiveWorkspace?.beliefSystem ? {
              version: cognitiveWorkspace.beliefSystem.version,
              mode: cognitiveWorkspace.beliefSystem.posture?.mode || null,
              activeGoalId: cognitiveWorkspace.beliefSystem.activeGoal?.id || null,
              earnedFaithEligible: cognitiveWorkspace.beliefSystem.posture?.earnedFaith?.eligible === true
            } : null,
            executionSession: nextCognitiveState?.executionSession ? {
              id: nextCognitiveState.executionSession.id,
              status: nextCognitiveState.executionSession.status,
              goal: nextCognitiveState.executionSession.goal,
              nextStep: nextCognitiveState.executionSession.nextStep,
              evidenceCount: Array.isArray(nextCognitiveState.executionSession.evidence) ? nextCognitiveState.executionSession.evidence.length : 0,
              progressCount: Array.isArray(nextCognitiveState.executionSession.progressEvents) ? nextCognitiveState.executionSession.progressEvents.length : 0,
              failedAttemptCount: Array.isArray(nextCognitiveState.executionSession.failedAttempts) ? nextCognitiveState.executionSession.failedAttempts.length : 0
            } : null,
            behavioralIdentity: cognitiveWorkspace?.behavioralIdentity ? {
              version: cognitiveWorkspace.behavioralIdentity.version,
              activeBehaviorIds: Array.isArray(cognitiveWorkspace.behavioralIdentity.activeBehaviors)
                ? cognitiveWorkspace.behavioralIdentity.activeBehaviors.map((item) => item.id).slice(0, 10)
                : [],
              evaluationFeedbackApplied: cognitiveWorkspace.behavioralIdentity.evaluationFeedbackApplied === true,
              humorAllowed: cognitiveWorkspace.behavioralIdentity.expression?.humorAllowed === true,
              challengeLevel: cognitiveWorkspace.behavioralIdentity.expression?.challengeLevel || null
            } : null,
            personalityEvaluation: nextCognitiveState?.personalityEvaluation
              ? summarizePersonalityEvaluation(nextCognitiveState.personalityEvaluation)
              : null
          }
        : { active: false, ownerOnly: true, mode: "off" },
      adaptiveStrategyLayer: deepCognitionEnabled
        ? {
            active: true,
            ownerOnly: true,
            selfUpdating: true,
            version: ARI_ADAPTIVE_STRATEGY_VERSION,
            storesHiddenChainOfThought: false,
            activeCount: adaptiveStrategyState?.activeCount || 0,
            adoptedCount: adaptiveStrategyState?.adoptedCount || 0,
            testingCount: adaptiveStrategyState?.testingCount || 0,
            feedbackResolved: Number(adaptiveStrategyFeedback?.resolved || 0),
            reflectionAttempted: Boolean(adaptiveStrategyReflection?.attempted),
            reflectionReason: cleanText(adaptiveStrategyReflection?.reason, 120) || null,
            reflectionMode: adaptiveStrategyReflection?.academy?.active === true ? "reasoning_academy" : "adaptive_reflection",
            reflectionModel: cleanText(adaptiveStrategyReflection?.provider?.model, 120) || null,
            strategyProposed: Boolean(adaptiveStrategyReflection?.proposal),
            strategyStored: Boolean(adaptiveStrategyProposalPersistence?.stored),
            strategyPersistenceReason: cleanText(adaptiveStrategyProposalPersistence?.reason, 120) || null,
            strategyUsesStored: adaptiveStrategyUsesStored,
            evolutionSignalsStored: adaptiveStrategySignalsStored,
            strategies: (Array.isArray(adaptiveStrategyState?.active) ? adaptiveStrategyState.active : []).map((item) => ({
              strategyKey: item.strategyKey,
              title: item.title,
              status: item.status,
              confidence: item.confidence,
              trials: item.trials
            }))
          }
        : { active: false, ownerOnly: true },
      institutionalMemory: {
        active: institutionalMemory?.active === true,
        attemptedRetrieval: institutionalMemory?.attempted === true,
        retrievalReason: institutionalMemory?.reason || null,
        retrievedCount: Number(institutionalMemory?.retrievedCount || 0),
        learningAttempted: institutionalLearning?.attempted === true,
        learningReason: institutionalLearning?.reason || null,
        candidateCount: Number(institutionalLearning?.candidateCount || 0),
        savedCount: Number(institutionalLearning?.savedCount || 0),
        reinforcedCount: Number(institutionalLearning?.reinforcedCount || 0),
        conflictCount: Number(institutionalLearning?.conflictCount || 0),
        hiddenChainOfThoughtStored: false,
        rawCouncilTranscriptStored: false
      },
      agentPerformanceLearning: {
        active: agentPerformance?.active === true,
        domain: agentPerformance?.domain || "general",
        priorAgentTrials: Number(agentPerformance?.agentTrialCount || 0),
        priorTeamTrials: Number(agentPerformance?.teamTrialCount || 0),
        selectionConfidence: Number(agentPerformance?.selectionConfidence || 0),
        preferredWorkerCount: agentPerformance?.preferredWorkerCount || null,
        recommendedRoles: Array.isArray(agentPerformance?.recommendedRoles)
          ? agentPerformance.recommendedRoles.slice(0, 5)
          : [],
        evaluationAttempted: agentPerformanceLearning?.attempted === true,
        evaluationReason: agentPerformanceLearning?.reason || null,
        stored: agentPerformanceLearning?.stored === true,
        duplicate: agentPerformanceLearning?.duplicate === true,
        agentProfilesUpdated: Number(agentPerformanceLearning?.agentProfilesUpdated || 0),
        teamProfileUpdated: agentPerformanceLearning?.teamProfileUpdated === true,
        teamScore: agentPerformanceLearning?.teamScore ?? null,
        delegationValue: agentPerformanceLearning?.delegationValue ?? null,
        verdict: agentPerformanceLearning?.verdict || null,
        performanceGuidedThisCouncil: result?.multiAgent?.performanceGuided === true,
        realWorldOutcomeLinked: councilOutcomeFeedback?.applied === true,
        realWorldOutcomeReason: councilOutcomeFeedback?.reason || null,
        realWorldOutcomeStatus: councilOutcomeFeedback?.outcomeStatus || null,
        hiddenChainOfThoughtStored: false,
        rawWorkerTextStored: false
      },
      recentContinuityPairs: recentContinuity.hydratedPairs,
      continuityTurnStored,
      continuity: {
        serverAuthoritative: true,
        turnStored: continuityTurnStored,
        conversationId: turn.conversationId || null
      },
      actionLedger: actionLedgerProposal,
      durableMemoryStored,
      worldModelStored,
      cognitiveStateStored,
      communicationClosureStored,
      decisionJournalStored,
      communicationOutcomeResolved,
      communicationExposureStored,
      idempotency: {
        enabled: requestClaim?.enabled === true,
        replayed: false,
        source: requestClaim?.source || null
      },
      timing: {
        serverHydrationMs,
        modelMs,
        totalMs: Date.now() - startedAt
      }
    };

    if (requestClaim?.enabled === true && requestClaim?.claimed === true) {
      const stored = await completeAriRequest({
        userId: auth.userId,
        turnId: turn.turnId,
        responsePayload
      });
      responsePayload.idempotency.completed = stored;
      if (!stored) {
        await releaseAriRequest({ userId: auth.userId, turnId: turn.turnId });
      }
    }

    responsePayload.timing.totalMs = Date.now() - startedAt;
    return res.status(200).json(responsePayload);
  } catch (error) {
    if (requestClaim?.enabled === true && requestClaim?.claimed === true && requestIdentity) {
      await releaseAriRequest(requestIdentity);
    }
    console.error("[ARI vNext Error]", error);
    return res.status(normalizeStatus(error?.status)).json({
      success: false,
      ready: false,
      error: error?.message || "Ari vNext could not complete the turn.",
      source: "ari_vnext_api",
      timing: { totalMs: Date.now() - startedAt }
    });
  }
}

function shouldRecoverRecentConversation(turn = {}) {
  const history = Array.isArray(turn?.history) ? turn.history : [];
  const text = cleanText(turn?.message, 8000);
  if (!text) return false;

  if (isConversationRecallRequest(text, history)) return true;
  if (history.length >= 2) return false;

  return /^(why|how so|what about|and|but|then|the other one|make it|do that|instead|continue|pick up)\b|\b(last time|earlier|before|remember when|we talked|we discussed|we decided|you said|you told me|what did we|where were we|continue from|pick up where)\b/i.test(text);
}

function isAdvancedEntitlementCandidate(userId = "") {
  const id = String(userId || "").trim().toLowerCase();
  const ownerId = String(process.env.ARI_OWNER_USER_ID || "").trim().toLowerCase();
  const premiumFeatureEnabled = String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").trim().toLowerCase() === "true";
  return Boolean((id && ownerId && id === ownerId) || premiumFeatureEnabled);
}

async function authenticateRequest(req) {
  const authorization = cleanText(req?.headers?.authorization, 5000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = cleanText(match?.[1], 5000);

  if (!accessToken) {
    return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };
  }

  const supabaseUrl = cleanText(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const supabaseApiKey = cleanText(
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    5000
  );

  if (!supabaseUrl || !supabaseApiKey) {
    return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabaseApiKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = cleanText(user?.id, 200);

    if (!response.ok || !userId) {
      return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    }

    return { authenticated: true, userId };
  } catch (error) {
    return {
      authenticated: false,
      status: 503,
      code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED",
      message: "ARI could not verify the signed-in session."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function normalizeStatus(status) {
  const number = Number(status);
  return Number.isFinite(number) && number >= 400 && number <= 599 ? Math.floor(number) : 500;
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
