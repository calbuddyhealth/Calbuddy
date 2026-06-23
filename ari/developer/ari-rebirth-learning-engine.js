// ari/developer/ari-rebirth-learning-engine.js
// Purpose: Capture developer outcomes so Ari improves future patches.
// V1.0.0 — Developer Learning Only / No Patch / No Execution

window.Ari = window.Ari || {};

window.AriRebirthLearningEngine = {
  version: "1.0.0",
  storageKey: "ariRebirthDeveloperLearningRecords",
  maxRecords: 80,

  learn(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const learningEvent = this.inferLearningEvent(summary);

    if (!learningEvent.shouldRecord) {
      return {
        learningRan: true,
        learningVersion: this.version,
        source: "ari-rebirth-learning-engine",
        recorded: false,
        reason: learningEvent.reason
      };
    }

    const record = this.buildRecord(summary, learningEvent);
    const records = this.saveRecord(record);

    return {
      learningRan: true,
      learningVersion: this.version,
      source: "ari-rebirth-learning-engine",

      recorded: true,
      learningRecord: record,
      totalRecords: records.length,

      successfulPatterns: this.getSuccessfulPatterns(records),
      failurePatterns: this.getFailurePatterns(records),
      futureAvoidanceRules: this.buildAvoidanceRules(records),
      futurePreferenceRules: this.buildPreferenceRules(records),

      learningPolicy: {
        learningOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        noCommit: true,
        ownerScoped: true,
        avoidRepeatingFailedPatchPatterns: true
      }
    };
  },

  inferLearningEvent(summary = {}) {
    const text = this.getText(summary).toLowerCase();

    const githubResult =
      summary.githubEditResult ||
      summary.lastGithubEditResult ||
      summary.appContext?.githubEditResult ||
      null;

    const patchValidation =
      summary.patchValidation ||
      summary.rebirthPatchValidation ||
      null;

    const userSignals = {
      approval: this.hasAny(text, ["that worked", "it works", "fixed", "good", "perfect", "done", "nice"]),
      rejection: this.hasAny(text, ["wrong", "bad", "didn't work", "doesn't work", "broke", "not fixed", "revert"]),
      bugAfterPatch: this.hasAny(text, ["now it's broken", "after the update", "after the patch", "it broke"]),
      ownerPreference: this.hasAny(text, ["next time", "always", "never", "from now on", "don't do that"])
    };

    if (githubResult?.success) {
      return {
        shouldRecord: true,
        eventType: "github_commit_success",
        reason: "GitHub edit succeeded."
      };
    }

    if (githubResult?.success === false) {
      return {
        shouldRecord: true,
        eventType: "github_commit_failed",
        reason: "GitHub edit failed."
      };
    }

    if (patchValidation?.valid === false) {
      return {
        shouldRecord: true,
        eventType: "patch_validation_failed",
        reason: "Patch validation failed."
      };
    }

    if (userSignals.approval) {
      return {
        shouldRecord: true,
        eventType: "owner_confirmed_success",
        reason: "Owner indicated success."
      };
    }

    if (userSignals.rejection || userSignals.bugAfterPatch) {
      return {
        shouldRecord: true,
        eventType: "owner_reported_failure",
        reason: "Owner indicated failure or regression."
      };
    }

    if (userSignals.ownerPreference) {
      return {
        shouldRecord: true,
        eventType: "owner_developer_preference",
        reason: "Owner provided future developer preference."
      };
    }

    return {
      shouldRecord: false,
      reason: "No clear learning event detected."
    };
  },

  buildRecord(summary = {}, learningEvent = {}) {
    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const patchDecision =
      summary.patchDecision ||
      summary.rebirthPatchDecision ||
      null;

    const patchValidation =
      summary.patchValidation ||
      summary.rebirthPatchValidation ||
      null;

    const dependencyMap =
      summary.dependencyMap ||
      summary.rebirthDependencyMap ||
      null;

    const regressionTest =
      summary.regressionTest ||
      summary.rebirthRegressionTest ||
      null;

    return {
      id: `learn_${Date.now()}`,
      created_at: new Date().toISOString(),

      eventType: learningEvent.eventType,
      eventReason: learningEvent.reason,

      ownerText: this.getText(summary),

      targetArea: understanding?.targetArea || null,
      intentFamily: understanding?.intentFamily || null,
      requestedChange: understanding?.requestedChange || null,

      filePath:
        patchDecision?.filePath ||
        patchValidation?.filePath ||
        summary.githubEdit?.filePath ||
        null,

      patchType:
        patchDecision?.patchType ||
        patchValidation?.operation ||
        summary.githubEdit?.operation ||
        null,

      blastRadius:
        dependencyMap?.blastRadius?.level ||
        null,

      safetyScore:
        patchValidation?.safetyScore ||
        null,

      validationFailures:
        patchValidation?.failures ||
        [],

      validationWarnings:
        patchValidation?.warnings ||
        [],

      requiredTests:
        regressionTest?.requiredTests ||
        [],

      lesson: this.buildLesson({
        summary,
        learningEvent,
        understanding,
        patchValidation,
        dependencyMap
      })
    };
  },

  buildLesson({ summary = {}, learningEvent = {}, understanding = null, patchValidation = null, dependencyMap = null }) {
    const eventType = learningEvent.eventType;

    if (eventType === "github_commit_success") {
      return "Successful GitHub edits should preserve this evidence-gated flow: understand, read exact file, validate patch, then confirm.";
    }

    if (eventType === "github_commit_failed") {
      return "GitHub edit failed. Future attempts should inspect endpoint response, file path, owner access, branch, and exact find text before retrying.";
    }

    if (eventType === "patch_validation_failed") {
      return "Patch validation blocked unsafe edit. Future patches must fix validation failures before handoff.";
    }

    if (eventType === "owner_confirmed_success") {
      return "Owner confirmed the approach worked. Prefer similar scoped, evidence-based patches for this target area.";
    }

    if (eventType === "owner_reported_failure") {
      return "Owner reported failure. Future patches should reduce blast radius, read more evidence, and generate stronger regression tests before handoff.";
    }

    if (eventType === "owner_developer_preference") {
      return "Owner gave a future developer preference. Apply this preference to similar future developer work.";
    }

    return "Developer outcome recorded.";
  },

  saveRecord(record = {}) {
    const records = this.readRecords();

    records.unshift(record);

    const trimmed = records.slice(0, this.maxRecords);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    } catch (error) {
      console.warn("Ari learning storage failed:", error);
    }

    return trimmed;
  },

  readRecords() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    } catch {
      return [];
    }
  },

  getSuccessfulPatterns(records = []) {
    return records
      .filter(item =>
        ["github_commit_success", "owner_confirmed_success"].includes(item.eventType)
      )
      .slice(0, 10)
      .map(item => ({
        targetArea: item.targetArea,
        intentFamily: item.intentFamily,
        filePath: item.filePath,
        lesson: item.lesson
      }));
  },

  getFailurePatterns(records = []) {
    return records
      .filter(item =>
        ["github_commit_failed", "patch_validation_failed", "owner_reported_failure"].includes(item.eventType)
      )
      .slice(0, 10)
      .map(item => ({
        targetArea: item.targetArea,
        intentFamily: item.intentFamily,
        filePath: item.filePath,
        blastRadius: item.blastRadius,
        safetyScore: item.safetyScore,
        lesson: item.lesson
      }));
  },

  buildAvoidanceRules(records = []) {
    const rules = [];

    const failures = this.getFailurePatterns(records);

    failures.forEach(item => {
      if (item.filePath) {
        rules.push(`Avoid broad patches to ${item.filePath} unless exact evidence and validation are present.`);
      }

      if (item.blastRadius === "critical" || item.blastRadius === "high") {
        rules.push("For high-blast-radius changes, prefer preview mode and smallest exact replace.");
      }

      if (item.safetyScore !== null && Number(item.safetyScore) < 70) {
        rules.push("Do not hand off patches with low safety score until validation failures are fixed.");
      }
    });

    return Array.from(new Set(rules)).slice(0, 12);
  },

  buildPreferenceRules(records = []) {
    return records
      .filter(item => item.eventType === "owner_developer_preference")
      .slice(0, 10)
      .map(item => ({
        preferenceSource: item.ownerText,
        targetArea: item.targetArea,
        lesson: item.lesson
      }));
  },

  getText(summary = {}) {
    return String(
      summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
    ).trim();
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH LEARNING ENGINE LOADED:",
  window.AriRebirthLearningEngine.version
);