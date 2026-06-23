// ari/developer/ari-rebirth-execution-planner-engine.js
// Purpose: Convert owner developer intent into a phased execution roadmap.
// V1.0.0 — Master Developer Project Plan / No Search / No Read / No Patch

window.Ari = window.Ari || {};

window.AriRebirthExecutionPlannerEngine = {
  version: "1.0.0",

  plan(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    if (!understanding?.isDeveloperWork) return null;

    const capabilityRegistry =
      summary.capabilityRegistry ||
      summary.rebirthCapabilityRegistry ||
      null;

    const projectGraph =
      summary.projectKnowledgeGraph ||
      summary.rebirthProjectKnowledgeGraph ||
      null;

    const architecture =
      summary.architecture ||
      summary.rebirthArchitecture ||
      null;

    const bugDiagnosis =
      summary.bugDiagnosis ||
      summary.rebirthBugDiagnosis ||
      null;

    const executionType = this.inferExecutionType({
      understanding,
      capabilityRegistry,
      architecture,
      bugDiagnosis
    });

    const phases = this.buildPhases({
      executionType,
      understanding,
      capabilityRegistry,
      projectGraph,
      architecture,
      bugDiagnosis
    });

    return {
      executionPlannerRan: true,
      executionPlannerVersion: this.version,
      source: "ari-rebirth-execution-planner-engine",

      executionType,
      userGoal: understanding.userGoal,
      targetArea: understanding.targetArea,
      intentFamily: understanding.intentFamily,
      requestedChange: understanding.requestedChange,

      phaseCount: phases.length,
      phases,
      currentPhase: this.inferCurrentPhase(phases),
      nextAction: this.inferNextAction(phases),

      executionPolicy: {
        plannerOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        noCommit: true,
        semanticFirst: true,
        evidenceBeforePatch: true,
        validationBeforeHandoff: true,
        regressionBeforeCommit: true,
        ownerConfirmationRequired: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    };
  },

  inferExecutionType({ understanding = {}, capabilityRegistry = null, architecture = null, bugDiagnosis = null }) {
    if (understanding.intentFamily === "bug_investigation" || bugDiagnosis?.isBugReport) {
      return "bug_fix";
    }

    if (understanding.intentFamily === "tool_or_feature_build") {
      return "feature_build";
    }

    if (understanding.intentFamily === "homepage_redesign_or_patch") {
      return "ui_redesign";
    }

    if (understanding.intentFamily === "improve_ari_behavior") {
      return "ari_self_improvement";
    }

    if (understanding.intentFamily === "code_search" || understanding.intentFamily === "file_read") {
      return "code_investigation";
    }

    if (architecture?.architectureRan) {
      return "architecture_work";
    }

    if (capabilityRegistry?.requestedCapability) {
      return "capability_work";
    }

    return "developer_work";
  },

  buildPhases({
    executionType,
    understanding = {},
    capabilityRegistry = null,
    projectGraph = null,
    architecture = null,
    bugDiagnosis = null
  }) {
    const phases = [];

    phases.push(this.phaseUnderstand(understanding));

    if (capabilityRegistry) {
      phases.push(this.phaseCapabilityCheck(capabilityRegistry));
    }

    if (projectGraph) {
      phases.push(this.phaseProjectMap(projectGraph));
    }

    if (architecture || ["feature_build", "ui_redesign", "architecture_work", "capability_work"].includes(executionType)) {
      phases.push(this.phaseArchitecture(architecture, understanding));
    }

    if (bugDiagnosis || executionType === "bug_fix") {
      phases.push(this.phaseBugDiagnosis(bugDiagnosis, understanding));
    }

    phases.push(this.phaseEvidence(understanding));
    phases.push(this.phaseCodeUnderstanding(understanding));
    phases.push(this.phaseDependencyMap(understanding));
    phases.push(this.phasePatchDecision(understanding));
    phases.push(this.phasePatchValidation());
    phases.push(this.phaseRegressionTests());
    phases.push(this.phaseHandoff());
    phases.push(this.phaseLearning());

    return phases.map((phase, index) => ({
      order: index + 1,
      ...phase
    }));
  },

  phaseUnderstand(understanding = {}) {
    return {
      id: "understand",
      title: "Understand owner request",
      status: understanding?.isDeveloperWork ? "complete" : "needed",
      ownerEngine: "ari-rebirth-developer-understanding-engine",
      purpose: "Identify owner goal, target area, risk, requested change, and safe next step.",
      expectedOutput: [
        "userGoal",
        "intentFamily",
        "targetArea",
        "targetObject",
        "likelyFiles",
        "searchConcepts"
      ]
    };
  },

  phaseCapabilityCheck(capabilityRegistry = {}) {
    return {
      id: "capability_check",
      title: "Check existing capabilities",
      status: capabilityRegistry?.capabilityRegistryRan ? "complete" : "needed",
      ownerEngine: "ari-rebirth-capability-registry-engine",
      purpose: "Determine what already exists, what is missing, and what should be reused.",
      expectedOutput: [
        "capabilityStatus",
        "existingCapabilities",
        "reusableCapabilities",
        "requiredNewCapabilities"
      ]
    };
  },

  phaseProjectMap(projectGraph = {}) {
    return {
      id: "project_map",
      title: "Map project system area",
      status: projectGraph?.projectKnowledgeGraphRan ? "complete" : "needed",
      ownerEngine: "ari-rebirth-project-knowledge-graph-engine",
      purpose: "Locate the affected CalBuddy system and its owning files.",
      expectedOutput: [
        "focusedArea",
        "relevantFiles",
        "systemRelationships",
        "safeNavigationPath"
      ]
    };
  },

  phaseArchitecture(architecture = null, understanding = {}) {
    return {
      id: "architecture",
      title: "Design safe architecture",
      status: architecture?.architectureRan ? "complete" : "needed",
      ownerEngine: "ari-rebirth-architecture-engine",
      purpose: "Create system design for new features, tools, or major UI changes.",
      expectedOutput: [
        "recommendedArchitecture",
        "requiredFiles",
        "integrationPoints",
        "buildOrder",
        "risks"
      ],
      neededWhen: [
        "feature_build",
        "tool_or_feature_build",
        "homepage_redesign_or_patch",
        "major_ui_change"
      ]
    };
  },

  phaseBugDiagnosis(bugDiagnosis = null, understanding = {}) {
    return {
      id: "bug_diagnosis",
      title: "Diagnose likely bug source",
      status: bugDiagnosis?.bugDiagnosisRan ? "complete" : "needed",
      ownerEngine: "ari-rebirth-bug-diagnosis-engine",
      purpose: "Rank possible causes before searching or patching.",
      expectedOutput: [
        "failureDomain",
        "likelyCauses",
        "recommendedFiles",
        "safeDebugOrder"
      ]
    };
  },

  phaseEvidence(understanding = {}) {
    return {
      id: "evidence",
      title: "Gather code evidence plan",
      status: "needed",
      ownerEngine: "ari-rebirth-code-evidence-engine",
      purpose: "Determine search/read steps before code analysis.",
      expectedOutput: [
        "searchSteps",
        "readSteps",
        "analysisSteps",
        "nextRequiredAction"
      ]
    };
  },

  phaseCodeUnderstanding(understanding = {}) {
    return {
      id: "code_understanding",
      title: "Understand current code",
      status: "needed",
      ownerEngine: "ari-rebirth-code-understanding-engine",
      purpose: "Map exact code structure, likely change zones, and safe edit candidates.",
      expectedOutput: [
        "importantSections",
        "likelyChangeZones",
        "safeEditCandidates",
        "risks"
      ]
    };
  },

  phaseDependencyMap(understanding = {}) {
    return {
      id: "dependency_map",
      title: "Check blast radius",
      status: "needed",
      ownerEngine: "ari-rebirth-dependency-map-engine",
      purpose: "Predict what could break before patching.",
      expectedOutput: [
        "dependencies",
        "blastRadius",
        "safestPatchStrategy",
        "requiredRegressionTests"
      ]
    };
  },

  phasePatchDecision(understanding = {}) {
    return {
      id: "patch_decision",
      title: "Decide if patch is possible",
      status: "needed",
      ownerEngine: "ari-rebirth-patch-decision-engine",
      purpose: "Create a GitHub edit only if exact current code and exact replacement are known.",
      expectedOutput: [
        "canPatchNow",
        "githubEdit",
        "missingEvidence",
        "reason"
      ]
    };
  },

  phasePatchValidation() {
    return {
      id: "patch_validation",
      title: "Validate patch safety",
      status: "needed",
      ownerEngine: "ari-rebirth-patch-validation-engine",
      purpose: "Final safety check before GitHub handoff.",
      expectedOutput: [
        "valid",
        "canHandOffToGithub",
        "failures",
        "warnings",
        "safetyScore"
      ]
    };
  },

  phaseRegressionTests() {
    return {
      id: "regression_tests",
      title: "Generate regression tests",
      status: "needed",
      ownerEngine: "ari-rebirth-regression-test-engine",
      purpose: "Define what must be tested after patching.",
      expectedOutput: [
        "requiredTests",
        "smokeTests",
        "failureChecks",
        "rollbackChecks"
      ]
    };
  },

  phaseHandoff() {
    return {
      id: "developer_handoff",
      title: "Prepare developer handoff",
      status: "needed",
      ownerEngine: "ari-rebirth-developer-handoff-engine",
      purpose: "Create final owner-safe response, GitHub edit request, or next investigation step.",
      expectedOutput: [
        "developerIntent",
        "githubEdit",
        "reply",
        "handoffStatus"
      ]
    };
  },

  phaseLearning() {
    return {
      id: "learning",
      title: "Record developer learning",
      status: "after_action",
      ownerEngine: "ari-rebirth-learning-engine",
      purpose: "Capture success/failure patterns after owner approval, rejection, bug report, or deployment result.",
      expectedOutput: [
        "learningRecord",
        "futureAvoidanceRules",
        "successfulPatterns"
      ]
    };
  },

  inferCurrentPhase(phases = []) {
    return phases.find(phase => phase.status === "needed") || phases[phases.length - 1] || null;
  },

  inferNextAction(phases = []) {
    const current = this.inferCurrentPhase(phases);

    if (!current) {
      return {
        type: "none",
        reason: "No execution phase found."
      };
    }

    return {
      type: "run_engine",
      engine: current.ownerEngine,
      phase: current.id,
      reason: current.purpose
    };
  }
};

console.log(
  "ARI REBIRTH EXECUTION PLANNER ENGINE LOADED:",
  window.AriRebirthExecutionPlannerEngine.version
);