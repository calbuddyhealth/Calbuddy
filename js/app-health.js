(() => {
  "use strict";

  const POLL_INTERVAL_MS = 8000;
  let pollTimer = null;
  let sweepStartedAt = 0;

  const stateLabels = {
    healthy: "ALL SYSTEMS PASSING",
    running: "BUG SWEEP RUNNING",
    needs_attention: "FIX REQUIRED",
    warning: "CHECK REQUIRED",
    unknown: "STATUS UNKNOWN"
  };

  const workflowLabels = {
    passed: "PASS",
    running: "RUNNING",
    failed: "FAIL",
    warning: "CHECK",
    unknown: "UNKNOWN"
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
    const checked = byId("appHealthChecked");

    if (branch) branch.textContent = `Branch: ${snapshot?.branch || "—"}`;
    if (commit) commit.textContent = `Commit: ${shortSha(snapshot?.commitSha)}`;
    if (checked) checked.textContent = `Last checked: ${formatTime(snapshot?.checkedAt)}`;
  }

  function renderWorkflow(workflow) {
    const card = document.querySelector(`[data-workflow-id="${workflow.id}"]`);
    if (!card) return;

    const state = workflow.state || "unknown";
    card.dataset.state = state;

    const chip = card.querySelector(".app-health-chip");
    if (chip) chip.textContent = workflowLabels[state] || "UNKNOWN";

    const meta = card.querySelector(".app-health-card-meta");
    if (meta) {
      meta.replaceChildren();

      const status = document.createElement("span");
      status.textContent = workflow.error
        ? `Error: ${workflow.error}`
        : `Run #${workflow.runNumber || "—"} · ${workflow.conclusion || workflow.status || "unknown"}`;

      const time = document.createElement("span");
      time.textContent = `Updated: ${formatTime(workflow.updatedAt || workflow.startedAt)}`;

      const sha = document.createElement("span");
      sha.textContent = `Commit: ${shortSha(workflow.headSha)}`;

      meta.append(status, time, sha);
    }

    card.querySelector(".app-health-run-link")?.remove();
    if (workflow.url) {
      const link = document.createElement("a");
      link.className = "app-health-run-link";
      link.href = workflow.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "OPEN GITHUB RUN";
      card.appendChild(link);
    }
  }

  function renderSnapshot(snapshot) {
    renderOverall(snapshot);
    (snapshot?.workflows || []).forEach(renderWorkflow);

    if (snapshot?.overall === "healthy") {
      setMessage("No release-critical failures are currently reported.", "success");
    } else if (snapshot?.overall === "needs_attention") {
      setMessage("At least one automated check failed. Review the red card before shipping.", "error");
    } else if (snapshot?.overall === "running") {
      setMessage("Automated checks are running. This screen will refresh automatically.");
    } else if (snapshot?.overall === "warning") {
      setMessage("A check completed with a warning or neutral result. Review it before release.");
    } else {
      setMessage("Some health information is unavailable. Run a Bug Sweep or open the workflow details.");
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

      const anyRunning = (snapshot.workflows || []).some(item => item.state === "running");
      const recentSweep = sweepStartedAt && Date.now() - sweepStartedAt < 10 * 60 * 1000;

      if (!anyRunning && !recentSweep) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }, POLL_INTERVAL_MS);
  }

  async function runBugSweep() {
    const button = byId("runBugSweepBtn");
    if (!button || button.disabled) return;

    button.disabled = true;
    button.textContent = "STARTING SWEEP…";
    setMessage("Starting ARI XP readiness, iOS, and Ari trust checks…");

    try {
      const result = await requestHealth({
        method: "POST",
        body: { action: "run_sweep" }
      });

      sweepStartedAt = Date.now();
      const alreadyRunning = (result.results || []).filter(item => item.alreadyRunning).length;
      setMessage(
        alreadyRunning
          ? `Bug Sweep active. ${alreadyRunning} check${alreadyRunning === 1 ? " was" : "s were"} already running.`
          : "Bug Sweep started. Results will appear here as GitHub Actions reports them.",
        "success"
      );

      await new Promise(resolve => setTimeout(resolve, 1200));
      await loadHealth({ quiet: true });
      schedulePolling();
    } catch (error) {
      setMessage(error?.message || "Could not start the Bug Sweep.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "RUN BUG SWEEP";
    }
  }

  async function initialize() {
    const session = typeof window.requireAuth === "function"
      ? await window.requireAuth()
      : await window.CalBuddy?.getCurrentSession?.();

    if (!session) return;

    byId("runBugSweepBtn")?.addEventListener("click", runBugSweep);
    const snapshot = await loadHealth();
    if (snapshot?.overall === "running") schedulePolling();
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
