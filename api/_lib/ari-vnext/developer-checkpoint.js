// Compact, read-only continuation state. Never persist source contents or replay writes.
export const DEVELOPER_STEP_LIMIT = 6;

const READ_ARGUMENTS = {
  owner_repo_read: ["filePath", "branch", "startLine", "endLine"],
  owner_repo_search: ["query", "path", "branch"],
  owner_repo_ci_status: ["branch", "commitSha"],
  owner_memory_search: ["query"],
  owner_cognitive_trace_read: ["limit"],
  owner_agent_mailbox_list: ["recipient", "sender", "kind", "limit"],
  owner_agent_mailbox_read: ["messageId"]
};

export function normalizeDeveloperCheckpoint(value) {
  if (!value || value.version !== 1) return null;
  const operation = value.nextOperation;
  if (!operation || !Object.hasOwn(READ_ARGUMENTS, operation.name)) return null;
  const args = operation.arguments;
  if (!args || typeof args !== "object" || Array.isArray(args)) return null;
  const entries = READ_ARGUMENTS[operation.name].map(key => [key, args[key] ?? null]);
  if (entries.some(([, item]) => item !== null &&
      !(typeof item === "string" && item.length <= 700) &&
      !(typeof item === "number" && Number.isSafeInteger(item)))) return null;
  return {
    version: 1,
    completedSteps: Math.min(DEVELOPER_STEP_LIMIT, Math.max(0, Number(value.completedSteps) || 0)),
    nextOperation: { name: operation.name, arguments: Object.fromEntries(entries) },
    inspectedFiles: (Array.isArray(value.inspectedFiles) ? value.inspectedFiles : [])
      .filter(file => typeof file?.filePath === "string" && /^[a-f0-9]{40,64}$/i.test(file?.sha || ""))
      .slice(-12)
      .map(file => ({
        filePath: file.filePath.slice(0, 420),
        branch: typeof file.branch === "string" ? file.branch.slice(0, 180) : null,
        sha: file.sha,
        fullFile: file.fullFile === true
      }))
  };
}

export function createDeveloperCheckpoint({ checked, reads = [], previous = null, completedSteps = DEVELOPER_STEP_LIMIT } = {}) {
  // An edit selected at the boundary must start with a fresh read next turn.
  const nextOperation = checked?.name === "propose_owner_github_edit"
    ? { name: "owner_repo_read", arguments: { filePath: checked.arguments?.filePath, branch: null, startLine: null, endLine: null } }
    : { name: checked?.name, arguments: checked?.arguments };
  const files = new Map((normalizeDeveloperCheckpoint(previous)?.inspectedFiles || [])
    .map(file => [`${file.branch}:${file.filePath}`, file]));
  for (const read of reads) files.set(`${read.branch}:${read.filePath}`, read);
  return normalizeDeveloperCheckpoint({ version: 1, completedSteps, nextOperation, inspectedFiles: [...files.values()] });
}

export function developerCheckpointNextStep(value) {
  const checkpoint = normalizeDeveloperCheckpoint(value);
  if (!checkpoint) return "Review the collected evidence and choose the next safe inspection.";
  const { name, arguments: args } = checkpoint.nextOperation;
  if (name === "owner_repo_read") return `Read ${args.filePath}${args.branch ? ` on ${args.branch}` : ""}${args.startLine || args.endLine ? ` (lines ${args.startLine || 1}–${args.endLine || "end"})` : ""} and reassess the evidence before any edit.`;
  if (name === "owner_repo_search") return `Search the repository for ${JSON.stringify(args.query)}${args.path ? ` in ${args.path}` : ""}.`;
  if (name === "owner_repo_ci_status") return `Check CI for ${args.commitSha || args.branch || "the current development branch"}.`;
  if (name === "owner_memory_search") return `Search owner memory for ${JSON.stringify(args.query)}.`;
  if (name === "owner_cognitive_trace_read") return `Inspect the latest ${args.limit} cognitive trace record(s).`;
  if (name === "owner_agent_mailbox_read") return `Read mailbox message ${args.messageId}.`;
  return "Inspect the saved mailbox query for relevant replies.";
}

export function developerResumeCheckpoint(turn = {}) {
  const workspace = turn?.context?.userWorldModel?.ariCognitiveWorkspace?.executionWorkspace;
  if (!workspace?.active || !workspace.resumeSuggested ||
      !["active", "waiting", "blocked"].includes(workspace.session?.status)) return null;
  // A new instruction or a question about progress must not replay an old operation.
  if (!/^(?:please\s+)?(?:continue|resume|keep going|go ahead|finish(?: the investigation)?)(?:\s+please)?[.!\s]*$/i.test(String(turn.message || "").trim())) return null;
  return normalizeDeveloperCheckpoint(workspace.session.developerCheckpoint);
}

export function developerPauseReply({ evidence = {}, checkpoint = null, stored = null } = {}) {
  const state = normalizeDeveloperCheckpoint(checkpoint);
  const observations = (Array.isArray(evidence.observations) ? evidence.observations : [])
    .slice(-4).map(item => String(item?.summary || "").slice(0, 400)).filter(Boolean);
  return [
    `I paused after ${state?.completedSteps || DEVELOPER_STEP_LIMIT} investigation steps. The investigation is not complete.`,
    observations.length ? `Evidence collected:\n${observations.map(item => `- ${item}`).join("\n")}` : "No verified findings are available yet.",
    `Next: ${developerCheckpointNextStep(state)}`,
    stored === true ? 'The checkpoint was saved. Say "continue" to resume that step within another bounded investigation.' :
      stored === false ? "I couldn't save a resumable checkpoint. Keep the next step above; I cannot promise this investigation will resume from it." : ""
  ].filter(Boolean).join("\n\n");
}

export function finalizeDeveloperPause(result = {}, { stateStored = false, session = null } = {}) {
  if (result.source !== "ari_vnext_owner_developer_step_limit") return {};
  const checkpoint = normalizeDeveloperCheckpoint(result.executionWorkspaceUpdate?.developerCheckpoint);
  const stored = stateStored === true && checkpoint !== null &&
    JSON.stringify(normalizeDeveloperCheckpoint(session?.developerCheckpoint)) === JSON.stringify(checkpoint);
  return {
    reply: developerPauseReply({ evidence: result.executionEvidence, checkpoint, stored }),
    developerInvestigation: { paused: true, checkpointStored: stored, nextStep: developerCheckpointNextStep(checkpoint) }
  };
}
