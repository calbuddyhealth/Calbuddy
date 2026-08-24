(() => {
  "use strict";

  const POLL_INTERVAL_MS = 9000;
  let pollTimer = null;
  let sweepStartedAt = 0;

  const stateLabels = {
    healthy: "CURRENT RELEASE HEALTHY",
    running: "CHECKS RUNNING",
    needs_attention: "FIX REQUIRED",
    warning: "RETEST REQUIRED",
    unknown: "STATUS INCOMPLETE"
  };

  const checkLabels = {
    passed: "PASS",
    running: "RUNNING",
    failed: "FAIL",
    stale: "RETEST",
    warning: "CHECK",
    unknown: "UNKNOWN"
  };

  const sweepLabels = {
    idle: "SWEEP IDLE",
    passed: "LAST SWEEP PASS",
    running: "SWEEP RUNNING",
    failed: "LAST SWEEP FAILED",
    warning: "SWEEP CHECK",
    unknown: "SWEEP UNKNOWN"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function formatTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function shortSha(value) {
    const clean = String(value || "").trim();
    return clean ? clean.slice(0, 9) : "—";
  }

  async function ownerHeaders() {
    if (typeof window.CalBuddy?.getOwnerRequestHeaders !== "function") {
      throw new Error("Owner authentication is unavailable.");
    }
    return await window.CalBuddy.getOwnerRequestHeaders();
  }

  async function requestHealth(options = {}) {
    const headers = await ownerHeaders();
    if (options.body) headers["Content-Type"] = "application/json";

    const response = await fetch("/api/ari-app-health", {
      method: options.method || "GET",
      headers,
      cache: "no-store",
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error || "App Health request failed.");
      error.status = response.status;
      error.code = data?.code || null;
      error.data = data;
      throw error;
    }
    return data;
  }

  function showDenied() {
    byId("appHealthShell")?.setAttribute("hidden", "");
    byId("appHealthDenied")?.removeAttribute("hidden");
  }

  function showDashboard() {
    byId("appHealthDenied")?.setAttribute("hidden", "");
    byId("appHealthShell")?.removeAttribute("hidden");
  }

  function setMessage(text = "", type = "") {
    const element = byId("appHealthMessage");
    if (!element) return;
    element.textContent = String(text || "");
    element.className = `app-health-message${type ? ` ${type}` : ""}`;
  }

  function renderOverall(snapshot) {
    const overall = byId("appHealthOverall");
    if (overall) {
      const state = snapshot?.overall || "unknown";
      overall.dataset.state = state;
      overall.textContent = stateLabels[state] || stateLabels.unknown;
    }

    const branch = byId("appHealthBranch");
    const commit = byId("appHealthCommit");
    const production = byId("appHealthProductionCommit");
    const checked = byId("appHealthChecked");

    if (branch) branch.textContent = `Branch: ${snapshot?.branch || "—"}`;
    if (commit) commit.textContent = `Main: ${shortSha(snapshot?.commitSha)}`;
    if (production) production.textContent = `Production: ${shortSha(snapshot?.deployment?.commitSha)}`;
    if (checked) checked.textContent = `Checked: ${formatTime(snapshot?.checkedAt)}`;
  }

  function renderSweep(sweep) {
    const element = byId("appHealthSweepState");
    if (!element) return;

    const state = sweep?.state || "idle";
    element.dataset.state = state;
    element.textContent = sweepLabels[state] || sweepLabels.unknown;

    const detail = byId("appHealthSweepDetail");
    if (detail) {
      if (!sweep?.runNumber) {
        detail.textContent = "No manual sweep has run yet.";
      } else {
        detail.textContent = `Sweep #${sweep.runNumber} · ${sweep.conclusion || sweep.status || "unknown"} · ${shortSha(sweep.headSha)}`;
      }
    }
  }

  function renderCheck(check) {
    const card = document.querySelector(`[data-workflow-id="${check.id}"]`);
    if (!card) return;

    const state = check.state || "unknown";
    card.dataset.state = state;

    const chip = card.querySelector(".app-health-chip");
    if (chip) chip.textContent = checkLabels[state] || "UNKNOWN";

    const meta = card.querySelector(".app-health-card-meta");
    if (meta) {
      meta.replaceChildren();

      const status = document.createElement("span");
      status.textContent = check.error
        ? `Error: ${check.error}`
        : `Run #${check.runNumber || "—"} · ${check.conclusion || check.status || "unknown"}`;

      const time = document.createElement("span");
      time.textContent = `Updated: ${formatTime(check.updatedAt || check.startedAt)}`;

      const sha = document.createElement("span");
      sha.textContent = `Tested commit: ${shortSha(check.headSha)}`;

      const coverage = document.createElement("span");
      if (check.state === "stale") {
        coverage.textContent = `Coverage: RETEST REQUIRED${check.impactedFiles?.length ? ` · ${check.impactedFiles.length} relevant change${check.impactedFiles.length === 1 ? "" : "s"}` : ""}`;
      } else if (check.validForCurrentCommit && check.inherited) {
        coverage.textContent = "Coverage: valid · no relevant changes since this pass";
      } else if (check.validForCurrentCommit) {
        coverage.textContent = "Coverage: current main commit";
      } else {
        coverage.textContent = "Coverage: not verified for current main";
      }

      meta.append(status, time, sha, coverage);
    }

    card.querySelector(".app-health-run-link")?.remove();
    if (check.url) {
      const link = document.createElement("a");
      link.className = "app-health-run-link";
      link.href = check.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = check.source === "app_health_sweep" ? "OPEN SWEEP RUN" : "OPEN GITHUB RUN";
      card.appendChild(link);
    }
  }

  function renderDeployment(deployment) {
    const card = document.querySelector('[data-workflow-id="deployment"]');
    if (!card) return;

    const state = deployment?.state || "unknown";
    card.dataset.state = state;

    const chip = card.querySelector(".app-health-chip");
    if (chip) chip.textContent = checkLabels[state] || "UNKNOWN";

    const meta = card.querySelector(".app-health-card-meta");
    if (meta) {
      meta.replaceChildren();
      const production = document.createElement("span");
      production.textContent = `Production: ${shortSha(deployment?.commitSha)}`;
      const current = document.createElement("span");
      current.textContent = `Main: ${shortSha(deployment?.currentCommitSha)}`;
      const result = document.createElement("span");
      result.textContent = deployment?.message || "Deployment parity unavailable.";
      meta.append(production, current, result);
    }
  }

  function renderSnapshot(snapshot) {
    renderOverall(snapshot);
    renderSweep(snapshot?.sweep);
    (snapshot?.workflows || []).forEach(renderCheck);
    renderDeployment(snapshot?.deployment);

    if (snapshot?.overall === "healthy") {
      setMessage("Current production and release-critical checks are valid for the current source.", "success");
    } else if (snapshot?.overall === "needs_attention") {
      setMessage("A release-blocking mismatch or failed check was detected. Review the red card before shipping.", "error");
    } else if (snapshot?.overall === "running") {
      setMessage("Checks are running. This screen will refresh automatically.");
    } else if (snapshot?.overall === "warning") {
      setMessage("At least one check is stale or needs review for the current commit. Run Smart Sweep or Full Release Sweep.", "warning");
    } else {
      setMessage("Some health information is incomplete. Review the cards before release.", "warning");
    }
  }

  async function loadHealth({ quiet = false } = {}) {
    try {
      const snapshot = await requestHealth();
      showDashboard();
      renderSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        showDenied();
        return null;
      }

      showDashboard();
      if (!quiet) setMessage(error?.message || "Could not load App Health.", "error");
      return null;
    }
  }

  function schedulePolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      const snapshot = await loadHealth({ quiet: true });
      if (!snapshot) return;

      const sweepRunning = snapshot?.sweep?.state === "running";
      const checksRunning = (snapshot.workflows || []).some(item => item.state === "running");
      const recentSweep = sweepStartedAt && Date.now() - sweepStartedAt < 35 * 60 * 1000;

      if (!sweepRunning && !checksRunning && !recentSweep) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }, POLL_INTERVAL_MS);
  }

  function formatSweepError(error) {
    if (error?.code === "APP_HEALTH_ACTIONS_WRITE_REQUIRED") {
      return "SWEEP CONTROL BLOCKED — GitHub Actions write permission is missing. The health dashboard can still read results, but the configured GitHub credential must be allowed to start Actions.";
    }
    if (error?.code === "APP_HEALTH_SWEEP_DISPATCH_REJECTED") {
      return "SWEEP CONTROL ERROR — GitHub rejected the manual sweep request. Open the controller workflow configuration before relying on manual sweeps.";
    }
    return error?.message || "Could not start the Bug Sweep.";
  }

  async function runBugSweep(mode) {
    const smartButton = byId("runSmartSweepBtn");
    const fullButton = byId("runFullSweepBtn");
    if (!smartButton || !fullButton || smartButton.disabled || fullButton.disabled) return;

    smartButton.disabled = true;
    fullButton.disabled = true;
    const selected = mode === "full" ? fullButton : smartButton;
    const originalText = selected.textContent;
    selected.textContent = "STARTING…";
    setMessage(mode === "full"
      ? "Starting the full release sweep, including iOS validation…"
      : "Starting Smart Sweep. ARI XP will run core checks and only the expensive subsystem checks affected by changes…");

    try {
      const result = await requestHealth({
        method: "POST",
        body: { action: "run_sweep", mode }
      });

      sweepStartedAt = Date.now();
      setMessage(
        result.alreadyRunning
          ? "A Bug Sweep is already running. This screen will follow the active run."
          : `${mode === "full" ? "Full Release Sweep" : "Smart Sweep"} accepted. Results will update automatically.`,
        "success"
      );

      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadHealth({ quiet: true });
      schedulePolling();
    } catch (error) {
      setMessage(formatSweepError(error), "error");
    } finally {
      selected.textContent = originalText;
      smartButton.disabled = false;
      fullButton.disabled = false;
    }
  }

  async function initialize() {
    const session = typeof window.requireAuth === "function"
      ? await window.requireAuth()
      : await window.CalBuddy?.getCurrentSession?.();

    if (!session) return;

    byId("runSmartSweepBtn")?.addEventListener("click", () => runBugSweep("smart"));
    byId("runFullSweepBtn")?.addEventListener("click", () => runBugSweep("full"));
    const snapshot = await loadHealth();
    if (snapshot?.sweep?.state === "running" || (snapshot?.workflows || []).some(item => item.state === "running")) {
      schedulePolling();
    }
  }

  window.addEventListener("pagehide", () => {
    if (pollTimer) clearInterval(pollTimer);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
