// ARI vNext — procedural skill compiler.
//
// This compiler does not generate executable code. It converts already-evidenced
// adaptive strategies, institutional lessons, and dream insights into compact
// runtime procedures that the executive can deliberately reuse.
//
// Mature source systems remain authoritative. This module is a projection layer,
// not a second persistence system.

export const ARI_PROCEDURAL_SKILL_VERSION = "1.0.0";

export function compileProceduralSkills({
  adaptiveStrategies = null,
  institutionalMemory = null,
  dreaming = null,
  route = {},
  message = "",
  limit = 8
} = {}) {
  const candidates = [
    ...skillsFromAdaptiveStrategies(adaptiveStrategies),
    ...skillsFromInstitutionalMemory(institutionalMemory),
    ...skillsFromDreaming(dreaming)
  ];

  const domains = deriveDomains(route, message);
  const ranked = candidates
    .map((skill) => ({
      ...skill,
      relevance: relevanceScore(skill, domains)
    }))
    .filter((skill) => skill.relevance > 0 || domains.has("general"))
    .sort((a, b) =>
      Number(b.relevance || 0) - Number(a.relevance || 0) ||
      Number(b.confidence || 0) - Number(a.confidence || 0) ||
      Number(b.evidenceCount || 0) - Number(a.evidenceCount || 0)
    );

  const deduped = [];
  const seen = new Set();
  for (const skill of ranked) {
    const key = canonical(skill.instruction || skill.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(skill);
    if (deduped.length >= Math.max(1, Math.min(12, Number(limit) || 8))) break;
  }

  return {
    version: ARI_PROCEDURAL_SKILL_VERSION,
    active: deduped.length > 0,
    compiledAt: new Date().toISOString(),
    requestedDomains: [...domains],
    count: deduped.length,
    skills: deduped.map((skill) => ({
      id: skill.id,
      key: skill.key,
      title: skill.title,
      instruction: skill.instruction,
      source: skill.source,
      domains: skill.domains,
      confidence: round(skill.confidence),
      evidenceCount: Math.max(0, Number(skill.evidenceCount || 0)),
      transferConditions: skill.transferConditions,
      disconfirmers: skill.disconfirmers,
      relevance: round(skill.relevance)
    })),
    sourceCounts: {
      adaptiveStrategy: deduped.filter((item) => item.source === "adaptive_strategy").length,
      institutionalMemory: deduped.filter((item) => item.source === "institutional_memory").length,
      dreaming: deduped.filter((item) => item.source === "dreaming").length
    },
    storesHiddenChainOfThought: false,
    executableCodeGenerated: false
  };
}

export function proceduralSkillsToInstruction(compiled = null) {
  const skills = Array.isArray(compiled?.skills) ? compiled.skills.slice(0, 8) : [];
  if (!compiled?.active || !skills.length) return "";

  return [
    "ARI PROCEDURAL SKILLS — EVIDENCE-EARNED RUNTIME PROCEDURES",
    "These are compact reusable procedures compiled from Ari's existing evidence-bearing learning systems.",
    "Use a skill only when its transfer conditions fit the current situation. Current evidence and explicit user instructions outrank every stored skill.",
    "A skill is a fallible procedure, not a fact. Disconfirming evidence should reduce or stop its use.",
    "Do not claim that a skill was learned successfully unless the source evidence supports that claim.",
    "Do not expose hidden chain-of-thought. Apply the procedure at an action/strategy level.",
    JSON.stringify({
      version: compiled.version,
      requestedDomains: compiled.requestedDomains,
      skills: skills.map((skill) => ({
        key: skill.key,
        title: skill.title,
        instruction: skill.instruction,
        source: skill.source,
        domains: skill.domains,
        confidence: skill.confidence,
        transferConditions: skill.transferConditions,
        disconfirmers: skill.disconfirmers
      }))
    }, null, 2)
  ].join("\n").slice(0, 6500);
}

function skillsFromAdaptiveStrategies(state = null) {
  const rows = Array.isArray(state?.active) ? state.active : [];
  return rows
    .filter((item) =>
      ["adopted", "practical_prior"].includes(clean(item?.status, 40)) &&
      clean(item?.instruction, 900).length >= 18 &&
      Number(item?.confidence || 0) >= 0.62
    )
    .map((item) => ({
      id: `strategy:${clean(item?.id || item?.strategyKey, 160)}`,
      key: clean(item?.strategyKey || item?.id, 160),
      title: clean(item?.title || item?.strategyKey, 180),
      instruction: clean(item?.instruction, 900),
      source: "adaptive_strategy",
      domains: normalizeDomains(item?.domains),
      confidence: clamp01(item?.confidence),
      evidenceCount: Math.max(
        Number(item?.trials || 0),
        Number(item?.positiveOutcomes || 0) +
          Number(item?.negativeOutcomes || 0) +
          Number(item?.neutralOutcomes || 0)
      ),
      transferConditions: [],
      disconfirmers: []
    }));
}

function skillsFromInstitutionalMemory(state = null) {
  const rows = Array.isArray(state?.lessons) ? state.lessons : [];
  return rows
    .filter((item) => {
      const instruction = clean(item?.lesson || item?.summary, 900);
      return instruction.length >= 18 && Number(item?.confidence || 0) >= 0.62;
    })
    .map((item) => ({
      id: `institutional:${clean(item?.id || item?.lessonKey || item?.lesson_key, 160)}`,
      key: clean(item?.lessonKey || item?.lesson_key || item?.id, 160),
      title: clean(item?.title || item?.summary, 180),
      instruction: clean(item?.lesson || item?.summary, 900),
      source: "institutional_memory",
      domains: normalizeDomains([
        item?.domain,
        ...(Array.isArray(item?.tags) ? item.tags : [])
      ]),
      confidence: clamp01(item?.confidence),
      evidenceCount: evidenceCountFromBasis(item?.evidenceBasis || item?.evidence_basis),
      transferConditions: [],
      disconfirmers: []
    }));
}

function skillsFromDreaming(state = null) {
  const rows = Array.isArray(state?.insights) ? state.insights : [];
  return rows
    .filter((item) =>
      ["strategy", "goal", "contradiction"].includes(clean(item?.kind, 40)) &&
      ["apply", "investigate"].includes(clean(item?.action, 40)) &&
      Number(item?.confidence || 0) >= 0.7 &&
      clean(item?.summary, 900).length >= 18
    )
    .map((item) => ({
      id: `dream:${clean(item?.id || item?.insightKey || item?.insight_key, 160)}`,
      key: clean(item?.insightKey || item?.insight_key || item?.id, 160),
      title: clean(item?.title || item?.summary, 180),
      instruction: clean(item?.summary, 900),
      source: "dreaming",
      domains: normalizeDomains([item?.domain]),
      confidence: clamp01(item?.confidence),
      evidenceCount: Array.isArray(item?.evidenceRefs || item?.evidence_refs)
        ? (item.evidenceRefs || item.evidence_refs).length
        : 0,
      transferConditions: cleanArray(item?.transferConditions || item?.transfer_conditions, 4, 220),
      disconfirmers: cleanArray(item?.disconfirmers, 4, 220)
    }));
}

function deriveDomains(route = {}, message = "") {
  const domains = new Set(["general"]);
  if (route?.developer) domains.add("developer");
  if (route?.nutrition) domains.add("nutrition");
  if (route?.training) domains.add("training");
  if (route?.goals) domains.add("goals");
  if (route?.social) domains.add("social");
  if (route?.memory) domains.add("memory");
  if (route?.currentInfo) domains.add("research");
  if (route?.health) domains.add("health");
  if (route?.judgment) domains.add("judgment");

  const text = clean(message, 2400).toLowerCase();
  const rules = [
    ["developer", /\b(code|repo|github|vercel|supabase|bug|architecture|deploy|test|implementation)\b/],
    ["research", /\b(research|find out|latest|source|evidence|verify|investigate)\b/],
    ["relationship", /\b(relationship|wife|husband|spouse|friend|family|trust|conflict)\b/],
    ["planning", /\b(plan|project|roadmap|goal|strategy|next step|organize)\b/],
    ["visual", /\b(visual|screenshot|ui|layout|screen|inspect the app)\b/]
  ];
  for (const [domain, pattern] of rules) if (pattern.test(text)) domains.add(domain);
  return domains;
}

function relevanceScore(skill, requestedDomains) {
  const domains = new Set(normalizeDomains(skill?.domains));
  if (!domains.size || domains.has("general")) return 0.45;
  let overlap = 0;
  for (const domain of requestedDomains) if (domains.has(domain)) overlap += 1;
  if (overlap > 0) return Math.min(1, 0.65 + overlap * 0.12);
  return 0;
}

function normalizeDomains(values) {
  const array = Array.isArray(values) ? values : [values];
  return [...new Set(
    array
      .map((value) => clean(value, 60).toLowerCase())
      .filter(Boolean)
      .map((value) => value.replace(/[^a-z0-9_-]+/g, "_"))
  )].slice(0, 8);
}

function evidenceCountFromBasis(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return clean(value, 500) ? 1 : 0;
}

function cleanArray(values, limit, max) {
  return (Array.isArray(values) ? values : [])
    .map((value) => clean(value, max))
    .filter(Boolean)
    .slice(0, limit);
}

function canonical(value) {
  return clean(value, 1400)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp01(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
