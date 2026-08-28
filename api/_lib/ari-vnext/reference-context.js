// ARI vNext — bounded universal conversational reference context.
//
// Purpose:
// - Detect short context-dependent follow-ups and real-world correction turns.
// - Prefer recent canonical app references from trusted executors and current
//   authoritative app context over free-form conversation text.
// - Keep mutation authorization and reference resolution separate: only the
//   CURRENT user message can authorize a write; prior state may identify target.
// - Add no extra model call. Trusted domain adapters remain authoritative.

export const REFERENCE_CONTEXT_VERSION = "1.5.0";

const MAX_REFERENCE_TURNS = 8;
const MAX_REFERENCE_TEXT = 900;
const MAX_APP_REFERENCES = 12;
const MAX_RECENT_INVALIDATIONS = 4;
const MAX_PACKET_CHARACTERS = 6200;

const REFERENCE_MARKER = /\b(?:it|its|them|they|their|that|this|those|these|one|ones|the other one|the (?:first|second|third) (?:one|item|meal|option|workout|meetup|mission|crew)|(?:first|second|third) (?:one|item|meal|option|workout|meetup|mission|crew)|former|latter|same one|previous one|last one)\b/i;
const GENERIC_TARGET_REFERENCE = /\b(?:it|that|this|them|those|these|one|ones|the other one|same one|previous one|last one)\b/i;
const CONTINUATION_PHRASE = /^(?:and|but|then|instead|okay|ok|yeah|yes|no|nope|make it|do that|use that|use it|go with that|go with it|the other one)\b/i;
const CORRECTION_PHRASE = /^(?:actually\b|no[,;:]?\s+(?:i\s+)?meant\b|i\s+meant\b|wait[,;:]?\b|sorry[,;:]?\b|correction\b|rather\b)/i;
const ORDINAL_REFERENCE = /\b(?:the\s+)?(first|second|third)\s+(?:one|item|meal|option|workout|activity|weigh-?in|meetup|mission|crew)?\b/i;
const ORDINALS = Object.freeze({ first: 1, second: 2, third: 3 });
const GENERIC_SELECTOR_WORDS = new Set([
  "the", "a", "an", "my", "i", "no", "to", "for", "of", "and", "or", "is", "was", "be",
  "actually", "again", "that", "this", "those", "these", "them", "they", "their", "it", "its",
  "one", "ones", "other", "same", "previous", "last", "first", "second", "third", "item", "option",
  "please", "can", "could", "would", "will", "you", "make", "change", "update", "edit", "correct", "fix",
  "delete", "remove", "undo", "replace", "swap", "log", "record", "save", "add", "use", "meant", "mean",
  "instead", "rather", "sorry", "wait", "with", "without", "from", "into", "before", "after", "then",
  "meal", "food", "workout", "activity", "weight", "weighin", "meetup", "mission", "crew",
  "breakfast", "lunch", "dinner", "snack", "today", "yesterday", "tomorrow",
  "ounce", "ounces", "gram", "grams", "calorie", "calories", "protein", "carbs", "fat"
]);

const DOMAIN_PATTERNS = {
  nutrition: /\b(?:calorie|calories|kcal|macro|macros|protein|carb|carbs|fat|meal|food|eat|ate|eaten|breakfast|lunch|dinner|snack|nutrition|diet|potato|potatoes|rice|chicken|beef|salmon|egg|eggs|drink|drank)\b/i,
  training: /\b(?:workout|training|train|exercise|sets?|reps?|gym|bench|squat|deadlift|press|row|run|running|walk|walking|bike|cycling|hike|cardio|chest|back|legs?|shoulders?|arms?|biceps?|triceps?)\b/i,
  goals: /\b(?:goal|weight|weigh-?in|target|calorie goal|daily goal|lose|gain|maintain|maintenance|cut|bulk|bmi)\b/i,
  social: /\b(?:circle|meetup|meet-up|mission|crew|challenge|friend|post|event|join|rsvp|host)\b/i,
  developer: /\b(?:github|repo|repository|branch|commit|deploy|vercel|supabase|api|code|javascript|html|css|sql)\b/i
};

export function isReferenceFollowUp(message = "") {
  const text = clean(message, 600);
  if (!text || text.length > 300) return false;
  return REFERENCE_MARKER.test(text) || CONTINUATION_PHRASE.test(text) || CORRECTION_PHRASE.test(text);
}

export function activeReferenceDomains(referenceState = {}) {
  const references = Array.isArray(referenceState?.references) ? referenceState.references : [];
  const referenceDomains = references
    .filter((reference) => isActiveAppReference(reference))
    .map((reference) => clean(reference?.domain, 40).toLowerCase())
    .filter(Boolean);
  const invalidationDomains = normalizeRecentInvalidations(referenceState)
    .map((item) => item.domain)
    .filter(Boolean);
  return Array.from(new Set([...referenceDomains, ...invalidationDomains]));
}

export function resolveReferenceTarget({ message = "", referenceState = {}, route = {} } = {}) {
  const text = clean(message, 600);
  if (!isReferenceFollowUp(text)) {
    return resolution("inactive", "not_a_reference_follow_up");
  }

  const authoritative = normalizeAppReferences(referenceState)
    .filter((candidate) => candidate.authoritative === true);
  const recentInvalidations = normalizeRecentInvalidations(referenceState);

  if (!authoritative.length) {
    if (shouldBlockOnRecentInvalidation({ message: text, candidates: [], invalidations: recentInvalidations, route })) {
      const invalidation = shouldBlockOnRecentInvalidation({ message: text, candidates: [], invalidations: recentInvalidations, route });
      return resolution("unresolved", "recent_reference_invalidated", [], true, {
        invalidatedReferenceIds: [invalidation.referenceId],
        invalidationOperation: invalidation.operation
      });
    }
    return resolution("context_only", "no_authoritative_app_reference");
  }

  const narrowed = narrowByCurrentMessage(authoritative, text, route);
  const candidates = narrowed.candidates;
  if (!candidates.length) {
    return resolution(
      "unresolved",
      narrowed.explicitSelectorMiss ? "explicit_selector_not_found" : "no_compatible_authoritative_target",
      [],
      narrowed.explicitSelectorMiss
    );
  }

  const invalidation = shouldBlockOnRecentInvalidation({
    message: text,
    candidates,
    invalidations: recentInvalidations,
    route
  });
  if (invalidation) {
    return resolution("unresolved", "recent_reference_invalidated", [], true, {
      invalidatedReferenceIds: [invalidation.referenceId],
      invalidationOperation: invalidation.operation
    });
  }

  const ordinal = explicitOrdinal(text);
  if (ordinal) {
    const ordinalMatches = resolveOrdinalCandidates(candidates, ordinal);
    if (ordinalMatches.length === 1) {
      return resolution("resolved", "unique_authoritative_ordinal", ordinalMatches);
    }
    if (ordinalMatches.length > 1) {
      return resolution("ambiguous", "ordinal_matches_multiple_collections", ordinalMatches, true);
    }
    return resolution("unresolved", "ordinal_not_found_in_authoritative_collection", candidates, true);
  }

  if (candidates.length === 1) {
    return resolution(
      "resolved",
      narrowed.selectorApplied ? "unique_authoritative_named_target" : "unique_authoritative_target",
      candidates
    );
  }

  return resolution("ambiguous", "multiple_authoritative_targets", candidates, true);
}

export function buildReferencePacket(turn = {}, route = {}) {
  const message = clean(turn?.message, 8000);
  const history = Array.isArray(turn?.history) ? turn.history : [];
  const referenceState = turn?.context?.referenceState || {};
  const appReferences = normalizeAppReferences(referenceState);
  const recentInvalidations = normalizeRecentInvalidations(referenceState);
  const active = Boolean(isReferenceFollowUp(message) && (history.length || appReferences.length || recentInvalidations.length));

  if (!active) return null;

  const conversationCandidates = history
    .slice(-MAX_REFERENCE_TURNS)
    .reverse()
    .map((item, index) => normalizeConversationCandidate(item, index + 1))
    .filter(Boolean);

  const candidates = [...appReferences, ...conversationCandidates];
  if (!candidates.length && !recentInvalidations.length) return null;

  const packet = {
    version: REFERENCE_CONTEXT_VERSION,
    active: true,
    source: appReferences.length
      ? "trusted_app_and_recent_conversation_reference_index"
      : recentInvalidations.length
        ? "recent_reference_invalidation_index"
        : "recent_conversation_reference_index",
    currentMessage: message.slice(0, 600),
    referenceDetected: REFERENCE_MARKER.test(message),
    correctionDetected: CORRECTION_PHRASE.test(message),
    resolution: resolveReferenceTarget({
      message,
      referenceState,
      route
    }),
    candidates,
    ...(recentInvalidations.length ? { recentInvalidations } : {}),
    policy: {
      currentTurnAuthorizesMutation: true,
      historyMayResolveTargetOnly: true,
      historyNeverGrantsWritePermission: true,
      appReferencesNeverGrantWritePermission: true,
      currentTrustedContextNeverGrantsWritePermission: true,
      recentInvalidationNeverGrantsWritePermission: true,
      preferPersistedCanonicalReference: true,
      preferNearestCompatibleReference: true,
      preferAuthoritativeAppStateOnConflict: true,
      useExplicitOrdinalWithinSameCollection: true,
      deterministicResolutionPrecedesModelChoice: true,
      correctionLanguageMayResolveTargetButNeverGrantWritePermission: true,
      explicitSelectorMissMustNotRetarget: true,
      barePronounAfterRecentInvalidationMustClarify: true,
      clarifyWhenAmbiguous: true,
      neverInventMissingTarget: true
    }
  };

  return trimPacket(packet);
}

function narrowByCurrentMessage(candidates = [], message = "", route = {}) {
  let output = [...candidates];
  let selectorApplied = false;
  const explicitDomains = inferDomains(message).filter((domain) => domain !== "general");

  if (explicitDomains.length === 1) {
    output = output.filter((candidate) => candidate.domain === explicitDomains[0]);
  } else {
    const routeDomains = ["nutrition", "training", "goals", "social", "developer"]
      .filter((domain) => route?.[domain] === true);
    if (routeDomains.length === 1) {
      output = output.filter((candidate) => candidate.domain === routeDomains[0]);
    }
  }

  const entityTypes = entityTypeHints(message);
  if (entityTypes.length === 1) {
    const narrowed = output.filter((candidate) => entityTypes.includes(candidate.entityType));
    if (narrowed.length) output = narrowed;
  }

  const category = mealCategoryHint(message);
  if (category) {
    selectorApplied = true;
    const categoryMatches = output.filter((candidate) => candidateMealCategory(candidate) === category);
    if (categoryMatches.length) output = categoryMatches;
    else return { candidates: [], selectorApplied: true, explicitSelectorMiss: true };
  }

  const explicitDate = explicitDateHint(message);
  if (explicitDate) {
    selectorApplied = true;
    const dateMatches = output.filter((candidate) => candidateDate(candidate) === explicitDate);
    if (dateMatches.length) output = dateMatches;
    else return { candidates: [], selectorApplied: true, explicitSelectorMiss: true };
  }

  // Ordinals are already a deterministic selector with collection semantics.
  // Do not let generic words around "the second one" become a competing named selector.
  const selectorTokens = explicitOrdinal(message) ? [] : namedSelectorTokens(message);
  if (selectorTokens.length) {
    const scored = output
      .map((candidate) => ({ candidate, score: selectorScore(candidate, selectorTokens) }))
      .filter((item) => item.score > 0);
    const best = scored.length ? Math.max(...scored.map((item) => item.score)) : 0;
    if (best > 0) {
      selectorApplied = true;
      output = scored.filter((item) => item.score === best).map((item) => item.candidate);
    } else if (hasLikelyNamedSelector(message, selectorTokens)) {
      return { candidates: [], selectorApplied: true, explicitSelectorMiss: true };
    }
  }

  return { candidates: output, selectorApplied, explicitSelectorMiss: false };
}

function shouldBlockOnRecentInvalidation({ message = "", candidates = [], invalidations = [], route = {} } = {}) {
  if (!Array.isArray(invalidations) || !invalidations.length) return null;
  const text = clean(message, 600);

  // An explicit current selector is stronger than the old deleted anchor.
  if (explicitOrdinal(text) || mealCategoryHint(text) || explicitDateHint(text) || namedSelectorTokens(text).length) return null;
  if (!GENERIC_TARGET_REFERENCE.test(text) && !CORRECTION_PHRASE.test(text)) return null;

  const explicitDomains = inferDomains(text).filter((domain) => domain !== "general");
  const routeDomains = ["nutrition", "training", "goals", "social", "developer"]
    .filter((domain) => route?.[domain] === true);
  const candidateDomains = Array.from(new Set((Array.isArray(candidates) ? candidates : []).map((candidate) => candidate?.domain).filter(Boolean)));
  const relevantDomains = explicitDomains.length
    ? explicitDomains
    : routeDomains.length === 1
      ? routeDomains
      : candidateDomains;
  const entityTypes = entityTypeHints(text);

  return invalidations.find((item) => {
    if (relevantDomains.length && !relevantDomains.includes(item.domain)) return false;
    if (entityTypes.length === 1 && item.entityType && item.entityType !== entityTypes[0]) return false;
    return true;
  }) || null;
}

function entityTypeHints(message = "") {
  const text = clean(message, 600).toLowerCase();
  const types = [];
  if (/\bplanned meal|meal plan\b/.test(text)) types.push("meal_plan_item");
  else if (/\bmeal|breakfast|lunch|dinner|snack\b/.test(text)) types.push("meal");
  if (/\bworkout\b/.test(text)) types.push("workout");
  if (/\bactivity\b/.test(text)) types.push("activity_log");
  if (/\bweigh-?in|weight log\b/.test(text)) types.push("weight_log");
  if (/\bmeet-?up\b/.test(text)) types.push("meetup");
  if (/\bmission\b/.test(text)) types.push("mission");
  if (/\bcrew\b/.test(text)) types.push("crew");
  return Array.from(new Set(types));
}

function mealCategoryHint(message = "") {
  const match = clean(message, 600).toLowerCase().match(/\b(breakfast|lunch|dinner|snack)\b/);
  return match ? match[1] : "";
}

function candidateMealCategory(candidate = {}) {
  const direct = clean(candidate?.details?.mealCategory ?? candidate?.details?.meal_slot ?? candidate?.details?.mealSlot, 60).toLowerCase();
  if (["breakfast", "lunch", "dinner", "snack"].includes(direct)) return direct;
  const label = clean(candidate?.label, 220).toLowerCase();
  const match = label.match(/\b(breakfast|lunch|dinner|snack)\b/);
  return match ? match[1] : "";
}

function explicitDateHint(message = "") {
  const match = clean(message, 600).match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return match ? match[1] : "";
}

function candidateDate(candidate = {}) {
  const values = [
    candidate?.details?.nutritionDate,
    candidate?.details?.logDate,
    candidate?.details?.date,
    candidate?.canonical?.nutritionDate,
    candidate?.canonical?.logDate,
    candidate?.canonical?.date
  ];
  for (const value of values) {
    const text = clean(value, 40);
    if (/^20\d{2}-\d{2}-\d{2}$/.test(text)) return text;
  }
  return "";
}

function namedSelectorTokens(message = "") {
  return normalizeWords(message)
    .filter((word) => word.length >= 3)
    .filter((word) => !GENERIC_SELECTOR_WORDS.has(word))
    .filter((word) => !/^\d+(?:\.\d+)?$/.test(word))
    .slice(0, 8);
}

function hasLikelyNamedSelector(message = "", tokens = []) {
  if (!tokens.length) return false;
  const text = clean(message, 600).toLowerCase();
  return /\b(?:the|my)\s+[a-z0-9]/.test(text) || CORRECTION_PHRASE.test(text);
}

function selectorScore(candidate = {}, selectorTokens = []) {
  const candidateTokens = new Set(normalizeWords([
    candidate?.label,
    candidate?.details?.name,
    candidate?.details?.title,
    candidate?.details?.activityName,
    candidate?.details?.activity,
    candidate?.details?.focus
  ].filter(Boolean).join(" ")));
  let score = 0;
  for (const token of selectorTokens) {
    if (candidateTokens.has(token)) score += 1;
  }
  return score;
}

function normalizeWords(value = "") {
  return clean(value, 1000)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function explicitOrdinal(message = "") {
  const match = clean(message, 600).match(ORDINAL_REFERENCE);
  return match ? ORDINALS[String(match[1] || "").toLowerCase()] || null : null;
}

function resolveOrdinalCandidates(candidates = [], ordinal = null) {
  if (!ordinal) return [];
  const collections = new Map();

  for (const candidate of candidates) {
    const collection = clean(candidate?.details?.collection, 160);
    const candidateOrdinal = Number(candidate?.details?.ordinal);
    if (!collection || !Number.isInteger(candidateOrdinal) || candidateOrdinal < 1) continue;
    const key = `${candidate.domain}|${candidate.entityType}|${collection}`;
    if (!collections.has(key)) collections.set(key, []);
    collections.get(key).push(candidate);
  }

  const matches = [];
  for (const collection of collections.values()) {
    const match = collection.find((candidate) => Number(candidate?.details?.ordinal) === ordinal);
    if (match) matches.push(match);
  }
  return matches;
}

function resolution(status, reason, candidates = [], requiresClarification = false, extra = {}) {
  const normalized = Array.isArray(candidates) ? candidates : [];
  const selected = status === "resolved" && normalized.length === 1 ? normalized[0] : null;
  return {
    status,
    reason,
    requiresClarification: Boolean(requiresClarification),
    selectedReferenceId: selected?.referenceId || null,
    candidateReferenceIds: normalized.map((candidate) => candidate.referenceId).filter(Boolean).slice(0, MAX_APP_REFERENCES),
    ...(extra && typeof extra === "object" && !Array.isArray(extra) ? extra : {})
  };
}

function normalizeAppReferences(referenceState = {}) {
  const references = Array.isArray(referenceState?.references) ? referenceState.references : [];
  return references
    .filter((reference) => isActiveAppReference(reference))
    .slice(0, MAX_APP_REFERENCES)
    .map((reference, index) => normalizeAppReference(reference, index))
    .filter(Boolean);
}

function normalizeRecentInvalidations(referenceState = {}) {
  const now = Date.now();
  return (Array.isArray(referenceState?.recentInvalidations) ? referenceState.recentInvalidations : [])
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      referenceId: clean(item?.referenceId, 180),
      operation: clean(item?.operation, 120),
      domain: clean(item?.domain, 40).toLowerCase(),
      entityType: clean(item?.entityType, 60),
      state: clean(item?.state, 40).toLowerCase(),
      invalidatedAt: clean(item?.invalidatedAt, 80),
      expiresAt: clean(item?.expiresAt, 80)
    }))
    .filter((item) => item.referenceId && item.operation && item.domain)
    .filter((item) => !item.state || item.state === "invalidated")
    .filter((item) => {
      const expiresAt = Date.parse(item.expiresAt);
      return Number.isFinite(expiresAt) && expiresAt > now;
    })
    .sort((left, right) => Date.parse(right.invalidatedAt || 0) - Date.parse(left.invalidatedAt || 0))
    .slice(0, MAX_RECENT_INVALIDATIONS);
}

function isActiveAppReference(reference = {}) {
  const state = clean(reference?.state, 40).toLowerCase();
  if (!reference || typeof reference !== "object") return false;
  if (["cancelled", "failed", "expired", "deleted"].includes(state)) return false;
  if (!clean(reference?.referenceId, 160)) return false;
  return true;
}

function normalizeAppReference(reference = {}, index = 0) {
  const referenceId = clean(reference?.referenceId, 160);
  if (!referenceId) return null;

  const domain = clean(reference?.domain, 40).toLowerCase() || "general";
  const state = clean(reference?.state, 40).toLowerCase() || "discussed";
  const canonical = compactObject(reference?.canonical, 10);
  const details = compactObject(reference?.details, 14);
  const verification = compactObject(reference?.verification, 8);
  const trustedExecutor = verification?.verifiedByTrustedExecutor === true;
  const trustedContext = verification?.verifiedByTrustedContext === true && verification?.currentContextRead === true;

  return {
    referenceId,
    kind: "app_reference",
    authoritative: state === "persisted" && (trustedExecutor || trustedContext),
    authoritySource: trustedExecutor ? "trusted_executor" : trustedContext ? "current_trusted_context" : "unverified",
    state,
    domain,
    domains: [domain],
    entityType: clean(reference?.entityType, 60) || "app_object",
    label: clean(reference?.label, 220) || "Recent Ari action",
    actionName: clean(reference?.actionName, 120) || null,
    sourceTurnId: clean(reference?.sourceTurnId, 200) || null,
    canonical,
    details,
    verification,
    recencyRank: index + 1
  };
}

function normalizeConversationCandidate(item = {}, turnDistance = 1) {
  const role = item?.role === "assistant" ? "assistant" : "user";
  const text = clean(item?.content, MAX_REFERENCE_TEXT);
  if (!text) return null;

  return {
    referenceId: makeReferenceId({ role, text, turnDistance }),
    kind: "conversation_turn",
    role,
    turnDistance,
    domains: inferDomains(text),
    text
  };
}

function inferDomains(text = "") {
  const domains = Object.entries(DOMAIN_PATTERNS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([domain]) => domain);
  return domains.length ? domains : ["general"];
}

function makeReferenceId({ role = "user", text = "", turnDistance = 1 } = {}) {
  const source = `${role}|${turnDistance}|${text}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ref_turn_${turnDistance}_${(hash >>> 0).toString(36)}`;
}

function compactObject(value = {}, maxKeys = 10) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const [key, raw] of Object.entries(value).slice(0, maxKeys)) {
    if (raw === null || raw === undefined || raw === "") continue;
    if (typeof raw === "boolean") output[key] = raw;
    else if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
    else if (typeof raw === "string") output[key] = clean(raw, 220);
  }
  return output;
}

function trimPacket(packet = {}) {
  let candidates = Array.isArray(packet?.candidates) ? [...packet.candidates] : [];
  let output = { ...packet, candidates };

  while (candidates.length > 1 && JSON.stringify(output).length > MAX_PACKET_CHARACTERS) {
    candidates = candidates.slice(0, -1);
    output = { ...packet, candidates };
  }

  return output;
}

function clean(value = "", maxLength = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
