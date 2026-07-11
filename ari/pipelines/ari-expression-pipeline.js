// ari/pipelines/ari-expression-pipeline.js
// Ari Expression Pipeline
// Purpose: Convert Ari's deliberation into natural final language.
// V1.0.0 — Five-Layer Architecture Foundation

window.Ari = window.Ari || {};

window.AriExpressionPipeline = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (_engine, _methods, fallback = {}) => fallback
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "expression"
    };

    const merge = result => {
      state = {
        ...state,
        ...(result || {})
      };

      return state;
    };

    /*
      Existing expression-stage calls will be moved here.

      Planned ownership:

      1. Character Context
      2. Character Knowledge compatibility
      3. Character Reasoning
      4. Character Expression
      5. Lexical Grounding
      6. Human Language
      7. Mouth Director
      8. Composer Bridge
      9. Blueprint Writer
      10. Arbiter Precheck
      11. AI Writer
      12. Candidate Arbiter
      13. Ari Language Composer
    */

    state.responseResult =
      this.buildResponseResult(state);

    state.expressionPipelineRan = true;
    state.expressionPipelineSource = "ari-expression-pipeline";
    state.expressionPipelineVersion = this.version;

    return state;
  },

  buildResponseResult(summary = {}) {
    return {
      ready:
        Boolean(
          String(
            summary.finalResponse ||
            summary.selectedDraft ||
            summary.aiWriterDraft ||
            summary.blueprintWriterDraft ||
            ""
          ).trim()
        ),

      source: "ari-expression-pipeline",
      version: this.version,

      finalResponse:
        summary.finalResponse ||
        summary.selectedDraft ||
        summary.aiWriterDraft ||
        summary.blueprintWriterDraft ||
        null,

      selectedDraft:
        summary.selectedDraft ||
        null,

      candidates:
        summary.candidateDrafts ||
        [],

      expressionPlan:
        summary.expressionPlan ||
        null,

      character:
        summary.composerCharacter ||
        null,

      composerPacket:
        summary.composerPacket ||
        null,

      authority: {
        canChangeRouting: false,
        canChangeSafetySeverity: false,
        canWriteFinalLanguage: true,
        role: "language_expression_and_draft_selection"
      }
    };
  }
};

console.log(
  "ARI EXPRESSION PIPELINE LOADED:",
  window.AriExpressionPipeline?.version
);