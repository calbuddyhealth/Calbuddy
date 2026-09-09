// A conversational promise is not a pending action or a completed write.
// This guard runs only when the model returned no application function.

export function actionReplyRequiresProposal(reply = "") {
  const text = String(reply || "").replace(/[*_`]/g, "").replace(/’/g, "'").trim();
  const completion = /(?:^|[.!?\n]\s*)(?:(?:okay|ok|sure|done)[,!.\s—-]+)?(?:i(?:'ve| have)?\s+(?:(?:just|successfully)\s+)?(?:logged(?!\s+(?:in|into|out)\b)|saved|recorded)\b|logged\s+(?!meals?\s+(?:are|can|will|show)\b|in\b|into\b|out\b)|(?:saved|recorded)\s+(?:your|the|that|this|it)\b|(?:it|that|your\s+[^.!?\n]{1,100}?)\s+(?:is now|is|has been|was)\s+(?:logged|saved|recorded)\b)/i;
  const proposal = /(?:^|[.!?\n]\s*)(?:(?:okay|ok|sure)[,!.\s—-]+)?(?:(?:i(?:'m| am)\s+)?ready to|i(?:'ll| will))\s+(?:log|save|record)\b|\b(?:confirm|approve)(?:\s+(?:it|that|this|the (?:entry|estimate|change)))?\s+to\s+(?:save|log|proceed)\b/i;
  return completion.test(text) || proposal.test(text);
}

export function guardUnpreparedActionReply(reply = "") {
  if (!actionReplyRequiresProposal(reply)) return { reply, actionPreparation: null };
  return {
    reply: "I haven't saved a change for this request. I couldn't prepare its confirmation. Please ask me to try again.",
    actionPreparation: { success: false, code: "missing_action_proposal" }
  };
}
