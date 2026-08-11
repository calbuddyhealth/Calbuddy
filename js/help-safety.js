/* ARI Rebirth — Help & Safety v1.0.0 */

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let session = null;
  let reportedUserId = null;
  let targetId = null;

  function setStatus(message = "", type = "") {
    window.AriSettings.setStatus($("reportStatus"), message, type);
  }

  function readContext() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const display = String(params.get("display") || "").slice(0, 80);
    reportedUserId = params.get("reported_user_id") || null;
    targetId = params.get("target_id") || null;

    if (["user", "content", "safety", "app", "other"].includes(type)) {
      $("reportTargetType").value = type;
    }

    if (type === "account") {
      $("reportTargetType").value = "other";
      $("reportCategory").value = "account_help";
    }

    if (reportedUserId) {
      $("reportedProfileNotice").hidden = false;
      $("reportedProfileNotice").textContent =
        display ? `Reporting ARI Circle profile: ${display}` : "An ARI Circle profile is attached to this report.";
      $("reportTargetType").value = "user";
      $("reportCategory").value = "harassment";
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    const details = String($("reportDetails").value || "").trim();
    const email = String($("reportEmail").value || "").trim();

    if (details.length < 10) {
      setStatus("Please add at least 10 characters of detail.", "error");
      $("reportDetails").focus();
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("Enter a valid contact email.", "error");
      $("reportEmail").focus();
      return;
    }

    $("submitReportButton").disabled = true;
    setStatus("Sending your private report…", "working");

    const { data, error } = await window.calbuddySupabase
      .from("ari_reports")
      .insert({
        reporter_user_id: session.user.id,
        reporter_contact_email: email,
        target_type: $("reportTargetType").value,
        reported_user_id: reportedUserId,
        target_id: targetId,
        category: $("reportCategory").value,
        details,
        evidence: {
          source_page: document.referrer || window.location.pathname,
          submitted_from: window.location.pathname
        },
        status: "pending",
        priority: ["unsafe_content", "privacy_concern"].includes($("reportCategory").value)
          ? "urgent"
          : "normal"
      })
      .select("id")
      .single();

    $("submitReportButton").disabled = false;

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    $("reportForm").reset();
    $("reportEmail").value = email;
    setStatus(`Report received. Reference: ${String(data.id).slice(0, 8).toUpperCase()}`, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function init() {
    session = await window.AriSettings.requireSession();
    if (!session) return;
    $("reportEmail").value = session.user.email || "";
    readContext();
    $("reportForm").addEventListener("submit", submitReport);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
