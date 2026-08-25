/* =============================================================
   ARI CIRCLE — MISSION V2
   Measurable real-world objectives layered over the existing Quest authority.
   Metric Missions are intentionally 0-XP in phase one.
============================================================= */
(() => {
  "use strict";

  const VERSION = "2.0.1";
  const $ = (id) => document.getElementById(id);
  const state = {
    client: null,
    user: null,
    rows: [],
    filter: "all",
    busy: false,
    toastTimer: 0
  };

  const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function getClient() {
    return window.calbuddySupabase || window.CalBuddy?.supabase || window.supabaseClient || null;
  }

  async function waitForClient(timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const client = getClient();
      if (client?.auth && client?.rpc) return client;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error("ARI Circle could not connect right now.");
  }

  async function requireUser() {
    const { data, error } = await state.client.auth.getUser();
    if (error) throw error;
    state.user = data?.user || null;
    if (!state.user) {
      location.replace("signin.html");
      return null;
    }
    return state.user;
  }

  async function rpc(name, params = {}) {
    const { data, error } = await state.client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function toast(message, duration = 3600) {
    const el = $("questToast");
    if (!el) return;
    clearTimeout(state.toastTimer);
    el.textContent = clean(message);
    el.hidden = false;
    state.toastTimer = window.setTimeout(() => { el.hidden = true; }, duration);
  }

  function timeLeft(value) {
    const ms = new Date(value).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return "Ended";
    const hours = Math.ceil(ms / 3600000);
    return hours < 24 ? `${hours}h left` : `${Math.ceil(hours / 86400000)}d left`;
  }

  function formatNumber(value, unit = "") {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    const countUnit = ["activities", "sessions", "visits", "times", "reps", "items", "people"].includes(unit);
    return countUnit ? String(Math.trunc(n)) : String(Number(n.toFixed(2)));
  }

  function unitLabel(unit = "", value = 0) {
    const normalized = clean(unit).toLowerCase();
    if (normalized === "miles") return Number(value) === 1 ? "mile" : "miles";
    if (normalized === "kilometers") return Number(value) === 1 ? "kilometer" : "kilometers";
    if (normalized === "minutes") return Number(value) === 1 ? "minute" : "minutes";
    if (normalized === "hours") return Number(value) === 1 ? "hour" : "hours";
    return normalized || "units";
  }

  function missionKind(row = {}) {
    if (row.objective_type === "distance") return "DISTANCE";
    if (row.objective_type === "duration") return "TIME";
    return "COUNT";
  }

  function filteredRows() {
    const metrics = state.rows.filter((row) => clean(row.objective_type) !== "completion");
    return state.filter === "all" ? metrics : metrics.filter((row) => row.category === state.filter);
  }

  async function loadMissions() {
    const status = $("missionStatus");
    if (status) status.textContent = "Loading Missions…";
    try {
      const rows = await rpc("ari_circle_list_missions_v2", { result_limit: 50 });
      state.rows = Array.isArray(rows) ? rows : [];
      renderMissions();
    } catch (error) {
      console.error("Mission V2 loading failed:", error);
      state.rows = [];
      renderMissions();
      if (status) status.textContent = error.message || "Missions are unavailable right now.";
    }
  }

  function renderMissions() {
    const list = $("missionList");
    const empty = $("missionEmpty");
    const status = $("missionStatus");
    if (!list || !empty || !status) return;

    list.replaceChildren();
    const rows = filteredRows();
    if (!rows.length) {
      empty.hidden = false;
      status.textContent = "";
      return;
    }

    empty.hidden = true;
    status.textContent = `${rows.length} active measurable Mission${rows.length === 1 ? "" : "s"}.`;
    rows.forEach((row) => list.append(createMissionCard(row)));
  }

  function createMissionCard(row) {
    const article = document.createElement("article");
    article.className = "circle-mission-v2-card";

    const target = Number(row.target_value) || 0;
    const progress = Number(row.verified_progress) || 0;
    const pending = Number(row.viewer_pending_progress) || 0;
    const percent = Math.max(0, Math.min(100, Number(row.progress_percent) || 0));
    const isCreator = row.creator_user_id === state.user?.id;
    const joined = Boolean(clean(row.viewer_status));
    const reached = Boolean(row.objective_reached_at) || percent >= 100;
    const collective = row.progress_mode === "collective";
    const verification = clean(row.verification_mode);
    const canReview = verification !== "self" && (isCreator || (verification === "peer" && joined));
    const progressLabel = collective ? "Community progress" : "Your progress";
    const unit = clean(row.unit);

    article.innerHTML = `
      <div class="circle-mission-v2-card__top">
        <div>
          <span class="circle-mission-v2-kicker">${escapeHtml(missionKind(row))} · ${escapeHtml(collective ? "TOGETHER" : "PERSONAL PROGRESS")}</span>
          <h3>${escapeHtml(row.title || "Mission")}</h3>
        </div>
        <span class="circle-mission-v2-state ${reached ? "is-complete" : ""}">${reached ? "GOAL REACHED" : escapeHtml(timeLeft(row.ends_at))}</span>
      </div>
      ${clean(row.description) ? `<p class="circle-mission-v2-copy">${escapeHtml(row.description)}</p>` : ""}
      <div class="circle-mission-v2-progress-head">
        <span>${escapeHtml(progressLabel)}</span>
        <strong>${escapeHtml(formatNumber(progress, unit))} / ${escapeHtml(formatNumber(target, unit))} ${escapeHtml(unitLabel(unit, target))}</strong>
      </div>
      <div class="circle-mission-v2-progress" role="progressbar" aria-label="${escapeHtml(progressLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <span style="width:${percent}%"></span>
      </div>
      <div class="circle-mission-v2-meta">
        <span>${Number(row.member_count) || 0} participating</span>
        <span>${escapeHtml(verification === "self" ? "Self verified" : `${verification} verified`)}</span>
        <span>${escapeHtml(clean(row.category) || "activity")}</span>
      </div>
      ${pending > 0 ? `<p class="circle-mission-v2-pending">${escapeHtml(formatNumber(pending, unit))} ${escapeHtml(unitLabel(unit, pending))} awaiting verification</p>` : ""}
      <div class="circle-mission-v2-actions"></div>
    `;

    const actions = article.querySelector(".circle-mission-v2-actions");
    if (!joined && !reached) {
      actions.append(button("Join Mission", "primary", async () => {
        await withBusy(async () => {
          await rpc("ari_circle_join_quest", { requested_quest_id: row.mission_id });
          toast("Mission joined.");
          await loadMissions();
        });
      }));
    }

    if (joined && !reached && row.viewer_status !== "verified") {
      actions.append(button("Add Progress", "primary", () => openProgress(row)));
    }

    if (canReview) {
      actions.append(button("Review", "secondary", () => openReview(row)));
    }

    return article;
  }

  function button(label, kind, onClick) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = kind === "primary" ? "circle-v5-button-primary" : "circle-v5-button";
    el.textContent = label;
    el.addEventListener("click", async () => {
      try {
        await onClick();
      } catch (error) {
        console.error(`Mission ${label} failed:`, error);
        toast(error.message || "That Mission action could not be completed.", 4600);
      }
    });
    return el;
  }

  async function withBusy(fn) {
    if (state.busy) return;
    state.busy = true;
    try {
      return await fn();
    } finally {
      state.busy = false;
    }
  }

  function setDefaultEnd() {
    const input = $("missionFormEnds");
    if (!input) return;
    const end = new Date(Date.now() + 7 * 86400000);
    const min = new Date(Date.now() + 60 * 60000);
    input.value = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    input.min = new Date(min.getTime() - min.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function syncMissionForm() {
    const objective = clean($("missionFormObjective")?.value) || "count";
    const scope = clean($("missionFormScope")?.value) || "community";
    const progress = $("missionFormProgressMode");
    const unit = $("missionFormUnit");
    if (!progress || !unit) return;

    if (scope === "personal" && progress.value === "collective") progress.value = "individual";
    [...progress.options].forEach((option) => {
      if (option.value === "collective") option.disabled = scope === "personal";
    });

    const unitSets = {
      count: [["activities", "Activities"], ["sessions", "Sessions"], ["visits", "Visits"], ["times", "Times"], ["reps", "Reps"], ["items", "Items"], ["people", "People"]],
      distance: [["miles", "Miles"], ["kilometers", "Kilometers"]],
      duration: [["minutes", "Minutes"], ["hours", "Hours"]]
    };
    const previous = unit.value;
    unit.replaceChildren();
    for (const [value, label] of unitSets[objective] || unitSets.count) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      unit.append(option);
    }
    if ([...unit.options].some((option) => option.value === previous)) unit.value = previous;

    const target = $("missionFormTarget");
    if (target) target.step = objective === "count" ? "1" : "0.1";
  }

  function openCreate() {
    setDefaultEnd();
    syncMissionForm();
    $("createMissionDialog")?.showModal?.();
  }

  async function createMission(event) {
    event.preventDefault();
    await withBusy(async () => {
      const end = new Date(clean($("missionFormEnds")?.value));
      if (Number.isNaN(end.getTime())) throw new Error("Choose a valid Mission end time.");
      const objective = clean($("missionFormObjective")?.value) || "count";
      const target = Number($("missionFormTarget")?.value);
      if (!Number.isFinite(target) || target <= 0) throw new Error("Choose a valid Mission target.");
      if (objective === "count" && target !== Math.trunc(target)) throw new Error("Count Mission targets must be whole numbers.");

      await rpc("ari_circle_create_mission_v2", {
        requested_title: clean($("missionFormTitle")?.value),
        requested_description: clean($("missionFormDescription")?.value) || null,
        requested_scope: clean($("missionFormScope")?.value) || "community",
        requested_category: clean($("missionFormCategory")?.value) || "activity",
        requested_verification_mode: clean($("missionFormVerification")?.value) || "self",
        requested_objective_type: objective,
        requested_progress_mode: clean($("missionFormProgressMode")?.value) || "individual",
        requested_target_value: target,
        requested_unit: clean($("missionFormUnit")?.value),
        requested_ends_at: end.toISOString(),
        requested_max_participants: null
      });

      $("createMissionDialog")?.close();
      $("createMissionForm")?.reset();
      setDefaultEnd();
      syncMissionForm();
      toast("Mission published. Measurable Missions are 0 XP in this phase.");
      await loadMissions();
    });
  }

  function randomEventId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  function openProgress(row) {
    $("missionProgressId").value = row.mission_id;
    $("missionProgressEventId").value = randomEventId();
    $("missionProgressTitle").textContent = row.title || "Add progress";
    $("missionProgressAmount").value = "";
    $("missionProgressAmount").step = row.objective_type === "count" ? "1" : "0.1";
    $("missionProgressUnit").textContent = unitLabel(row.unit, 2);
    $("missionProgressNote").value = "";
    $("missionProgressDialog")?.showModal?.();
  }

  async function submitProgress(event) {
    event.preventDefault();
    await withBusy(async () => {
      const missionId = clean($("missionProgressId")?.value);
      const eventId = clean($("missionProgressEventId")?.value);
      const amount = Number($("missionProgressAmount")?.value);
      if (!missionId || !eventId || !Number.isFinite(amount) || amount <= 0) throw new Error("Enter valid Mission progress.");

      const result = await rpc("ari_circle_submit_mission_progress", {
        requested_mission_id: missionId,
        requested_amount: amount,
        requested_client_event_id: eventId,
        requested_note: clean($("missionProgressNote")?.value) || null
      });

      $("missionProgressDialog")?.close();
      $("missionProgressEventId").value = "";
      toast(result?.needs_verification ? "Progress submitted for verification." : "Progress added.");
      await loadMissions();
    });
  }

  async function openReview(row) {
    const list = $("missionReviewList");
    const dialog = $("missionReviewDialog");
    if (!list || !dialog) return;
    list.innerHTML = '<div class="circle-v5-empty"><span>Loading progress…</span></div>';
    $("missionReviewTitle").textContent = row.title || "Mission progress";
    if (!dialog.open) dialog.showModal?.();

    try {
      const rows = await rpc("ari_circle_list_mission_contributions", {
        requested_mission_id: row.mission_id,
        result_limit: 50
      });
      renderReview(row, Array.isArray(rows) ? rows : []);
    } catch (error) {
      list.innerHTML = `<div class="circle-v5-empty"><strong>Review unavailable.</strong><span>${escapeHtml(error.message || "Try again later.")}</span></div>`;
    }
  }

  function renderReview(mission, rows) {
    const list = $("missionReviewList");
    list.replaceChildren();
    if (!rows.length) {
      list.innerHTML = '<div class="circle-v5-empty"><strong>No progress to review.</strong><span>Submitted contributions will appear here.</span></div>';
      return;
    }

    rows.forEach((row) => {
      const article = document.createElement("article");
      article.className = "circle-v5-activity-row circle-mission-v2-review-row";
      const status = clean(row.contribution_status);
      article.innerHTML = `
        <span class="circle-v5-activity-icon">${status === "verified" ? "✓" : status === "rejected" ? "×" : "?"}</span>
        <span class="circle-v5-activity-row__copy">
          <strong>${escapeHtml(row.contributor_display_name || "ARI User")}</strong>
          <small>${escapeHtml(formatNumber(row.amount, row.unit))} ${escapeHtml(unitLabel(row.unit, row.amount))}${clean(row.proof_note) ? ` · ${escapeHtml(row.proof_note)}` : ""}</small>
        </span>
        <span class="circle-mission-v2-review-actions"></span>
      `;

      const actions = article.querySelector(".circle-mission-v2-review-actions");
      if (status === "submitted" && row.contributor_user_id !== state.user?.id) {
        actions.append(button("Verify", "primary", () => reviewContribution(mission, row.contribution_id, "verify")));
        actions.append(button("Reject", "secondary", () => reviewContribution(mission, row.contribution_id, "reject")));
      } else {
        const label = document.createElement("span");
        label.className = "circle-v5-activity-xp";
        label.textContent = status === "submitted" ? "Needs another reviewer" : status;
        actions.append(label);
      }
      list.append(article);
    });
  }

  async function reviewContribution(mission, contributionId, decision) {
    await withBusy(async () => {
      const result = await rpc("ari_circle_review_mission_contribution", {
        requested_contribution_id: contributionId,
        requested_decision: decision
      });
      toast(result?.already_reviewed ? "That contribution was already reviewed." : decision === "verify" ? "Progress verified." : "Progress rejected.");
      await openReview(mission);
      await loadMissions();
    });
  }

  function bindFilters() {
    document.querySelectorAll("[data-quest-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.filter = chip.dataset.questFilter || "all";
        renderMissions();
      });
    });
  }

  function bind() {
    $("createMissionButton")?.addEventListener("click", openCreate);
    $("createMissionForm")?.addEventListener("submit", createMission);
    $("missionProgressForm")?.addEventListener("submit", submitProgress);
    $("refreshMissions")?.addEventListener("click", loadMissions);
    $("missionFormObjective")?.addEventListener("change", syncMissionForm);
    $("missionFormScope")?.addEventListener("change", syncMissionForm);
    document.querySelectorAll("[data-mission-close]").forEach((button) => {
      button.addEventListener("click", () => $(button.dataset.missionClose)?.close?.());
    });
    bindFilters();
  }

  async function boot() {
    const page = $("questPage");
    if (!page) return;
    try {
      state.client = await waitForClient();
      if (!await requireUser()) return;
      bind();
      setDefaultEnd();
      syncMissionForm();
      await loadMissions();
      window.dispatchEvent(new CustomEvent("ari:circleMissionsReady", { detail: { version: VERSION } }));
    } catch (error) {
      console.error("Mission V2 boot failed:", error);
      const status = $("missionStatus");
      if (status) status.textContent = error.message || "Missions are unavailable right now.";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
