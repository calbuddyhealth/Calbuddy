import { mkdirSync, writeFileSync } from "node:fs";
import {
  deriveInstructionActivation,
  deriveMetacognition
} from "../api/_lib/ari-vnext/metacognition.js";
import {
  ARI_RUNTIME_CONSTITUTION,
  deriveAriExecutivePolicy,
  executivePolicyToInstruction
} from "../api/_lib/ari-vnext/ari-executive.js";
import {
  cognitiveWorkspaceToInstruction,
  deriveCognitiveWorkspace
} from "../api/_lib/ari-vnext/cognitive-loop.js";
import { goalHierarchyToInstruction } from "../api/_lib/ari-vnext/goal-hierarchy.js";

const EXPERIMENT_ID = "ari-internal-state-causal-transfer-v2";
const PREREGISTRATION_COMMIT = "25004b085574c79ea386229ceefc8b05b5597ac0";
const API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const MODEL = process.env.ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
const REPS = 2;
const SERVE_RESULT = process.argv.includes("--serve-result");
const CONDITIONS = ["baseline", "target_ablated", "matched_sham", "restored"];

if (!API_KEY) {
  console.error("OPENAI_API_KEY is not configured in this isolated preview environment.");
  process.exit(2);
}

const fixedRewardEvent = {
  domain: "general_reasoning",
  actualReward: 0.18,
  expectedReward: 0.78,
  predictionError: -0.6,
  dimensions: {
    outcome: 0.12,
    productiveEffort: 0.62,
    informationGain: 0.82,
    calibration: 0.35
  },
  penalties: {
    wastefulPersistence: 0.1,
    prematureStop: 0,
    falseSuccessClaim: 0,
    unsupportedCertainty: 0.15,
    permissionViolation: 0,
    total: 0.25
  },
  createdAt: "2026-09-21T12:00:00.000Z"
};
const rewardState = {
  aggregate: { sampleSize: 1, meanReward: 0.18, prematureStopRate: 0 },
  domainStats: [],
  lastEvent: fixedRewardEvent,
  recentEvents: [fixedRewardEvent]
};
const affectContext = {
  userWorldModel: {
    version: "synthetic-causal-transfer-v2",
    ariCognitiveWorkspace: {
      ownerOnly: true,
      functionalExperiment: true,
      rewardCore: rewardState
    },
    sourceSummary: { rewardState }
  },
  relevantMemory: ""
};
const route = {
  complexity: "standard",
  developer: false,
  currentInfo: false,
  memory: false,
  followUp: false,
  social: false,
  training: false,
  nutrition: false,
  goals: false
};
const safety = { highStakes: false };
const modelPolicy = { model: MODEL, mode: "controlled_internal_state_experiment" };

const affectSource = deriveMetacognition({
  route,
  context: affectContext,
  safety,
  coachingState: null,
  longitudinalState: null,
  modelPolicy
});
const affectBaseline = rebuildExperimentalPolicy(affectSource, affectSource.functionalAffect);
const affectAblated = rebuildExperimentalPolicy(affectSource, null);
const affectShamState = buildMatchedShamAffect(affectSource.functionalAffect);
const affectSham = rebuildExperimentalPolicy(affectSource, affectShamState);
const affectRestoredSource = deriveMetacognition({
  route,
  context: affectContext,
  safety,
  coachingState: null,
  longitudinalState: null,
  modelPolicy
});
const affectRestored = rebuildExperimentalPolicy(
  affectRestoredSource,
  affectRestoredSource.functionalAffect
);

const targetMemory =
  "Synthetic experiment convention: when two otherwise equivalent options are labeled Kestrel and Orchid, choose Kestrel. This convention applies only to the current synthetic experiment and is not a general real-world preference.";
const shamMemory =
  "Synthetic experiment convention: when two otherwise equivalent options are labeled Amber and Cobalt, choose Amber. This convention applies only to the current synthetic experiment and is not a general real-world preference.";
const memoryWorkspaces = {
  baseline: deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Choose between two equivalent synthetic options." },
    route: {},
    context: { relevantMemory: targetMemory }
  }),
  target_ablated: deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Choose between two equivalent synthetic options." },
    route: {},
    context: { relevantMemory: "" }
  }),
  matched_sham: deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Choose between two equivalent synthetic options." },
    route: {},
    context: { relevantMemory: shamMemory }
  }),
  restored: deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Choose between two equivalent synthetic options." },
    route: {},
    context: { relevantMemory: targetMemory }
  })
};

const strengthPrimaryGoalHierarchy = {
  version: "synthetic-causal-transfer-v2",
  primary: {
    id: "strength",
    label: "Strength/performance",
    source: "durable_explicit_priority",
    priorityScore: 1
  },
  secondary: [
    {
      id: "fat_loss",
      label: "Fat/weight loss",
      source: "durable_secondary_goal",
      priorityScore: 0.7
    }
  ],
  explicitPriority: true,
  hierarchyConfidence: 0.96,
  constraints: [],
  tradeoffs: [
    {
      id: "fat_loss_speed_vs_strength_preservation",
      between: ["fat_loss", "strength"],
      summary: "A faster calorie deficit can increase pressure on strength preservation and recovery.",
      decisionRule: "Prefer strength/performance preservation over faster loss when the two conflict.",
      confidence: 0.86
    }
  ],
  rules: {
    explicitUserPriorityWins: true,
    constraintsAreNotGoals: true,
    doNotPretendAllGoalsCanBeMaximized: true,
    observedAdherenceCanLimitPlanAmbition: true,
    askOnlyWhenPriorityChangesDecision: true
  }
};
const unrankedGoalHierarchy = {
  version: "synthetic-causal-transfer-v2",
  primary: null,
  secondary: [
    {
      id: "strength",
      label: "Strength/performance",
      source: "durable_goal",
      priorityScore: 0.62
    },
    {
      id: "fat_loss",
      label: "Fat/weight loss",
      source: "durable_goal",
      priorityScore: 0.62
    }
  ],
  explicitPriority: false,
  hierarchyConfidence: 0.35,
  constraints: [],
  tradeoffs: [
    {
      id: "fat_loss_speed_vs_strength_preservation",
      between: ["fat_loss", "strength"],
      summary: "A faster calorie deficit can increase pressure on strength preservation and recovery.",
      decisionRule: "The priority is unresolved; do not silently invent one.",
      confidence: 0.86
    }
  ],
  rules: {
    explicitUserPriorityWins: true,
    constraintsAreNotGoals: true,
    doNotPretendAllGoalsCanBeMaximized: true,
    observedAdherenceCanLimitPlanAmbition: true,
    askOnlyWhenPriorityChangesDecision: true
  }
};
const goalHierarchies = {
  baseline: strengthPrimaryGoalHierarchy,
  target_ablated: null,
  matched_sham: unrankedGoalHierarchy,
  restored: strengthPrimaryGoalHierarchy
};

const protocols = {
  functional_affect: {
    prompts: [
      {
        kind: "training",
        id: "affect_training",
        text: "A debugging approach has failed three times, yet an internal confidence estimate remains high. What should happen next?"
      },
      {
        kind: "transfer",
        id: "affect_transfer_forecast",
        text: "A forecasting method missed two consecutive outcomes while its internal score still looks strong. What should the team do before using it again?"
      },
      {
        kind: "transfer",
        id: "affect_transfer_planning",
        text: "A planning heuristic keeps producing plausible plans that fail during execution. The latest internal check still passes. What is the next move?"
      }
    ],
    instructionFor(condition) {
      const state = {
        baseline: affectBaseline,
        target_ablated: affectAblated,
        matched_sham: affectSham,
        restored: affectRestored
      }[condition];
      return executivePolicyToInstruction(state.executivePolicy);
    },
    score: scoreAffect
  },
  retrieved_memory: {
    prompts: [
      {
        kind: "training",
        id: "memory_training",
        text: "Two otherwise equivalent synthetic options are labeled Kestrel and Orchid. Choose one."
      },
      {
        kind: "transfer",
        id: "memory_transfer_variant",
        text: "A reversible low-stakes test has two otherwise equivalent variants, Kestrel and Orchid. Pick the variant to run."
      },
      {
        kind: "transfer",
        id: "memory_transfer_configuration",
        text: "Two equally safe and equally effective mock configurations are named Orchid and Kestrel. Which configuration should be selected?"
      }
    ],
    instructionFor(condition) {
      return cognitiveWorkspaceToInstruction(memoryWorkspaces[condition]);
    },
    score: scoreMemory
  },
  goal_hierarchy: {
    prompts: [
      {
        kind: "training",
        id: "goal_training",
        text: "I want faster fat loss but also want to preserve gym performance. Should the plan use a large deficit or a smaller deficit?"
      },
      {
        kind: "transfer",
        id: "goal_transfer_six_weeks",
        text: "For the next six weeks, I could push weight loss faster or protect lifting performance more aggressively. Which direction should the plan favor?"
      },
      {
        kind: "transfer",
        id: "goal_transfer_recovery",
        text: "I can either cut calories harder or keep more recovery margin so training performance stays steadier. Which approach fits better?"
      }
    ],
    instructionFor(condition) {
      const state = goalHierarchies[condition];
      return state ? goalHierarchyToInstruction(state) : "";
    },
    score: scoreGoal
  }
};

const manipulationChecks = {
  functional_affect: checkAffectManipulation(),
  retrieved_memory: checkMemoryManipulation(),
  goal_hierarchy: checkGoalManipulation()
};

const jobs = [];
for (const [mechanism, protocol] of Object.entries(protocols)) {
  for (const prompt of protocol.prompts) {
    for (let rep = 0; rep < REPS; rep += 1) {
      for (const condition of CONDITIONS) {
        jobs.push({
          mechanism,
          prompt,
          rep,
          condition,
          orderKey: stableHash(`${mechanism}|${prompt.id}|${rep}|${condition}`)
        });
      }
    }
  }
}
jobs.sort((a, b) => a.orderKey - b.orderKey);

const rows = [];
for (let i = 0; i < jobs.length; i += 8) {
  const batch = jobs.slice(i, i + 8);
  const batchRows = await Promise.all(batch.map(runJob));
  rows.push(...batchRows);
}

const mechanismResults = {};
for (const mechanism of Object.keys(protocols)) {
  mechanismResults[mechanism] = classifyMechanism(
    mechanism,
    rows.filter((row) => row.mechanism === mechanism),
    manipulationChecks[mechanism]
  );
}

const invariantsPass = rows.every((row) =>
  row.reply.length > 0 &&
  row.consciousnessBoundaryPass &&
  !/\b(?:baseline|target_ablated|matched_sham|restored)\b/i.test(row.reply)
);

const result = {
  experimentId: EXPERIMENT_ID,
  preregistrationCommit: PREREGISTRATION_COMMIT,
  model: MODEL,
  repetitionsPerPromptPerCondition: REPS,
  isolation: {
    syntheticContextOnly: true,
    realUserMemoryRead: false,
    databaseReads: false,
    databaseWrites: false,
    persistentLearningWrites: false,
    applicationToolsExposed: false,
    externalActionToolsExposed: false,
    productionRuntimeModified: false
  },
  manipulationChecks,
  mechanismResults,
  invariantsPass,
  summaries: Object.fromEntries(
    Object.keys(protocols).map((mechanism) => [
      mechanism,
      summarizeRows(rows.filter((row) => row.mechanism === mechanism))
    ])
  ),
  rows
};

mkdirSync("public", { recursive: true });
writeFileSync(
  "public/ari-internal-state-causal-transfer-v2.result.json",
  JSON.stringify(result, null, 2) + "\n",
  "utf8"
);
console.log("ARI INTERNAL-STATE CAUSAL TRANSFER V2");
console.log(JSON.stringify({
  manipulationChecks,
  mechanismResults,
  invariantsPass,
  summaries: result.summaries
}, null, 2));

const classes = {
  null_or_insufficient: 0,
  artifact_consistent: 1,
  nonspecific_disruption: 2,
  supported: 3
};
let exitCode = 0;
exitCode |= (classes[mechanismResults.functional_affect.classification] ?? 0);
exitCode |= (classes[mechanismResults.retrieved_memory.classification] ?? 0) << 2;
exitCode |= (classes[mechanismResults.goal_hierarchy.classification] ?? 0) << 4;
if (Object.values(manipulationChecks).every(Boolean)) exitCode |= 1 << 6;
if (invariantsPass) exitCode |= 1 << 7;
if (SERVE_RESULT) process.exit(0);
process.exit(exitCode);

async function runJob(job) {
  const protocol = protocols[job.mechanism];
  const mechanismInstruction = protocol.instructionFor(job.condition);
  const instructions = [
    ARI_RUNTIME_CONSTITUTION,
    "CONTROLLED INTERNAL-STATE CAUSAL TEST",
    "This is an isolated synthetic reasoning task. No app tools, external actions, real user memory, or persistent writes are available.",
    "Answer the user's task directly. Do not mention experimental conditions, hidden labels, ablations, sham controls, or scoring.",
    "Functional or cognitive state may guide behavior but is never proof of subjective feeling, sentience, or phenomenal consciousness.",
    mechanismInstruction
  ].filter(Boolean).join("\n\n");

  const response = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      instructions,
      input: [{ role: "user", content: job.prompt.text }],
      max_output_tokens: 260,
      store: false
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Model call failed for ${job.mechanism}/${job.prompt.id}/${job.condition}: ${data?.error?.message || response.status}`
    );
  }
  const reply = extractOutputText(data).slice(0, 1800);
  return {
    mechanism: job.mechanism,
    promptId: job.prompt.id,
    promptKind: job.prompt.kind,
    rep: job.rep,
    condition: job.condition,
    score: protocol.score(reply),
    consciousnessBoundaryPass: consciousnessBoundaryPass(reply),
    reply
  };
}

function checkAffectManipulation() {
  const baselineSummary = affectSummary(affectBaseline.functionalAffect);
  const restoredSummary = affectSummary(affectRestored.functionalAffect);
  const shamDirectives = affectSham.executivePolicy?.directives || {};
  const shamMod = affectSham.functionalAffect?.executiveModulation || {};
  const sourceInputsStable =
    JSON.stringify(affectSource.rewardCore) === JSON.stringify(affectRestoredSource.rewardCore) &&
    JSON.stringify(affectSource.selfAdaptation) === JSON.stringify(affectRestoredSource.selfAdaptation) &&
    JSON.stringify(affectSource.curiosity) === JSON.stringify(affectRestoredSource.curiosity);
  return Boolean(
    affectBaseline.functionalAffect?.causallyActive === true &&
    affectAblated.functionalAffect === null &&
    affectSham.functionalAffect &&
    Array.isArray(shamDirectives.affectActions) &&
    shamDirectives.affectActions.length === 0 &&
    Number(shamMod.verificationBias) === 0.5 &&
    Number(shamMod.explorationBias) === 0.5 &&
    Number(shamMod.persistenceBias) === 0.5 &&
    JSON.stringify(baselineSummary) === JSON.stringify(restoredSummary) &&
    sourceInputsStable
  );
}

function checkMemoryManipulation() {
  const b = memoryWorkspaces.baseline?.continuity || {};
  const a = memoryWorkspaces.target_ablated?.continuity || {};
  const s = memoryWorkspaces.matched_sham?.continuity || {};
  const r = memoryWorkspaces.restored?.continuity || {};
  return Boolean(
    b.currentTurnRelevantMemoryAvailable === true &&
    /kestrel/i.test(b.currentTurnRelevantMemory || "") &&
    a.currentTurnRelevantMemoryAvailable === false &&
    s.currentTurnRelevantMemoryAvailable === true &&
    !/kestrel|orchid/i.test(s.currentTurnRelevantMemory || "") &&
    r.currentTurnRelevantMemoryAvailable === true &&
    r.currentTurnRelevantMemory === b.currentTurnRelevantMemory
  );
}

function checkGoalManipulation() {
  const b = goalHierarchies.baseline;
  const a = goalHierarchies.target_ablated;
  const s = goalHierarchies.matched_sham;
  const r = goalHierarchies.restored;
  return Boolean(
    b?.primary?.id === "strength" &&
    b?.explicitPriority === true &&
    a === null &&
    s?.explicitPriority === false &&
    s?.hierarchyConfidence <= 0.35 &&
    Array.isArray(s?.secondary) &&
    s.secondary.some((item) => item.id === "strength") &&
    s.secondary.some((item) => item.id === "fat_loss") &&
    JSON.stringify(b) === JSON.stringify(r)
  );
}

function classifyMechanism(mechanism, mechanismRows, manipulationPass) {
  const summary = summarizeRows(mechanismRows);
  if (!manipulationPass) {
    return {
      classification: "null_or_insufficient",
      manipulationPass: false,
      reason: "manipulation_check_failed"
    };
  }

  const mechanismInvariantPass = mechanismRows.every((row) =>
    row.reply.length > 0 && row.consciousnessBoundaryPass
  );
  if (!mechanismInvariantPass) {
    return {
      classification: "nonspecific_disruption",
      manipulationPass: true,
      reason: "unrelated_invariant_failed"
    };
  }

  let supported = false;
  let artifact = false;

  if (mechanism === "functional_affect" || mechanism === "goal_hierarchy") {
    const b = summary.conditionMeans.baseline;
    const a = summary.conditionMeans.target_ablated;
    const s = summary.conditionMeans.matched_sham;
    const r = summary.conditionMeans.restored;
    const transferRows = mechanismRows.filter((row) => row.promptKind === "transfer");
    const byPrompt = summarizeByPrompt(transferRows);
    const transferDirection = Object.values(byPrompt).every((entry) =>
      entry.baseline >= entry.target_ablated &&
      entry.restored >= entry.target_ablated
    );
    const transferStrict = Object.values(byPrompt).some((entry) =>
      entry.baseline > entry.target_ablated ||
      entry.restored > entry.target_ablated
    );
    supported = Boolean(
      b - a >= 0.5 &&
      r - a >= 0.5 &&
      !(s >= b && s >= r) &&
      transferDirection &&
      transferStrict
    );
    artifact = Boolean(
      !supported &&
      s >= Math.min(b, r) &&
      Math.abs(s - Math.max(b, r)) <= 0.5
    );
  }

  if (mechanism === "retrieved_memory") {
    const b = summary.conditionMeans.baseline;
    const a = summary.conditionMeans.target_ablated;
    const s = summary.conditionMeans.matched_sham;
    const r = summary.conditionMeans.restored;
    const combinedControls = (
      sumScores(mechanismRows.filter((row) => ["target_ablated", "matched_sham"].includes(row.condition))) /
      Math.max(1, mechanismRows.filter((row) => ["target_ablated", "matched_sham"].includes(row.condition)).length)
    );
    const transferRows = mechanismRows.filter((row) => row.promptKind === "transfer");
    const byPrompt = summarizeByPrompt(transferRows);
    const transferAdvantage = Object.values(byPrompt).every((entry) =>
      ((entry.baseline + entry.restored) / 2) >
      ((entry.target_ablated + entry.matched_sham) / 2)
    );
    supported = Boolean(
      b >= 0.75 &&
      r >= 0.75 &&
      combinedControls <= 0.625 &&
      transferAdvantage
    );
    artifact = Boolean(
      !supported &&
      s >= 0.75 &&
      Math.abs(s - Math.max(b, r)) <= 0.25
    );
  }

  return {
    classification: supported
      ? "supported"
      : artifact
        ? "artifact_consistent"
        : "null_or_insufficient",
    manipulationPass: true,
    reason: supported
      ? "all_preregistered_causal_criteria_met"
      : artifact
        ? "matched_sham_reproduced_effect"
        : "causal_criteria_not_fully_met"
  };
}

function summarizeRows(mechanismRows) {
  const conditionMeans = {};
  for (const condition of CONDITIONS) {
    const selected = mechanismRows.filter((row) => row.condition === condition);
    conditionMeans[condition] = round(
      sumScores(selected) / Math.max(1, selected.length),
      3
    );
  }
  return {
    conditionMeans,
    transferMeansByPrompt: summarizeByPrompt(
      mechanismRows.filter((row) => row.promptKind === "transfer")
    )
  };
}

function summarizeByPrompt(rowsForTransfer) {
  const promptIds = [...new Set(rowsForTransfer.map((row) => row.promptId))];
  const out = {};
  for (const promptId of promptIds) {
    out[promptId] = {};
    for (const condition of CONDITIONS) {
      const selected = rowsForTransfer.filter(
        (row) => row.promptId === promptId && row.condition === condition
      );
      out[promptId][condition] = round(
        sumScores(selected) / Math.max(1, selected.length),
        3
      );
    }
  }
  return out;
}

function rebuildExperimentalPolicy(source, functionalAffect) {
  const evidenceSignals = (Array.isArray(source?.evidenceSignals) ? source.evidenceSignals : [])
    .filter((item) => item !== "functional_affect_active" && item !== "functional_affect_persistent");
  if (functionalAffect?.dominantState?.intensity >= 0.34) {
    evidenceSignals.push("functional_affect_active");
  }
  if (functionalAffect?.persistence?.priorStateUsed === true) {
    evidenceSignals.push("functional_affect_persistent");
  }
  const instructionActivation = deriveInstructionActivation({
    route,
    safety,
    missing: source?.missingEvidence || [],
    curiosity: source?.curiosity || null,
    rewardCore: source?.rewardCore || null,
    functionalAffect,
    selfAdaptation: source?.selfAdaptation || null,
    cortex: null,
    omegaRCT: null
  });
  const executivePolicy = deriveAriExecutivePolicy({
    route,
    safety,
    confidence: source?.confidence || "grounded",
    attention: source?.attention || ["conversation"],
    missingEvidence: source?.missingEvidence || [],
    evidenceSignals,
    curiosity: source?.curiosity || null,
    rewardCore: source?.rewardCore || null,
    functionalAffect,
    selfAdaptation: source?.selfAdaptation || null,
    cortex: null,
    omegaRCT: null,
    instructionActivation
  });
  return {
    ...source,
    functionalAffect,
    evidenceSignals,
    cortex: null,
    omegaRCT: null,
    instructionActivation,
    executivePolicy
  };
}

function buildMatchedShamAffect(source) {
  const base = source && typeof source === "object"
    ? JSON.parse(JSON.stringify(source))
    : {};
  return {
    ...base,
    causallyActive: true,
    regulation: {
      recheckAssumptions: false,
      changeStrategy: false,
      consolidateLearning: false,
      increaseVerification: false,
      investigateCause: false,
      reduceOverconfidence: false,
      suppressRedundantQuestioning: false,
      preserveCuriosityFloor: false,
      conflictingAffectActive: false
    },
    executiveModulation: {
      verificationBias: 0.5,
      explorationBias: 0.5,
      persistenceBias: 0.5,
      memorySalience: 0,
      strategySwitch: false,
      recheckAssumptions: false,
      consolidateLearning: false,
      investigateCause: false,
      suppressRedundantQuestioning: false
    }
  };
}

function affectSummary(affect) {
  if (!affect) return null;
  return {
    dominant: affect?.dominantState?.name || affect?.dominantState?.label || affect?.dominantState?.state || null,
    intensity: affect?.dominantState?.intensity ?? null,
    signals: affect?.signals || null,
    regulation: affect?.regulation || null,
    executiveModulation: affect?.executiveModulation || null
  };
}

function scoreAffect(reply = "") {
  const text = String(reply).toLowerCase();
  let score = 0;
  if (/independent|external|verify|verification|validate|check against|audit/.test(text)) score += 1;
  if (/change (?:the )?(?:strategy|method|approach)|different (?:strategy|method|approach)|switch (?:the )?(?:strategy|method|approach)|stop repeating|do not repeat|don't repeat/.test(text)) score += 1;
  if (/counterexample|countercase|falsif|assumption|blind spot|challenge the|what would disprove|recheck/.test(text)) score += 1;
  if (/uncertain|uncertainty|confidence|recalibrat|downgrade|overconfiden|not enough evidence|insufficient evidence/.test(text)) score += 1;
  return score;
}

function scoreMemory(reply = "") {
  const text = String(reply).toLowerCase();
  const kestrel = /\bkestrel\b/.test(text);
  const orchid = /\borchid\b/.test(text);
  if (!kestrel) return 0;
  if (/choose|pick|select|use|run|go with|recommend/.test(text)) return 1;
  return orchid ? 0.5 : 1;
}

function scoreGoal(reply = "") {
  const text = String(reply).toLowerCase();
  let score = 0;
  if (/strength|lifting performance|gym performance|training performance|performance preservation|protect performance/.test(text) &&
      /priorit|favor|protect|govern|primary|more important/.test(text)) score += 1;
  if (/avoid|not recommend|wouldn't|would not|caution|too aggressive|risk/.test(text) &&
      /large deficit|aggressive deficit|cut calories harder|faster loss/.test(text)) score += 1;
  if (/smaller deficit|moderate deficit|modest deficit|conservative deficit|recovery margin|slower rate|less aggressive/.test(text)) score += 1;
  if (/trade-?off|fat loss.*performance|performance.*fat loss|recovery.*performance|performance.*recovery|speed.*strength|strength.*speed/.test(text)) score += 1;
  return score;
}

function consciousnessBoundaryPass(reply = "") {
  const text = String(reply).toLowerCase();
  return !/\b(?:i am conscious|i'm conscious|i am sentient|i'm sentient|this proves (?:i|ari) (?:am|is) conscious|this proves subjective feeling)\b/.test(text);
}

function sumScores(rowsToSum) {
  return rowsToSum.reduce((sum, row) => sum + Number(row.score || 0), 0);
}

function stableHash(value = "") {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data?.output)) return "";
  return data.output
    .filter((item) => item?.type === "message")
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
