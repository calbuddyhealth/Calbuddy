// ARI vNext — deterministic conversation personalization.
// Learns bounded communication patterns from direct Ari interactions only.
// It never uses Circle/social behavior, never optimizes engagement/time-in-app,
// and never overrides explicit current-turn or saved communication preferences.

export const ARI_CONVERSATION_PERSONALIZATION_VERSION = "2.0.0";

const HALF_LIFE_DAYS = 45;
const MIN_DIMENSION_SAMPLES = 4;
const MIN_VALUE_SUPPORT = 2;
const MIN_SCORE_SEPARATION = 0.1;

const DETAIL_VALUES = new Set(["brief", "balanced", "detailed"]);
const DIRECTNESS_VALUES = new Set(["gentle", "balanced", "direct"]);
const COMPLEXITY_VALUES = new Set(["simple", "balanced", "advanced"]);
const QUESTION_VALUES = new Set(["none", "light", "high"]);
const FORMAT_VALUES = new Set(["prose", "structured"]);

export function resolveConversationDomain(route = {}) {
  if (route?.training) return "training";
  if (route?.nutrition) return "nutrition";
  if (route?.goals) return "goals";
  if (route?.health || route?.medical) return "health";
  if (route?.developer || route?.projectHelp || route?.code) return "developer";
  if (route?.currentInfo || route?.research) return "research";
  if (route?.casualConversation) return "casual";
  return "general";
}

export function analyzeResponseStrategy({ reply = "", communication = {}, selfModel = null } = {}) {
  const text = clean(reply, 12000);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const listItemCount = lines.filter((line) => /^[-*•]\s+|^\d+[.)]\s+/.test(line)).length;
  const headingCount = lines.filter((line) => /^#{1,4}\s+|^[A-Z][A-Z\s&/:-]{3,}$/.test(line)).length;
  const paragraphCount = Math.max(1, text.split(/\n\s*\n/).filter((item) => clean(item, 12000)).length);
  const sentenceCount = Math.max(1, (text.match(/[.!?](?:\s|$)/g) || []).length);
  const questionCount = Math.min(8, (text.match(/\?/g) || []).length);
  const realizedReplyLength = text.length < 420 ? "brief" : text.length < 1100 ? "balanced" : "detailed";
  const questionBurden = questionCount === 0 ? "none" : questionCount <= 1 ? "light" : "high";
  const formatStyle = listItemCount >= 2 || headingCount >= 2 ? "structured" : "prose";
  const recommendationMode = /\b(i recommend|my recommendation|best option|best move|i would|you should)\b/i.test(text)
    ? "recommendation_first"
    : /\b(option 1|option 2|either|you could|choices? are)\b/i.test(text)
      ? "options"
      : "neutral";

  return {
    version: ARI_CONVERSATION_PERSONALIZATION_VERSION,
    tone: normalizeTone(communication?.tone),
    directness: normalizeDirectness(communication?.directness),
    detail: normalizeDetail(communication?.detail),
    complexity: normalizeComplexity(communication?.complexity),
    selfMode: clean(selfModel?.current?.mode, 80) || "unknown",
    realizedReplyLength,
    questionCount,
    questionBurden,
    formatStyle,
    recommendationMode,
    paragraphCount: Math.min(20, paragraphCount),
    sentenceCount: Math.min(80, sentenceCount),
    listItemCount: Math.min(40, listItemCount),
    headingCount: Math.min(20, headingCount)
  };
}

export function detectCurrentTurnCommunicationOverride(message = "") {
  const text = clean(message, 2000);
  if (!text) return {};

  const override = {};

  if (/\b(short answer|keep it short|keep (?:this|it) brief|be concise|concise answer|quick answer|simple answer|in simple terms|just the answer|just answer)\b/i.test(text)) {
    override.detail = "brief";
  } else if (/\b(more detail|more detailed|go into detail|explain (?:it )?(?:fully|thoroughly|in depth)|walk me through|deep dive)\b/i.test(text)) {
    override.detail = "detailed";
  }

  if (/\b(be direct|more direct|straight answer|straightforward|don't sugarcoat|do not sugarcoat|stop sugarcoating|just tell me|give me the answer)\b/i.test(text)) {
    override.directness = "direct";
  } else if (/\b(be gentle|more gentle|soften it|less harsh)\b/i.test(text)) {
    override.directness = "gentle";
  }

  if (/\b(simple terms|plain english|simpler|make it simple|less technical)\b/i.test(text)) {
    override.complexity = "simple";
  } else if (/\b(more technical|technical detail|advanced explanation|more advanced)\b/i.test(text)) {
    override.complexity = "advanced";
  }

  if (/\b(don't ask (?:me )?(?:follow[- ]?up )?questions|do not ask (?:me )?(?:follow[- ]?up )?questions|stop asking questions|no follow[- ]?up questions|fewer questions)\b/i.test(text)) {
    override.questionBurden = "none";
  }

  if (/\b(use bullets|bullet points|make (?:it|this) a list|list it out|structured format)\b/i.test(text)) {
    override.formatStyle = "structured";
  } else if (/\b(no bullets|don't use bullets|do not use bullets|write (?:it )?normally|just paragraphs)\b/i.test(text)) {
    override.formatStyle = "prose";
  }

  return override;
}

export function detectConversationSignal({ message = "" } = {}) {
  const text = clean(message, 2000);
  if (!text) return null;
  const currentTurnOverride = detectCurrentTurnCommunicationOverride(text);

  if (/\b(too long|too wordy|too much text|wall of text|stop lecturing|don't lecture|do not lecture)\b/i.test(text)) {
    return signal("negative", 0.96, "explicit_detail_feedback", { detail: "brief" }, text);
  }
  if (/\b(not enough detail|too vague|more detail|more detailed|explain more|go deeper|walk me through)\b/i.test(text)) {
    return signal("negative", 0.93, "explicit_detail_feedback", { detail: "detailed" }, text);
  }
  if (/\b(too indirect|be direct|more direct|stop sugarcoating|don't sugarcoat|do not sugarcoat|just answer|just tell me)\b/i.test(text)) {
    return signal("negative", 0.94, "explicit_directness_feedback", { directness: "direct" }, text);
  }
  if (/\b(too harsh|be gentler|more gentle|less harsh)\b/i.test(text)) {
    return signal("negative", 0.9, "explicit_directness_feedback", { directness: "gentle" }, text);
  }
  if (/\b(too complicated|too technical|simpler|simple terms|plain english|make it simple)\b/i.test(text)) {
    return signal("negative", 0.94, "explicit_complexity_feedback", { complexity: "simple" }, text);
  }
  if (/\b(too basic|more technical|more advanced|technical detail)\b/i.test(text)) {
    return signal("negative", 0.9, "explicit_complexity_feedback", { complexity: "advanced" }, text);
  }
  if (/\b(too many questions|stop asking questions|don't ask (?:me )?(?:follow[- ]?up )?questions|do not ask (?:me )?(?:follow[- ]?up )?questions|fewer questions)\b/i.test(text)) {
    return signal("negative", 0.96, "explicit_question_burden_feedback", { questionBurden: "none" }, text);
  }
  if (/\b(use bullets|bullet points|make (?:it|this) a list|list it out|more structured)\b/i.test(text)) {
    return signal("negative", 0.9, "explicit_format_feedback", { formatStyle: "structured" }, text);
  }
  if (/\b(no bullets|don't use bullets|do not use bullets|just paragraphs|less structured)\b/i.test(text)) {
    return signal("negative", 0.9, "explicit_format_feedback", { formatStyle: "prose" }, text);
  }

  const positive = /\b(exactly|perfect|that's better|that is better|that helps|this helps|that's what i needed|that is what i needed|that's what i meant|that is what i meant|i like how you|i like the way you|keep answering like|keep it like this|that was clear|that was helpful)\b/i.test(text);
  if (positive) {
    return signal("positive", 0.9, "explicit_positive_conversation_feedback", currentTurnOverride, text);
  }

  const repair = /^(?:no[,\s]|wait[,\s]|not quite|that's not|that is not|you misunderstood|you misread|wrong|i meant|what i meant)|\b(not what i asked|not what i meant|you didn't answer|you did not answer|you misunderstood me|that's wrong|that is wrong)\b/i.test(text);
  if (repair) {
    return signal("negative", 0.78, "conversation_repair_friction", currentTurnOverride, text);
  }

  return null;
}

export function summarizeConversationPersonalization(rows = [], { route = {}, domain = null, now = new Date() } = {}) {
  const currentDomain = clean(domain, 60) || resolveConversationDomain(route);
  const resolved = (Array.isArray(rows) ? rows : [])
    .filter((item) => item?.status === "resolved")
    .filter((item) => ["positive", "negative", "mixed"].includes(item?.outcomeDirection));

  const globalDimensions = scoreDimensions(resolved, { currentDomain: null, now });
  const scopedRows = resolved.filter((item) => item?.domain === currentDomain);
  const scopedDimensions = scoreDimensions(scopedRows, { currentDomain, now });

  const adaptiveProfile = {};
  const evidence = {};
  const dimensions = ["detail", "directness", "complexity", "questionBurden", "formatStyle"];

  for (const dimension of dimensions) {
    const scoped = scopedDimensions[dimension];
    const global = globalDimensions[dimension];
    const selected = scoped?.usable ? scoped : global?.usable ? global : null;
    if (!selected) continue;
    adaptiveProfile[dimension] = selected.preferredValue;
    evidence[dimension] = {
      confidence: selected.confidence,
      sampleSize: selected.sampleSize,
      effectiveSample: selected.effectiveSample,
      score: selected.preferredScore,
      separation: selected.separation,
      scope: selected === scoped ? currentDomain : "global"
    };
  }

  const appliedDimensions = Object.keys(adaptiveProfile);
  const confidence = appliedDimensions.length
    ? aggregateConfidence(appliedDimensions.map((key) => evidence[key]?.confidence))
    : "insufficient";

  return {
    version: ARI_CONVERSATION_PERSONALIZATION_VERSION,
    ready: true,
    currentDomain,
    resolvedCount: resolved.length,
    domainResolvedCount: scopedRows.length,
    shouldAdapt: appliedDimensions.length > 0,
    adaptiveProfile,
    evidence,
    confidence,
    safeguards: {
      explicitCurrentTurnAlwaysWins: true,
      savedExplicitPreferenceAlwaysWins: true,
      highStakesCanSuppressLearning: true,
      circleSocialDataAllowed: false,
      engagementOptimizationAllowed: false,
      timeInAppOptimizationAllowed: false,
      emotionalDependencyOptimizationAllowed: false,
      causalClaimAllowed: false,
      learnedToneAllowed: false,
      learnedProfanityAllowed: false,
      learnedHumorAllowed: false
    },
    guidance: appliedDimensions.length
      ? buildGuidance(adaptiveProfile, evidence)
      : "Conversation evidence is not yet strong enough to justify learned style adaptation."
  };
}

export function applyConversationPersonalization({
  explicitProfile = {},
  learning = null,
  message = "",
  safety = null
} = {}) {
  const base = {
    ...explicitProfile,
    tone: normalizeTone(explicitProfile?.tone),
    directness: normalizeDirectness(explicitProfile?.directness),
    detail: normalizeDetail(explicitProfile?.detail),
    humor: normalizeSimple(explicitProfile?.humor, "adaptive"),
    profanity: normalizeSimple(explicitProfile?.profanity, "match_user"),
    complexity: normalizeComplexity(explicitProfile?.complexity)
  };

  const currentTurnOverrides = detectCurrentTurnCommunicationOverride(message);
  const learned = learning?.personalization || learning || null;
  const adaptive = safeObject(learned?.adaptiveProfile);
  const evidence = safeObject(learned?.evidence);
  const learnedApplied = {};
  const highStakes = Boolean(safety?.highStakes || safety?.shouldStopNormalResponse || safety?.severity === "high");

  for (const dimension of ["detail", "directness", "complexity"]) {
    const currentValue = currentTurnOverrides[dimension];
    if (currentValue) {
      base[dimension] = currentValue;
      continue;
    }
    if (highStakes) continue;
    if (String(explicitProfile?.[dimension] || "adaptive") !== "adaptive") continue;
    const learnedValue = adaptive?.[dimension];
    if (!learnedValue) continue;
    base[dimension] = learnedValue;
    learnedApplied[dimension] = learnedValue;
  }

  const questionBurden = currentTurnOverrides.questionBurden || (!highStakes ? adaptive?.questionBurden : null) || null;
  const formatStyle = currentTurnOverrides.formatStyle || (!highStakes ? adaptive?.formatStyle : null) || null;

  return {
    ...base,
    personalization: {
      version: ARI_CONVERSATION_PERSONALIZATION_VERSION,
      applied: Object.keys(learnedApplied).length > 0 || Boolean(questionBurden || formatStyle),
      highStakesSuppressed: highStakes,
      currentTurnOverrides,
      learnedApplied,
      questionBurden,
      formatStyle,
      evidence,
      confidence: learned?.confidence || "insufficient",
      source: "conversation_personalization",
      explicitProfilePreserved: true,
      circleSocialDataAllowed: false,
      engagementOptimizationAllowed: false
    }
  };
}

export function conversationPersonalizationToInstruction(state = null) {
  if (!state) return "";
  const adaptive = state?.adaptiveProfile || {};
  const lines = [
    "CONVERSATION PERSONALIZATION",
    "Learned conversation patterns are bounded advisory signals from the user's direct Ari interactions only.",
    "Current-turn instructions and saved explicit communication preferences always outrank learned patterns.",
    "Do not use Ari Circle/social behavior. Do not optimize for engagement, time-in-app, dependency, guilt, pressure, or manipulation.",
    "Do not infer personality, diagnosis, intelligence, or other sensitive traits from communication behavior.",
    "In high-stakes contexts, clarity/safety outrank learned style.",
    state?.guidance || "No learned adaptation is justified yet."
  ];
  if (Object.keys(adaptive).length) lines.push(`Adaptive profile: ${JSON.stringify(adaptive)}`);
  if (state?.evidence) lines.push(`Evidence: ${JSON.stringify(state.evidence)}`);
  return lines.join("\n").slice(0, 5000);
}

function scoreDimensions(rows, { currentDomain = null, now = new Date() } = {}) {
  const accumulators = {
    detail: new Map(),
    directness: new Map(),
    complexity: new Map(),
    questionBurden: new Map(),
    formatStyle: new Map()
  };

  for (const item of rows) {
    const strategy = safeObject(item?.strategy);
    const signalDimensions = safeObject(item?.followup?.conversationSignal?.dimensions);
    const ageWeight = recencyWeight(item?.resolvedAt || item?.createdAt, now);
    const confidenceWeight = clamp(Number(item?.associationConfidence || 0.5), 0.2, 1);
    const sourceWeight = evaluationSourceWeight(item?.evaluationSource);
    const domainWeight = currentDomain && item?.domain === currentDomain ? 1.15 : 1;
    const weight = ageWeight * confidenceWeight * sourceWeight * domainWeight;

    const dimensions = {
      detail: normalizeDetail(signalDimensions.detail || strategy.detail || strategy.realizedReplyLength),
      directness: normalizeDirectness(signalDimensions.directness || strategy.directness),
      complexity: normalizeComplexity(signalDimensions.complexity || strategy.complexity),
      questionBurden: normalizeQuestionBurden(signalDimensions.questionBurden || strategy.questionBurden || fromQuestionCount(strategy.questionCount)),
      formatStyle: normalizeFormatStyle(signalDimensions.formatStyle || strategy.formatStyle)
    };

    for (const [dimension, value] of Object.entries(dimensions)) {
      if (!isScorableDimensionValue(dimension, value)) continue;
      addEvidence(accumulators[dimension], value, item?.outcomeDirection, weight);
    }
  }

  return Object.fromEntries(
    Object.entries(accumulators).map(([dimension, map]) => [dimension, summarizeDimension(map)])
  );
}

function addEvidence(map, value, direction, weight) {
  const current = map.get(value) || { value, positive: 0, negative: 0, raw: 0 };
  current.raw += 1;
  if (direction === "positive") current.positive += weight;
  else if (direction === "negative") current.negative += weight;
  else if (direction === "mixed") {
    current.positive += weight * 0.5;
    current.negative += weight * 0.5;
  }
  map.set(value, current);
}

function summarizeDimension(map) {
  const values = [...map.values()].map((item) => {
    const effective = item.positive + item.negative;
    const score = (item.positive + 1.5) / (effective + 3);
    return {
      ...item,
      effectiveSample: round(effective, 2),
      score: round(score, 3)
    };
  }).sort((a, b) => b.score - a.score || b.effectiveSample - a.effectiveSample);

  const sampleSize = values.reduce((sum, item) => sum + item.raw, 0);
  const effectiveSample = round(values.reduce((sum, item) => sum + item.effectiveSample, 0), 2);
  const best = values[0] || null;
  const second = values[1] || null;
  const separation = best && second ? round(best.score - second.score, 3) : 0;
  const usable = Boolean(
    best &&
    sampleSize >= MIN_DIMENSION_SAMPLES &&
    best.raw >= MIN_VALUE_SUPPORT &&
    second &&
    separation >= MIN_SCORE_SEPARATION
  );

  return {
    usable,
    preferredValue: usable ? best.value : null,
    preferredScore: best?.score ?? null,
    separation,
    sampleSize,
    effectiveSample,
    confidence: usable ? confidenceFor(sampleSize, separation) : "insufficient",
    values
  };
}

function buildGuidance(profile, evidence) {
  const parts = [];
  if (profile.detail) parts.push(`lean ${profile.detail} on answer length/detail`);
  if (profile.directness) parts.push(`use ${profile.directness} directness`);
  if (profile.complexity) parts.push(`use ${profile.complexity} complexity`);
  if (profile.questionBurden === "none") parts.push("avoid unnecessary follow-up questions");
  else if (profile.questionBurden === "light") parts.push("keep follow-up questions light");
  if (profile.formatStyle === "structured") parts.push("prefer structured formatting when useful");
  else if (profile.formatStyle === "prose") parts.push("prefer normal prose unless structure materially helps");
  const strongest = Object.entries(evidence || {}).sort((a, b) => (b[1]?.sampleSize || 0) - (a[1]?.sampleSize || 0))[0];
  const basis = strongest ? ` Strongest evidence: ${strongest[0]} (${strongest[1].confidence}, n=${strongest[1].sampleSize}).` : "";
  return `When the current turn and explicit profile leave style adaptive, ${parts.join("; ")}.${basis}`;
}

function signal(direction, confidence, source, dimensions, message) {
  return {
    direction,
    confidence,
    source,
    followup: {
      conversationSignal: {
        version: ARI_CONVERSATION_PERSONALIZATION_VERSION,
        direction,
        source,
        dimensions: safeObject(dimensions),
        explicit: source.startsWith("explicit_"),
        messagePreview: clean(message, 220)
      }
    }
  };
}

function evaluationSourceWeight(source = "") {
  const value = clean(source, 100);
  if (value.startsWith("explicit_")) return 1.35;
  if (value === "conversation_repair_friction") return 1.05;
  if (/training_adherence|nutrition_follow_through/.test(value)) return 0.8;
  return 0.7;
}

function recencyWeight(value, now = new Date()) {
  const timestamp = Date.parse(String(value || ""));
  if (!Number.isFinite(timestamp)) return 0.65;
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(String(now));
  const ageDays = Math.max(0, (nowMs - timestamp) / 86400000);
  return Math.max(0.2, Math.pow(0.5, ageDays / HALF_LIFE_DAYS));
}

function confidenceFor(sampleSize, separation) {
  if (sampleSize >= 12 && separation >= 0.18) return "high";
  if (sampleSize >= 7 && separation >= 0.13) return "medium";
  return "low";
}

function aggregateConfidence(values) {
  if (values.includes("high")) return "high";
  if (values.includes("medium")) return "medium";
  if (values.includes("low")) return "low";
  return "insufficient";
}

function normalizeDetail(value) {
  const text = clean(value, 30).toLowerCase();
  if (["concise", "short"].includes(text)) return "brief";
  if (["thorough", "long", "verbose"].includes(text)) return "detailed";
  return DETAIL_VALUES.has(text) ? text : "adaptive";
}

function normalizeDirectness(value) {
  const text = clean(value, 30).toLowerCase();
  if (["straight", "blunt"].includes(text)) return "direct";
  return DIRECTNESS_VALUES.has(text) ? text : "adaptive";
}

function normalizeComplexity(value) {
  const text = clean(value, 30).toLowerCase();
  if (["plain", "basic"].includes(text)) return "simple";
  if (["technical", "expert"].includes(text)) return "advanced";
  return COMPLEXITY_VALUES.has(text) ? text : "adaptive";
}

function normalizeTone(value) {
  return clean(value, 30).toLowerCase() || "adaptive";
}

function normalizeQuestionBurden(value) {
  const text = clean(value, 30).toLowerCase();
  return QUESTION_VALUES.has(text) ? text : "unknown";
}

function normalizeFormatStyle(value) {
  const text = clean(value, 30).toLowerCase();
  return FORMAT_VALUES.has(text) ? text : "unknown";
}

function normalizeSimple(value, fallback) {
  return clean(value, 30).toLowerCase() || fallback;
}

function fromQuestionCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return "unknown";
  if (count <= 0) return "none";
  if (count === 1) return "light";
  return "high";
}

function isScorableDimensionValue(dimension, value) {
  if (dimension === "detail") return DETAIL_VALUES.has(value);
  if (dimension === "directness") return DIRECTNESS_VALUES.has(value);
  if (dimension === "complexity") return COMPLEXITY_VALUES.has(value);
  if (dimension === "questionBurden") return QUESTION_VALUES.has(value);
  if (dimension === "formatStyle") return FORMAT_VALUES.has(value);
  return false;
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
