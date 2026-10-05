// Provider availability is separate from content policy and app authorization.
// Retry only transport failures, with one shared deadline and attempt budget.
export const MAX_PROVIDER_ATTEMPTS = 3;

export function isTransientProviderFailure({ status = 0, code = "", message = "" } = {}) {
  if (/insufficient_quota|billing|credit|spend|budget|payment|content_policy|safety|moderation/i.test(`${code} ${message}`)) return false;
  return [408, 429, 500, 502, 503, 504].includes(Number(status));
}

export function retryDelayMs(response, attempt = 1, now = Date.now()) {
  const retryAfter = response?.headers?.get?.("retry-after");
  if (retryAfter != null && retryAfter !== "") {
    const seconds = Number(retryAfter);
    const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - now;
    if (Number.isFinite(delay)) return Math.max(0, delay);
  }
  return Math.min(1000, 250 * (2 ** Math.max(0, attempt - 1)));
}

export function waitForProviderRetry(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason || new DOMException("Aborted", "AbortError"));
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason || new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function providerError({ status = 503, message = "Model provider unavailable.", code = "", attempts = 1 } = {}) {
  const error = new Error(message);
  error.status = Number(status) || 503;
  const detail = `${code} ${message}`;
  error.code = /insufficient_quota|billing|credit|spend|budget|payment/i.test(detail)
    ? "ARI_PROVIDER_QUOTA_EXHAUSTED"
    : error.status === 401 || error.status === 403
      ? "ARI_PROVIDER_ACCESS_FAILED"
      : error.status === 429
        ? "ARI_PROVIDER_RATE_LIMIT"
        : error.status === 408 || error.status === 504
          ? "ARI_PROVIDER_TIMEOUT"
          : isTransientProviderFailure({ status, code, message })
            ? "ARI_PROVIDER_UNAVAILABLE"
            : "ARI_PROVIDER_REQUEST_FAILED";
  error.retryable = isTransientProviderFailure({ status, code, message });
  error.attempts = attempts;
  return error;
}

export function publicTurnFailure(error = {}) {
  const code = String(error.code || "ARI_VNEXT_RUNTIME_FAILED");
  const replies = {
    ARI_PROVIDER_UNAVAILABLE: "My AI provider is temporarily unavailable. Please try again in a moment.",
    ARI_PROVIDER_TIMEOUT: "My AI provider took too long to respond. Please try again.",
    ARI_PROVIDER_RATE_LIMIT: "My AI provider is temporarily busy. Please try again shortly.",
    ARI_PROVIDER_QUOTA_EXHAUSTED: "My AI provider's usage budget is exhausted. The account owner needs to restore provider access.",
    ARI_PROVIDER_ACCESS_FAILED: "I couldn't connect to my AI provider. The account owner needs to check provider access.",
    ARI_PROVIDER_REQUEST_FAILED: "My AI provider couldn't process this response. Please try again."
  };
  return {
    code,
    retryable: error.retryable !== false,
    reply: replies[code] || "I couldn't finish that response. Please try again.",
    failureKind: replies[code] ? "provider" : "runtime"
  };
}
