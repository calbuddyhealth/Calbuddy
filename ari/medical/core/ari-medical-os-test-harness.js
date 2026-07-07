// ari/medical/core/ari-medical-os-test-harness.js
// Purpose: Simple test harness for Ari Medical OS pipeline.
// V1.0.0 — Medical OS Test Harness / Pipeline Smoke Test

window.Ari = window.Ari || {};
window.Ari.medical = window.Ari.medical || {};

window.Ari.medical.osTestHarness = {
  version: "1.0.0",

  run(message = "") {
    const orchestrator = window.Ari.medical.osOrchestrator;

    if (!orchestrator?.run) {
      return {
        testHarnessRan: false,
        error: "Medical OS Orchestrator not loaded."
      };
    }

    const result = orchestrator.run({
      userMessage: message,
      chiefComplaint: message,
      context: {
        testMode: true
      }
    });

    return {
      testHarnessRan: true,
      testHarnessVersion: this.version,
      input: message,
      response: result.response,
      dangerLevel: result.room?.executiveSummary?.dangerLevel || "unknown",
      highestConcern: result.room?.executiveSummary?.highestConcern || "",
      nextBestStep: result.room?.executiveSummary?.nextBestStep || "",
      totalActions: result.operations?.totalActions || 0,
      precautions: result.room?.precautions || [],
      monitoring: result.monitoring?.monitoring || [],
      auditCount: result.room?.auditTrail?.length || 0,
      fullResult: result
    };
  },

  smokeTests() {
    return [
      this.run("Patient has fever, cough, and positive influenza test."),
      this.run("Patient has chronic cough, weight loss, night sweats, and possible TB."),
      this.run("Patient has watery diarrhea after antibiotics, concern for C diff."),
      this.run("Patient has hypotension, fever, confusion, and suspected sepsis."),
      this.run("Patient has swollen tongue, hives, and trouble breathing.")
    ];
  },

  print(message = "") {
    const result = this.run(message);

    console.group("ARI MEDICAL OS TEST");
    console.log("Input:", result.input);
    console.log("Response:", result.response);
    console.log("Danger Level:", result.dangerLevel);
    console.log("Highest Concern:", result.highestConcern);
    console.log("Next Best Step:", result.nextBestStep);
    console.log("Total Actions:", result.totalActions);
    console.log("Precautions:", result.precautions);
    console.log("Monitoring:", result.monitoring);
    console.log("Audit Count:", result.auditCount);
    console.groupEnd();

    return result;
  }
};

window.AriMedicalOSTestHarness =
  window.Ari.medical.osTestHarness;

console.log(
  "ARI MEDICAL OS TEST HARNESS LOADED:",
  window.Ari.medical.osTestHarness.version
);