// Explicit corrections supersede the same preference dimension. Unknown topics
// are preserved independently rather than guessed into a conflicting category.
export function reconcilePreferences({ previous = {}, memoryLines = [], message = "", turnId = null, at = new Date().toISOString(), creative = false } = {}) {
  const prior = Array.isArray(previous.records) ? previous.records : (previous.items || []).map(text => ({ text, source: "legacy_memory", observedAt: null }));
  const records = prior.map(item => ({ ...item, text: clean(item.text), key: item.key || preferenceKey(item.text) })).filter(item => item.text);
  const superseded = [...(previous.superseded || [])];
  const incoming = memoryLines.filter(text => /\b(prefer|like|love|favorite|favourite|dislike|hate|want ari to|prefer ari to)\b/i.test(text))
    .map(text => ({ text: clean(text), source: "retrieved_memory", observedAt: at, turnId: null }));
  const explicit = creative ? [] : extractPreferenceStatements(message);
  for (const text of explicit) incoming.push({ text, source: "explicit_user", observedAt: at, turnId });
  for (const item of incoming) {
    item.key = preferenceKey(item.text);
    const exact = records.find(row => row.text.toLowerCase() === item.text.toLowerCase());
    const same = records.filter(row => row.key === item.key);
    // Retrieval does not establish recency. It cannot undo an explicit correction.
    if (item.source !== "explicit_user" && same.some(row => row.source === "explicit_user")) continue;
    if (exact && item.source !== "explicit_user") continue;
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].key !== item.key) continue;
      const old = records.splice(i, 1)[0];
      if (old.text !== item.text) superseded.unshift({ ...old, supersededAt: at, supersededBy: item.text });
    }
    records.unshift(item);
  }
  // Explicit corrections survive ordinary retrieval churn; keep fresh records first.
  records.sort((a, b) => Number(b.source === "explicit_user") - Number(a.source === "explicit_user"));
  const active = records.slice(0, 18);
  return { items: active.map(item => item.text), records: active, superseded: superseded.slice(0, 18) };
}

export function extractPreferenceStatements(message = "") {
  return String(message).split(/(?<=[.!?])\s+|\n+/).map(clean).filter(text =>
    /^(?:actually[, ]+|from now on[, ]+|please[, ]+)*(?:i (?:now |no longer )?(?:prefer|like|dislike|hate|love|want (?:you|ari) to)|keep (?:your |the )?(?:answers|responses|replies)|(?:make|keep) your (?:answers|responses|replies))\b/i.test(text)
  ).slice(0, 4);
}

function preferenceKey(value) {
  const text = clean(value).toLowerCase();
  if (/\b(answer|answers|response|responses|reply|replies|explanation|explanations)\b/.test(text)) {
    if (/\b(short|shorter|brief|concise|long|longer|detailed|detail|verbose|verbosity)\b/.test(text)) return "communication.length";
    if (/\b(bullet|bullets|paragraph|paragraphs|list|lists)\b/.test(text)) return "communication.format";
    if (/\b(formal|casual|warm|direct|blunt|gentle)\b/.test(text)) return "communication.tone";
  }
  return `text:${text.replace(/[.!]+$/, "")}`;
}
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, 360); }
