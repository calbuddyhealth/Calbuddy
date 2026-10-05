// Shared browser/server routing hint. This selects capabilities, never safety
// permissions. The server recomputes it from the message and conversation.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AriConversationMode = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CREATIVE = /^(?:(?:hey|hi|yo|ari)[, !]+)?(?:(?:can|could|would) you\s+|please\s+|i (?:want|need) you to\s+)?(?:(?:tell|give)(?: me)?\s+(?:(?:a|an|another|one|some|really|very|fucking|damn|hilarious|funny|good|short|long|scary|creepy|dark|horror|fictional|bedtime|original|little)\s+){0,8}(?:jokes?|stor(?:y|ies)|poems?|riddles?)\b|(?:write|invent|create|make up)\s+(?:(?:me|a|an|another|one|some|really|very|fucking|damn|funny|short|long|scary|creepy|dark|horror|fictional|bedtime|original|little)\s+){0,8}(?:jokes?|stor(?:y|ies)|poems?|comedy|sketch|scene|fiction)\b|roast me\b|make me laugh\b|joke around\b)/i;
  const FOLLOW_UP = /^(?:(?:please\s+)?(?:continue(?: the story)?|keep going|go on|another(?: one)?|one more|try again|retry)|(?:make it|make that|can you make it)\s+(?:funnier|darker|scarier|creepier|longer|shorter|more .+|less .+)|(?:that(?:'s| was| is)\s+(?:not funny|boring|too .+|weak)[,.! ]*try again))[.!?\s]*$/i;
  const MIXED_OPERATION = /(?:\b(?:and|then|also|after that)\s+|[.;,!]\s*)(?:please\s+)?(?:log|save|record|update|delete|remove|schedule|send|publish|post|deploy|merge|remember|search|look up|check)\b/i;

  function creativeConversation(message, history = []) {
    const text = String(message || "").trim();
    if (!text || MIXED_OPERATION.test(text)) return false;
    if (CREATIVE.test(text)) return true;
    if (!FOLLOW_UP.test(text)) return false;
    // Only walk an uninterrupted creative exchange. An old story must never
    // turn "continue" on a later code task into fiction.
    const previousUsers = (Array.isArray(history) ? history : [])
      .filter(item => item?.role === "user").slice(-8).reverse();
    for (const item of previousUsers) {
      const previous = String(item?.content || "").trim();
      if (MIXED_OPERATION.test(previous)) return false;
      if (CREATIVE.test(previous)) return true;
      if (!FOLLOW_UP.test(previous)) return false;
    }
    return false;
  }

  return Object.freeze({ version: "1.0.0", creativeConversation });
});
