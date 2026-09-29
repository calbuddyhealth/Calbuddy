import {
  claimCognitiveTrigger,
  deferCognitiveTrigger,
  finishCognitiveTrigger
} from "./cognitive-scheduler-store.js";

export const ARI_COGNITIVE_TRIGGER_RUNNER_VERSION = "1.0.0";

export async function runNextUrgentCognitiveTrigger({
  userId,
  now = new Date(),
  claim = claimCognitiveTrigger,
  finish = finishCognitiveTrigger,
  defer = deferCognitiveTrigger,
  loadScheduler = async () => {
    const module = await import("./cognitive-scheduler.js");
    return module.runAriCognitiveScheduler;
  }
} = {}) {
  const id = clean(userId, 200);
  if (!id) return { success: true, acted: false, reason: "owner_id_missing" };

  const claimed = await claim({ userId: id });
  if (!claimed?.claimed || !claimed?.trigger?.id) {
    return { success: true, acted: false, reason: claimed?.reason || "no_pending_trigger" };
  }

  const trigger = claimed.trigger;
  try {
    const runScheduler = await loadScheduler();
    const result = await runScheduler({ userId: id, now, trigger });
    const resultReason = clean(result?.reason || result?.laneResult?.reason, 240);
    const budgetBlocked = [
      "daily_budget_reached",
      "monthly_budget_reached",
      "usage_ledger_unavailable",
      "usage_ledger_query_failed"
    ].includes(resultReason);

    if (budgetBlocked) {
      await defer({
        userId: id,
        triggerId: trigger.id,
        delayMinutes: resultReason === "monthly_budget_reached" ? 1440 : 240,
        payload: {
          ...safeObject(trigger.payload),
          lastDeferral: { reason: resultReason, at: validDate(now).toISOString() }
        }
      }).catch(() => {});
      return {
        success: true,
        acted: false,
        deferred: true,
        triggerId: trigger.id,
        lane: trigger.lane,
        reason: resultReason,
        scheduler: result
      };
    }

    await finish({
      userId: id,
      triggerId: trigger.id,
      success: result?.success !== false,
      payload: {
        ...safeObject(trigger.payload),
        execution: {
          lane: result?.lane || trigger.lane,
          acted: result?.acted === true,
          reason: resultReason || null,
          completedAt: validDate(now).toISOString()
        }
      }
    }).catch(() => {});

    return {
      success: result?.success !== false,
      acted: result?.acted === true,
      triggerId: trigger.id,
      lane: trigger.lane,
      scheduler: result
    };
  } catch (error) {
    await finish({
      userId: id,
      triggerId: trigger.id,
      success: false,
      payload: {
        ...safeObject(trigger.payload),
        execution: { error: clean(error?.message, 300), completedAt: validDate(now).toISOString() }
      }
    }).catch(() => {});
    return {
      success: false,
      acted: false,
      triggerId: trigger.id,
      lane: trigger.lane,
      reason: "trigger_execution_failed"
    };
  }
}

function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
