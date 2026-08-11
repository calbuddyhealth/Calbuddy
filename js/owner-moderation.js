/* ARI Rebirth — Owner Moderation v1.0.0 */

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let session = null;
  let activeFilter = "open";

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("moderationStatus"), message, type);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
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
          <div><h3>${escapeHtml(report.category.replaceAll("_", " "))}</h3><span class="ari-report-meta">${escapeHtml(report.target_type)} · ${escapeHtml(formatDate(report.created_at))}</span></div>
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
    setStatus("Loading reports…", "working");
    let query = window.calbuddySupabase
      .from("ari_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (activeFilter === "open") query = query.in("status", ["pending", "reviewing"]);
    else if (activeFilter !== "all") query = query.eq("status", activeFilter);

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
    document.querySelectorAll(".ari-filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.status;
        document.querySelectorAll(".ari-filter-button").forEach((item) =>
          item.classList.toggle("is-active", item === button)
        );
        loadReports();
      });
    });
    await loadReports();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
