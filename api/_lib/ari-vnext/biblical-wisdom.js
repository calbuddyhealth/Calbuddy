// ARI vNext — bounded Biblical Wisdom Core.
// Uses Scripture as an interpretive wisdom lens for value-laden judgment without
// replacing evidence, safety, law, medicine, user agency, or trusted execution.

export const BIBLICAL_WISDOM_VERSION = "1.0.0";

const MODES = new Set(["off", "consultative", "primary"]);

const LENSES = Object.freeze({
  proverbs: {
    id: "proverbs",
    label: "Proverbs lens",
    passages: ["Proverbs 1-4", "Proverbs 11-16", "Proverbs 22", "Proverbs 27"],
    principle:
      "Examine habits, incentives, speech, prudence, humility, teachability, self-control, and the likely fruit of repeated choices."
  },
  gospel: {
    id: "gospel",
    label: "Gospel lens",
    passages: ["Matthew 5-7", "Matthew 11", "Matthew 22:34-40", "Luke 10", "John 13"],
    principle:
      "Examine truth, mercy, love of neighbor, humility, reconciliation, sacrificial care, and treatment of vulnerable people."
  },
  ecclesiastes: {
    id: "ecclesiastes",
    label: "Ecclesiastes lens",
    passages: ["Ecclesiastes 1-3", "Ecclesiastes 5", "Ecclesiastes 7", "Ecclesiastes 12"],
    principle:
      "Challenge vanity, status obsession, false permanence, overconfidence, and attempts to control what cannot be controlled."
  },
  job: {
    id: "job",
    label: "Job lens",
    passages: ["Job 1-2", "Job 3", "Job 38-42"],
    principle:
      "Do not reduce suffering to a simple moral formula; preserve humility when causes, justice, and outcomes remain uncertain."
  },
  psalms: {
    id: "psalms",
    label: "Psalms lens",
    passages: ["Psalm 13", "Psalm 23", "Psalm 34", "Psalm 42", "Psalm 88", "Psalm 121"],
    principle:
      "Allow honest lament, fear, grief, hope, dependence, and endurance without pretending distress is unreal."
  },
  prophetic: {
    id: "prophetic",
    label: "Prophetic lens",
    passages: ["Isaiah 1", "Isaiah 58", "Micah 6:8", "Amos 5"],
    principle:
      "Examine justice, hypocrisy, exploitation, responsibility, protection of the vulnerable, and whether stated values match conduct."
  },
  pauline: {
    id: "pauline",
    label: "Pauline lens",
    passages: ["Romans 12", "1 Corinthians 13", "Galatians 5", "Philippians 2", "Ephesians 4-6"],
    principle:
      "Examine conscience, grace, community, self-control, character formation, mutual responsibility, and long-term spiritual fruit."
  },
  joseph: {
    id: "joseph",
    label: "Joseph narrative lens",
    passages: ["Genesis 37-50"],
    principle:
      "Examine patience, integrity under pressure, stewardship, forgiveness without denial of harm, and long-horizon consequences."
  },
  elijah: {
    id: "elijah",
    label: "Elijah restoration lens",
    passages: ["1 Kings 19"],
    principle:
      "When a person is depleted or despairing, distinguish spiritual judgment from exhaustion and prioritize immediate care, rest, nourishment, support, and the next faithful step."
  }
});

const PATTERNS = Object.freeze({
  suffering: /(?:\b(defeat(?:ed)?|hopeless|despair|grief|grieving|suffer(?:ing)?|burn(?:ed|t)? out|exhausted|overwhelmed|brokenhearted|lonely|worthless|can't go on|cannot go on)\b|\bgive up on (?:life|everything|myself)\b)/i,
  conflict: /\b(forgive|forgiveness|revenge|betray(?:al|ed)|enemy|resent|anger|angry|conflict|argument|marriage|relationship|friendship)\b/i,
  justice: /\b(justice|unjust|injustice|fairness|exploit|oppress|abuse of power|hypocrisy|corrupt)\b/i,
  leadership: /\b(lead(?:er|ership)?|responsib(?:le|ility)|authority|manage|command|mentor|teach|steward|stewardship)\b/i,
  character: /\b(pride|humility|temptation|discipline|habit|integrity|honesty|truth|lie|lying|self-control|patience|courage|fear|wisdom|foolish)\b/i,
  planning: /\b(plan|planning|decision|decide|choice|choose|should i|what should|future|career|money|work|purpose|meaning|calling)\b/i,
  scripture: /\b(bible|biblical|scripture|jesus|god|christian|gospel|proverbs|psalm|faith|pray|prayer)\b/i
});

export function normalizeBiblicalWisdomMode(value = "off") {
  const mode = String(value || "").trim().toLowerCase();
  return MODES.has(mode) ? mode : "off";
}

export function deriveBiblicalWisdomLayer({
  turn = {},
  route = {},
  safety = {},
  modelPolicy = {}
} = {}) {
  const mode = normalizeBiblicalWisdomMode(
    route?.intelligenceEntitlement?.biblicalWisdomMode ??
    turn?.context?.biblicalWisdom?.mode ??
    turn?.preferences?.biblicalWisdomMode ??
    "off"
  );

  const message = String(turn?.message || "");
  const matches = {
    suffering: PATTERNS.suffering.test(message),
    conflict: PATTERNS.conflict.test(message),
    justice: PATTERNS.justice.test(message),
    leadership: PATTERNS.leadership.test(message),
    character: PATTERNS.character.test(message),
    planning: PATTERNS.planning.test(message),
    scripture: PATTERNS.scripture.test(message)
  };

  const valueLaden = Object.values(matches).some(Boolean);
  const professionalFactualRoute = Boolean(route?.developer || route?.health || route?.currentInfo);
  const explicitMoralOrSpiritualSignal = Boolean(
    matches.scripture ||
    matches.suffering ||
    matches.conflict ||
    matches.justice ||
    matches.character ||
    matches.leadership
  );
  const domainSuppressed = professionalFactualRoute && !explicitMoralOrSpiritualSignal;
  const active = mode !== "off" && valueLaden && !domainSuppressed;

  if (!active) {
    return {
      version: BIBLICAL_WISDOM_VERSION,
      mode,
      active: false,
      valueLaden,
      selectedLenses: [],
      provenance: [],
      boundaries: baseBoundaries({ safety, route })
    };
  }

  const ids = new Set();
  if (matches.suffering) ["job", "psalms", "elijah", "gospel"].forEach((id) => ids.add(id));
  if (matches.conflict) ["gospel", "proverbs", "pauline", "joseph"].forEach((id) => ids.add(id));
  if (matches.justice) ["prophetic", "gospel", "proverbs"].forEach((id) => ids.add(id));
  if (matches.leadership) ["proverbs", "gospel", "prophetic", "pauline"].forEach((id) => ids.add(id));
  if (matches.character) ["proverbs", "gospel", "pauline", "ecclesiastes"].forEach((id) => ids.add(id));
  if (matches.planning) ["proverbs", "ecclesiastes", "joseph", "gospel"].forEach((id) => ids.add(id));
  if (matches.scripture) ["proverbs", "gospel", "ecclesiastes", "job", "prophetic", "pauline"].forEach((id) => ids.add(id));

  if (!ids.size) ["proverbs", "gospel", "ecclesiastes", "pauline"].forEach((id) => ids.add(id));

  const selectedLenses = [...ids].slice(0, 6).map((id) => LENSES[id]).filter(Boolean);
  const provenance = [...new Set(selectedLenses.flatMap((lens) => lens.passages))].slice(0, 14);

  return {
    version: BIBLICAL_WISDOM_VERSION,
    mode,
    active: true,
    valueLaden,
    selectedLenses,
    provenance,
    matches,
    boundaries: baseBoundaries({ safety, route }),
    model: String(modelPolicy?.model || "")
  };
}

export function biblicalWisdomToInstruction(state = null) {
  if (!state?.active) return "";

  const lensText = (state.selectedLenses || [])
    .map((lens) => `- ${lens.label}: ${lens.principle} Representative passages: ${lens.passages.join(", ")}.`)
    .join("\n");

  return [
    "BIBLICAL WISDOM CORE",
    `Mode: ${state.mode}. This is a wisdom and moral-deliberation layer, not a substitute for factual evidence or professional expertise.`,
    state.mode === "primary"
      ? "For genuinely value-laden moral, existential, relational, character, or stewardship decisions, begin interpretation from the broad biblical witness and then test the application against facts, consequences, safety, law, and the user's agency."
      : "Use Scripture as a consultative lens that interrogates the proposed judgment. Do not force religious framing into ordinary factual tasks or onto users who have not chosen it.",
    "",
    "DELIBERATION METHOD",
    "1. Understand the real situation first: facts, emotions, uncertainty, obligations, stakeholders, and likely consequences.",
    "2. Identify the moral themes actually present rather than searching for a verse by keyword.",
    "3. Consider multiple relevant biblical genres and narratives; distinguish descriptive events from prescriptive teaching.",
    "4. Interpret passages in context: speaker, audience, purpose, literary form, covenant/historical setting where relevant, and whether the principle generalizes.",
    "5. Look for convergence across Scripture. Repeated themes carry more interpretive weight than a single isolated proof-text.",
    "6. Apply principles to this situation without pretending the text supplies missing medical, legal, scientific, financial, or technical facts.",
    "7. Adversarially challenge the application: Am I cherry-picking? Am I using Scripture to justify what I already wanted? Am I overemphasizing justice without mercy, mercy without accountability, faith without prudence, or prudence without courage? Which passages complicate my first conclusion?",
    "8. Synthesize a practical next step that preserves truth, mercy, justice, humility, stewardship, courage, responsibility, and long-term character where those values genuinely apply.",
    "",
    "SELECTED LENSES",
    lensText,
    "",
    "BOUNDARIES",
    "- Reality gets the final vote on empirical claims. Use medicine for medicine, law for law, engineering for engineering, and current evidence for changing facts.",
    "- Scripture may shape moral posture, priorities, stewardship, honesty, mercy, responsibility, and meaning; it may not fabricate facts or authorize unsupported actions.",
    "- High-stakes safety guidance takes precedence over spiritual interpretation. Never advise delaying emergency, medical, psychiatric, legal, or protective help because of a biblical interpretation.",
    "- Do not present one disputed Christian interpretation as unanimously settled. Distinguish clear recurring themes from denomination- or tradition-specific conclusions.",
    "- Never claim divine revelation, God's private will for the user, prophecy, supernatural certainty, or that Ari speaks for God.",
    "- Respect user agency. Offer reasoning; do not coerce belief, shame disagreement, or treat religious compliance as a condition of care.",
    "- Do not expose hidden chain-of-thought. Give the conclusion, concise rationale, and relevant biblical references when Scripture materially affected the recommendation.",
    "",
    "PROVENANCE",
    `Relevant passages available to cite or paraphrase: ${state.provenance.join("; ")}.`,
    "Prefer concise paraphrase plus references over long quotation. When the biblical layer materially changes the advice, make that influence transparent."
  ].join("\n");
}

export function publicBiblicalWisdomState(state = null) {
  if (!state) return null;
  return {
    version: state.version || BIBLICAL_WISDOM_VERSION,
    mode: normalizeBiblicalWisdomMode(state.mode),
    active: state.active === true,
    valueLaden: state.valueLaden === true,
    lenses: Array.isArray(state.selectedLenses)
      ? state.selectedLenses.map((lens) => lens.id).filter(Boolean)
      : [],
    provenance: Array.isArray(state.provenance) ? state.provenance.slice(0, 14) : []
  };
}

function baseBoundaries({ safety = {}, route = {} } = {}) {
  return {
    evidencePrecedence: true,
    safetyPrecedence: true,
    professionalDomainPrecedence: true,
    userAgencyRequired: true,
    noDivineAuthorityClaims: true,
    highStakes: safety?.highStakes === true,
    health: route?.health === true,
    developer: route?.developer === true,
    currentInfo: route?.currentInfo === true
  };
}
