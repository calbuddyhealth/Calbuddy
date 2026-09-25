// ARI vNext — autonomous background multi-agent queue processor.

import {
  claimAgentJobs,
  completeAgentJob,
  deadletterAgentJob,
  enqueueAgentJob,
  retryAgentJob,
  retryDelaySeconds
} from "./agent-queue.js";
import {
  loadAgentTaskSessionById,
  loadAgentTaskWorkers,
  updateAgentTaskSession
} from "./agent-task-store.js";
import {
  runQueuedSpecialist,
  runQueuedVerifier
} from "./background-specialist.js";
import {
  listAgentMailboxMessages,
  sendAgentMailboxMessage
} from "../../../server/ari-supabase-agent-mailbox.js";

export const ARI_BACKGROUND_AGENT_RUNTIME_VERSION = "1.0.0";

export async function runBackgroundAgentBatch({
  limit = 2,
  visibilitySeconds = 300
} = {}) {
  const jobs = await claimAgentJobs({ limit, visibilitySeconds });
  const summary = {
    success: true,
    version: ARI_BACKGROUND_AGENT_RUNTIME_VERSION,
    claimed: jobs.length,
    completed: 0,
    retried: 0,
    deadlettered: 0,
    verifiersQueued: 0,
    resolversQueued: 0,
    stoppedForRateLimit: false,
    failures: []
  };

  for (const job of jobs) {
    if (job.readCount > job.maxAttempts) {
      await deadletter(job, codedError("AGENT_JOB_MAX_ATTEMPTS", "Maximum background attempts exceeded."), summary);
      continue;
    }

    try {
      const result = job.jobType === "verifier"
        ? await processVerifier(job)
        : await processSpecialist(job);

      summary.completed += result.completed ? 1 : 0;
      summary.verifiersQueued += Number(result.verifiersQueued || 0);
      summary.resolversQueued += Number(result.resolversQueued || 0);
    } catch (error) {
      if (job.readCount >= job.maxAttempts) {
        await deadletter(job, error, summary);
      } else {
        const delay = retryDelaySeconds(job, error);
        await retryAgentJob({
          msgId: job.msgId,
          taskId: job.taskId,
          workerKey: job.workerKey,
          delaySeconds: delay,
          error: clean(error?.message || error, 1000),
          errorCode: clean(error?.code, 240) || null
        });
        summary.retried += 1;
        summary.failures.push({
          taskId: job.taskId,
          workerKey: job.workerKey,
          stage: "retry",
          retryInSeconds: delay,
          code: clean(error?.code, 120) || null
        });
      }

      if (Number(error?.status) === 429) {
        summary.stoppedForRateLimit = true;
        break;
      }
    }
  }

  return summary;
}

async function processSpecialist(job) {
  const task = await loadAgentTaskSessionById({
    userId: job.userId,
    taskId: job.taskId
  });
  if (!task) throw codedError("AGENT_TASK_NOT_FOUND", "Durable agent task was not found.");

  const priorMessages = await loadTaskMessages(job);
  const result = await runQueuedSpecialist({ job, priorMessages });
  if (!result?.success || !result?.text) {
    throw codedError("AGENT_SPECIALIST_EMPTY", "Background specialist returned no usable conclusion.");
  }

  const mailbox = await sendAgentMailboxMessage({
    userId: job.userId,
    sender: workerSender(job.workerKey),
    recipient: "ari-orchestrator",
    kind: job.jobType === "resolver" ? "handoff" : "finding",
    threadId: job.taskId,
    subject: `${clean(job.role, 80) || "specialist"} · background round ${job.round}`,
    payload: {
      workerKey: job.workerKey,
      jobType: job.jobType,
      role: job.role,
      objective: job.objective,
      content: result.text,
      evidence: result.evidence,
      toolCallCount: Number(result.toolCallCount || 0),
      success: true,
      followup: job.followup === true,
      round: job.round
    },
    metadata: {
      source: "ari_background_agent_worker",
      coordinationRole: "worker",
      taskId: job.taskId,
      executionSessionId: job.executionSessionId,
      providerModel: result?.provider?.model || null,
      asynchronous: true
    },
    idempotencyKey: `agent-job:${job.msgId}:result`
  });
  if (!mailbox?.success) {
    throw codedError(
      mailbox?.code || "AGENT_MAILBOX_WRITE_FAILED",
      mailbox?.message || "Could not persist background specialist result."
    );
  }

  await completeAgentJob({
    msgId: job.msgId,
    taskId: job.taskId,
    workerKey: job.workerKey,
    mailboxMessageId: mailbox.messageId,
    providerModel: result?.provider?.model || null
  });

  const verifiersQueued = await enqueueVerifierWhenRoundSettled({
    job,
    task
  });

  return {
    completed: true,
    mailboxMessageId: mailbox.messageId,
    verifiersQueued
  };
}

async function processVerifier(job) {
  const task = await loadAgentTaskSessionById({
    userId: job.userId,
    taskId: job.taskId
  });
  if (!task) throw codedError("AGENT_TASK_NOT_FOUND", "Durable agent task was not found.");

  const priorMessages = await loadTaskMessages(job);
  const verification = await runQueuedVerifier({ job, priorMessages });
  if (!verification?.success || !verification?.synthesis) {
    throw codedError("AGENT_VERIFIER_EMPTY", "Background verifier returned no usable synthesis.");
  }

  const mailbox = await sendAgentMailboxMessage({
    userId: job.userId,
    sender: "ari-verifier",
    recipient: "ari-orchestrator",
    kind: "experiment_result",
    threadId: job.taskId,
    subject: `Background council reconciliation · round ${job.round}`,
    payload: {
      workerKey: job.workerKey,
      jobType: "verifier",
      role: "council_verifier",
      objective: job.objective,
      content: verification.synthesis,
      ready: verification.ready === true,
      confidence: Number(verification.confidence || 0),
      unresolved: verification.unresolved,
      nextStep: verification.nextStep,
      resolver: verification.resolver,
      evidence: verification.evidence,
      toolCallCount: Number(verification.toolCallCount || 0),
      round: job.round
    },
    metadata: {
      source: "ari_background_agent_worker",
      coordinationRole: "verifier",
      taskId: job.taskId,
      executionSessionId: job.executionSessionId,
      providerModel: verification?.provider?.model || null,
      asynchronous: true
    },
    idempotencyKey: `agent-job:${job.msgId}:verifier-result`
  });
  if (!mailbox?.success) {
    throw codedError(
      mailbox?.code || "AGENT_MAILBOX_WRITE_FAILED",
      mailbox?.message || "Could not persist background verifier result."
    );
  }

  const ready = verification.ready === true;
  const nextStep = ready
    ? "Use the reconciled background specialist evidence in Ari's next execution step."
    : clean(
        verification.nextStep ||
        "Resolve the strongest remaining disagreement with one bounded specialist check.",
        1200
      );

  const plan = {
    ...(task.plan || {}),
    background: true,
    pendingResolver: ready ? null : verification.resolver || null
  };
  const stored = await updateAgentTaskSession({
    userId: job.userId,
    taskId: job.taskId,
    patch: {
      status: "waiting",
      plan,
      verification: {
        ready,
        confidence: Number(verification.confidence || 0),
        synthesis: verification.synthesis,
        unresolved: verification.unresolved,
        nextStep,
        resolver: verification.resolver,
        provider: verification.provider
          ? {
              provider: verification.provider.provider || "openai_responses",
              model: verification.provider.model || null,
              id: verification.provider.id || null
            }
          : null,
        asynchronous: true,
        hiddenChainOfThoughtStored: false
      },
      synthesis: verification.synthesis,
      nextStep,
      roundCount: job.round
    }
  });
  if (!stored?.session) {
    throw codedError("AGENT_TASK_UPDATE_FAILED", "Could not persist background verifier state.");
  }

  await completeAgentJob({
    msgId: job.msgId,
    taskId: job.taskId,
    workerKey: job.workerKey,
    mailboxMessageId: mailbox.messageId,
    providerModel: verification?.provider?.model || null
  });

  let resolversQueued = 0;
  if (
    !ready &&
    verification.resolver?.objective &&
    job.round < Number(task.maxRounds || job.taskMaxRounds || 2)
  ) {
    const nextRound = job.round + 1;
    const scope = boundedResolverScope(
      verification.resolver.toolScope,
      job.toolScope
    );
    const queued = await enqueueAgentJob({
      userId: job.userId,
      taskId: job.taskId,
      workerKey: `resolver_round_${nextRound}`,
      jobType: "resolver",
      role: verification.resolver.role || "disagreement_resolver",
      objective: verification.resolver.objective,
      round: nextRound,
      followup: true,
      toolScope: scope,
      input: {
        ...(job.input || {}),
        request: job?.input?.request || "",
        resolverReason: verification.resolver.reason || "",
        priorRound: job.round
      },
      maxAttempts: job.maxAttempts
    });
    if (queued?.queued) {
      resolversQueued = 1;
      await updateAgentTaskSession({
        userId: job.userId,
        taskId: job.taskId,
        patch: {
          status: "running",
          roundCount: nextRound,
          nextStep: verification.resolver.objective,
          plan: {
            ...plan,
            pendingResolver: {
              ...verification.resolver,
              toolScope: scope,
              workerKey: `resolver_round_${nextRound}`
            }
          }
        }
      });
    }
  }

  return {
    completed: true,
    mailboxMessageId: mailbox.messageId,
    resolversQueued
  };
}

async function enqueueVerifierWhenRoundSettled({ job, task }) {
  const workers = await loadAgentTaskWorkers({
    userId: job.userId,
    taskId: job.taskId
  });
  const round = Number(job.round || 1);
  const evidenceWorkers = workers.filter(
    worker =>
      worker.round === round &&
      ["specialist", "resolver"].includes(worker.jobType)
  );
  if (!evidenceWorkers.length) return 0;

  const unsettled = evidenceWorkers.some(worker =>
    ["planned", "running"].includes(worker.status)
  );
  if (unsettled) return 0;

  const completed = evidenceWorkers.filter(worker => worker.status === "completed");
  if (!completed.length) {
    await updateAgentTaskSession({
      userId: job.userId,
      taskId: job.taskId,
      patch: {
        status: "failed",
        nextStep: "All background specialists in the active round failed. Replan the task with a different bounded assignment."
      }
    });
    return 0;
  }

  const verifierKey = `verifier_round_${round}`;
  if (workers.some(worker => worker.workerKey === verifierKey && worker.status !== "failed")) {
    return 0;
  }

  const queued = await enqueueAgentJob({
    userId: job.userId,
    taskId: job.taskId,
    workerKey: verifierKey,
    jobType: "verifier",
    role: "council_verifier",
    objective: "Reconcile the completed specialist evidence, resolve contradictions by evidence rather than vote, and identify one bounded resolver only if materially necessary.",
    round,
    followup: false,
    toolScope: verifierScope(evidenceWorkers),
    input: {
      ...(job.input || {}),
      request: job?.input?.request || "",
      completedWorkerKeys: completed.map(worker => worker.workerKey).slice(0, 12)
    },
    maxAttempts: job.maxAttempts
  });

  if (queued?.queued) {
    await updateAgentTaskSession({
      userId: job.userId,
      taskId: job.taskId,
      patch: {
        status: "verifying",
        roundCount: round,
        nextStep: "Reconcile the completed specialist evidence and preserve material disagreements."
      }
    });
    return 1;
  }
  return 0;
}

async function deadletter(job, error, summary) {
  await deadletterAgentJob({
    msgId: job.msgId,
    taskId: job.taskId,
    workerKey: job.workerKey,
    error: clean(error?.message || error, 1000),
    errorCode: clean(error?.code, 240) || null
  });
  summary.deadlettered += 1;
  summary.failures.push({
    taskId: job.taskId,
    workerKey: job.workerKey,
    stage: "deadletter",
    code: clean(error?.code, 120) || null
  });

  await sendAgentMailboxMessage({
    userId: job.userId,
    sender: "ari-worker-status",
    recipient: "ari-orchestrator",
    kind: "status",
    threadId: job.taskId,
    subject: `Background worker exhausted retries · ${job.workerKey}`,
    payload: {
      workerKey: job.workerKey,
      jobType: job.jobType,
      role: job.role,
      objective: job.objective,
      success: false,
      attempts: job.readCount,
      error: clean(error?.message || error, 500),
      round: job.round
    },
    metadata: {
      source: "ari_background_agent_worker",
      coordinationRole: "worker_status",
      taskId: job.taskId,
      asynchronous: true
    },
    idempotencyKey: `agent-job:${job.msgId}:deadletter`
  }).catch(() => null);
}

async function loadTaskMessages(job) {
  const result = await listAgentMailboxMessages({
    userId: job.userId,
    threadId: job.taskId,
    limit: 100
  });
  return result?.success && Array.isArray(result.messages)
    ? [...result.messages].reverse()
    : [];
}

function verifierScope(workers = []) {
  if (workers.some(worker => worker.toolScope === "developer_read")) return "developer_read";
  if (workers.some(worker => worker.toolScope === "web")) return "web";
  return "analysis";
}

function boundedResolverScope(requested, parent) {
  const wanted = normalizeScope(requested);
  const available = normalizeScope(parent);
  if (available === "developer_read") return wanted;
  if (available === "web") return wanted === "developer_read" ? "web" : wanted;
  return "analysis";
}

function normalizeScope(value) {
  const scope = clean(value, 40).toLowerCase();
  return ["analysis", "web", "developer_read"].includes(scope) ? scope : "analysis";
}

function workerSender(workerKey) {
  const suffix = clean(workerKey, 34)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "") || "specialist";
  return `ari-worker-${suffix}`.slice(0, 48);
}

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
