/* ARI Rebirth — Owner Moderation v2.1.0 */

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let session = null;
  let activeReportFilter = "open";
  let activeSafetyFilter = "open";
  let activeAgeFilter = "pending";
  let activePanel = "teen";

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("moderationStatus"), message, type);
  }

  function escapeHtml(value = "") {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function formatBirthday(value) {
    const text = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "Unknown";
    const [year, month, day] = text.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function titleCase(value = "") {
    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function reportActions(report) {
    if (["resolved", "dismissed"].includes(report.status)) {
      return '<button type="button" data-action="reviewing">Reopen</button>';
    }
    return [
      report.status !== "reviewing" ? '<button type="button" data-action="reviewing">Review</button>' : "",
      '<button type="button" data-action="resolved">Resolve</button>',
      '<button type="button" data-action="dismissed">Dismiss</button>'
    ].join("");
  }

  function renderReports(reports) {
    const list = $("moderationReportList");
    if (!reports.length) {
      list.innerHTML = '<div class="ari-empty-state">No reports in this view.</div>';
      return;
    }

    list.innerHTML = reports.map((report) => `
      <article class="ari-report-card" data-report-id="${escapeHtml(report.id)}">
        <div class="ari-report-card-header">
          <div><h3>${escapeHtml(titleCase(report.category))}</h3><span class="ari-report-meta">${escapeHtml(report.target_type)} · ${escapeHtml(formatDate(report.created_at))}</span></div>
          <span class="ari-report-pill">${escapeHtml(report.status.toUpperCase())}</span>
        </div>
        <p>${escapeHtml(report.details)}</p>
        <div class="ari-report-meta">Reporter: ${escapeHtml(report.reporter_contact_email || "account deleted")}<br />Reference: ${escapeHtml(report.id)}${report.reported_user_id ? `<br />Reported user: ${escapeHtml(report.reported_user_id)}` : ""}${report.target_id ? `<br />Target: ${escapeHtml(report.target_id)}` : ""}</div>
        <div class="ari-report-actions">${reportActions(report)}</div>
      </article>
    `).join("");

    list.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-report-id]");
        updateReport(card.dataset.reportId, button.dataset.action);
      });
    });
  }

  async function loadReports() {
    if (activePanel !== "reports") return;
    setStatus("Loading reports…", "working");
    let query = window.calbuddySupabase
      .from("ari_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (activeReportFilter === "open") query = query.in("status", ["pending", "reviewing"]);
    else if (activeReportFilter !== "all") query = query.eq("status", activeReportFilter);

    const { data, error } = await query;
    if (error) return setStatus(error.message, "error");
    setStatus("");
    renderReports(data || []);
  }

  async function updateReport(reportId, status) {
    setStatus("Updating report…", "working");
    const { error: updateError } = await window.calbuddySupabase
      .from("ari_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (updateError) return setStatus(updateError.message, "error");

    const action = status === "pending" ? "opened" : status;
    const { error: auditError } = await window.calbuddySupabase
      .from("ari_moderation_actions")
      .insert({
        report_id: reportId,
        admin_user_id: session.user.id,
        action,
        notes: `Status changed to ${status}`
      });

    if (auditError) console.warn("Moderation audit save failed:", auditError.message);
    await loadReports();
  }

  function safetyActions(event) {
    if (event.status === "open") {
      return [
        '<button type="button" data-safety-action="reviewed">Reviewed</button>',
        '<button type="button" data-safety-action="escalated">Escalate</button>',
        '<button type="button" data-safety-action="dismissed">Dismiss</button>'
      ].join("");
    }
    if (event.status === "escalated") {
      return [
        '<button type="button" data-safety-action="reviewed">Mark reviewed</button>',
        '<button type="button" data-safety-action="open">Return to open</button>'
      ].join("");
    }
    return '<button type="button" data-safety-action="open">Reopen</button>';
  }

  function moderationCategories(event) {
    const categories = event?.metadata?.blocked_categories;
    if (!Array.isArray(categories) || !categories.length) return "";
    return `<div class="owner-safety-meta">AI categories: ${escapeHtml(categories.join(", "))}</div>`;
  }

  function renderTeenSafetyEvents(events) {
    const list = $("teenSafetyList");
    if (!events.length) {
      list.innerHTML = '<div class="ari-empty-state">No teen safety events in this view.</div>';
      return;
    }

    list.innerHTML = events.map((event) => {
      const identity = event.display_name || "Teen account";
      const handle = event.handle ? `@${String(event.handle).replace(/^@+/, "")}` : "";
      const evidence = event.excerpt
        ? `<div class="owner-safety-evidence">${escapeHtml(event.excerpt)}</div>`
        : '<div class="owner-safety-evidence">Media-only safety event. No private message text stored.</div>';
      const priorCount = Number(event.prior_event_count || 0);

      return `
        <article class="owner-safety-card" data-safety-id="${escapeHtml(event.id)}" data-severity="${escapeHtml(event.severity)}">
          <div class="owner-safety-card__top">
            <div>
              <h3>${escapeHtml(titleCase(event.category))}</h3>
              <div class="owner-safety-card__identity">${escapeHtml(identity)}${handle ? ` · ${escapeHtml(handle)}` : ""}</div>
            </div>
            <span class="owner-safety-pill${event.severity === "high" ? " owner-safety-pill--high" : ""}">${escapeHtml(event.severity)} priority</span>
          </div>
          <div class="owner-safety-pills">
            <span class="owner-safety-pill">${escapeHtml(titleCase(event.surface))}</span>
            <span class="owner-safety-pill">${escapeHtml(event.action)}</span>
            <span class="owner-safety-pill">${escapeHtml(event.status)}</span>
          </div>
          ${evidence}
          ${moderationCategories(event)}
          <div class="owner-safety-meta">Blocked: ${escapeHtml(formatDate(event.created_at))}<br />Prior safety events: ${priorCount}<br />User ID: ${escapeHtml(event.user_id)}<br />Event: ${escapeHtml(event.id)}</div>
          <div class="owner-safety-actions">${safetyActions(event)}</div>
        </article>
      `;
    }).join("");

    list.querySelectorAll("[data-safety-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-safety-id]");
        updateTeenSafetyEvent(card.dataset.safetyId, button.dataset.safetyAction);
      });
    });
  }

  async function loadTeenSafetySummary() {
    const { data, error } = await window.calbuddySupabase.rpc("ari_admin_teen_safety_summary");
    if (error) throw error;
    if (data?.authorized !== true) throw new Error("Owner access required.");

    $("teenSafetyOpen").textContent = Number(data.open || 0).toLocaleString();
    $("teenSafetyHigh").textContent = Number(data.high_priority || 0).toLocaleString();
    $("teenSafety24h").textContent = Number(data.last_24h || 0).toLocaleString();
    $("teenSafetyUsers").textContent = Number(data.unique_teens_30d || 0).toLocaleString();
  }

  async function loadTeenSafetyEvents() {
    if (activePanel !== "teen") return;
    setStatus("Loading teen safety…", "working");
    const [{ data, error }] = await Promise.all([
      window.calbuddySupabase.rpc("ari_admin_teen_safety_events", {
        requested_status: activeSafetyFilter,
        result_limit: 100
      }),
      loadTeenSafetySummary()
    ]);

    if (error) return setStatus(error.message, "error");
    setStatus("");
    renderTeenSafetyEvents(Array.isArray(data) ? data : []);
  }

  async function updateTeenSafetyEvent(eventId, status) {
    setStatus("Updating teen safety event…", "working");
    const { data, error } = await window.calbuddySupabase.rpc("ari_admin_review_teen_safety_event", {
      requested_event_id: eventId,
      requested_status: status
    });
    if (error) return setStatus(error.message, "error");
    if (data !== true) return setStatus("That safety event is no longer available.", "error");
    await loadTeenSafetyEvents();
  }

  function ageCorrectionActions(request) {
    if (request.status !== "pending") return "";
    return [
      '<button type="button" data-age-action="approved">Approve</button>',
      '<button type="button" data-age-action="denied">Deny</button>'
    ].join("");
  }

  function renderAgeCorrections(requests) {
    const list = $("ageCorrectionList");
    if (!requests.length) {
      list.innerHTML = '<div class="ari-empty-state">No age correction requests in this view.</div>';
      return;
    }

    list.innerHTML = requests.map((request) => {
      const boundary = request.crosses_adult_boundary === true;
      return `
        <article class="owner-safety-card" data-age-request-id="${escapeHtml(request.id)}" data-severity="${boundary ? "high" : "normal"}">
          <div class="owner-safety-card__top">
            <div>
              <h3>Birthday correction</h3>
              <div class="owner-safety-card__identity">${escapeHtml(request.user_email || request.user_id)}</div>
            </div>
            <span class="owner-safety-pill${boundary ? " owner-safety-pill--high" : ""}">${boundary ? "18+ ACCESS CHANGE" : escapeHtml(request.status.toUpperCase())}</span>
          </div>
          <div class="owner-safety-pills">
            <span class="owner-safety-pill">Current age ${escapeHtml(request.current_age_at_request)}</span>
            <span class="owner-safety-pill">Requested age ${escapeHtml(request.requested_age_at_request)}</span>
            <span class="owner-safety-pill">${escapeHtml(request.status)}</span>
          </div>
          <div class="owner-safety-evidence">${escapeHtml(request.explanation)}</div>
          <div class="owner-safety-meta">
            Current birthday: ${escapeHtml(formatBirthday(request.current_date_of_birth))}<br />
            Requested birthday: ${escapeHtml(formatBirthday(request.requested_date_of_birth))}<br />
            Submitted: ${escapeHtml(formatDate(request.requested_at))}<br />
            User ID: ${escapeHtml(request.user_id)}
            ${request.reviewed_at ? `<br />Reviewed: ${escapeHtml(formatDate(request.reviewed_at))}` : ""}
            ${request.review_notes ? `<br />Review note: ${escapeHtml(request.review_notes)}` : ""}
          </div>
          <div class="owner-safety-actions">${ageCorrectionActions(request)}</div>
        </article>
      `;
    }).join("");

    list.querySelectorAll("[data-age-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-age-request-id]");
        reviewAgeCorrection(card.dataset.ageRequestId, button.dataset.ageAction);
      });
    });
  }

  async function loadAgeCorrectionSummary() {
    const { data, error } = await window.calbuddySupabase.rpc("ari_owner_age_correction_summary");
    if (error) throw error;
    if (data?.authorized !== true) throw new Error("Owner access required.");
    $("ageCorrectionPending").textContent = Number(data.pending || 0).toLocaleString();
    $("ageCorrectionBoundary").textContent = Number(data.age_boundary_changes || 0).toLocaleString();
  }

  async function loadAgeCorrections() {
    if (activePanel !== "age") return;
    setStatus("Loading age correction requests…", "working");
    try {
      const [{ data, error }] = await Promise.all([
        window.calbuddySupabase.rpc("ari_owner_age_correction_requests", {
          requested_status: activeAgeFilter,
          result_limit: 100
        }),
        loadAgeCorrectionSummary()
      ]);
      if (error) throw error;
      setStatus("");
      renderAgeCorrections(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus(error?.message || "Age correction review is unavailable.", "error");
      $("ageCorrectionList").innerHTML = '<div class="ari-empty-state">The vNext age-correction database migration must be activated before this queue can be used.</div>';
    }
  }

  async function reviewAgeCorrection(requestId, decision) {
    const action = decision === "approved" ? "approve" : "deny";
    if (!window.confirm(`Are you sure you want to ${action} this protected birthday correction?`)) return;

    const note = window.prompt("Optional owner review note:", "") ?? "";
    setStatus(`${decision === "approved" ? "Approving" : "Denying"} birthday correction…`, "working");

    const { data, error } = await window.calbuddySupabase.rpc("ari_owner_review_age_correction", {
      requested_request_id: requestId,
      requested_decision: decision,
      requested_notes: note
    });

    if (error) return setStatus(error.message, "error");
    if (data?.success !== true) return setStatus("The request could not be reviewed.", "error");

    setStatus(
      decision === "approved"
        ? "Birthday correction approved. Protected account age has been updated."
        : "Birthday correction denied. The protected account birthday was not changed.",
      "success"
    );
    await loadAgeCorrections();
  }

  function switchPanel(panelName) {
    activePanel = panelName === "reports" ? "reports" : panelName === "age" ? "age" : "teen";
    $("teenSafetyPanel").hidden = activePanel !== "teen";
    $("reportPanel").hidden = activePanel !== "reports";
    $("ageCorrectionPanel").hidden = activePanel !== "age";
    document.querySelectorAll("[data-owner-panel]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.ownerPanel === activePanel);
    });
    if (activePanel === "teen") loadTeenSafetyEvents();
    else if (activePanel === "reports") loadReports();
    else loadAgeCorrections();
  }

  async function init() {
    session = await window.AriSettings.requireSession();
    if (!session) return;

    const { data: isAdmin, error } = await window.calbuddySupabase.rpc("is_ari_admin");
    if (error || isAdmin !== true) {
      setStatus("Owner access required.", "error");
      setTimeout(() => window.location.replace("account.html"), 900);
      return;
    }

    $("moderationWorkspace").hidden = false;

    document.querySelectorAll("[data-owner-panel]").forEach((button) => {
      button.addEventListener("click", () => switchPanel(button.dataset.ownerPanel));
    });

    document.querySelectorAll("[data-report-status]").forEach((button) => {
      button.addEventListener("click", () => {
        activeReportFilter = button.dataset.reportStatus;
        document.querySelectorAll("[data-report-status]").forEach((item) =>
          item.classList.toggle("is-active", item === button)
        );
        loadReports();
      });
    });

    document.querySelectorAll("[data-safety-status]").forEach((button) => {
      button.addEventListener("click", () => {
        activeSafetyFilter = button.dataset.safetyStatus;
        document.querySelectorAll("[data-safety-status]").forEach((item) =>
          item.classList.toggle("is-active", item === button)
        );
        loadTeenSafetyEvents();
      });
    });

    document.querySelectorAll("[data-age-status]").forEach((button) => {
      button.addEventListener("click", () => {
        activeAgeFilter = button.dataset.ageStatus;
        document.querySelectorAll("[data-age-status]").forEach((item) =>
          item.classList.toggle("is-active", item === button)
        );
        loadAgeCorrections();
      });
    });

    await loadTeenSafetyEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();