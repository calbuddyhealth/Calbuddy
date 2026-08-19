// ARI vNext — confirmation-safe action lifecycle.

import { makeId } from "./current-turn.js";

export const PENDING_ACTION_VERSION = "1.0.0";

export function createPendingAction({ turn, name, args = {}, confirmationRequired = true } = {}) {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);

  return {
    version: PENDING_ACTION_VERSION,
    id: makeId("action"),
    name: String(name || "").slice(0, 120),
    arguments: sanitizeArgs(args),
    sourceTurnId: String(turn?.turnId || "").slice(0, 200),
    sourceMessage: String(turn?.message || "").slice(0, 1000),
    status: confirmationRequired ? "pending_confirmation" : "ready",
    confirmationRequired: confirmationRequired === true,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

export function isConfirmationMessage(message = "") {
  const text = String(message || "").trim().toLowerCase();
  return /^(yes|yep|yeah|confirm|confirmed|do it|go ahead|save it|log it|add it|make it|update it|that's right|correct)[.!\s]*$/.test(text);
}

export function isCancellationMessage(message = "") {
  const text = String(message || "").trim().toLowerCase();
  return /^(no|nope|cancel|never mind|nevermind|don't|do not|stop)[.!\s]*$/.test(text);
}

export function resolvePendingActionIntent(turn = {}) {
  const pending = turn?.pendingAction;
  if (!pending) return { type: "none", pendingAction: null };

  if (isConfirmationMessage(turn?.message)) return { type: "confirm", pendingAction: pending };
  if (isCancellationMessage(turn?.message)) return { type: "cancel", pendingAction: pending };
  return { type: "none", pendingAction: pending };
}

function sanitizeArgs(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return {};
  }
}
