import { mergeCommunityQuestionIntoCuriosityState } from "./community-learning.js";
import { upsertAdaptiveStrategyProposal } from "./adaptive-strategy-store.js";
import { loadUserWorldModel, persistUserWorldModel } from "./user-world-model.js";

function emptyWorldModel() {
  return {
    identity: {},
    preferences: {},
    goals: {},
    constraints: {},
    behavior: {},
    responseProfile: {},
    physiologicalResponse: {},
    relationship: {},
    tensions: [],
    sourceSummary: {},
    privacyControls: { blockedCategories: [] }
  };
}

export async function persistCommunityLearningArtifacts({
  userId,
  analysis,
  thread,
  sourceModel = null
} = {}) {
  const strategyPersistence = analysis?.strategy
    ? await upsertAdaptiveStrategyProposal({
        userId,
        proposal: analysis.strategy,
        sourceModel
      })
    : { stored: false, reason: "no_strategy_hypothesis", strategy: null };

  const curiosityPersistence = await persistCommunityResearchQuestion({
    userId,
    analysis,
    thread
  });

  return { strategyPersistence, curiosityPersistence };
}

export async function persistCommunityResearchQuestion({ userId, analysis, thread } = {}) {
  if (!analysis?.research) {
    return { stored: false, reason: "no_research_question", question: null };
  }

  const current = await loadUserWorldModel({ userId }) || emptyWorldModel();
  const curiosityState = mergeCommunityQuestionIntoCuriosityState({
    curiosityState: current?.sourceSummary?.curiosityState,
    analysis,
    thread
  });

  const stored = await persistUserWorldModel({
    userId,
    model: {
      ...current,
      sourceSummary: {
        ...(current?.sourceSummary || {}),
        curiosityState
      }
    }
  });

  return {
    stored,
    reason: stored ? "community_research_question_persisted" : "world_model_write_failed",
    question: {
      topic: analysis.research.topic,
      question: analysis.research.question,
      priority: analysis.research.priority,
      informationGain: analysis.research.informationGain
    }
  };
}
