// =====================================================
// ARI REBIRTH
// File: ari/pipelines/ari-delivery-openai-authority-cleanup.js
// Version: 1.0.0
// Purpose:
//   Remove the obsolete delivery degradation that required a legacy semantic
//   validator to approve an OpenAI-authoritative response plan.
//
// This patch does NOT mark semantic validation accepted and does NOT loosen
// memory-persistence requirements. It only stops a successful OpenAI-first
// response from being labeled degraded for intentionally bypassing the old
// semantic-validator gate.
// =====================================================

(() => {
  "use strict";

  const pipeline = window.AriDeliveryPipeline || window.Ari?.deliveryPipeline;
  if (!pipeline || pipeline.__ariOpenAIAuthorityCleanupPatched === true) return;

  const originalValidate = pipeline.validateDeliveryInputs?.bind(pipeline);
  if (typeof originalValidate !== "function") return;

  pipeline.__ariOpenAIAuthorityCleanupPatched = true;

  pipeline.validateDeliveryInputs = function patchedValidateDeliveryInputs(summary = {}) {
    const result = originalValidate(summary);

    const openAIAuthority =
      summary.cognitiveReasoningResult?.ready === true &&
      (
        summary.deliberationDiagnostics?.openAISemanticAuthority === true ||
        summary.cognitiveReasoningResult?.authority?.semanticSource === "openai" ||
        summary.reasoningStagePacket?.authority?.semanticSource === "openai"
      );

    if (!openAIAuthority || !result || typeof result !== "object") {
      return result;
    }

    return {
      ...result,
      warnings: Array.isArray(result.warnings)
        ? result.warnings.filter(
            warning => warning !== "response_plan_without_validated_semantic_frame"
          )
        : [],
      contracts: {
        ...(result.contracts || {}),
        openAIAuthoritativeSemanticFrameAvailable:
          Boolean(
            summary.validatedSemanticFrame ||
            summary.semanticFrame ||
            summary.cognitiveReasoningResult?.semanticFrame
          ),
        legacySemanticValidatorRequiredForResponseDelivery: false
      }
    };
  };
})();