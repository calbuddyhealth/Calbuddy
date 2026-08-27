// ARI vNext — bounded universal conversational reference context.
//
// Purpose:
// - Detect short context-dependent follow-ups such as "log them", "change it",
//   "do that", or "join the second one".
// - Give the primary Ari model a compact candidate index from recent turns.
// - Keep mutation authorization and reference resolution separate: only the
//   CURRENT user message can authorize a write; history may identify its target.
// - Add no extra model call. Trusted domain adapters remain authoritative.

export const REFERENCE_CONTEXT_VERSION = "1.0.0";

const MAX_REFERENCE_TURNS = 8;
const MAX_REFERENCE_TEXT = 900;
const MAX_PACKET_CHARACTERS = 6200;

const REFERENCE_MARKER = /\b(?:it|its|them|they|their|that|this|those|these|one|ones|the other one|the first one|the second one|the third one|first one|second one|third one|former|latter|same one|previous one|last one)\b/i;
const CONTINUATION_PHRASE = /^(?:and|but|then|instead|okay|ok|yeah|yes|no|nope|make it|do that|use that|use it|go with that|go with it|the other one)\b/i;

const DOMAIN_PATTERNS = {
  nutrition: /\b(?:calorie|calories|kcal|macro|macros|protein|carb|carbs|fat|meal|food|eat|ate|eaten|breakfast|lunch|dinner|snack|nutrition|diet|potato|potatoes|rice|chicken|beef|salmon|egg|eggs|drink|drank)\b/i,
  training: /\b(?:workout|training|train|exercise|sets?|reps?|gym|bench|squat|deadlift|press|row|run|running|walk|walking|bike|cycling|hike|cardio|chest|back|legs?|shoulders?|arms?|biceps?|triceps?)\b/i,
  goals: /\b(?:goal|weight|target|calorie goal|daily goal|lose|gain|maintain|maintenance|cut|bulk|bmi)\b/i,
  social: /\b(?:circle|meetup|meet-up|mission|crew|challenge|friend|post|event|join|rsvp|host)\b/i,
  developer: /\b(?:github|repo|repository|branch|commit|deploy|vercel|supabase|api|code|javascript|html|css|sql)\b/i
};

export function isReferenceFollowUp(message = "") {
  const text = clean(message, 600);
  if (!text || text.length > 240) return false;
  return REFERENCE_MARKER.test(text) || CONTINUATION_PHRASE.test(text);
}

export function buildReferencePacket(turn = {}, route = {}) {
  const message = clean(turn?.message, 8000);
  const history = Array.isArray(turn?.history) ? turn.history : [];
  const active = Boolean(history.length && (route?.followUp === true || isReferenceFollowUp(message)));

  if (!active) return null;

  const candidates = history
    .slice(-MAX_REFERENCE_TURNS)
    .reverse()
    .map((item, index) => normalizeCandidate(item, index + 1))
    .filter(Boolean);

  if (!candidates.length) return null;

  const packet = {
    version: REFERENCE_CONTEXT_VERSION,
    active: true,
    source: "recent_conversation_reference_index",
    currentMessage: message.slice(0, 600),
    referenceDetected: REFERENCE_MARKER.test(message),
    candidates,
    policy: {
      currentTurnAuthorizesMutation: true,
      historyMayResolveTargetOnly: true,
      historyNeverGrantsWritePermission: true,
      preferNearestCompatibleReference: true,
      preferAuthoritativeAppStateOnConflict: true,
      clarifyWhenAmbiguous: true,
      neverInventMissingTarget: true
    }
  };

  return trimPacket(packet);
}

function normalizeCandidate(item = {}, turnDistance = 1) {
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
